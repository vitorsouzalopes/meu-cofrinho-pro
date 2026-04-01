import { useEffect, useRef } from "react";
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
  const hasNotified = useRef(false);

  useEffect(() => {
    if (!expenses.length || hasNotified.current) return;
    hasNotified.current = true;

    const today = new Date().toISOString().split("T")[0];
    const tomorrow = getTomorrowISO();

    // Contas que vencem amanhã
    const dueTomorrow = expenses.filter(
      (e) => e.next_due_date === tomorrow || e.date === tomorrow
    );
    if (dueTomorrow.length > 0) {
      toast({
        title: "📅 Conta vence amanhã",
        description: `Você tem ${dueTomorrow.length} conta(s) para pagar amanhã!`,
      });
    }

    // Contas atrasadas (next_due_date ou date no passado)
    const overdue = expenses.filter((e) => {
      const dueDate = e.next_due_date || e.date;
      return dueDate < today;
    });
    if (overdue.length > 0) {
      const totalOverdue = overdue.reduce((sum, e) => sum + Number(e.amount), 0);
      toast({
        title: "⚠️ Contas atrasadas",
        description: `${overdue.length} conta(s) atrasada(s) — Total: R$${totalOverdue.toFixed(2)}`,
        variant: "destructive",
      });
    }

    // Contas pagas hoje
    const paidToday = expenses.filter((e) => e.date === today);
    if (paidToday.length >= 3) {
      toast({
        title: "🎉 Parabéns!",
        description: `Você registrou ${paidToday.length} gastos hoje. Fique de olho!`,
      });
    }
  }, [expenses, toast]);
}
