// Investment Engine Skeleton for future implementation
export interface InvestmentSuggestion {
  name: string;
  recommendedAmount: number;
}

export function recommendInvestments(surplus: number): InvestmentSuggestion[] {
  if (surplus <= 0) return [];
  
  return [
    {
      name: "Reserva de Emergência (Tesouro Selic/CDB 100%)",
      recommendedAmount: surplus * 0.7,
    },
    {
      name: "Renda Fixa IPCA / Pré-fixado",
      recommendedAmount: surplus * 0.3,
    }
  ];
}
