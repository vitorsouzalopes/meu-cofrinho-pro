import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Calculator, TrendingDown } from "lucide-react";
import MultiDebtManager from "@/components/planner/MultiDebtManager";
import StrategyComparison from "@/components/planner/StrategyComparison";
import DebtTimeline from "@/components/planner/DebtTimeline";
import { Debt } from "@/financial/types";
import { simularMultiplasDividas, StrategyResult } from "@/financial/multiDebtEngine";

interface MultiDebtPayoffProps {
  initialIncome?: number;
  initialExpenses?: number;
}

export default function MultiDebtPayoff({
  initialIncome = 0,
  initialExpenses = 0,
}: MultiDebtPayoffProps) {
  const [income, setIncome] = useState<number>(initialIncome);
  const [expenses, setExpenses] = useState<number>(initialExpenses);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<"avalanche" | "snowball" | "fluxo-caixa">("avalanche");
  const [strategyResult, setStrategyResult] = useState<StrategyResult | null>(null);

  useEffect(() => {
    setIncome(initialIncome);
    setExpenses(initialExpenses);
  }, [initialIncome, initialExpenses]);

  useEffect(() => {
    if (debts.length > 0) {
      const disponivel = Math.max(0, income - expenses);
      if (disponivel > 0) {
        try {
          const resultado = simularMultiplasDividas(debts, disponivel, selectedStrategy);
          setStrategyResult(resultado);
        } catch (error) {
          console.error("Erro ao simular dívidas:", error);
          setStrategyResult(null);
        }
      }
    }
  }, [debts, income, expenses, selectedStrategy]);

  const disponivel = Math.max(0, income - expenses);
  const totalDividas = debts.reduce((sum, d) => sum + d.valorTotal, 0);

  return (
    <div className="space-y-6">
      {/* Cenário Atual */}
      <Card className="p-4 border-border bg-card">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-accent" />
          Cenário Financeiro
        </h2>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Renda Mensal</p>
            <p className="font-bold text-lg text-foreground">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(income)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Gastos Fixos</p>
            <p className="font-bold text-lg text-destructive">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(expenses)}
            </p>
          </div>
          <div className="p-3 bg-emerald-accent/10 rounded-lg border border-emerald-accent/20">
            <p className="text-xs text-muted-foreground mb-2">Disponível</p>
            <p className="font-bold text-lg text-emerald-accent">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(disponivel)}
            </p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="manager" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-card border border-border">
          <TabsTrigger value="manager" className="data-[state=active]:bg-sky-accent/20 data-[state=active]:text-sky-accent">
            Minhas Dívidas
          </TabsTrigger>
          <TabsTrigger
            value="comparison"
            disabled={debts.length === 0}
            className="data-[state=active]:bg-emerald-accent/20 data-[state=active]:text-emerald-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Comparar
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            disabled={!strategyResult}
            className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* Gerenciador de Dívidas */}
        <TabsContent value="manager" className="space-y-4 animate-in fade-in-50">
          <MultiDebtManager
            debts={debts}
            onDebtsChange={setDebts}
            totalIncome={income}
            currentExpenses={expenses}
          />
        </TabsContent>

        {/* Comparação de Estratégias */}
        <TabsContent value="comparison" className="space-y-4 animate-in fade-in-50">
          {debts.length > 0 && disponivel > 0 ? (
            <div className="space-y-4">
              <Card className="p-4 bg-muted/50">
                <h3 className="font-semibold text-foreground text-sm mb-3">Selecione uma estratégia para visualizar timeline</h3>
                <div className="flex gap-2">
                  {(["avalanche", "snowball", "fluxo-caixa"] as const).map((estrat) => (
                    <button
                      key={estrat}
                      onClick={() => setSelectedStrategy(estrat)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedStrategy === estrat
                          ? "bg-foreground text-background"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {estrat === "avalanche"
                        ? "Avalanche"
                        : estrat === "snowball"
                        ? "Snowball"
                        : "Fluxo de Caixa"}
                    </button>
                  ))}
                </div>
              </Card>

              <StrategyComparison debts={debts} pagamentoMensal={disponivel} />
            </div>
          ) : (
            <Card className="p-6 text-center">
              <TrendingDown className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground mb-2">
                {debts.length === 0 ? "Adicione dívidas para começar" : "Sem valor disponível para simulação"}
              </p>
              <p className="text-xs text-muted-foreground">
                {debts.length === 0
                  ? "Vá para 'Minhas Dívidas' e adicione suas dívidas"
                  : "Aumente sua renda ou reduza seus gastos"}
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Timeline de Quitação */}
        <TabsContent value="timeline" className="space-y-4 animate-in fade-in-50">
          {strategyResult ? (
            <DebtTimeline resultado={strategyResult} />
          ) : (
            <Card className="p-6 text-center">
              <TrendingDown className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Selecione uma estratégia na aba Comparar</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Resumo Rápido */}
      {debts.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-blue-accent/10 to-sky-accent/10 border-blue-accent/30">
          <h3 className="font-semibold text-foreground mb-3">Resumo</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Total de Dívidas</p>
              <p className="font-bold text-destructive text-lg">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalDividas)}
              </p>
            </div>
            {strategyResult && (
              <>
                <div>
                  <p className="text-muted-foreground mb-1">Tempo Estimado</p>
                  <p className="font-bold text-foreground text-lg">
                    {strategyResult.mesesTotais < 12
                      ? `${strategyResult.mesesTotais} meses`
                      : `${Math.floor(strategyResult.mesesTotais / 12)} anos ${strategyResult.mesesTotais % 12} meses`}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Economia de Juros</p>
                  <p className="font-bold text-emerald-accent text-lg">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                      strategyResult.economiJuros
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Total de Juros</p>
                  <p className="font-bold text-destructive text-lg">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                      strategyResult.totalJuros
                    )}
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
