import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Expense = Tables<"expenses">;

function getTomorrowISO() {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return t.toISOString().split("T")[0];
}

export function useExpenseNotifications(expenses: Expense[]) {
  const { toast } = useToast();

  useEffect(() => {
    if (!expenses.length) return;
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = getTomorrowISO();

    // Contas que vencem amanhã
    const dueTomorrow = expenses.filter(e => e.next_due_date === tomorrow || e.date === tomorrow);
    if (dueTomorrow.length > 0) {
      toast({
        title: "Conta vence amanhã",
        description: `Você tem ${dueTomorrow.length} conta(s) para pagar amanhã! 💡`,
      });
    }
//teste
    // Contas atrasadas e saldo para investir removidos por falta de campos no tipo Expense
  }, [expenses, toast]);
}
