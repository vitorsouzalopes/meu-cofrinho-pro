import { supabase } from "@/integrations/supabase/client";

type EventType = "challenge_progress" | "challenge_completed" | "salary" | "extra_income";

/**
 * Dispara notificação de evento (Supabase Edge Function).
 * Falha silenciosamente para o usuário mas loga erros detalhados no console.
 */
export async function notifyEvent(event: EventType, payload: Record<string, unknown>) {
  try {
    const { data, error } = await supabase.functions.invoke("notify-event", {
      body: { event, payload },
    });

    if (error) {
      console.error(`[notifyEvent] Error invoking function:`, error);
      // Try to parse the error message if it's a non-2xx status code
      if (error instanceof Error) {
         console.error(`[notifyEvent] Message: ${error.message}`);
      }
      return;
    }

    if (data && !data.ok) {
      console.warn(`[notifyEvent] Function returned business error:`, data.error);
    } else {
      console.log(`[notifyEvent] Event ${event} successfully processed.`);
    }

  } catch (err) {
    console.error("[notifyEvent] Fatal connection error:", err);
  }
}
