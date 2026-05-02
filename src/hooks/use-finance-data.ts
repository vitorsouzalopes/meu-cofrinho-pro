import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
      const [inst, tmpl] = await Promise.all([
        supabase.from("accounts").select("*")
          .eq("user_id", user!.id).eq("is_template", false)
          .eq("month_year", monthYear).order("due_day", { ascending: true }),
        supabase.from("accounts").select("*")
          .eq("user_id", user!.id).eq("is_template", true)
          .order("name", { ascending: true }),
      ]);
      return {
        instances: inst.data ?? [],
        templates: tmpl.data ?? [],
      };
    },
  });
}

/** Dívidas (fonte única para Planejamento e dashboard) */
export function useDebts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["debts", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("debts" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("juros_mensal", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["goals", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("priority", { ascending: true });
      if (error) throw error;
      return (data ?? []) as any[];
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
