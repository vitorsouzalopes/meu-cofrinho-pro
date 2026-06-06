import { Debt } from './types';

/**
 * Tipos para suportar simulação de múltiplas dívidas com estratégias diferentes
 */

export interface DebtState {
  debtId: string;
  nome: string;
  saldoRestante: number;
  parcelasRestantes: number;
  jurosMensal: number;
  valorParcela: number;
  dataQuitacao?: Date;
}

export interface MonthlyPayment {
  mes: number;
  data: Date;
  debtId: string;
  nomeDivida: string;
  pagamento: number;
  juros: number;
  saldoAnterior: number;
  saldoPos: number;
  quitar: boolean;
}

export interface StrategyResult {
  estrategia: 'avalanche' | 'snowball' | 'fluxo-caixa';
  prioridade: Array<{
    debtId: string;
    nomeDivida: string;
    ordem: number;
    motivo: string;
  }>;
  timeline: MonthlyPayment[];
  datasQuitacao: Map<string, Date>;
  dataQuitacaoTotal: Date;
  totalPago: number;
  totalJuros: number;
  economiJuros: number;
  mesesTotais: number;
  efeitos: {
    [debtId: string]: {
      nomeDivida: string;
      dataQuitacao: Date;
      totalJurosPago: number;
      parcelasQuitadas: number;
    };
  };
}

/**
 * Simula o pagamento de múltiplas dívidas com uma estratégia específica
 * @param debts Array de dívidas
 * @param pagamentoMensal Valor total disponível por mês
 * @param estrategia Qual estratégia usar
 * @param mesesMax Máximo de meses para simular
 */
export function simularMultiplasDividas(
  debts: Debt[],
  pagamentoMensal: number,
  estrategia: 'avalanche' | 'snowball' | 'fluxo-caixa',
  mesesMax: number = 360
): StrategyResult {
  if (pagamentoMensal <= 0 || debts.length === 0) {
    throw new Error('Pagamento mensal deve ser > 0 e deve haver dívidas');
  }

  // Inicializar estados das dívidas
  const estados = debts.map((d) => ({
    debtId: d.id,
    nome: d.nome,
    saldoRestante: d.valorTotal,
    parcelasRestantes: d.parcelasRestantes,
    jurosMensal: d.jurosMensal / 100,
    valorParcela: d.valorParcela,
    dataQuitacao: undefined as Date | undefined,
  }));

  // Determinar ordem de prioridade baseado na estratégia
  const prioridade = definirPrioridade(estados, estrategia);

  // Simular mês a mês
  const timeline: MonthlyPayment[] = [];
  const datasQuitacao = new Map<string, Date>();
  let dataAtual = new Date();
  let totalJurosMes = 0;
  let totalPagoSim = 0;
  let mes = 0;

  while (mes < mesesMax && estados.some((e) => e.saldoRestante > 0.01)) {
    mes++;
    dataAtual = new Date(dataAtual);
    dataAtual.setMonth(dataAtual.getMonth() + 1);

    // Aplicar juros a todas as dívidas ativas
    for (const estado of estados) {
      if (estado.saldoRestante > 0.01) {
        const jurosAplicados = estado.saldoRestante * estado.jurosMensal;
        estado.saldoRestante += jurosAplicados;
        totalJurosMes += jurosAplicados;
      }
    }

    // Distribuir pagamento conforme estratégia
    let pagamentoDisponivel = pagamentoMensal;
    const pagamentosPorDivida: { [key: string]: number } = {};

    // Reordenar dívidas conforme a estratégia (somente as ativas)
    const ordemAtual = reordenarDividasStrategy(estados, estrategia, datasQuitacao);

    for (const debtId of ordemAtual) {
      const estado = estados.find((e) => e.debtId === debtId);
      if (!estado || estado.saldoRestante <= 0.01) continue;

      const pagamentoEfetivo = Math.min(pagamentoDisponivel, estado.saldoRestante);
      const saldoAnterior = estado.saldoRestante;
      
      estado.saldoRestante -= pagamentoEfetivo;
      pagamentoDisponivel -= pagamentoEfetivo;
      pagamentosPorDivida[debtId] = pagamentoEfetivo;
      totalPagoSim += pagamentoEfetivo;

      // Registrar data de quitação
      if (estado.saldoRestante <= 0.01 && !datasQuitacao.has(debtId)) {
        datasQuitacao.set(debtId, new Date(dataAtual));
        estado.dataQuitacao = new Date(dataAtual);
      }

      // Registrar na timeline
      const juros = saldoAnterior * estado.jurosMensal;
      timeline.push({
        mes,
        data: new Date(dataAtual),
        debtId,
        nomeDivida: estado.nome,
        pagamento: pagamentoEfetivo,
        juros,
        saldoAnterior,
        saldoPos: Math.max(0, estado.saldoRestante),
        quitar: estado.saldoRestante <= 0.01,
      });
    }
  }

  // Calcular economia de juros em relação a cenário base (pagar apenas a parcela)
  const jurosBase = calcularJurosBase(debts);

  const efeitos: { [key: string]: any } = {};
  for (const debtId of datasQuitacao.keys()) {
    const estado = estados.find((e) => e.debtId === debtId)!;
    const dataQuit = datasQuitacao.get(debtId)!;
    const totalJurosPago = timeline
      .filter((t) => t.debtId === debtId)
      .reduce((sum, t) => sum + t.juros, 0);

    efeitos[debtId] = {
      nomeDivida: estado.nome,
      dataQuitacao: dataQuit,
      totalJurosPago,
      parcelasQuitadas: timeline.filter((t) => t.debtId === debtId && t.quitar).length,
    };
  }

  return {
    estrategia,
    prioridade: prioridade.map((d, i) => ({
      debtId: d.debtId,
      nomeDivida: d.nome,
      ordem: i + 1,
      motivo: definirMotivoStrategy(d, estrategia),
    })),
    timeline,
    datasQuitacao,
    dataQuitacaoTotal: dataAtual,
    totalPago: totalPagoSim,
    totalJuros: totalJurosMes,
    economiJuros: Math.max(0, jurosBase - totalJurosMes),
    mesesTotais: mes,
    efeitos,
  };
}

/**
 * Define a ordem de prioridade inicial baseado na estratégia
 */
function definirPrioridade(
  estados: DebtState[],
  estrategia: 'avalanche' | 'snowball' | 'fluxo-caixa'
): DebtState[] {
  const copia = [...estados];

  if (estrategia === 'avalanche') {
    // Maior taxa de juros
    return copia.sort((a, b) => b.jurosMensal - a.jurosMensal);
  } else if (estrategia === 'snowball') {
    // Menor saldo
    return copia.sort((a, b) => a.saldoRestante - b.saldoRestante);
  } else {
    // Fluxo de Caixa: maior parcela mensal (maior valor liberado quando quitada)
    return copia.sort((a, b) => b.valorParcela - a.valorParcela);
  }
}

/**
 * Reordena as dívidas a cada mês, exceto as já quitadas
 */
function reordenarDividasStrategy(
  estados: DebtState[],
  estrategia: 'avalanche' | 'snowball' | 'fluxo-caixa',
  quitadas: Map<string, Date>
): string[] {
  const ativas = estados.filter((e) => e.saldoRestante > 0.01 && !quitadas.has(e.debtId));

  if (estrategia === 'avalanche') {
    ativas.sort((a, b) => b.jurosMensal - a.jurosMensal);
  } else if (estrategia === 'snowball') {
    ativas.sort((a, b) => a.saldoRestante - b.saldoRestante);
  } else {
    ativas.sort((a, b) => b.valorParcela - a.valorParcela);
  }

  return ativas.map((e) => e.debtId);
}

/**
 * Define o motivo da prioridade de cada dívida conforme a estratégia
 */
function definirMotivoStrategy(estado: DebtState, estrategia: string): string {
  if (estrategia === 'avalanche') {
    return `Taxa de ${(estado.jurosMensal * 100).toFixed(1)}% a.m. — Maior impacto em juros`;
  } else if (estrategia === 'snowball') {
    return `Saldo menor — Vitória rápida e motivação`;
  } else {
    return `Maior parcela — Libera fluxo de caixa`;
  }
}

/**
 * Calcula juros base se pagasse apenas as parcelas mínimas
 */
function calcularJurosBase(debts: Debt[]): number {
  let totalJuros = 0;

  for (const debt of debts) {
    let saldo = debt.valorTotal;
    const jurosMensal = debt.jurosMensal / 100;
    const pagamento = debt.valorParcela;

    for (let mes = 0; mes < 360; mes++) {
      if (saldo <= 0.01) break;
      const juros = saldo * jurosMensal;
      totalJuros += juros;
      saldo = saldo + juros - pagamento;
    }
  }

  return totalJuros;
}

/**
 * Calcula o efeito cascata quando uma dívida é quitada
 * Retorna quanto da parcela liberada pode ser redirecionado
 */
export function calcularEfeitoCascata(
  debtId: string,
  resultado: StrategyResult
): { dataLiberacao: Date; valorLiberado: number; novoDisponivel: number } {
  const quitacao = resultado.datasQuitacao.get(debtId);
  if (!quitacao) {
    return { dataLiberacao: new Date(), valorLiberado: 0, novoDisponivel: 0 };
  }

  const efeito = resultado.efeitos[debtId];
  const timelineDebt = resultado.timeline.filter((t) => t.debtId === debtId);
  const valorParcela = timelineDebt.length > 0 
    ? timelineDebt.reduce((sum, t) => sum + t.pagamento, 0) / timelineDebt.length
    : 0;

  return {
    dataLiberacao: quitacao,
    valorLiberado: valorParcela,
    novoDisponivel: valorParcela,
  };
}

/**
 * Compara os resultados de todas as três estratégias
 */
export function compararEstrategias(
  debts: Debt[],
  pagamentoMensal: number
): {
  avalanche: StrategyResult;
  snowball: StrategyResult;
  fluxoCaixa: StrategyResult;
  melhorEconomia: StrategyResult;
  melhorVelocidade: StrategyResult;
  melhorFluxo: StrategyResult;
} {
  const avalanche = simularMultiplasDividas(debts, pagamentoMensal, 'avalanche');
  const snowball = simularMultiplasDividas(debts, pagamentoMensal, 'snowball');
  const fluxoCaixa = simularMultiplasDividas(debts, pagamentoMensal, 'fluxo-caixa');

  return {
    avalanche,
    snowball,
    fluxoCaixa,
    melhorEconomia: 
      avalanche.economiJuros >= snowball.economiJuros && avalanche.economiJuros >= fluxoCaixa.economiJuros 
        ? avalanche 
        : snowball.economiJuros >= fluxoCaixa.economiJuros 
        ? snowball 
        : fluxoCaixa,
    melhorVelocidade: 
      avalanche.mesesTotais <= snowball.mesesTotais && avalanche.mesesTotais <= fluxoCaixa.mesesTotais 
        ? avalanche 
        : snowball.mesesTotais <= fluxoCaixa.mesesTotais 
        ? snowball 
        : fluxoCaixa,
    melhorFluxo: fluxoCaixa,
  };
}
