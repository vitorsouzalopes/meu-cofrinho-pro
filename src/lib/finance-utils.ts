import { Account } from "@/integrations/supabase/types";

export interface FinanceSummary {
  totalRenda: number;
  totalDespesas: number;
  totalDividas: number;
  saldoDisponivel: number;
  contasDoMes: any[];
}

/**
 * 📅 Regra de Filtragem por Mês/Ano
 */
export function filtrarContasPorMes(contas: any[], mes: number, ano: number) {
  return contas.filter(c => {
    if (!c.vencimento && !c.month_year && !c.start_date) return false;
    
    // Tenta pegar a data de várias fontes (vencimento, month_year ou start_date)
    const dataStr = c.vencimento || (c.month_year ? `${c.month_year}-01` : c.start_date);
    const d = new Date(dataStr);
    
    return d.getMonth() === mes && d.getFullYear() === ano;
  });
}

/**
 * 🔁 Sincronização Automática de Dívidas
 * Transforma templates de dívida em instâncias de conta para o cálculo
 */
export function sincronizarDividas(contas: any[], dividas: any[]) {
  // Retorna apenas a lista de contas/instâncias reais.
  // Não geramos mais dívidas virtuais a partir dos templates de dívida.
  return [...contas];
}

/**
 * 🎯 Resolve a lista final de contas do mês, unindo instâncias e templates sem duplicar.
 * Prioridade: Instância > Template
 */
export function resolverContasDoMes(instancias: any[], templates: any[], currentMonthYear: string) {
  // Retorna apenas as instâncias reais que já existem no banco de dados.
  // Ignoramos a geração de dados virtuais/projeções para manter apenas os dados reais.
  return [...instancias];
}

/**
 * 💰 Cálculo de Totais (Regra Obrigatória)
 */
export function calcularTotaisFinanceiros({
  salario = 0,
  extra = 0,
  contas = [],
  dividas = []
}: {
  salario?: number;
  extra?: number;
  contas?: any[];
  dividas?: any[];
}) {
  const totalContas = contas
    .filter(c => c.tipo !== "divida" && c.billing_type !== "debt")
    .reduce((s, c) => s + Number(c.valor || c.amount || 0), 0);

  const totalDividas = dividas.reduce((s, d) => s + Number(d.valor || d.amount || d.parcelaMensal || 0), 0);

  const renda = Number(salario) + Number(extra);
  const gastos = totalContas + totalDividas;

  return {
    renda,
    gastos,
    disponivel: renda - gastos,
    totalContas,
    totalDividas
  };
}
