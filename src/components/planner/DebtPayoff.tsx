import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, TrendingDown, CheckCircle2, AlertCircle, Wallet, Flame, Scale, Lightbulb, Building2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const PREDEFINED_BANKS = [
  {
    id: "nubank",
    nome: "Nubank",
    tipo: "cartao_credito",
    jurosMensal: 12,
    permiteAntecipacao: true,
    descontoAntecipacao: 0.08,
    permiteAmortizacao: false,
    negociacao: true
  },
  {
    id: "itau",
    nome: "Itaú",
    tipo: "cartao_credito",
    jurosMensal: 9,
    permiteAntecipacao: true,
    descontoAntecipacao: 0.05,
    permiteAmortizacao: true,
    negociacao: true
  },
  {
    id: "picpay",
    nome: "PicPay",
    tipo: "cartao_credito",
    jurosMensal: 11,
    permiteAntecipacao: false,
    descontoAntecipacao: 0,
    permiteAmortizacao: false,
    negociacao: true
  },
  {
    id: "outro",
    nome: "Outro Banco",
    tipo: "geral",
    jurosMensal: 5,
    permiteAntecipacao: true,
    descontoAntecipacao: 0,
    permiteAmortizacao: true,
    negociacao: true
  }
];

export default function DebtPayoff({ initialIncome = 0, initialExpenses = 0 }: { initialIncome?: number, initialExpenses?: number }) {
  const [selectedBankId, setSelectedBankId] = useState<string>("nubank");
  const [income, setIncome] = useState<number>(initialIncome);
  const [fixedExpenses, setFixedExpenses] = useState<number>(initialExpenses);
  const [debtAmount, setDebtAmount] = useState<number>(5000);
  const [interestRate, setInterestRate] = useState<number>(12);
  const [showAdvancedHard, setShowAdvancedHard] = useState<boolean>(false);
  const [showAdvancedMixed, setShowAdvancedMixed] = useState<boolean>(false);

  // Update when props change
  useEffect(() => {
    setIncome(initialIncome);
    setFixedExpenses(initialExpenses);
  }, [initialIncome, initialExpenses]); 

  // Negotiation state
  const [offeredAmount, setOfferedAmount] = useState<number>(0);

  const selectedBank = PREDEFINED_BANKS.find(b => b.id === selectedBankId) || PREDEFINED_BANKS[0];

  useEffect(() => {
    // When changing bank, set the default interest rate for that bank
    const bank = PREDEFINED_BANKS.find(b => b.id === selectedBankId);
    if (bank) {
      setInterestRate(bank.jurosMensal);
    }
  }, [selectedBankId]);

  const available = Math.max(0, income - fixedExpenses);

  // HARD Strategy
  const hardPayment = available;
  const hardLeftover = 0;

  // MIXED Strategy
  const mixedPayment = available * 0.6;
  const mixedLeftover = available * 0.4;
  const mixedSaved = mixedLeftover * 0.5;

  const simulate = (debt: number, payment: number, rate: number) => {
    if (payment <= 0 || payment <= debt * (rate / 100)) {
      return { months: Infinity, totalPaid: Infinity, table: [] };
    }
    let months = 0;
    let totalPaid = 0;
    let currentDebt = debt;
    const table = [];

    while (currentDebt > 0 && months < 360) {
      const interest = currentDebt * (rate / 100);
      currentDebt += interest;
      let actualPayment = payment;
      if (payment >= currentDebt) {
        actualPayment = currentDebt;
        totalPaid += currentDebt;
        currentDebt = 0;
      } else {
        currentDebt -= payment;
        totalPaid += payment;
      }
      months++;
      table.push({
        month: months,
        interest,
        payment: actualPayment,
        remainingDebt: currentDebt
      });
    }
    return { months, totalPaid, table };
  };

  const hardResult = simulate(debtAmount, hardPayment, interestRate);
  const mixedResult = simulate(debtAmount, mixedPayment, interestRate);

  const formatMonths = (m: number) => {
    if (m === Infinity) return "Nunca";
    if (m === 1) return "1 mês";
    if (m >= 12) {
      const years = Math.floor(m / 12);
      const months = m % 12;
      return `${years} ano${years > 1 ? "s" : ""}${months > 0 ? ` e ${months} mês${months > 1 ? "es" : ""}` : ""}`;
    }
    return `${m} meses`;
  };

  // Negotiation Logic based on user prompt
  const negotiationEconomy = debtAmount - offeredAmount;
  // Calculate if it's worth it based on the formula provided by user:
  // economia > (jurosMensal * mesesRestantes * valorAtual)
  // We'll use the mixedResult.months as a realistic baseline for "mesesRestantes"
  const futureInterestCost = (interestRate / 100) * (mixedResult.months !== Infinity ? mixedResult.months : 24) * debtAmount;
  const negotiationWorthIt = negotiationEconomy > futureInterestCost;

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

        <div className="p-3 bg-emerald-accent/5 rounded-lg border border-emerald-accent/20 flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-foreground">Valor Disponível:</span>
          <span className="text-lg font-bold text-emerald-accent">{formatCurrency(available)}</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Onde é a sua dívida?</Label>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {PREDEFINED_BANKS.map((bank) => (
                <button
                  key={bank.id}
                  onClick={() => setSelectedBankId(bank.id)}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-sm font-medium shrink-0 transition-all",
                    selectedBankId === bank.id 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {bank.nome}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Valor da Dívida</Label>
              <Input 
                type="number" 
                value={debtAmount || ""} 
                onChange={e => setDebtAmount(Number(e.target.value))}
                className="bg-muted border-border text-destructive font-semibold"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Juros Mensal (%)</Label>
              <Input 
                type="number" 
                value={interestRate || ""} 
                onChange={e => setInterestRate(Number(e.target.value))}
                className="bg-muted border-border text-destructive font-semibold"
                step="0.1"
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Você pode editar os juros se tiver negociado uma taxa diferente. Dívida não é CDI (~0.8%), geralmente é bem maior (~10%).
          </p>
        </div>
      </Card>

      {available > 0 && debtAmount > 0 && (
        <>
          {/* Alerta Inteligente */}
          {interestRate > 5 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-destructive text-sm uppercase">Quitar o mais rápido possível</p>
                <p className="text-xs text-destructive/80 mt-0.5">
                  Os juros dessa dívida ({interestRate}% a.m.) são abusivos. Nossa recomendação é utilizar todo seu esforço financeiro para zerar isso antes de investir ou guardar.
                </p>
              </div>
            </div>
          )}

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
              </div>

              <div className="mt-4 p-2 bg-destructive/5 rounded border border-destructive/20">
                <p className="text-xs text-destructive">
                  Você quita mais rápido e paga menos juros, mas <span className="font-bold">abre mão de qualquer folga financeira</span>.
                </p>
              </div>

              <div className="mt-4">
                <button 
                  onClick={() => setShowAdvancedHard(!showAdvancedHard)}
                  className="text-xs text-destructive hover:underline font-medium flex items-center justify-center w-full"
                >
                  {showAdvancedHard ? "Ocultar Detalhes" : "Ver Detalhes Mês a Mês"}
                </button>
                
                {showAdvancedHard && hardResult.table && hardResult.table.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-[10px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="py-1">Mês</th>
                          <th className="py-1">Juros</th>
                          <th className="py-1">Parcela</th>
                          <th className="py-1">Saldo Devedor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hardResult.table.map((row) => (
                          <tr key={row.month} className="border-b border-border/50">
                            <td className="py-1.5">{row.month}</td>
                            <td className="py-1.5 text-destructive">{formatCurrency(row.interest)}</td>
                            <td className="py-1.5 font-medium">{formatCurrency(row.payment)}</td>
                            <td className="py-1.5">{formatCurrency(row.remainingDebt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
                <p className="text-xs text-sky-accent">
                  Você mantém qualidade de vida e guarda <span className="font-bold">{formatCurrency(mixedSaved)}/mês</span>, mas <span className="font-bold">paga {formatCurrency((mixedResult.totalPaid === Infinity || hardResult.totalPaid === Infinity) ? 0 : mixedResult.totalPaid - hardResult.totalPaid)} a mais em juros</span>.
                </p>
              </div>

              <div className="mt-4">
                <button 
                  onClick={() => setShowAdvancedMixed(!showAdvancedMixed)}
                  className="text-xs text-sky-accent hover:underline font-medium flex items-center justify-center w-full"
                >
                  {showAdvancedMixed ? "Ocultar Detalhes" : "Ver Detalhes Mês a Mês"}
                </button>
                
                {showAdvancedMixed && mixedResult.table && mixedResult.table.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-[10px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="py-1">Mês</th>
                          <th className="py-1">Juros</th>
                          <th className="py-1">Parcela</th>
                          <th className="py-1">Saldo Devedor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mixedResult.table.map((row) => (
                          <tr key={row.month} className="border-b border-border/50">
                            <td className="py-1.5">{row.month}</td>
                            <td className="py-1.5 text-sky-accent">{formatCurrency(row.interest)}</td>
                            <td className="py-1.5 font-medium">{formatCurrency(row.payment)}</td>
                            <td className="py-1.5">{formatCurrency(row.remainingDebt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Banco e Estratégias */}
          <Card className="p-4 border-gold/30 bg-gold/5 mt-6">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-gold" />
              Estratégias para {selectedBank.nome}
            </h3>
            
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-card rounded border">
                <span className="text-muted-foreground">Negociação:</span>
                {selectedBank.negociacao ? <span className="flex items-center text-emerald-accent font-medium text-xs"><Check className="w-4 h-4 mr-1"/> Disponível</span> : <span className="flex items-center text-destructive font-medium text-xs"><X className="w-4 h-4 mr-1"/> Não disponível</span>}
              </div>
              <div className="flex items-center justify-between p-2 bg-card rounded border">
                <span className="text-muted-foreground">Antecipação:</span>
                {selectedBank.permiteAntecipacao ? <span className="flex items-center text-emerald-accent font-medium text-xs"><Check className="w-4 h-4 mr-1"/> Com desconto</span> : <span className="flex items-center text-destructive font-medium text-xs"><X className="w-4 h-4 mr-1"/> Não aplicável</span>}
              </div>
              <div className="flex items-center justify-between p-2 bg-card rounded border">
                <span className="text-muted-foreground">Amortização:</span>
                {selectedBank.permiteAmortizacao ? <span className="flex items-center text-emerald-accent font-medium text-xs"><Check className="w-4 h-4 mr-1"/> Reduz parcela/tempo</span> : <span className="flex items-center text-destructive font-medium text-xs"><X className="w-4 h-4 mr-1"/> Limitado</span>}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {selectedBank.permiteAntecipacao && (
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                  <span className="font-medium text-foreground">Antecipar parcelas:</span> O {selectedBank.nome} permite pagar faturas futuras com desconto. Adiante pagamentos sempre que possível.
                </p>
              )}
              {selectedBank.permiteAmortizacao && (
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-accent shrink-0 mt-0.5" />
                  <span className="font-medium text-foreground">Amortizar dívida:</span> Pagar valor extra reduz o tempo de dívida e diminui a base de cálculo de juros.
                </p>
              )}
              {selectedBank.negociacao && (
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <Wallet className="w-3.5 h-3.5 text-sky-accent shrink-0 mt-0.5" />
                  <span className="font-medium text-foreground">Negociação direta:</span> Entre em contato pelo app ou telefone. Bancos preferem receber com desconto a levar calote. Use o simulador abaixo!
                </p>
              )}
            </div>
          </Card>

          {/* Negociação Avançada */}
          {selectedBank.negociacao && (
            <Card className="p-4 border-border bg-card mt-6">
              <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-accent" />
                Simulador de Negociação à Vista
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Recebeu uma proposta de quitação com desconto? Veja se a economia supera os juros futuros que você pagaria.
              </p>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Valor Oferecido pelo Banco</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      value={offeredAmount || ""} 
                      onChange={e => setOfferedAmount(Number(e.target.value))}
                      placeholder="Ex: 1500"
                      className="bg-muted border-border text-emerald-accent font-semibold"
                    />
                  </div>
                </div>

                {offeredAmount > 0 && (
                  <div className={cn(
                    "p-3 rounded-lg border flex items-start gap-3",
                    negotiationWorthIt ? "bg-emerald-accent/10 border-emerald-accent/30 text-emerald-accent" : "bg-destructive/10 border-destructive/30 text-destructive"
                  )}>
                    {negotiationWorthIt ? <CheckCircle2 className="w-6 h-6 mt-0.5 shrink-0" /> : <AlertCircle className="w-6 h-6 mt-0.5 shrink-0" />}
                    <div>
                      <p className="font-semibold text-sm">
                        {negotiationWorthIt ? "VALE A PENA QUITAR AGORA!" : "NÃO COMPENSA."}
                      </p>
                      {negotiationWorthIt ? (
                        <p className="text-xs opacity-90 mt-1">
                          A economia de <span className="font-bold">{formatCurrency(negotiationEconomy)}</span> cobre com folga os juros futuros estimados ({formatCurrency(futureInterestCost)}). É um ótimo negócio!
                        </p>
                      ) : (
                        <p className="text-xs opacity-90 mt-1">
                          A economia de <span className="font-bold">{formatCurrency(negotiationEconomy)}</span> é menor que o impacto dos juros que você pagaria ({formatCurrency(futureInterestCost)}) ou a proposta é mais cara que a dívida atual. Tente negociar um desconto maior!
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
