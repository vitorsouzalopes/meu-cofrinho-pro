import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Investment } from "@/integrations/supabase/types";

export function useInvestmentIntelligence(investments: Investment[]) {
  const { toast } = useToast();

  useEffect(() => {
    if (!investments.length) return;
    const total = investments.reduce((sum, inv) => sum + Number(inv.current_amount ?? inv.amount), 0);
    const aportes = investments.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    const retornoNegativo = investments.some(inv => Number(inv.current_amount ?? inv.amount) < Number(inv.amount));

    // Previsão simples: saldo + aportes futuros (exemplo fictício)
    const saldoPrevisto = total + 200; // supondo aporte mensal de 200
    if (saldoPrevisto > total) {
      toast({
        title: "Previsão de saldo",
        description: `Se investir R$200/mês, terá R$${saldoPrevisto.toLocaleString("pt-BR", {minimumFractionDigits:2})} em 1 mês!`,
      });
    }

    // Meta inteligente: sugerir valor para investir
    if (total < 1000) {
      toast({
        title: "Meta sugerida",
        description: "Que tal investir mais R$100 este mês para alcançar R$1000?",
      });
    }

    // Alerta automático: retorno negativo
    if (retornoNegativo) {
      toast({
        title: "Atenção!",
        description: "Algum investimento está com retorno negativo.",
        variant: "destructive",
      });
    }
  }, [investments, toast]);
}
