import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
    if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: configs, error: configErr } = await supabase
      .from("telegram_config")
      .select("*")
      .not("telegram_chat_id", "is", null);

    if (configErr) throw configErr;
    if (!configs || configs.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "No configs" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date();
    const todayDay = today.getDate();
    let sent = 0;

    for (const config of configs) {
      const reminderDays = config.reminder_days_before || 2;
      const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

      const { data: accounts } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", config.user_id)
        .eq("month_year", currentMonthYear)
        .eq("paid", false);

      if (!accounts || accounts.length === 0) continue;

      const messages: string[] = [];

      const overdue = accounts.filter((a: any) => a.due_day < todayDay);
      if (overdue.length > 0) {
        const total = overdue.reduce((s: number, a: any) => s + Number(a.amount), 0);
        messages.push(
          `⚠️ *Contas atrasadas!*\n${overdue.map((a: any) => `• ${a.name}: R$${Number(a.amount).toFixed(2)} (dia ${a.due_day})`).join("\n")}\nTotal: R$${total.toFixed(2)}`
        );
      }

      const dueToday = accounts.filter((a: any) => a.due_day === todayDay);
      if (dueToday.length > 0) {
        messages.push(
          `⏰ *Vence hoje!*\n${dueToday.map((a: any) => `• ${a.name}: R$${Number(a.amount).toFixed(2)}`).join("\n")}`
        );
      }

      const dueSoon = accounts.filter((a: any) => {
        const diff = a.due_day - todayDay;
        return diff > 0 && diff <= reminderDays;
      });
      if (dueSoon.length > 0) {
        messages.push(
          `📅 *Vence em breve:*\n${dueSoon.map((a: any) => `• ${a.name}: R$${Number(a.amount).toFixed(2)} (dia ${a.due_day})`).join("\n")}`
        );
      }

      // Check salary status
      const { data: salaryData } = await supabase
        .from("salary")
        .select("*")
        .eq("user_id", config.user_id)
        .eq("month_year", currentMonthYear)
        .maybeSingle();

      if (salaryData && salaryData.received) {
        const totalAccounts = accounts.reduce((s: number, a: any) => s + Number(a.amount), 0);
        const remaining = Number(salaryData.amount) - totalAccounts;
        messages.push(
          `💰 *Saldo restante:* R$${remaining.toFixed(2)}`
        );
      }

      if (messages.length === 0) continue;

      const text = `🐷 *Meu Cofrinho*\n\n${messages.join("\n\n")}`;

      const telegramRes = await fetch(`${GATEWAY_URL}/sendMessage`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": TELEGRAM_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: config.telegram_chat_id,
          text,
          parse_mode: "Markdown",
        }),
      });

      const telegramData = await telegramRes.json();
      if (telegramRes.ok) sent++;
      else console.error("Telegram error:", telegramData);
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
