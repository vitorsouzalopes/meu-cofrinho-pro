import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

type EventType = "challenge_progress" | "challenge_completed" | "salary" | "extra_income";

const TEMPLATES: Record<EventType, (p: any) => string> = {
  challenge_progress: (p) =>
    `🐷 *Progresso registrado!*\n\n🎯 Desafio: *${p.challenge_id}*\n💰 Valor: R$${Number(p.amount).toFixed(2)}\n🔥 Sequência atual: *${p.streak} dia(s)*\n\n_Continue assim e mantenha sua sequência!_`,
  challenge_completed: (p) =>
    `🎉 *DESAFIO CONCLUÍDO!*\n\n🏆 ${p.challenge_id}\n💰 Total economizado: R$${Number(p.total).toFixed(2)}\n\n_Parabéns! Compartilhe sua conquista._`,
  salary: (p) =>
    `💵 *Salário ${p.received ? "recebido" : "atualizado"}*\n\n📅 Mês: ${p.month_year}\n💰 Valor: R$${Number(p.amount).toFixed(2)}\n\n_Não esqueça de pagar suas contas em dia!_`,
  extra_income: (p) =>
    `✨ *Renda extra registrada*\n\n📝 ${p.description}\n💰 +R$${Number(p.amount).toFixed(2)}\n\n_Que tal direcionar para uma meta?_`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { event, payload, user_id } = body as { event: EventType; payload: any; user_id?: string };
    if (!event || !TEMPLATES[event]) {
      return new Response(JSON.stringify({ error: "invalid event" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } },
    );

    let targetUserId = user_id;
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      targetUserId = user.id;
    }

    // service client to read config bypassing RLS context
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: cfg } = await admin
      .from("telegram_config")
      .select("telegram_chat_id, event_notifications_enabled")
      .eq("user_id", targetUserId)
      .maybeSingle();

    const eventsEnabled = !!cfg?.event_notifications_enabled;
    const text = TEMPLATES[event](payload);
    const plainText = text.replace(/\*/g, "");

    // Fire FCM push in parallel (non-blocking, best-effort)
    const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const titleByEvent: Record<EventType, string> = {
      challenge_progress: "🐷 Progresso registrado",
      challenge_completed: "🏆 Desafio concluído!",
      salary: "💵 Salário atualizado",
      extra_income: "✨ Renda extra",
    };
    const fcmPromise = fetch(`${SUPA_URL}/functions/v1/send-fcm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY },
      body: JSON.stringify({ user_id: targetUserId, title: titleByEvent[event], body: plainText.slice(0, 200), url: "/" }),
    }).catch((e) => console.warn("send-fcm failed:", e));

    if (!cfg?.telegram_chat_id || !eventsEnabled) {
      await fcmPromise;
      return new Response(JSON.stringify({ ok: true, telegram_skipped: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
    const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat_id: cfg.telegram_chat_id, text, parse_mode: "Markdown" }),
    });
    const data = await res.json();

    return new Response(JSON.stringify({ ok: res.ok, telegram: data }), {
      status: res.ok ? 200 : 502,
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
