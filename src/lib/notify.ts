import { supabase } from "@/integrations/supabase/client";

type EventType = "challenge_progress" | "challenge_completed" | "salary" | "extra_income";

/**
 * Dispara notificação de evento (Telegram). Falha silenciosamente — não bloqueia UX.
 */
export async function notifyEvent(event: EventType, payload: Record<string, unknown>) {
  try {
    await supabase.functions.invoke("notify-event", {
      body: { event, payload },
    });
  } catch (err) {
    console.warn("notifyEvent failed (non-blocking):", err);
  }
}
