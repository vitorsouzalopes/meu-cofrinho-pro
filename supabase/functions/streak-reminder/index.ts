import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function brasiliaHourNow(): number {
  const utcH = new Date().getUTCHours();
  return (utcH - 3 + 24) % 24;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPA_URL, SERVICE_KEY);

    let user_id: string | null = null;
    try {
      const body = await req.json();
      user_id = body?.user_id ?? null;
    } catch { /* ignore */ }

    const targetHour = brasiliaHourNow();
    const today = new Date().toISOString().slice(0, 10);

    // Encontra usuários com push registrado
    let tokensQuery = supabase
      .from("fcm_tokens")
      .select("user_id");

    if (user_id) {
      tokensQuery = tokensQuery.eq("user_id", user_id);
    }

    const { data: tokens, error } = await tokensQuery;
    if (error) throw error;

    // Deduplica user_ids
    const userIds = Array.from(new Set((tokens ?? []).map((t: any) => t.user_id)));
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, hour: targetHour, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cruza com preferência (opcional) — se telegram_config existir com streak_reminders_enabled
    let allowedUsers = userIds;
    if (!user_id) {
      const { data: cfgs } = await supabase
        .from("telegram_config")
        .select("user_id, reminder_hour, streak_reminders_enabled")
        .in("user_id", userIds);
      const cfgMap = new Map((cfgs ?? []).map((c: any) => [c.user_id, c]));
      allowedUsers = userIds.filter((uid) => {
        const cfg = cfgMap.get(uid);
        if (!cfg) return targetHour === 20; // default 20h se não configurou
        if (!cfg.streak_reminders_enabled) return false;
        return (cfg.reminder_hour ?? 20) === targetHour;
      });
    }

    let sent = 0;
    for (const uid of allowedUsers) {
      const { data: challenges } = await supabase
        .from("user_challenges")
        .select("id, challenge_id")
        .eq("user_id", uid)
        .eq("status", "active");

      if (!challenges || challenges.length === 0) continue;

      // Já fez algum desafio hoje?
      const chIds = challenges.map((c: any) => c.id);
      const { data: doneToday } = await supabase
        .from("challenge_progress")
        .select("id")
        .in("user_challenge_id", chIds)
        .eq("status_date", today)
        .limit(1);

      const alreadyDone = (doneToday?.length ?? 0) > 0;
      const title = "🐷 Lembrete de Desafio";
      const body = alreadyDone
        ? "Boa! Você já marcou hoje. Continue mantendo a sequência 🔥"
        : "Ainda não marcou hoje — abra o app e não quebre sua sequência!";

      try {
        await fetch(`${SUPA_URL}/functions/v1/send-fcm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_KEY}`,
            apikey: SERVICE_KEY,
          },
          body: JSON.stringify({ user_id: uid, title, body, url: "/challenges" }),
        });
        sent++;
      } catch (e) {
        console.warn("send-fcm failed for", uid, e);
      }
    }

    return new Response(JSON.stringify({ ok: true, hour: targetHour, sent }), {
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
