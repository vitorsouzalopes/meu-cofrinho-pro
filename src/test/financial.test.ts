import { jurosMensalFromDb, jurosMensalToDecimal } from "../financial/types";
import { describe, it, expect } from "vitest";
import { DEBT_TYPES, parseDebtType, type Debt } from "../financial/types";
import {
  avalancheStrategy,
  snowballStrategy,
  debtScore,
  smartPriority,
  shouldAmortize,
  shouldNegotiate,
} from "../financial/debtEngine";
import { forecastMonth } from "../financial/forecastEngine";
import { analyzeFinancialRisk } from "../financial/notificationEngine";
import { simularAtacarDividaIndividual, simularMultiplasDividas } from "../financial/multiDebtEngine";

const sampleDebts: Debt[] = [
  {
    id: "1",
    nome: "Nubank",
    banco: "Nubank",
    valorTotal: 5000,
    valorParcela: 300,
    parcelasRestantes: 24,
    jurosMensal: 12,
    tipo: "credito",
    vencimento: "10",
    permiteAmortizacao: true,
    permiteQuitacao: true,
  },
  {
    id: "2",
    nome: "Banco do Brasil",
    banco: "Banco do Brasil",
    valorTotal: 12000,
    valorParcela: 500,
    parcelasRestantes: 36,
    jurosMensal: 3,
    tipo: "emprestimo",
    vencimento: "15",
    permiteAmortizacao: true,
    permiteQuitacao: true,
  },
  {
    id: "3",
    nome: "Cheque Especial Caixa",
    banco: "Caixa",
    valorTotal: 1000,
    valorParcela: 1000,
    parcelasRestantes: 1,
    jurosMensal: 8,
    tipo: "cheque_especial",
    vencimento: "20",
    permiteAmortizacao: false,
    permiteQuitacao: true,
  },
];

describe("Debt category validation", () => {
  it("accepts every category supported by the debt planner", () => {
    for (const type of DEBT_TYPES) {
      expect(parseDebtType(type)).toBe(type);
    }
    expect(DEBT_TYPES).toHaveLength(6);
  });

  it("rejects unknown categories instead of silently mapping them", () => {
    expect(() => parseDebtType("unknown")).toThrow("Tipo de dívida não reconhecido: unknown");
  });
});

describe("Smart Debt Engines", () => {
  it("should sort debts using avalanche strategy (highest interest rate first)", () => {
    const sorted = avalancheStrategy(sampleDebts);
    expect(sorted[0].nome).toBe("Nubank"); // 12%
    expect(sorted[1].nome).toBe("Cheque Especial Caixa"); // 8%
    expect(sorted[2].nome).toBe("Banco do Brasil"); // 3%
  });

  it("should sort debts using snowball strategy (lowest total value first)", () => {
    const sorted = snowballStrategy(sampleDebts);
    expect(sorted[0].nome).toBe("Cheque Especial Caixa"); // 1000
    expect(sorted[1].nome).toBe("Nubank"); // 5000
    expect(sorted[2].nome).toBe("Banco do Brasil"); // 12000
  });

  it("should calculate correct debt score and apply smart priority", () => {
    // Nubank score: 12 * 5 + 24 * 2 + 5000 / 1000 = 60 + 48 + 5 = 113
    // BB score: 3 * 5 + 36 * 2 + 12000 / 1000 = 15 + 72 + 12 = 99
    // Caixa score: 8 * 5 + 1 * 2 + 1000 / 1000 = 40 + 2 + 1 = 43
    expect(debtScore(sampleDebts[0])).toBe(113);
    expect(debtScore(sampleDebts[1])).toBe(99);
    expect(debtScore(sampleDebts[2])).toBe(43);

    const sorted = smartPriority(sampleDebts);
    expect(sorted[0].nome).toBe("Nubank"); // 113
    expect(sorted[1].nome).toBe("Banco do Brasil"); // 99
    expect(sorted[2].nome).toBe("Cheque Especial Caixa"); // 43
  });

  it("should evaluate shouldAmortize suggestion correctly", () => {
    // Nubank: jurosMensal (12) > 2, parcelasRestantes (24) > 12.
    // Needs saldo > valorParcela * 2 = 600
    expect(shouldAmortize(sampleDebts[0], 500)).toBe(false);
    expect(shouldAmortize(sampleDebts[0], 800)).toBe(true);

    // Caixa: parcelasRestantes (1) <= 12, should be false
    expect(shouldAmortize(sampleDebts[2], 3000)).toBe(false);
  });

  it("should evaluate shouldNegotiate suggestion correctly", () => {
    // Nubank total is 5000, 30% is 1500
    expect(shouldNegotiate(sampleDebts[0], 1400)).toBe(false);
    expect(shouldNegotiate(sampleDebts[0], 1500)).toBe(true);
  });
});

describe("Monthly Forecast Engine", () => {
  it("should calculate correct forecast margin", () => {
    const input = {
      salario: 5000,
      rendaExtra: 1000, // Total receita = 6000
      contas: [
        { valor: 1500 },
        { valor: 500 },
      ], // Total contas = 2000
      dividas: [
        { valorParcela: 300 },
        { valorParcela: 500 },
      ], // Total dividas = 800
    };
    // margem = 6000 * 0.1 = 600
    // forecast = 6000 - 2000 - 800 - 600 = 2600
    const result = forecastMonth(input);
    expect(result).toBe(2600);
  });
});

describe("Notification Engine", () => {
  it("should output correct risk alert levels", () => {
    expect(analyzeFinancialRisk(-50)).toEqual({
      type: "danger",
      message: "Risco financeiro próximo",
    });
    expect(analyzeFinancialRisk(150)).toEqual({
      type: "warning",
      message: "Saldo baixo",
    });
    expect(analyzeFinancialRisk(400)).toBeNull();
  });
});


describe("Multi-debt balance semantics", () => {
  it("uses current outstanding balance for payoff simulation while preserving original total", () => {
    const debtWithBalance: Debt = {
      ...sampleDebts[0],
      valorTotal: 5000,
      saldoAtual: 1000,
      valorParcela: 600,
      jurosMensal: 10,
    };

    const result = simularMultiplasDividas([debtWithBalance], 600, "avalanche");

    expect(result.mesesTotais).toBe(2);
    expect(result.totalPago).toBe(1150);
    expect(result.totalJuros).toBe(150);
  });
});


describe("Monthly interest representation", () => {
  it("converts database decimal interest to domain percentage", () => {
    expect(jurosMensalFromDb(0.1)).toBe(10);
  });

  it("converts domain percentage interest to calculation decimal", () => {
    expect(jurosMensalToDecimal(10)).toBe(0.1);
  });
});

describe("Individual debt simulation balance semantics", () => {
  it("uses current balance for the baseline instead of original total", () => {
    const debtWithBalance: Debt = {
      ...sampleDebts[0],
      valorTotal: 5000,
      saldoAtual: 1000,
      valorParcela: 600,
      jurosMensal: 10,
    };

    const result = simularAtacarDividaIndividual([debtWithBalance], 0, 600);

    expect(result.mesesTotais).toBe(1);
    expect(result.totalJuros).toBe(100);
    expect(result.economiJuros).toBe(50);
  });
});