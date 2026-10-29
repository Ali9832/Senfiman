// Internet quota — fetches data quota from university net portal
// Actions: save_creds | fetch | delete_creds
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";
import { z } from "https://esm.sh/zod@3.23.8";

const SaveCredsSchema = z.object({
  action: z.literal("save_creds"),
  username: z.string().trim().min(3).max(64),
  password: z.string().min(1).max(256),
});
const FetchSchema = z.object({ action: z.literal("fetch"), force: z.boolean().optional() });
const DeleteSchema = z.object({ action: z.literal("delete_creds") });
const BodySchema = z.union([SaveCredsSchema, FetchSchema, DeleteSchema]);

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const KDF_INPUT = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CACHE_TTL_MS = 15 * 60 * 1000;
const NET_BASE = "https://net.nit.ac.ir";

async function getKey(): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("internet-creds:" + KDF_INPUT));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
async function encryptText(plain: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain)));
  const combined = new Uint8Array(iv.length + ct.length);
  combined.set(iv, 0); combined.set(ct, iv.length);
  return btoa(String.fromCharCode(...combined));
}
async function decryptText(b64: string): Promise<string> {
  const key = await getKey();
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bin.slice(0, 12) }, key, bin.slice(12));
  return new TextDecoder().decode(pt);
}

// Parses values like "12.5 GB", "500 MB", "۱۲٫۵ گیگابایت"
function parseSize(text: string): number | null {
  const t = text.replace(/[٬,]/g, "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  const m = t.match(/([\d.]+)\s*(GB|MB|گیگ|مگ)/i);
  if (!m) return null;
  const val = parseFloat(m[1]);
  if (isNaN(val)) return null;
  const unit = m[2].toUpperCase();
  return unit.startsWith("G") || unit.startsWith("گ") ? Math.round(val * 1024) : Math.round(val);
}

async function scrapeQuota(username: string, password: string) {
  try {
    const loginPage = await fetch(`${NET_BASE}/`, { redirect: "manual" });
    const cookies1 = loginPage.headers.get("set-cookie") ?? "";
    const html1 = await loginPage.text();
    const doc1 = new DOMParser().parseFromString(html1, "text/html");
    const token = doc1?.querySelector('input[name="__RequestVerificationToken"]')?.getAttribute("value")
      ?? doc1?.querySelector('input[name="_token"]')?.getAttribute("value") ?? "";

    const form = new URLSearchParams();
    form.set("username", username); form.set("Username", username);
    form.set("password", password); form.set("Password", password);
    if (token) { form.set("__RequestVerificationToken", token); form.set("_token", token); }

    const loginRes = await fetch(`${NET_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Cookie": cookies1 },
      body: form.toString(), redirect: "manual",
    });
    const cookies2 = loginRes.headers.get("set-cookie") ?? cookies1;

    const dashRes = await fetch(`${NET_BASE}/dashboard`, { headers: { Cookie: cookies2 } });
    const html2 = await dashRes.text();
    const doc = new DOMParser().parseFromString(html2, "text/html");
    if (!doc) throw new Error("parse-failed");

    // Heuristic — look for two size values: used and total
    const body = doc.body?.textContent ?? "";
    const sizes = Array.from(body.matchAll(/([\d.]+)\s*(GB|MB|گیگ|مگ)/gi)).slice(0, 4);
    let used_mb = 0, total_mb = 0;
    if (sizes.length >= 2) {
      used_mb = parseSize(sizes[0][0]) ?? 0;
      total_mb = parseSize(sizes[1][0]) ?? 0;
    }
    const expireMatch = body.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    const expires_at = expireMatch ? new Date(`${expireMatch[1]}-${expireMatch[2].padStart(2, "0")}-${expireMatch[3].padStart(2, "0")}`).toISOString() : null;

    return { ok: true, used_mb, total_mb, expires_at, note: (used_mb || total_mb) ? null : "ساختار صفحه شناسایی نشد" };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "unauthorized" }, 401);
    const supa = createClient(SUPABASE_URL, SERVICE_KEY, { global: { headers: { Authorization: auth } } });
    const { data: ud, error: uErr } = await supa.auth.getUser();
    if (uErr || !ud.user) return json({ error: "unauthorized" }, 401);
    const userId = ud.user.id;

    const raw = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) return json({ error: "invalid-input", details: parsed.error.flatten() }, 400);
    const body = parsed.data;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    if (body.action === "save_creds") {
      const enc = await encryptText(body.password);
      const { error } = await admin.from("university_credentials").upsert(
        { user_id: userId, system: "internet", username: body.username, password_encrypted: enc, updated_at: new Date().toISOString() },
        { onConflict: "user_id,system" },
      );
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }
    if (body.action === "delete_creds") {
      await admin.from("university_credentials").delete().eq("user_id", userId).eq("system", "internet");
      await admin.from("internet_usage").delete().eq("user_id", userId);
      return json({ ok: true });
    }
    if (body.action === "fetch") {
      const { data: cred } = await admin.from("university_credentials")
        .select("username, password_encrypted").eq("user_id", userId).eq("system", "internet").maybeSingle();
      if (!cred) return json({ ok: false, error: "no-credentials" }, 200);

      const { data: existing } = await admin.from("internet_usage").select("*").eq("user_id", userId).maybeSingle();
      if (!body.force && existing && Date.now() - new Date(existing.fetched_at).getTime() < CACHE_TTL_MS) {
        return json({ ok: true, cached: true, data: existing });
      }
      const password = await decryptText(cred.password_encrypted);
      const result = await scrapeQuota(cred.username, password);
      if (result.ok) {
        const row = {
          user_id: userId,
          used_mb: result.used_mb ?? 0,
          total_mb: result.total_mb ?? 0,
          expires_at: result.expires_at,
          fetched_at: new Date().toISOString(),
        };
        await admin.from("internet_usage").upsert(row, { onConflict: "user_id" });
        return json({ ok: true, cached: false, data: { ...row, note: (result as any).note } });
      }
      return json({ ok: false, cached: false, error: (result as any).error });
    }
    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
