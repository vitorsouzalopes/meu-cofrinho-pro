import type { Tables } from "@/integrations/supabase/types";
import { jurosMensalFromDb, parseDebtType, type Debt } from "./types";

export type DebtRow = Tables<"debts">;

export function mapDebtRowToDomainDebt(d: DebtRow): Debt {
  return {
    id: d.id,
    nome: d.nome,
    banco: d.nome,
    valorTotal: Number(d.valor_total),
    saldoAtual: Number(d.valor_restante ?? d.valor_total),
    valorParcela: Number(d.parcela_mensal),
    parcelasRestantes: Number(d.parcelas_restantes ?? 0),
    jurosMensal: jurosMensalFromDb(Number(d.juros_mensal)),
    tipo: parseDebtType(d.tipo),
    vencimento: String(d.dia_vencimento),
    permiteAmortizacao: d.permite_amortizacao ?? true,
    permiteQuitacao: d.permite_antecipacao ?? true,
  };
}
