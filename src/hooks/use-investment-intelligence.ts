import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Investment = Tables<"investments">;

export function useInvestmentIntelligence(investments: Investment[]) {
  const { toast } = useToast();
  const hasNotified = useRef(false);

  useEffect(() => {
    if (!investments.length || hasNotified.current) return;
    hasNotified.current = true;

    const total = investments.reduce(
      (sum, inv) => sum + Number(inv.current_amount ?? inv.amount),
      0
    );

    // Alerta automático: retorno negativo
    const retornoNegativo = investments.filter(
      (inv) => Number(inv.current_amount ?? inv.amount) < Number(inv.amount)
    );
    if (retornoNegativo.length > 0) {
      toast({
        title: "⚠️ Retorno negativo",
        description: `${retornoNegativo.length} investimento(s) com retorno negativo. Fique atento!`,
        variant: "destructive",
      });
    }

    // Meta inteligente
    if (total < 1000) {
      const falta = 1000 - total;
      toast({
        title: "🎯 Meta sugerida",
        description: `Faltam R$${falta.toFixed(2)} para chegar a R$1.000,00 investidos!`,
      });
    }

    // Saldo parado (investimento sem atualização de valor)
    const semAtualizacao = investments.filter(
      (inv) => inv.current_amount === null || Number(inv.current_amount) === Number(inv.amount)
    );
    if (semAtualizacao.length > 0 && investments.length >= 2) {
      toast({
        title: "💡 Atualize seus valores",
        description: `${semAtualizacao.length} investimento(s) sem atualização de saldo.`,
      });
    }
  }, [investments, toast]);
}
