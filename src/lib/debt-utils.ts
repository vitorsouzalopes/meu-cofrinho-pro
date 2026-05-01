// Funções core de cálculo de dívidas

export interface Debt {
  id: string;
  nome: string;
  tipo: string;
  valor_total: number;
  valor_restante: number;
  parcela_mensal: number;
  total_parcelas?: number | null;
  parcelas_restantes?: number | null;
  juros_mensal: number; // ex: 0.10 = 10%
  dia_vencimento: number;
  permite_antecipacao: boolean;
  permite_amortizacao: boolean;
}

const MAX_MESES = 240;

/** Calcula meses para quitar com a parcela atual */
export function calcularMesesQuitar(debt: Debt, valorMensal?: number): number {
  let saldo = debt.valor_restante;
  const pagamento = valorMensal ?? debt.parcela_mensal;
  let meses = 0;

  if (pagamento <= 0) return Infinity;

  while (saldo > 0 && meses < MAX_MESES) {
    saldo = saldo * (1 + (debt.juros_mensal || 0));
    saldo -= pagamento;
    meses++;
  }
  return meses;
}

/** Simula um cenário de pagamento */
export function simular(debt: Debt, valorMensal: number) {
  let saldo = debt.valor_restante;
  let meses = 0;
  let totalPago = 0;
  let totalJuros = 0;

  if (valorMensal <= 0) {
    return { meses: Infinity, totalPago: 0, totalJuros: 0 };
  }

  while (saldo > 0 && meses < MAX_MESES) {
    const juros = saldo * (debt.juros_mensal || 0);
    totalJuros += juros;
    saldo = saldo + juros;

    const pagamentoEfetivo = Math.min(valorMensal, saldo);
    saldo -= pagamentoEfetivo;
    totalPago += pagamentoEfetivo;
    meses++;
  }

  return { meses, totalPago, totalJuros };
}

/** Estratégia HARD: usa 90% da renda disponível */
export function estrategiaHard(rendaDisponivel: number) {
  return Math.max(0, rendaDisponivel * 0.9);
}

/** Estratégia MISTA: usa 60% da renda disponível */
export function estrategiaMista(rendaDisponivel: number) {
  return Math.max(0, rendaDisponivel * 0.6);
}

/** Gera dados para o gráfico de evolução do saldo */
export function gerarGraficoDivida(debt: Debt, valorMensal: number, mesesMax = 24) {
  let saldo = debt.valor_restante;
  const dados: { mes: number; saldo: number }[] = [];
  dados.push({ mes: 0, saldo });

  for (let i = 1; i <= mesesMax; i++) {
    if (saldo <= 0) {
      dados.push({ mes: i, saldo: 0 });
      continue;
    }
    saldo = saldo * (1 + (debt.juros_mensal || 0));
    saldo -= valorMensal;
    dados.push({ mes: i, saldo: Math.max(saldo, 0) });
  }
  return dados;
}

/** Ordena dívidas pela maior taxa de juros (Avalanche) */
export function ordenarDividasPorJuros(dividas: Debt[]) {
  return [...dividas].sort((a, b) => (b.juros_mensal || 0) - (a.juros_mensal || 0));
}

/** Retorna sugestão automática para a dívida */
export function sugestaoAutomatica(debt: Debt): string | null {
  if ((debt.juros_mensal || 0) > 0.1) {
    return "Alta taxa de juros — priorize quitar essa dívida.";
  }
  if ((debt.juros_mensal || 0) > 0.05) {
    return "Juros acima da média — considere antecipar parcelas.";
  }
  return null;
}

export const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    isFinite(v) ? v : 0,
  );
