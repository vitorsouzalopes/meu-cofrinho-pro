export interface ForecastInput {
  salario: number
  rendaExtra: number
  contas: { valor: number }[]
  dividas: { valorParcela: number }[]
}

export function forecastMonth({
  salario,
  rendaExtra,
  contas,
  dividas
}: ForecastInput): number {
  const receita = salario + rendaExtra

  const despesas = contas.reduce(
    (acc, item) => acc + item.valor,
    0
  )

  const parcelas = dividas.reduce(
    (acc, item) => acc + item.valorParcela,
    0
  )

  const margem = receita * 0.1

  return (
    receita -
    despesas -
    parcelas -
    margem
  )
}
