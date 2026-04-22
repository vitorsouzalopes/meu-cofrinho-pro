import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Target, Car, Plane, Home, Briefcase, Plus, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const PRESET_GOALS = [
  { id: "car", icon: Car, label: "Carro" },
  { id: "travel", icon: Plane, label: "Viagem" },
  { id: "house", icon: Home, label: "Casa" },
  { id: "business", icon: Briefcase, label: "Negócio" },
  { id: "other", icon: Target, label: "Outro" },
];

export default function FinancialGoals() {
  const [selectedPreset, setSelectedPreset] = useState<string>("travel");
  const [goalName, setGoalName] = useState<string>("Viagem de Férias");
  const [goalAmount, setGoalAmount] = useState<number>(5000);
  const [monthlySavings, setMonthlySavings] = useState<number>(300); // Ex: parte da sobra MISTA

  const calculateGoal = (target: number, monthly: number) => {
    if (!target || !monthly || monthly <= 0) return { months: 0, withInvestment: 0 };
    
    const months = Math.ceil(target / monthly);
    
    // Simulação básica de investimento (1% ao mês)
    let investedMonths = 0;
    let currentAmount = 0;
    const rate = 0.01;
    
    while(currentAmount < target && investedMonths < 600) {
      currentAmount += currentAmount * rate;
      currentAmount += monthly;
      investedMonths++;
    }

    return { months, withInvestment: investedMonths };
  };

  const result = calculateGoal(goalAmount, monthlySavings);

  const formatMonths = (m: number) => {
    if (m === 0) return "—";
    if (m === 1) return "1 mês";
    if (m >= 12) {
      const years = Math.floor(m / 12);
      const months = m % 12;
      return `${years} ano${years > 1 ? "s" : ""}${months > 0 ? ` e ${months} mês${months > 1 ? "es" : ""}` : ""}`;
    }
    return `${m} meses`;
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 border-border bg-card">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-sky-accent" />
          Novo Objetivo
        </h2>

        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-2">
          {PRESET_GOALS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedPreset(preset.id);
                  setGoalName(preset.label);
                }}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl border min-w-[80px] shrink-0 transition-all",
                  isSelected 
                    ? "bg-sky-accent/10 border-sky-accent text-sky-accent" 
                    : "bg-muted border-transparent text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{preset.label}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nome do Objetivo</Label>
            <Input 
              value={goalName} 
              onChange={e => setGoalName(e.target.value)}
              className="bg-muted border-border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Valor Necessário</Label>
              <Input 
                type="number" 
                value={goalAmount || ""} 
                onChange={e => setGoalAmount(Number(e.target.value))}
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Posso guardar / mês</Label>
              <Input 
                type="number" 
                value={monthlySavings || ""} 
                onChange={e => setMonthlySavings(Number(e.target.value))}
                className="bg-muted border-border text-emerald-accent"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Dica: Use o valor de "Sobra" da Estratégia Mista!
              </p>
            </div>
          </div>
        </div>
      </Card>

      {goalAmount > 0 && monthlySavings > 0 && (
        <div className="space-y-4">
          <Card className="p-4 border-sky-accent/30 bg-card overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2 bg-sky-accent/10 rounded-bl-lg">
              <Target className="w-4 h-4 text-sky-accent" />
            </div>
            <h3 className="font-bold text-sky-accent mb-1">Cenário Padrão</h3>
            <p className="text-xs text-muted-foreground mb-4">Guardando o dinheiro no cofrinho ou conta corrente.</p>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tempo estimado:</p>
                <p className="text-2xl font-bold text-foreground">{formatMonths(result.months)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Acumulado</p>
                <p className="font-medium text-foreground">{formatCurrency(goalAmount)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-emerald-accent/30 bg-emerald-accent/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2 bg-emerald-accent/10 rounded-bl-lg">
              <TrendingUp className="w-4 h-4 text-emerald-accent" />
            </div>
            <h3 className="font-bold text-emerald-accent mb-1">Cenário Investindo (CDB 100% CDI)</h3>
            <p className="text-xs text-muted-foreground mb-4">Simulação rendendo aprox. 1% ao mês.</p>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tempo estimado:</p>
                <p className="text-2xl font-bold text-emerald-accent">{formatMonths(result.withInvestment)}</p>
              </div>
            </div>

            <div className="mt-4 p-2 bg-card rounded border border-emerald-accent/20">
              <p className="text-xs text-emerald-accent flex items-start gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Investindo todos os meses, os juros compostos trabalham a seu favor e você chega no objetivo 
                <span className="font-bold ml-1">{result.months - result.withInvestment > 0 ? formatMonths(result.months - result.withInvestment) : "mais"} rápido!</span>
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
