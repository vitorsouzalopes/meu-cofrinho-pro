import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Debt } from "@/financial/types";
import type { Tables } from "@/integrations/supabase/types";

const todayMY = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/** Contas do mês (instâncias + templates não-dívida) */
export function useAccounts(monthYear: string = todayMY()) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["accounts", user?.id, monthYear],
    enabled: !!user?.id,
    queryFn: async () => {
      const [inst, tmpl, pay] = await Promise.all([
        supabase.from("accounts").select("*")
          .eq("user_id", user!.id).eq("is_template", false)
          .eq("month_year", monthYear).order("due_day", { ascending: true }),
        supabase.from("accounts").select("*")
          .eq("user_id", user!.id).eq("is_template", true)
          .order("name", { ascending: true }),
        supabase.from("debt_payments").select("*")
          .eq("user_id", user!.id)
          .gte("data_pagamento", `${monthYear}-01`)
          .lte("data_pagamento", `${monthYear}-31`),
      ]);
      return {
        instances: inst.data ?? [],
        templates: tmpl.data ?? [],
        debtPayments: pay.data ?? [],
      };
    },
  });
}

export async function fetchDebts(userId: string): Promise<Debt[]> {
  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", userId)
    .order("juros_mensal", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((d) => ({
    ...d,
    id: d.id,
    nome: d.nome,
    banco: d.bank || d.nome, // Use bank if exists
    valorTotal: Number(d.valor_total),
    valorParcela: Number(d.parcela_mensal),
    parcelasRestantes: Number(d.parcelas_restantes ?? 0),
    jurosMensal: Number(d.juros_mensal) * 100,
    tipo: d.tipo as any, // Cast specific only where strictly necessary for external engine
    vencimento: String(d.dia_vencimento),
    permiteAmortizacao: d.permite_amortizacao ?? true,
    permiteQuitacao: d.permite_antecipacao ?? true,
  }));
}

/** Dívidas (fonte única para Planejamento e dashboard) */
export function useDebts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["debts", user?.id],
    enabled: !!user?.id,
    queryFn: () => fetchDebts(user!.id),
  });
}

export function useGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["goals", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user!.id)
        .order("priority", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Tables<"goals">[];
    },
  });
}

/** Invalida todas as queries financeiras (chame após criar/editar/excluir) */
export function useInvalidateFinance() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["accounts"] });
    qc.invalidateQueries({ queryKey: ["debts"] });
    qc.invalidateQueries({ queryKey: ["goals"] });
    window.dispatchEvent(new CustomEvent("finance-data-updated"));
  };
}
