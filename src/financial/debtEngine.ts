import { Debt } from './types'

export function avalancheStrategy(
  debts: Debt[]
) {
  return [...debts].sort(
    (a, b) =>
      b.jurosMensal - a.jurosMensal
  )
}

export function snowballStrategy(
  debts: Debt[]
) {
  return [...debts].sort(
    (a, b) =>
      a.valorTotal - b.valorTotal
  )
}

export function debtScore(
  debt: Debt
) {
  return (
    debt.jurosMensal * 5 +
    debt.parcelasRestantes * 2 +
    debt.valorTotal / 1000
  )
}

export function smartPriority(
  debts: Debt[]
) {
  return [...debts].sort(
    (a, b) =>
      debtScore(b) - debtScore(a)
  )
}

export function shouldAmortize(
  debt: Debt,
  saldo: number
) {
  return (
    debt.jurosMensal > 2 &&
    debt.parcelasRestantes > 12 &&
    saldo > debt.valorParcela * 2
  )
}

export function shouldNegotiate(
  debt: Debt,
  saldo: number
) {
  return (
    saldo >= debt.valorTotal * 0.3
  )
}
