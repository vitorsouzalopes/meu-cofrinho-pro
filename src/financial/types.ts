export const DEBT_TYPES = [
  'credito',
  'emprestimo',
  'consignado',
  'cheque_especial',
  'financiamento',
  'outro',
] as const

export type DebtType = (typeof DEBT_TYPES)[number]

/** Representação de juros no domínio: percentual, ex. 10 = 10% a.m. */
export const jurosMensalFromDb = (value: number): number => Number(value) * 100

/** Converte o percentual do domínio para decimal de cálculo, ex. 10 -> 0.10. */
export const jurosMensalToDecimal = (value: number): number => Number(value) / 100

export function parseDebtType(value: string): DebtType {
  if ((DEBT_TYPES as readonly string[]).includes(value)) return value as DebtType
  throw new Error(`Tipo de dívida não reconhecido: ${value}`)
}

export interface Debt {
  id: string
  nome: string
  banco: string

  valorTotal: number
  /** Saldo devedor atual; quando ausente, valorTotal é usado por compatibilidade. */
  saldoAtual?: number
  valorParcela: number

  parcelasRestantes: number

  jurosMensal: number

  tipo: DebtType

  vencimento: string

  permiteAmortizacao: boolean
  permiteQuitacao: boolean
}

export interface DebtProjection {
  debtId: string
  nome: string
  banco: string
  saldoAtual: number
  parcelaAtual: number
  extraRecebido: number
  pagamentoTotal: number
  dataQuitacao: Date
  mesesRestantes: number
  ehProxima: boolean
  valorLiberadoAposCascata: number
}

export interface ProjectionSummary {
  totalDividas: number
  saldoLivre: number
  estrategia: 'avalanche' | 'snowball' | 'fluxo-caixa'
  dataQuitacaoTotal: Date
  projecoes: DebtProjection[]
}

export interface PayoffProjection {
  meses: number;
  termino: string;
  jurosTotal: number;
  extraMensal: number;
  economiaTempo: number;
  economiaJuros: number;
  valorLivrePreservado: number;
  balances: number[];
}

export interface DebtSimulation {
  id: string;
  nome: string;
  banco: string;
  saldoDevedor: number;
  parcelaMensal: number;
  jurosMensal: number;
  normal: PayoffProjection;
  hard: PayoffProjection;
  mista: PayoffProjection;
}

export interface EvolutionRow {
  label: string;
  normal: number;
  hard: number;
  mista: number;
  selected: number;
}
