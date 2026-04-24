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
  // Filtra as dívidas que já possuem instâncias no mês para não duplicar
  const dividasSemInstancia = dividas.filter(d => 
    !contas.some(c => c.parent_id === d.id || (c.name === d.name && (c.billing_type === 'debt' || c.tipo === 'divida')))
  );

  const contasDivida = dividasSemInstancia.map(d => ({
    ...d,
    id: `virtual-debt-${d.id}`,
    nome: d.name || d.nome,
    valor: Number(d.amount || d.parcelaMensal || 0),
    tipo: "divida",
    vencimento: d.vencimento || new Date().toISOString(),
    status: "pendente",
    is_template: false,
    parent_id: d.id,
    virtual: true
  }));

  // Retorna contas normais + as dívidas sincronizadas (sem duplicar se já existir instância)
  return [...contas, ...contasDivida];
}

/**
 * 🎯 Resolve a lista final de contas do mês, unindo instâncias e templates sem duplicar.
 * Prioridade: Instância > Template
 */
export function resolverContasDoMes(instancias: any[], templates: any[], currentMonthYear: string) {
  const [currYear, currMonth] = currentMonthYear.split('-').map(Number);
  
  // 1. Filtrar templates que já começaram e estão ativos
  const templatesAtivos = templates.filter(t => {
    if (!t.start_date) return true;
    const [sYear, sMonth] = t.start_date.split('-').map(Number);
    const jaComecou = (currYear > sYear) || (currYear === sYear && currMonth >= sMonth);
    const aindaAtivo = t.billing_type !== 'debt' || (t.remaining_months === null || t.remaining_months > 0);
    return jaComecou && aindaAtivo;
  });

  const listaFinal = [...instancias];

  // 2. Para cada template, se não houver instância, adiciona como virtual
  templatesAtivos.forEach(t => {
    const temInstancia = instancias.some(i => i.parent_id === t.id || (i.name === t.name && i.billing_type === t.billing_type));
    
    if (!temInstancia) {
      listaFinal.push({
        ...t,
        id: `virtual-${t.id}`,
        nome: t.name,
        valor: Number(t.amount || 0),
        tipo: t.billing_type,
        vencimento: `${currentMonthYear}-${String(t.due_day || 5).padStart(2, '0')}`,
        status: "pendente",
        is_template: false,
        parent_id: t.id,
        virtual: true
      });
    }
  });

  return listaFinal;
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
