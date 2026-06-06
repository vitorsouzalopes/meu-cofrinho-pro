// Edge function: send-fcm
// Envia push via Firebase Cloud Messaging usando o Firebase Admin SDK.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { initializeApp, getApps, cert } from "npm:firebase-admin@12.7.0/app";
import { getMessaging } from "npm:firebase-admin@12.7.0/messaging";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseServiceAccountJson(value: string) {
  let raw = value.replace(/^\uFEFF/, "").trim();
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1).trim();
  }
  if (!raw) throw new Error("FCM_SERVICE_ACCOUNT_JSON está vazio.");

  const tryParse = (s: string) => {
    const parsed = JSON.parse(s);
    return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
  };

  const escapeRawNewlines = (s: string) => {
    let out = "";
    let inStr = false;
    let escaped = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (inStr) {
        if (escaped) { out += c; escaped = false; continue; }
        if (c === "\\") { out += c; escaped = true; continue; }
        if (c === '"') { out += c; inStr = false; continue; }
        if (c === "\n") { out += "\\n"; continue; }
        if (c === "\r") { out += "\\r"; continue; }
        if (c === "\t") { out += "\\t"; continue; }
        out += c;
      } else {
        if (c === '"') inStr = true;
        out += c;
      }
    }
    return out;
  };

  let lastErr: any = null;
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first !== -1 && last > first) {
    const slice = raw.slice(first, last + 1);
    try { return tryParse(slice); } catch (e) { lastErr = e; }
    try { return tryParse(escapeRawNewlines(slice)); } catch (e) { lastErr = e; }
  }

  const maybeBase64 = raw.replace(/\s+/g, "");
  if (/^[A-Za-z0-9+/=]+$/.test(maybeBase64) && maybeBase64.length > 100) {
    try {
      const decoded = atob(maybeBase64);
      try { return tryParse(decoded); } catch (e) { lastErr = e; }
      try { return tryParse(escapeRawNewlines(decoded)); } catch (e) { lastErr = e; }
    } catch (e) { lastErr = e; }
  }

  const preview = raw.slice(0, 100).replace(/[\r\n]/g, "\\n");
  throw new Error(
    `FCM_SERVICE_ACCOUNT_JSON inválido (${lastErr?.message || "formato desconhecido"}). ` +
    `Início: "${preview}..." | Tamanho: ${raw.length}. ` +
    `Cole o CONTEÚDO completo do arquivo .json (começando com { e terminando com }).`
  );
}

let cachedApp: any = null;
function getAdminApp(serviceAccount: any) {
  if (cachedApp) return cachedApp;
  const existing = getApps();
  cachedApp = existing.length > 0
    ? existing[0]
    : initializeApp({ credential: cert(serviceAccount) });
  return cachedApp;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user_id, title, body, url, force } = await req.json();
    if (!user_id || !title || !body) {
      return new Response(JSON.stringify({ error: "user_id, title, body required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FCM_SERVICE_ACCOUNT_JSON = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const missing: string[] = [];
    if (!FCM_SERVICE_ACCOUNT_JSON) missing.push("FCM_SERVICE_ACCOUNT_JSON");
    if (!SUPABASE_URL) missing.push("SUPABASE_URL");
    if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    if (missing.length) {
      return new Response(JSON.stringify({ ok: false, error: `Faltando: ${missing.join(", ")}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let serviceAccount;
    try {
      serviceAccount = parseServiceAccountJson(FCM_SERVICE_ACCOUNT_JSON!);
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { data: cfg } = await admin
      .from("telegram_config")
      .select("fcm_notifications_enabled")
      .eq("user_id", user_id)
      .maybeSingle();

    if (!force && cfg && cfg.fcm_notifications_enabled === false) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "user disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: tokens, error: tErr } = await admin
      .from("fcm_tokens").select("token").eq("user_id", user_id);
    if (tErr) throw tErr;
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "no tokens" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const app = getAdminApp(serviceAccount);
    const messaging = getMessaging(app);

    const tokenList = tokens.map((t: any) => t.token);
    const response = await messaging.sendEachForMulticast({
      tokens: tokenList,
      notification: { title, body },
      data: { url: url || "/" },
      webpush: { fcmOptions: { link: url || "/" } },
    });

    // Cleanup invalid tokens
    const toDelete: string[] = [];
    response.responses.forEach((r: any, i: number) => {
      if (!r.success) {
        const code = r.error?.code || "";
        if (code.includes("registration-token-not-registered") || code.includes("invalid-argument")) {
          toDelete.push(tokenList[i]);
        }
      }
    });
    if (toDelete.length) {
      await admin.from("fcm_tokens").delete().in("token", toDelete);
    }

    return new Response(JSON.stringify({
      ok: true,
      success: response.successCount,
      failure: response.failureCount,
      cleaned: toDelete.length,
      results: response.responses.map((r: any) => r.success ? { ok: true } : { ok: false, error: r.error?.message }),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
