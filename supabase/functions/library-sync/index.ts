// Library sync — fetches book loans from university library system
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
const CACHE_TTL_MS = 30 * 60 * 1000;
const LIB_BASE = "https://lib.nit.ac.ir";

async function getKey(): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("library-creds:" + KDF_INPUT));
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

async function scrapeLibrary(username: string, password: string) {
  try {
    const loginPage = await fetch(`${LIB_BASE}/`, { redirect: "manual" });
    const cookies1 = loginPage.headers.get("set-cookie") ?? "";
    const html1 = await loginPage.text();
    const doc1 = new DOMParser().parseFromString(html1, "text/html");
    const token = doc1?.querySelector('input[name="__RequestVerificationToken"]')?.getAttribute("value")
      ?? doc1?.querySelector('input[name="_token"]')?.getAttribute("value") ?? "";

    const form = new URLSearchParams();
    form.set("UserName", username); form.set("username", username);
    form.set("Password", password); form.set("password", password);
    if (token) { form.set("__RequestVerificationToken", token); form.set("_token", token); }

    const loginRes = await fetch(`${LIB_BASE}/Account/Login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Cookie": cookies1 },
      body: form.toString(), redirect: "manual",
    });
    const cookies2 = loginRes.headers.get("set-cookie") ?? cookies1;

    const loansRes = await fetch(`${LIB_BASE}/MyAccount/Loans`, { headers: { Cookie: cookies2 } });
    const html2 = await loansRes.text();
    const doc = new DOMParser().parseFromString(html2, "text/html");
    if (!doc) throw new Error("parse-failed");

    const loans: Array<{ title: string; author: string | null; due_date: string; loan_date: string | null; external_id: string | null }> = [];
    const rows = Array.from(doc.querySelectorAll("table tr, .loan-row"));
    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll("td"));
      if (cells.length < 2) continue;
      const txt = cells.map((c) => (c.textContent ?? "").trim());
      const dateMatch = txt.join(" ").match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g);
      if (!dateMatch?.length) continue;
      loans.push({
        title: txt[0]?.slice(0, 200) ?? "نامشخص",
        author: txt[1]?.slice(0, 120) ?? null,
        loan_date: dateMatch[0] ?? null,
        due_date: dateMatch[dateMatch.length - 1] ?? dateMatch[0],
        external_id: row.getAttribute("data-id") ?? null,
      });
    }
    return { ok: true, loans, note: loans.length ? null : "ساختار صفحه شناسایی نشد" };
  } catch (e) {
    return { ok: false, error: String(e), loans: [] };
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
        { user_id: userId, system: "library", username: body.username, password_encrypted: enc, updated_at: new Date().toISOString() },
        { onConflict: "user_id,system" },
      );
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }
    if (body.action === "delete_creds") {
      await admin.from("university_credentials").delete().eq("user_id", userId).eq("system", "library");
      await admin.from("library_loans").delete().eq("user_id", userId);
      return json({ ok: true });
    }
    if (body.action === "fetch") {
      const { data: cred } = await admin.from("university_credentials")
        .select("username, password_encrypted").eq("user_id", userId).eq("system", "library").maybeSingle();
      if (!cred) return json({ ok: false, error: "no-credentials" }, 200);

      // Check cache by fetched_at on loans
      const { data: existing } = await admin.from("library_loans")
        .select("fetched_at").eq("user_id", userId).order("fetched_at", { ascending: false }).limit(1).maybeSingle();
      if (!body.force && existing && Date.now() - new Date(existing.fetched_at).getTime() < CACHE_TTL_MS) {
        const { data: loans } = await admin.from("library_loans").select("*").eq("user_id", userId).order("due_date");
        return json({ ok: true, cached: true, data: { loans } });
      }

      const password = await decryptText(cred.password_encrypted);
      const result = await scrapeLibrary(cred.username, password);
      if (result.ok && result.loans.length) {
        await admin.from("library_loans").delete().eq("user_id", userId);
        const now = new Date().toISOString();
        await admin.from("library_loans").insert(result.loans.map((l) => ({ ...l, user_id: userId, fetched_at: now })));
      }
      const { data: loans } = await admin.from("library_loans").select("*").eq("user_id", userId).order("due_date");
      return json({ ok: result.ok, cached: false, data: { loans, note: (result as any).note ?? null } });
    }
    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
