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
  challenge_progress: (p) => `Desafio ${p.challenge_id} • +R$${Number(p.amount).toFixed(2)} • ${p.streak} dia(s) de sequência`,
  challenge_completed: (p) => `${p.challenge_id} concluído! Total: R$${Number(p.total).toFixed(2)}`,
  salary: (p) => `${p.month_year}: R$${Number(p.amount).toFixed(2)}`,
  extra_income: (p) => `${p.description}: +R$${Number(p.amount).toFixed(2)}`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { event, payload, user_id } = body as { event: EventType; payload: any; user_id?: string };
    if (!event || !TITLES[event]) {
      return new Response(JSON.stringify({ error: "invalid event" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    let targetUserId = user_id;
    if (!targetUserId) {
      const supabase = createClient(SUPA_URL, SERVICE_KEY, {
        global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
      });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "unauthenticated" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      targetUserId = user.id;
    }

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
    }).catch((e) => {
      console.warn("send-fcm failed:", e);
      return null;
    });

    return new Response(JSON.stringify({ ok: true, fcm: fcmRes?.ok ?? false }), {
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
