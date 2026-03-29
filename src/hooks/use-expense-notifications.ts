import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Expense } from "@/integrations/supabase/types";

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

    // Contas atrasadas
    const overdue = expenses.filter(e => {
      const due = e.next_due_date || e.date;
      return due < today && !e.paid;
    });
    if (overdue.length > 0) {
      toast({
        title: "Conta atrasada",
        description: `Você tem ${overdue.length} conta(s) atrasada(s)! ⚠️`,
        variant: "destructive",
      });
    }

    // Pagou 3 contas hoje
    const paidToday = expenses.filter(e => e.paid && e.paid_date === today);
    if (paidToday.length >= 3) {
      toast({
        title: "Parabéns!",
        description: `Você pagou ${paidToday.length} contas hoje! 🎉`,
      });
    }

    // Sobrou dinheiro para investir (exemplo: saldo > 500)
    const saldo = expenses.filter(e => e.type !== "recurring").reduce((sum, e) => sum + (e.income ? e.amount : -e.amount), 0);
    if (saldo > 500) {
      toast({
        title: "Sobrou dinheiro!",
        description: `Você tem R$${saldo.toLocaleString("pt-BR", {minimumFractionDigits:2})} para investir! 💰`,
      });
    }
  }, [expenses, toast]);
}
