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
