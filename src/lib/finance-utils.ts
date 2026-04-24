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
  const contasDivida = dividas.map(d => ({
    id: `divida-sync-${d.id}`,
    nome: d.name || d.nome,
    valor: Number(d.amount || d.parcelaMensal || 0),
    tipo: "divida",
    vencimento: d.vencimento || new Date().toISOString(),
    status: d.paid ? "pago" : "pendente",
    is_template: false,
    parent_id: d.id
  }));

  // Retorna contas normais + as dívidas sincronizadas
  return [
    ...contas.filter(c => c.billing_type !== "debt" && c.tipo !== "divida"),
    ...contasDivida
  ];
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
