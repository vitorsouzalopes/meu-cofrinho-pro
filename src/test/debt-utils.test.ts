import { describe, expect, it } from "vitest";
import {
  calcularMesesQuitar,
  gerarGraficoDivida,
  simular,
  type Debt,
} from "@/lib/debt-utils";

const debt: Debt = {
  id: "debt-1",
  nome: "Cartão",
  tipo: "credito",
  valor_total: 5000,
  valor_restante: 1000,
  parcela_mensal: 600,
  total_parcelas: 12,
  parcelas_restantes: 3,
  juros_mensal: 0.1,
  dia_vencimento: 10,
  permite_antecipacao: true,
  permite_amortizacao: true,
};

describe("Debt payoff utilities", () => {
  it("calculates payoff using current balance, not original debt value", () => {
    expect(calcularMesesQuitar(debt)).toBe(2);
  });

  it("applies monthly interest as a decimal and caps the final payment", () => {
    expect(simular(debt, 600)).toEqual({
      meses: 2,
      totalPago: 1150,
      totalJuros: 150,
    });
  });

  it("returns Infinity when the monthly payment is not positive", () => {
    expect(calcularMesesQuitar(debt, 0)).toBe(Infinity);
    expect(simular(debt, -1)).toEqual({
      meses: Infinity,
      totalPago: 0,
      totalJuros: 0,
    });
  });

  it("starts the balance chart at the current outstanding balance", () => {
    expect(gerarGraficoDivida(debt, 600, 2)).toEqual([
      { mes: 0, saldo: 1000 },
      { mes: 1, saldo: 500 },
      { mes: 2, saldo: 0 },
    ]);
  });
});
