import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, BrainCircuit, Brain, TrendingUp } from "lucide-react";
import FinancialGoals from "@/components/planner/FinancialGoals";
import SmartDebtDashboard from "@/components/planner/SmartDebtDashboard";
import ForecastReport from "@/components/planner/ForecastReport";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calcularTotaisFinanceiros, sincronizarDividas } from "@/lib/finance-utils";

const Planner = () => {
  const { user } = useAuth();
  const [initialIncome, setInitialIncome] = useState(0);
  const [initialExpenses, setInitialExpenses] = useState(0);
  const [initialDebts, setInitialDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const today = new Date();
      const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

      try {
        const [instancesRes, templatesRes, debtsResponse, salaryResponse, extraResponse] = await Promise.all([
          supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", false).eq("month_year", currentMonthYear),
          supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", true),
          supabase.from("debts" as any).select("*").eq("user_id", user.id),
          supabase.from("salary" as any).select("amount").eq("user_id", user.id).eq("month_year", currentMonthYear).maybeSingle(),
          supabase.from("extra_income").select("amount").eq("user_id", user.id).eq("month_year", currentMonthYear)
        ]);

        const salary = salaryResponse.data ? Number((salaryResponse.data as any).amount) : 0;
        const extra = extraResponse.data ? extraResponse.data.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0) : 0;
        
        const rawAccounts = (instancesRes.data ?? []) as any[];
        const rawTemplates = (templatesRes.data ?? []) as any[];

        // SINCRONIZAR (Dívidas ➔ Contas)
        const debtTemplates = rawTemplates.filter(t => t.billing_type === 'debt' && (t.remaining_months === null || t.remaining_months > 0));
        const syncAccounts = sincronizarDividas(rawAccounts, debtTemplates);

        // CALCULAR TOTAIS
        const results = calcularTotaisFinanceiros({
          salario: salary,
          extra: extra,
          contas: syncAccounts.filter(a => a.billing_type !== 'debt' && a.tipo !== 'divida'),
          dividas: syncAccounts.filter(a => a.billing_type === 'debt' || a.tipo === 'divida')
        });

        // Extrair dívidas para o MultiDebtPayoff
        const debtAccounts = syncAccounts.filter(a => a.billing_type === 'debt' || a.tipo === 'divida');
        const debtsFromAccounts = debtAccounts.map((debt: any) => ({
          id: debt.id || '',
          nome: debt.name || debt.description || '',
          banco: debt.institution || debt.bank || debt.nome || 'Instituição',
          valorTotal: Number(debt.total_debt_amount || debt.total || debt.saldo || debt.amount || 0),
          valorParcela: Number(debt.monthly_value || debt.monthly_payment || debt.parcela || debt.amount || 0),
          parcelasRestantes: Number(debt.remaining_months || debt.installments || 1),
          jurosMensal: Number(debt.interest_rate || debt.juros || 0),
          tipo: debt.type || debt.tipo || 'credito',
          vencimento: debt.due_date || debt.vencimento || '',
          permiteAmortizacao: true,
          permiteQuitacao: true,
        }));
        const debtsFromTable = ((debtsResponse.data ?? []) as any[]).map((debt: any) => ({
          id: debt.id || '',
          nome: debt.nome || 'Dívida',
          banco: debt.banco || debt.nome || 'Instituição',
          valorTotal: Number(debt.valor_restante ?? debt.valor_total ?? 0),
          valorParcela: Number(debt.parcela_mensal ?? 0),
          parcelasRestantes: Number(debt.parcelas_restantes ?? debt.total_parcelas ?? 1),
          jurosMensal: Number(debt.juros_mensal ?? 0) * 100,
          tipo: debt.tipo || 'credito',
          vencimento: String(debt.dia_vencimento || ''),
          permiteAmortizacao: debt.permite_amortizacao ?? true,
          permiteQuitacao: debt.permite_antecipacao ?? true,
        }));
        const seenDebts = new Set<string>();
        const debtsForPayoff = [...debtsFromTable, ...debtsFromAccounts].filter((debt) => {
          if (!debt.valorTotal || !debt.valorParcela) return false;
          const key = `${debt.id}|${debt.nome}|${debt.valorTotal}|${debt.valorParcela}`;
          if (seenDebts.has(key)) return false;
          seenDebts.add(key);
          return true;
        });

        console.log('📥 Dívidas carregadas do Supabase:', {
          total: debtAccounts.length,
          debts: debtsForPayoff.map(d => ({ nome: d.nome, banco: d.banco, valor: d.valorTotal }))
        });

        setInitialIncome(results.renda);
        setInitialExpenses(results.gastos);
        setInitialDebts(debtsForPayoff);
      } catch (error) {
        console.error("Erro no Planner:", error);
      } finally {
        setLoading(false);
      }
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

      <Tabs defaultValue="forecast" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-card border border-border">
          <TabsTrigger value="smart" className="data-[state=active]:bg-amber-400/20 data-[state=active]:text-amber-300">
            <Brain className="w-4 h-4 mr-1" />
            <span className="text-xs">IA</span>
          </TabsTrigger>
          <TabsTrigger value="forecast" className="data-[state=active]:bg-emerald-accent/20 data-[state=active]:text-emerald-accent">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="text-xs">Previsão</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="data-[state=active]:bg-sky-accent/20 data-[state=active]:text-sky-accent">
            <Target className="w-4 h-4 mr-1" />
            <span className="text-xs">Metas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smart" className="space-y-4 animate-in fade-in-50">
          <SmartDebtDashboard />
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4 animate-in fade-in-50">
          <ForecastReport debts={initialDebts} />
        </TabsContent>

        <TabsContent value="goals" className="space-y-4 animate-in fade-in-50">
          <FinancialGoals initialIncome={initialIncome} initialExpenses={initialExpenses} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Planner;
