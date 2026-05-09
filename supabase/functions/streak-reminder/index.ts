import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

function brasiliaHourNow(): number {
  // UTC-3 (sem horário de verão no Brasil atualmente)
  const utcH = new Date().getUTCHours();
  return (utcH - 3 + 24) % 24;
}

async function sendTelegram(chatId: number, text: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
  const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TELEGRAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("Telegram error", res.status, t);
  }
  return res.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.clone().json().catch(() => ({}));
    const { user_id } = body;

    const targetHour = brasiliaHourNow();

    // Pega só configs cujo reminder_hour bate com a hora atual de Brasília
    // OU se for um disparo forçado para um usuário específico
    let query = supabase
      .from("telegram_config")
      .select("*")
      .eq("streak_reminders_enabled", true)
      .not("telegram_chat_id", "is", null);

    if (user_id) {
      query = query.eq("user_id", user_id);
    } else {
      query = query.eq("reminder_hour", targetHour);
    }

    const { data: configs, error } = await query;

    if (error) throw error;
    if (!configs || configs.length === 0) {
      return new Response(JSON.stringify({ ok: true, hour: targetHour, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    let sent = 0;

    for (const cfg of configs) {
      // Busca desafios ativos do usuário
      const { data: challenges } = await supabase
        .from("user_challenges")
        .select("id, challenge_id, start_date")
        .eq("user_id", cfg.user_id)
        .eq("status", "active");

      if (!challenges || challenges.length === 0) continue;

      const lines: string[] = [];
      for (const ch of challenges) {
        const { data: progress } = await supabase
          .from("challenge_progress")
          .select("status_date, amount_saved")
          .eq("user_challenge_id", ch.id)
          .order("status_date", { ascending: false });

        const dates = new Set((progress || []).map((p: any) => p.status_date));
        // calcular streak (dias consecutivos terminando ontem ou hoje)
        let streak = 0;
        const cursor = new Date();
        // começa de hoje pra trás
        for (let i = 0; i < 365; i++) {
          const d = cursor.toISOString().slice(0, 10);
          if (dates.has(d)) {
            streak++;
            cursor.setDate(cursor.getDate() - 1);
          } else {
            // se não fez hoje ainda, não quebra; tenta ontem como base
            if (i === 0) {
              cursor.setDate(cursor.getDate() - 1);
              continue;
            }
            break;
          }
        }
        const didToday = dates.has(today);
        const total = (progress || []).reduce((a: number, p: any) => a + Number(p.amount_saved || 0), 0);
        const flame = streak >= 7 ? "🔥🔥" : streak >= 3 ? "🔥" : "✨";
        lines.push(
          `${flame} *${ch.challenge_id}*\nSequência: *${streak} dia(s)* • Acumulado: R$${total.toFixed(2)}\n${didToday ? "✅ Você já fez hoje! Continue assim." : "⏰ Ainda não fez hoje — não quebre a sequência!"}`,
        );
      }

      const text = `🐷 *Cofrinho Pro — Lembrete diário*\n\n${lines.join("\n\n")}\n\n_Abra o app e marque seu progresso para manter o streak._`;
      const ok = await sendTelegram(cfg.telegram_chat_id, text);
      if (ok) sent++;

      // FCM push (best-effort)
      try {
        const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
        const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        await fetch(`${SUPA_URL}/functions/v1/send-fcm`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY },
          body: JSON.stringify({
            user_id: cfg.user_id,
            title: "🐷 Lembrete diário",
            body: "Não esqueça de marcar seu desafio hoje para manter a sequência!",
            url: "/progress",
          }),
        });
      } catch (e) { console.warn("send-fcm failed:", e); }
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
