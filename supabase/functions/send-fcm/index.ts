// Edge function: send-fcm
// Envia push via Firebase Cloud Messaging HTTP v1 API usando uma Service Account.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------- JWT (RS256) signer for Google OAuth ----------
function base64url(input: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof input === "string") bytes = new TextEncoder().encode(input);
  else if (input instanceof Uint8Array) bytes = input;
  else bytes = new Uint8Array(input);
  let str = "";
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64url(sigBuf)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  if (!json?.access_token) {
    throw new Error(`Google token response missing access_token: ${JSON.stringify(json)}`);
  }
  return json.access_token;
}

function parseServiceAccountJson(value: string) {
  // Strip BOM, surrounding whitespace, and outer single/double quotes if present
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
    // Escape real newlines/tabs that appear INSIDE JSON string literals.
    // We scan char-by-char, tracking whether we're inside a "..." string.
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
        if (c === '"') { inStr = true; }
        out += c;
      }
    }
    return out;
  };

  let lastErr: any = null;

  // Extract from first { to last } if both exist
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first !== -1 && last > first) {
    const slice = raw.slice(first, last + 1);
    try { return tryParse(slice); } catch (e) { lastErr = e; }
    try { return tryParse(escapeRawNewlines(slice)); } catch (e) { lastErr = e; }
  }

  // No braces (or only partial): wrap and try
  if (raw.includes('"type"') || raw.includes('"private_key"')) {
    let body = raw;
    if (body.startsWith("{")) body = body.slice(1);
    if (body.endsWith("}")) body = body.slice(0, -1);
    body = body.trim().replace(/,\s*$/, "");
    const wrapped = "{" + body + "}";
    try { return tryParse(wrapped); } catch (e) { lastErr = e; }
    try { return tryParse(escapeRawNewlines(wrapped)); } catch (e) { lastErr = e; }
  }

  // Base64 fallback
  const maybeBase64 = raw.replace(/\s+/g, "");
  if (/^[A-Za-z0-9+/=]+$/.test(maybeBase64) && maybeBase64.length > 100) {
    try {
      const decoded = atob(maybeBase64);
      try { return tryParse(decoded); } catch (e) { lastErr = e; }
      try { return tryParse(escapeRawNewlines(decoded)); } catch (e) { lastErr = e; }
    } catch (e) { lastErr = e; }
  }

  const preview = raw.slice(0, 100).replace(/[\r\n]/g, "\\n");
  const tail = raw.slice(-60).replace(/[\r\n]/g, "\\n");
  throw new Error(
    `FCM_SERVICE_ACCOUNT_JSON inválido (${lastErr?.message || "formato desconhecido"}). ` +
    `Início: "${preview}..." | Fim: "...${tail}" | Tamanho: ${raw.length}.`
  );
}

// ---------- Handler ----------
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
    const FCM_PROJECT_ID = Deno.env.get("FCM_PROJECT_ID")?.trim();
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const missingEnv = [];
    if (!FCM_SERVICE_ACCOUNT_JSON) missingEnv.push("FCM_SERVICE_ACCOUNT_JSON");
    if (!FCM_PROJECT_ID) missingEnv.push("FCM_PROJECT_ID");
    if (!SUPABASE_URL) missingEnv.push("SUPABASE_URL");
    if (!SUPABASE_SERVICE_ROLE_KEY) missingEnv.push("SUPABASE_SERVICE_ROLE_KEY");

    if (missingEnv.length > 0) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: `Firebase/Supabase não configurado. Defina: ${missingEnv.join(", ")}`
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let serviceAccount;
    try {
      serviceAccount = parseServiceAccountJson(FCM_SERVICE_ACCOUNT_JSON);
    } catch (error) {
      return new Response(JSON.stringify({ ok: false, error: `${(error as Error).message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    );

    // check user prefs
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
      .from("fcm_tokens")
      .select("token")
      .eq("user_id", user_id);
    if (tErr) throw tErr;
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "no tokens" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken;
    try {
      accessToken = await getAccessToken(serviceAccount);
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: `Erro ao obter Access Token do Google: ${(e as Error).message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const endpoint = `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`;

    const results = await Promise.all(
      tokens.map(async ({ token }) => {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title, body },
              data: { url: url || "/" },
              webpush: { fcm_options: { link: url || "/" } },
            },
          }),
        });
        const out: any = { token, status: res.status };
        if (!res.ok) {
          out.error = await res.text();
          // Cleanup invalid/unregistered tokens
          if (res.status === 404 || res.status === 400) {
            await admin.from("fcm_tokens").delete().eq("token", token);
            out.cleaned = true;
          }
        }
        return out;
      }),
    );

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
