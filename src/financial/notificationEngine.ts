export interface FinancialRiskAlert {
  type: 'danger' | 'warning'
  message: string
}

export function analyzeFinancialRisk(
  saldo: number
): FinancialRiskAlert | null {
  if (saldo < 0) {
    return {
      type: 'danger',
      message: 'Risco financeiro próximo'
    }
  }

  if (saldo < 300) {
    return {
      type: 'warning',
      message: 'Saldo baixo'
    }
  }

  return null
}
