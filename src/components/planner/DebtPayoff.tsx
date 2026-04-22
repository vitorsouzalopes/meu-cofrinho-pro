import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingDown, CheckCircle2, AlertCircle, ArrowRight, Wallet, Flame, Scale, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function DebtPayoff() {
  const [income, setIncome] = useState<number>(3000);
  const [fixedExpenses, setFixedExpenses] = useState<number>(1500);
  const [debtAmount, setDebtAmount] = useState<number>(5000);
  const [interestRate, setInterestRate] = useState<number>(3); // 3% a.m.

  // Negotiation state
  const [offeredAmount, setOfferedAmount] = useState<number>(0);

  const available = Math.max(0, income - fixedExpenses);

  // HARD Strategy
  const hardPayment = available;
  const hardLeftover = 0;
  const hardSaved = 0;

  // MIXED Strategy
  const mixedPayment = available * 0.6;
  const mixedLeftover = available * 0.4;
  const mixedSaved = mixedLeftover * 0.5; // Saving half of the leftover

  const simulate = (debt: number, payment: number, rate: number) => {
    if (payment <= 0 || payment <= debt * (rate / 100)) {
      return { months: Infinity, totalPaid: Infinity };
    }
    let months = 0;
    let totalPaid = 0;
    let currentDebt = debt;

    while (currentDebt > 0 && months < 360) { // cap at 30 years
      currentDebt += currentDebt * (rate / 100);
      if (payment >= currentDebt) {
        totalPaid += currentDebt;
        currentDebt = 0;
      } else {
        currentDebt -= payment;
        totalPaid += payment;
      }
      months++;
    }
    return { months, totalPaid };
  };

  const hardResult = simulate(debtAmount, hardPayment, interestRate);
  const mixedResult = simulate(debtAmount, mixedPayment, interestRate);

  const formatMonths = (m: number) => {
    if (m === Infinity) return "Nunca (parcela não cobre os juros)";
    if (m === 1) return "1 mês";
    if (m >= 12) {
      const years = Math.floor(m / 12);
      const months = m % 12;
      return `${years} ano${years > 1 ? "s" : ""}${months > 0 ? ` e ${months} mês${months > 1 ? "es" : ""}` : ""}`;
    }
    return `${m} meses`;
  };

  const negotiationEconomy = debtAmount - offeredAmount;
  const negotiationWorthIt = negotiationEconomy > 0;

  return (
    <div className="space-y-6">
      <Card className="p-4 border-border bg-card">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-accent" />
          Seu Cenário Atual
        </h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Renda Mensal</Label>
            <Input 
              type="number" 
              value={income || ""} 
              onChange={e => setIncome(Number(e.target.value))}
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gastos Fixos</Label>
            <Input 
              type="number" 
              value={fixedExpenses || ""} 
              onChange={e => setFixedExpenses(Number(e.target.value))}
              className="bg-muted border-border"
            />
          </div>
        </div>

        <div className="p-3 bg-emerald-accent/5 rounded-lg border border-emerald-accent/20 flex justify-between items-center">
          <span className="text-sm font-medium text-foreground">Valor Disponível:</span>
          <span className="text-lg font-bold text-emerald-accent">{formatCurrency(available)}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Valor da Dívida</Label>
            <Input 
              type="number" 
              value={debtAmount || ""} 
              onChange={e => setDebtAmount(Number(e.target.value))}
              className="bg-muted border-border text-destructive"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Juros ao Mês (%)</Label>
            <Input 
              type="number" 
              value={interestRate || ""} 
              onChange={e => setInterestRate(Number(e.target.value))}
              className="bg-muted border-border"
              step="0.1"
            />
          </div>
        </div>
      </Card>

      {available > 0 && debtAmount > 0 && (
        <>
          <h3 className="font-semibold text-foreground text-lg mb-2">Comparação de Estratégias</h3>
          <div className="grid grid-cols-1 gap-4">
            {/* HARD Strategy */}
            <Card className="p-4 border-destructive/30 bg-card overflow-hidden relative">
              <div className="absolute top-0 right-0 p-2 bg-destructive/10 rounded-bl-lg">
                <Flame className="w-4 h-4 text-destructive" />
              </div>
              <h3 className="font-bold text-destructive mb-1">Estratégia HARD</h3>
              <p className="text-xs text-muted-foreground mb-4">Todo o dinheiro disponível vai para a dívida.</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tempo estimado:</span>
                  <span className="font-semibold text-foreground">{formatMonths(hardResult.months)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pagamento Mensal:</span>
                  <span className="font-medium text-foreground">{formatCurrency(hardPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Pago:</span>
                  <span className="font-medium text-foreground">{hardResult.totalPaid === Infinity ? "—" : formatCurrency(hardResult.totalPaid)}</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between">
                  <span className="text-muted-foreground">Sobra p/ Lazer:</span>
                  <span className="font-medium text-muted-foreground">{formatCurrency(hardLeftover)}</span>
                </div>
              </div>

              <div className="mt-4 p-2 bg-destructive/5 rounded border border-destructive/20">
                <p className="text-xs text-destructive flex items-start gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Você quita mais rápido e paga menos juros, mas abre mão de qualquer folga financeira ou reserva.
                </p>
              </div>
            </Card>

            {/* MIXED Strategy */}
            <Card className="p-4 border-sky-accent/30 bg-card overflow-hidden relative">
              <div className="absolute top-0 right-0 p-2 bg-sky-accent/10 rounded-bl-lg">
                <Scale className="w-4 h-4 text-sky-accent" />
              </div>
              <h3 className="font-bold text-sky-accent mb-1">Estratégia MISTA</h3>
              <p className="text-xs text-muted-foreground mb-4">60% para dívida, 40% para folga e reserva.</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tempo estimado:</span>
                  <span className="font-semibold text-foreground">{formatMonths(mixedResult.months)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pagamento Mensal:</span>
                  <span className="font-medium text-foreground">{formatCurrency(mixedPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Pago:</span>
                  <span className="font-medium text-foreground">{mixedResult.totalPaid === Infinity ? "—" : formatCurrency(mixedResult.totalPaid)}</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between">
                  <span className="text-muted-foreground">Livre Mensal:</span>
                  <span className="font-medium text-emerald-accent">{formatCurrency(mixedLeftover)}</span>
                </div>
              </div>

              <div className="mt-4 p-2 bg-sky-accent/5 rounded border border-sky-accent/20">
                <p className="text-xs text-sky-accent flex items-start gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Você mantém qualidade de vida e guarda {formatCurrency(mixedSaved)}/mês, mas demora mais e paga {formatCurrency(mixedResult.totalPaid - hardResult.totalPaid)} a mais em juros.
                </p>
              </div>
            </Card>
          </div>

          {/* Dicas Profissionais */}
          <Card className="p-4 border-gold/30 bg-gold/5 mt-6">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-gold" />
              Estratégias Avançadas
            </h3>
            
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-card rounded-lg border border-border">
                <h4 className="font-semibold text-foreground mb-1 flex items-center gap-1">
                  <TrendingDown className="w-4 h-4 text-emerald-accent" /> Amortização
                </h4>
                <p className="text-xs text-muted-foreground">
                  Se sobrar um dinheiro extra no mês (ex: 13º salário), pague um valor além da parcela. Isso reduz o saldo devedor e "mata" meses de juros futuros!
                </p>
              </div>

              <div className="p-3 bg-card rounded-lg border border-border">
                <h4 className="font-semibold text-foreground mb-1">Avalanche vs Snowball</h4>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-muted p-2 rounded">
                    <span className="font-medium text-xs block text-foreground">Avalanche (Recomendado)</span>
                    <span className="text-[10px] text-muted-foreground">Pague primeiro as dívidas com maiores juros (ex: Cartão de Crédito). Economiza mais dinheiro.</span>
                  </div>
                  <div className="bg-muted p-2 rounded">
                    <span className="font-medium text-xs block text-foreground">Snowball</span>
                    <span className="text-[10px] text-muted-foreground">Pague primeiro a menor dívida. Dá um ganho psicológico de "vitória", mas custa mais caro no fim.</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Negociação */}
          <Card className="p-4 border-border bg-card mt-6">
            <h3 className="font-semibold text-foreground mb-1">Simulador de Negociação</h3>
            <p className="text-xs text-muted-foreground mb-4">Muitos bancos oferecem descontos enormes se você quitar à vista. Simule abaixo se a oferta vale a pena.</p>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Valor Oferecido pelo Banco</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    value={offeredAmount || ""} 
                    onChange={e => setOfferedAmount(Number(e.target.value))}
                    placeholder="Ex: 1500"
                    className="bg-muted border-border"
                  />
                </div>
              </div>

              {offeredAmount > 0 && (
                <div className={cn(
                  "p-3 rounded-lg border flex items-start gap-2",
                  negotiationWorthIt ? "bg-emerald-accent/10 border-emerald-accent/30 text-emerald-accent" : "bg-destructive/10 border-destructive/30 text-destructive"
                )}>
                  {negotiationWorthIt ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />}
                  <div>
                    <p className="font-semibold text-sm">
                      {negotiationWorthIt ? "Vale a pena quitar agora!" : "Não compensa."}
                    </p>
                    <p className="text-xs opacity-90">
                      {negotiationWorthIt 
                        ? `Você vai economizar ${formatCurrency(negotiationEconomy)} em relação ao valor da dívida atual (fora os juros futuros que deixará de pagar).`
                        : `O valor oferecido (${formatCurrency(offeredAmount)}) é maior ou igual ao que você já deve (${formatCurrency(debtAmount)}). Continue pagando normalmente.`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
