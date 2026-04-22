import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Calculator, Target, BrainCircuit } from "lucide-react";
import DebtPayoff from "@/components/planner/DebtPayoff";
import FinancialGoals from "@/components/planner/FinancialGoals";

const Planner = () => {
  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto bg-background">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BrainCircuit className="w-6 h-6 text-emerald-accent" />
          <h1 className="font-heading text-2xl font-bold text-foreground">Planejador Inteligente</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Simule dívidas e planeje seus objetivos com inteligência.
        </p>
      </div>

      <Tabs defaultValue="debts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-card border border-border">
          <TabsTrigger value="debts" className="data-[state=active]:bg-emerald-accent/20 data-[state=active]:text-emerald-accent">
            <Calculator className="w-4 h-4 mr-2" />
            Quitar Dívidas
          </TabsTrigger>
          <TabsTrigger value="goals" className="data-[state=active]:bg-sky-accent/20 data-[state=active]:text-sky-accent">
            <Target className="w-4 h-4 mr-2" />
            Objetivos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="debts" className="space-y-4 animate-in fade-in-50">
          <DebtPayoff />
        </TabsContent>

        <TabsContent value="goals" className="space-y-4 animate-in fade-in-50">
          <FinancialGoals />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Planner;
