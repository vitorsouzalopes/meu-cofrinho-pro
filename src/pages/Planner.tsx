import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Calculator, Target, BrainCircuit } from "lucide-react";
import DebtPayoff from "@/components/planner/DebtPayoff";
import FinancialGoals from "@/components/planner/FinancialGoals";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Planner = () => {
  const { user } = useAuth();
  const [initialIncome, setInitialIncome] = useState(0);
  const [initialExpenses, setInitialExpenses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const today = new Date();
      const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

      const [accountsResponse, salaryResponse, extraResponse] = await Promise.all([
        supabase.from("accounts").select("amount, month_year").eq("user_id", user.id).eq("month_year", currentMonthYear),
        supabase.from("salary" as never).select("amount").eq("user_id", user.id).eq("month_year", currentMonthYear).maybeSingle(),
        supabase.from("extra_income").select("amount").eq("user_id", user.id).eq("month_year", currentMonthYear)
      ]);

      const salary = salaryResponse.data ? Number((salaryResponse.data as { amount: number }).amount) : 0;
      const extra = extraResponse.data ? extraResponse.data.reduce((acc: number, curr: { amount: number }) => acc + Number(curr.amount), 0) : 0;
      const expenses = accountsResponse.data ? accountsResponse.data.reduce((acc: number, curr: { amount: number }) => acc + Number(curr.amount), 0) : 0;

      setInitialIncome(salary + extra);
      setInitialExpenses(expenses);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto bg-background">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BrainCircuit className="w-6 h-6 text-emerald-accent" />
          <h1 className="font-heading text-2xl font-bold text-foreground">Planejador Inteligente</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Cenário atual calculado com base nas suas finanças.
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
          <DebtPayoff initialIncome={initialIncome} initialExpenses={initialExpenses} />
        </TabsContent>

        <TabsContent value="goals" className="space-y-4 animate-in fade-in-50">
          <FinancialGoals initialIncome={initialIncome} initialExpenses={initialExpenses} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Planner;
