import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { parseDebtType, type Debt } from "@/financial/types";

const todayMY = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/** Contas do mês (instâncias + templates não-dívida) */
export function useAccounts(monthYear: string = todayMY()) {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: ["accounts", userId, monthYear],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error("Usuário não autenticado");
      const [inst, tmpl, pay] = await Promise.all([
        supabase.from("accounts").select("*")
          .eq("user_id", userId).eq("is_template", false)
          .eq("month_year", monthYear).order("due_day", { ascending: true }),
        supabase.from("accounts").select("*")
          .eq("user_id", userId).eq("is_template", true)
          .order("name", { ascending: true }),
        supabase.from("debt_payments").select("*")
          .eq("user_id", userId)
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
    tipo: parseDebtType(d.tipo),
    vencimento: String(d.dia_vencimento),
    permiteAmortizacao: d.permite_amortizacao ?? true,
    permiteQuitacao: d.permite_antecipacao ?? true,
  }));
}

/** Dívidas (fonte única para Planejamento e dashboard) */
export function useDebts() {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: ["debts", userId],
    enabled: !!userId,
    queryFn: () => {
      if (!userId) throw new Error("Usuário não autenticado");
      return fetchDebts(userId);
    },
  });
}

export function useGoals() {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: ["goals", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .order("priority", { ascending: true });
      if (error) throw error;
      return data ?? [];
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
