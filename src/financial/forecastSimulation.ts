import { Debt } from "./types";

export type Strategy = "avalanche" | "snowball" | "smart";

export interface DebtTimelineItem {
  id: string;
  nome: string;
  banco: string;
  prioridade: number;
  saldoAtual: number;
  parcela: number;
  jurosMensal: number;
  extraRecebido: number;
  jurosTotalBaseline: number;
  economiaJuros: number;
  mesTermino: string; // "YYYY-MM" or "—"
  mesesAteQuitar: number; // 9999 if not paid in horizon
  jurosTotalPagos: number;
}

export interface MonthSnapshot {
  monthYear: string;
  label: string; // "Jun/2026"
  receita: number;
  contas: number;
  dividas: number; // total paid this month towards debts (parcela + extra)
  saldo: number;
  prioridades: { id: string; nome: string }[];
  quitadas: { id: string; nome: string; parcelaLiberada: number }[];
  saldoDevedorTotal: number;
}

export interface ForecastResult {
  timeline: DebtTimelineItem[];
  months: MonthSnapshot[];
  mesQuitacaoFinal: string | null;
  economiaJuros: number; // baseline juros - strategy juros
  totalJurosBaseline: number;
  totalJurosEstrategia: number;
}

const MES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function monthLabel(d: Date) {
  return `${MES_PT[d.getMonth()]}/${d.getFullYear()}`;
}
function monthYear(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function sortByStrategy(debts: Debt[], strat: Strategy): Debt[] {
  const arr = [...debts];
  if (strat === "avalanche") return arr.sort((a, b) => b.jurosMensal - a.jurosMensal);
  if (strat === "snowball") return arr.sort((a, b) => a.valorTotal - b.valorTotal);
  // smart: high interest * remaining
  return arr.sort(
    (a, b) =>
      b.jurosMensal * b.parcelasRestantes - a.jurosMensal * a.parcelasRestantes,
  );
}

interface SimInput {
  debts: Debt[];
  receita: number;
  contas: number;
  saldoLivre: number; // valor extra mensal direcionado para a prioritária
  strategy: Strategy;
  horizonMonths: number;
}

/** Simulates month-by-month with cascade: extra goes to top priority remaining */
function simulate(input: SimInput, useExtra: boolean, recordMonths = input.horizonMonths) {
  const { debts, receita, contas, saldoLivre, strategy, horizonMonths } = input;
  const sorted = sortByStrategy(debts, strategy);
  // state per debt
  const state = sorted.map((d, index) => ({
    id: d.id,
    nome: d.nome,
    banco: d.banco,
    prioridade: index + 1,
    saldo: d.valorTotal,
    parcela: d.valorParcela,
    juros: d.jurosMensal / 100,
    jurosPagos: 0,
    extraRecebido: 0,
    parcelaOriginal: d.valorParcela,
    jurosMensalPct: d.jurosMensal,
    quitadoMes: null as string | null,
    mesesAteQuitar: 9999,
  }));

  const months: MonthSnapshot[] = [];
  const start = new Date();
  start.setDate(1);

  let liberadoCascata = 0; // soma das parcelas das dívidas já quitadas

  for (let m = 0; m < horizonMonths; m++) {
    const cur = addMonths(start, m);
    const my = monthYear(cur);
    const label = monthLabel(cur);
    const ativas = state.filter((s) => s.saldo > 0.01);
    if (ativas.length === 0) break;

    // determine priority (first non-paid in sorted order)
    const prioridadeAtual = ativas[0];
    const extraDisponivel = useExtra ? saldoLivre + liberadoCascata : 0;

    let totalPagoDividas = 0;
    const quitadasMes: { id: string; nome: string; parcelaLiberada: number }[] = [];

    for (const s of state) {
      if (s.saldo <= 0.01) continue;
      // juros do mês
      const juros = s.saldo * s.juros;
      s.jurosPagos += juros;
      s.saldo += juros;

      // pagamento: parcela mínima + extra se for prioritária
      let pagamento = s.parcelaOriginal;
      if (useExtra && s.id === prioridadeAtual.id) {
        pagamento += extraDisponivel;
        s.extraRecebido += extraDisponivel;
      }
      pagamento = Math.min(pagamento, s.saldo);
      s.saldo -= pagamento;
      totalPagoDividas += pagamento;

      if (s.saldo <= 0.01) {
        s.saldo = 0;
        s.quitadoMes = label;
        s.mesesAteQuitar = m + 1;
        quitadasMes.push({ id: s.id, nome: s.nome, parcelaLiberada: s.parcelaOriginal });
        if (useExtra) liberadoCascata += s.parcelaOriginal;
      }
    }

    const saldoDevedorTotal = state.reduce((sum, s) => sum + s.saldo, 0);
    const saldoMes = receita - contas - totalPagoDividas;

    if (m < recordMonths) {
      months.push({
        monthYear: my,
        label,
        receita,
        contas,
        dividas: totalPagoDividas,
        saldo: saldoMes,
        prioridades: state
          .filter((s) => s.saldo > 0.01)
          .slice(0, 3)
          .map((s) => ({ id: s.id, nome: s.nome })),
        quitadas: quitadasMes,
        saldoDevedorTotal,
      });
    }
  }

  return { state, months };
}

export function runForecast(input: SimInput): ForecastResult {
  const payoffHorizon = Math.max(input.horizonMonths, 360);
  const fullInput = { ...input, horizonMonths: payoffHorizon };
  const withStrat = simulate(fullInput, true, input.horizonMonths);
  const baseline = simulate(fullInput, false, input.horizonMonths);

  const totalJurosEstrategia = withStrat.state.reduce((s, d) => s + d.jurosPagos, 0);
  const totalJurosBaseline = baseline.state.reduce((s, d) => s + d.jurosPagos, 0);

  const baselineById = new Map(baseline.state.map((s) => [s.id, s.jurosPagos]));
  const timeline: DebtTimelineItem[] = withStrat.state.map((s) => {
    const jurosBase = baselineById.get(s.id) ?? 0;
    return {
      id: s.id,
      nome: s.nome,
      banco: s.banco,
      prioridade: s.prioridade,
      saldoAtual: 0,
      parcela: s.parcelaOriginal,
      jurosMensal: s.jurosMensalPct,
      extraRecebido: s.extraRecebido,
      jurosTotalBaseline: jurosBase,
      economiaJuros: Math.max(0, jurosBase - s.jurosPagos),
      mesTermino: s.quitadoMes ?? "—",
      mesesAteQuitar: s.mesesAteQuitar,
      jurosTotalPagos: s.jurosPagos,
    };
  });

  // saldo atual = saldo original (pre-sim) — pull from input.debts
  const byId = new Map(input.debts.map((d) => [d.id, d.valorTotal]));
  for (const t of timeline) t.saldoAtual = byId.get(t.id) ?? 0;

  const ultimoMes = [...withStrat.state]
    .filter((s) => s.quitadoMes)
    .sort((a, b) => b.mesesAteQuitar - a.mesesAteQuitar)[0];

  return {
    timeline,
    months: withStrat.months,
    mesQuitacaoFinal: ultimoMes?.quitadoMes ?? null,
    economiaJuros: Math.max(0, totalJurosBaseline - totalJurosEstrategia),
    totalJurosBaseline,
    totalJurosEstrategia,
  };
}
