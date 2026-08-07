export interface Debt {
  id: string
  nome: string
  banco: string

  valorTotal: number
  valorParcela: number

  parcelasRestantes: number

  jurosMensal: number

  tipo:
    | 'credito'
    | 'emprestimo'
    | 'consignado'
    | 'cheque_especial'

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
