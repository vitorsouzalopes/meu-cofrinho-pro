import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EventType = "challenge_progress" | "challenge_completed" | "salary" | "extra_income";

const TITLES: Record<EventType, string> = {
  challenge_progress: "🐷 Progresso registrado",
  challenge_completed: "🏆 Desafio concluído!",
  salary: "💵 Salário atualizado",
  extra_income: "✨ Renda extra",
};

const URLS: Record<EventType, string> = {
  challenge_progress: "/challenges",
  challenge_completed: "/challenges",
  salary: "/monthly-accounts",
  extra_income: "/today",
};

const BODIES: Record<EventType, (p: any) => string> = {
  challenge_progress: (p) => `Desafio ${p.challenge_id ?? 'N/A'} • +R$${Number(p.amount || 0).toFixed(2)} • ${p.streak || 0} dia(s) de sequência`,
  challenge_completed: (p) => `${p.challenge_id ?? 'Desafio'} concluído! Total: R$${Number(p.total || 0).toFixed(2)}`,
  salary: (p) => `${p.month_year ?? ''}: R$${Number(p.amount || 0).toFixed(2)}`,
  extra_income: (p) => `${p.description ?? 'Renda'}: +R$${Number(p.amount || 0).toFixed(2)}`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { event, payload, user_id } = body as { event: EventType; payload: any; user_id?: string };

    // Payload Validation
    if (!event || !TITLES[event]) {
      console.error("[Notify] Invalid event type:", event);
      return new Response(JSON.stringify({ error: `Evento inválido: ${event}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!payload || typeof payload !== 'object') {
      console.error("[Notify] Missing or invalid payload for event:", event);
      return new Response(JSON.stringify({ error: "Payload ausente ou inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPA_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPA_URL || !SERVICE_KEY) {
      console.error("[Notify] Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(JSON.stringify({ error: "Configuração de servidor incompleta (SUPABASE_URL/KEY)" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let targetUserId = user_id;
    if (!targetUserId) {
      const supabase = createClient(SUPA_URL, SERVICE_KEY, {
        global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
      });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Sessão expirada ou não autenticada" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      targetUserId = user.id;
    }

    console.log(`[Notify] Forwarding event ${event} to send-fcm for user ${targetUserId}`);

    const fcmRes = await fetch(`${SUPA_URL}/functions/v1/send-fcm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
      },
      body: JSON.stringify({
        user_id: targetUserId,
        title: TITLES[event],
        body: BODIES[event](payload).slice(0, 200),
        url: URLS[event],
      }),
    });

    if (!fcmRes.ok) {
      const errorText = await fcmRes.text();
      console.error("[Notify] send-fcm call failed:", fcmRes.status, errorText);
      return new Response(JSON.stringify({
        error: `Sub-função send-fcm falhou com status ${fcmRes.status}`,
        details: errorText.slice(0, 100)
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fcmData = await fcmRes.json();
    console.log("[Notify] send-fcm response:", fcmData);

    return new Response(JSON.stringify({
      ok: true,
      fcm: fcmData.ok || false,
      eventId: crypto.randomUUID()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[Notify] Critical error in Deno serve:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
