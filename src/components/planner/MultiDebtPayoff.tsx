import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Calculator, TrendingDown, Zap, FileText } from "lucide-react";
import MultiDebtManager from "@/components/planner/MultiDebtManager";
import SimulacaoGlobal from "@/components/planner/SimulacaoGlobal";
import Recomendacao from "@/components/planner/Recomendacao";
import DebtReportPDF from "@/components/planner/DebtReportPDF";
import { Debt } from "@/financial/types";
import { simularMultiplasDividas, StrategyResult, SimulacaoIndividual, compararGlobalmente } from "@/financial/multiDebtEngine";

interface MultiDebtPayoffProps {
  initialIncome?: number;
  initialExpenses?: number;
  initialDebts?: Debt[];
}

export default function MultiDebtPayoff({
  initialIncome = 0,
  initialExpenses = 0,
  initialDebts = [],
}: MultiDebtPayoffProps) {
  const [income, setIncome] = useState<number>(initialIncome);
  const [expenses, setExpenses] = useState<number>(initialExpenses);
  const [debts, setDebts] = useState<Debt[]>(initialDebts || []);
  const [selectedStrategy, setSelectedStrategy] = useState<"avalanche" | "snowball" | "fluxo-caixa">("avalanche");
  const [selectedScenario, setSelectedScenario] = useState<{ tipo: "individual" | "estrategia"; debtId?: string } | null>(null);
  const [strategyResult, setStrategyResult] = useState<StrategyResult | null>(null);
  const [individualSimulation, setIndividualSimulation] = useState<SimulacaoIndividual | null>(null);

  useEffect(() => {
    setIncome(initialIncome);
    setExpenses(initialExpenses);
  }, [initialIncome, initialExpenses]);

  // Carregar dívidas iniciais quando o componente montar ou initialDebts mudar
  useEffect(() => {
    if (initialDebts && initialDebts.length > 0) {
      console.log('📥 Carregando dívidas iniciais:', initialDebts.length);
      setDebts(initialDebts);
    }
  }, [initialDebts]);

  useEffect(() => {
    if (debts.length > 0) {
      console.log('💰 MultiDebtPayoff - Dívidas atualizadas:', debts.length, debts.map(d => d.nome));
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

  const handleSelectCenario = (tipo: string, debtId?: string) => {
    setSelectedScenario({ tipo: tipo as "individual" | "estrategia", debtId });
    
    if (tipo === "individual" && debtId && debts.length > 0) {
      const disponivel = Math.max(0, income - expenses);
      try {
        const comparacao = compararGlobalmente(debts, disponivel);
        const simIndividual = comparacao.simulacoesIndividuais.find((s) => s.debtId === debtId);
        if (simIndividual) {
          setIndividualSimulation(simIndividual);
        }
      } catch (error) {
        console.error("Erro ao buscar simulação individual:", error);
      }
    } else {
      setIndividualSimulation(null);
    }
  };

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

      <Tabs defaultValue="simulacao" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6 bg-card border border-border">
          <TabsTrigger value="manager" className="data-[state=active]:bg-sky-accent/20 data-[state=active]:text-sky-accent text-xs">
            Minhas Dívidas
          </TabsTrigger>
          <TabsTrigger
            value="simulacao"
            disabled={debts.length === 0}
            className="data-[state=active]:bg-zap/20 data-[state=active]:text-zap disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            Simulação Global
          </TabsTrigger>
          <TabsTrigger
            value="recomendacao"
            disabled={!selectedScenario}
            className="data-[state=active]:bg-emerald-accent/20 data-[state=active]:text-emerald-accent disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            Recomendação
          </TabsTrigger>
          <TabsTrigger value="detalhes" disabled={debts.length === 0} className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold disabled:opacity-50 disabled:cursor-not-allowed text-xs">
            Detalhes
          </TabsTrigger>
          <TabsTrigger 
            value="relatorio" 
            disabled={debts.length === 0 || !strategyResult}
            className="data-[state=active]:bg-purple-accent/20 data-[state=active]:text-purple-accent disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            Relatório
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

        {/* Simulação Global */}
        <TabsContent value="simulacao" className="space-y-4 animate-in fade-in-50">
          {debts.length > 0 && disponivel > 0 ? (
            <SimulacaoGlobal debts={debts} pagamentoMensal={disponivel} onSelectCenario={handleSelectCenario} />
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

        {/* Recomendação */}
        <TabsContent value="recomendacao" className="space-y-4 animate-in fade-in-50">
          {selectedScenario && strategyResult ? (
            <Recomendacao
              estrategia={strategyResult}
              simulacaoIndividual={selectedScenario.tipo === "individual" ? individualSimulation : null}
              isIndividual={selectedScenario.tipo === "individual"}
              pagamentoMensal={disponivel}
            />
          ) : (
            <Card className="p-6 text-center">
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Selecione um cenário na aba Simulação Global</p>
            </Card>
          )}
        </TabsContent>

        {/* Detalhes */}
        <TabsContent value="detalhes" className="space-y-4 animate-in fade-in-50">
          <Card className="p-6 border-border">
            <h3 className="font-bold text-foreground text-lg mb-4">Resumo das Dívidas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total de Dívidas</p>
                <p className="text-2xl font-bold text-destructive">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalDividas)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{debts.length} dívida(s)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Juros Médios</p>
                <p className="text-2xl font-bold text-destructive">
                  {debts.length > 0
                    ? (debts.reduce((sum, d) => sum + d.jurosMensal, 0) / debts.length).toFixed(1)
                    : 0}
                  %
                </p>
                <p className="text-xs text-muted-foreground mt-1">ao mês</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <h4 className="font-semibold text-foreground text-sm">Dívidas Cadastradas</h4>
              {debts.map((debt, idx) => (
                <div key={debt.id} className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between mb-2">
                    <p className="font-medium text-foreground">{idx + 1}. {debt.nome}</p>
                    <span className="text-sm font-semibold text-destructive">{debt.jurosMensal}% a.m.</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>Saldo: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(debt.valorTotal)}</div>
                    <div>Parcela: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(debt.valorParcela)}</div>
                    <div>Parcelas: {debt.parcelasRestantes}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Relatório PDF */}
        <TabsContent value="relatorio" className="space-y-4 animate-in fade-in-50">
          {strategyResult && debts.length > 0 ? (
            <DebtReportPDF
              debts={debts}
              strategyResult={strategyResult}
              pagamentoMensal={disponivel}
              userName="Usuário do Cofrinho Pro"
            />
          ) : (
            <Card className="p-6 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Crie um plano primeiro para gerar o relatório</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
