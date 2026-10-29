// Food sync — fetches meal data from food.nit.ac.ir
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
const KDF_INPUT = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; // derive enc key from service role
const CACHE_TTL_MS = 15 * 60 * 1000;
const FOOD_BASE = "https://food.nit.ac.ir";

// --- AES-GCM helpers ---
async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode("food-creds:" + KDF_INPUT));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
async function encryptText(plain: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain)),
  );
  const combined = new Uint8Array(iv.length + ct.length);
  combined.set(iv, 0); combined.set(ct, iv.length);
  return btoa(String.fromCharCode(...combined));
}
async function decryptText(b64: string): Promise<string> {
  const key = await getKey();
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const iv = bin.slice(0, 12);
  const ct = bin.slice(12);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}

// --- Scraper (best-effort; selectors may need adjustment after testing) ---
async function scrapeFood(username: string, password: string) {
  // Attempt login + fetch reservations page.
  // NOTE: food.nit.ac.ir structure cannot be tested from here; this is a
  // generic scaffold using common Persian university food-system patterns.
  try {
    // 1) GET login page to grab CSRF/cookies
    const loginPageRes = await fetch(`${FOOD_BASE}/`, { redirect: "manual" });
    const cookies1 = loginPageRes.headers.get("set-cookie") ?? "";
    const html1 = await loginPageRes.text();
    const doc1 = new DOMParser().parseFromString(html1, "text/html");
    const tokenInput =
      doc1?.querySelector('input[name="__RequestVerificationToken"]') ||
      doc1?.querySelector('input[name="_token"]') ||
      doc1?.querySelector('input[name="csrf_token"]');
    const token = tokenInput?.getAttribute("value") ?? "";

    // 2) POST credentials
    const form = new URLSearchParams();
    form.set("Username", username);
    form.set("Password", password);
    form.set("username", username);
    form.set("password", password);
    if (token) {
      form.set("__RequestVerificationToken", token);
      form.set("_token", token);
    }

    const loginRes = await fetch(`${FOOD_BASE}/Account/Login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": cookies1,
      },
      body: form.toString(),
      redirect: "manual",
    });
    const cookies2 = loginRes.headers.get("set-cookie") ?? cookies1;

    // 3) GET reservation/menu page
    const menuRes = await fetch(`${FOOD_BASE}/Reserve/Index`, {
      headers: { "Cookie": cookies2 },
    });
    const html2 = await menuRes.text();
    const doc = new DOMParser().parseFromString(html2, "text/html");
    if (!doc) throw new Error("parse-failed");

    // Heuristic extraction
    const cells = Array.from(doc.querySelectorAll("td, .meal-cell, [data-meal]"));
    const meals: Array<{ date: string; kind: string; name: string; reserved: boolean }> = [];
    for (const c of cells) {
      const txt = (c.textContent ?? "").trim();
      if (!txt) continue;
      const reserved = !!c.querySelector("input[checked], .reserved, .selected");
      const dateAttr = c.getAttribute("data-date");
      const kindAttr = c.getAttribute("data-meal") ?? "";
      if (dateAttr) {
        meals.push({ date: dateAttr, kind: kindAttr || "lunch", name: txt.slice(0, 80), reserved });
      }
    }

    return {
      ok: true,
      meals,
      note: meals.length ? null : "ساختار صفحه شناسایی نشد — نیاز به تنظیم selector",
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "unauthorized" }, 401);

    const supa = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData, error: uErr } = await supa.auth.getUser();
    if (uErr || !userData.user) return json({ error: "unauthorized" }, 401);
    const userId = userData.user.id;

    const rawBody = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return json({ error: "invalid-input", details: parsed.error.flatten() }, 400);
    }
    const body = parsed.data;
    const action = body.action;

    if (body.action === "save_creds") {
      const { username, password } = body;
      const enc = await encryptText(password);
      const admin = createClient(SUPABASE_URL, SERVICE_KEY);
      const { error } = await admin
        .from("university_credentials")
        .upsert({ user_id: userId, system: "food", username, password_encrypted: enc, updated_at: new Date().toISOString() }, { onConflict: "user_id,system" });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "delete_creds") {
      const admin = createClient(SUPABASE_URL, SERVICE_KEY);
      await admin.from("university_credentials").delete().eq("user_id", userId).eq("system", "food");
      return json({ ok: true });
    }

    if (action === "fetch") {
      const admin = createClient(SUPABASE_URL, SERVICE_KEY);
      // week_start = this week's Saturday (Persian week)
      const now = new Date();
      const day = now.getDay(); // Sun=0..Sat=6
      const diffToSat = (day + 1) % 7; // days since last Saturday
      const sat = new Date(now); sat.setDate(now.getDate() - diffToSat);
      const weekStart = sat.toISOString().slice(0, 10);

      const { data: cached } = await admin
        .from("food_menu_cache")
        .select("*").eq("user_id", userId).eq("week_start", weekStart).maybeSingle();

      const force = body.action === "fetch" && body.force === true;
      if (!force && cached && (Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS)) {
        return json({ ok: true, cached: true, data: cached.payload });
      }

      const { data: cred } = await admin
        .from("university_credentials")
        .select("username, password_encrypted").eq("user_id", userId).eq("system", "food").maybeSingle();
      if (!cred) return json({ ok: false, error: "no-credentials" }, 200);

      const password = await decryptText(cred.password_encrypted);
      const result = await scrapeFood(cred.username, password);

      if (result.ok) {
        await admin.from("food_menu_cache").upsert(
          { user_id: userId, week_start: weekStart, payload: result, fetched_at: new Date().toISOString() },
          { onConflict: "user_id,week_start" },
        );
      }
      return json({ ok: result.ok, cached: false, data: result });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
