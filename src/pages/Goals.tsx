import { useEffect, useState, useCallback, useMemo } from "react";
import { ArrowLeft, Plus, Target, TrendingUp, Edit2, PlusCircle, Trash2, ChevronRight, Wallet, TrendingDown, Pause, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import DebtPlanner from "@/components/planner/DebtPlanner";
import { calcularTotaisFinanceiros } from "@/lib/finance-utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DEFAULT_INTEREST = 0.008; // 0.8% a.m.

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const calculateMonths = (monthly: number, target: number) => {
  if (monthly <= 0) return 0;
  let months = 0;
  let current = 0;
  while (current < target && months < 600) {
    current = (current + monthly) * (1 + DEFAULT_INTEREST);
    months++;
  }
  return months;
};

const Goals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("2");
  const [status, setStatus] = useState<"active" | "paused" | "completed" | "cancelled">("active");

  const monthlyAmount = useMemo(() => {
    const target = parseFloat(targetAmount);
    const months = parseInt(deadline);
    if (isNaN(target) || isNaN(months) || months <= 0) return 0;
    return target / months;
  }, [targetAmount, deadline]);

  const loadGoals = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("goals" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("priority", { ascending: true });
      if (error) throw error;
      setGoals(data || []);
    } catch (error: any) {
      // Se a tabela ainda não tem todas as colunas, mostra lista vazia
      console.warn("Goals:", error.message);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadFinance = useCallback(async () => {
    if (!user) return;
    const today = new Date();
    const monthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    try {
      const [accountsRes, salaryRes, extraRes, debtsRes] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", false).eq("month_year", monthYear),
        supabase.from("salary" as any).select("amount").eq("user_id", user.id).eq("month_year", monthYear).maybeSingle(),
        supabase.from("extra_income").select("amount").eq("user_id", user.id).eq("month_year", monthYear),
        supabase.from("debts" as any).select("parcela_mensal").eq("user_id", user.id),
      ]);
      const salary = salaryRes.data ? Number((salaryRes.data as any).amount) : 0;
      const extra = (extraRes.data || []).reduce((s: number, c: any) => s + Number(c.amount), 0);
      const accounts = (accountsRes.data || []) as any[];
      const dividas = ((debtsRes.data as any[]) || []).map(d => ({ amount: d.parcela_mensal }));
      const r = calcularTotaisFinanceiros({
        salario: salary,
        extra,
        contas: accounts,
        dividas,
      });
      setIncome(r.renda);
      setExpenses(r.gastos);
    } catch (e) {
      console.warn("loadFinance:", e);
    }
  }, [user]);

  useEffect(() => {
    loadGoals();
    loadFinance();
  }, [loadGoals, loadFinance]);

  const resetForm = () => {
    setName("");
    setTargetAmount("");
    setDeadline("");
    setPriority("2");
    setStatus("active");
    setEditingGoal(null);
  };

  const saveGoal = async () => {
    if (!user || !name || !targetAmount || !deadline) return;
    const goalData: any = {
      user_id: user.id,
      name,
      target_amount: parseFloat(targetAmount),
      monthly_amount: monthlyAmount,
      priority: parseInt(priority),
      status: status,
      current_amount: editingGoal ? editingGoal.current_amount : 0,
    };

    try {
      if (editingGoal) {
        const { error } = await supabase.from("goals" as any).update(goalData).eq("id", editingGoal.id);
        if (error) throw error;
        toast({ title: "Objetivo atualizado!" });
      } else {
        const { error } = await supabase.from("goals" as any).insert([goalData]);
        if (error) throw error;
        toast({ title: "Objetivo criado!" });
      }
      setIsDialogOpen(false);
      resetForm();
      loadGoals();
    } catch (error: any) {
      toast({ title: "Erro ao salvar objetivo", description: error.message, variant: "destructive" });
    }
  };

  const deleteGoal = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este objetivo? Esta ação não poderá ser desfeita.")) return;
    try {
      const { error } = await supabase.from("goals" as any).delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Objetivo removido" });
      loadGoals();
    } catch (error: any) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (goal: any) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(String(goal.target_amount));
    // Calculate deadline from monthly amount if not saved
    const calculatedDeadline = goal.monthly_amount > 0 ? Math.round(goal.target_amount / goal.monthly_amount) : 12;
    setDeadline(String(calculatedDeadline));
    setPriority(String(goal.priority));
    setStatus(goal.status || "active");
    setIsDialogOpen(true);
  };

  const generateEvolutionData = (monthly: number, target: number) => {
    const data = [];
    let current = 0;
    const months = calculateMonths(monthly, target);
    const step = Math.max(1, Math.floor(months / 6));
    for (let i = 0; i <= months; i += step) {
      current = (current + monthly * step) * (1 + DEFAULT_INTEREST * step);
      data.push({ mes: i, valor: Math.min(current, target) });
    }
    return data;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-6 pt-10 max-w-lg mx-auto bg-background">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl bg-card border border-border/50">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Objetivos e Metas</h1>
      </div>

      <Tabs defaultValue="metas" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-card border border-border">
          <TabsTrigger value="metas" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Target className="w-4 h-4 mr-1.5" /> Metas
          </TabsTrigger>
          <TabsTrigger value="dividas" className="data-[state=active]:bg-destructive/20 data-[state=active]:text-destructive">
            <TrendingDown className="w-4 h-4 mr-1.5" /> Planejamento de Dívidas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metas" className="space-y-6 animate-in fade-in-50">
          {/* Summary Section */}
          <div className="grid grid-cols-2 gap-4 mb-2 animate-slide-up">
        <Card className="p-5 bg-primary shadow-xl shadow-primary/20 border-none">
          <p className="text-white/70 text-[10px] uppercase font-bold mb-1">Total Metas</p>
          <p className="text-xl font-bold text-white">{formatCurrency(goals.reduce((s, g) => s + g.target_amount, 0))}</p>
        </Card>
        <Card className="p-5 bg-card border border-border/50 shadow-lg">
          <p className="text-muted-foreground text-[10px] uppercase font-bold mb-1">Economia Mensal</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(goals.reduce((s, g) => s + g.monthly_amount, 0))}</p>
        </Card>
      </div>

      <div className="space-y-6">
        {goals.length === 0 ? (
          <div className="text-center py-20 bg-card/50 rounded-3xl border border-dashed border-border p-8 animate-slide-up">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground text-sm">Nenhum objetivo cadastrado. <br/> Comece a planejar seus sonhos!</p>
            <Button variant="outline" className="mt-6 rounded-xl" onClick={() => setIsDialogOpen(true)}>
              Criar primeiro objetivo
            </Button>
          </div>
        ) : (
          goals.map((goal, index) => {
            const months = calculateMonths(goal.monthly_amount, goal.target_amount);
            const years = Math.floor(months / 12);
            const remainingMonths = months % 12;
            const evolutionData = generateEvolutionData(goal.monthly_amount, goal.target_amount);
            const monthsPlus = calculateMonths(goal.monthly_amount + 200, goal.target_amount);
            const diff = months - monthsPlus;

            return (
              <Card key={goal.id} className="p-6 bg-card border-border/50 shadow-sm animate-slide-up relative overflow-hidden group" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(goal)} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteGoal(goal.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between mb-6 pr-12">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${goal.priority === 1 ? 'bg-destructive' : goal.priority === 2 ? 'bg-primary' : 'bg-emerald-500'}`} />
                    <h3 className="text-lg font-bold text-foreground">{goal.name}</h3>
                  </div>
                  {goal.status && goal.status !== 'active' && (
                    <Badge variant="outline" className={cn(
                      "text-[9px] uppercase tracking-widest",
                      goal.status === 'completed' && "border-emerald-500 text-emerald-500 bg-emerald-500/10",
                      goal.status === 'paused' && "border-amber-500 text-amber-500 bg-amber-500/10",
                      goal.status === 'cancelled' && "border-red-500 text-red-500 bg-red-500/10",
                    )}>
                      {goal.status === 'completed' ? 'Concluída' : goal.status === 'paused' ? 'Pausada' : 'Cancelada'}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1 tracking-widest">Valor Alvo</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(goal.target_amount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1 tracking-widest">Investimento</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(goal.monthly_amount)}<span className="text-[10px] text-muted-foreground">/mês</span></p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" /> Tempo Estimado
                    </p>
                    <span className="text-xs font-bold text-foreground bg-muted px-3 py-1 rounded-full">
                      {years > 0 ? `${years}a ` : ''}{remainingMonths > 0 ? `${remainingMonths}m` : ''}
                    </span>
                  </div>
                  <div className="h-32 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={evolutionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="mes" hide />
                        <YAxis hide domain={[0, goal.target_amount]} />
                        <Line type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} animationDuration={1000} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {diff > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
                    <PlusCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[9px] font-bold text-primary uppercase tracking-widest mb-1">Dica de Aceleração</p>
                      <p className="text-[11px] text-foreground/80 leading-relaxed">
                        Poupando <span className="font-bold text-primary">+R$ 200</span>, você ganha <span className="font-bold text-primary">{diff} meses</span> de tempo!
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-primary/40" />
                  </div>
                )}
              </Card>
            );
          })
        )}
          </div>

          {/* FAB Metas */}
          <Button
            className="fixed bottom-24 right-8 w-14 h-14 rounded-full bg-primary shadow-2xl shadow-primary/40 p-0 flex items-center justify-center animate-bounce-slow z-10"
            onClick={() => { resetForm(); setIsDialogOpen(true); }}
          >
            <Plus className="w-7 h-7 text-white" />
          </Button>
        </TabsContent>

        <TabsContent value="dividas" className="animate-in fade-in-50">
          <DebtPlanner initialIncome={income} initialExpenses={expenses} />
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingGoal ? "Editar Objetivo" : "Novo Objetivo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">O que você quer conquistar?</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Viagem para o Japão" className="bg-muted border-border h-12 px-4 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Valor Total</label>
                <Input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="0.00" className="bg-muted border-border h-12 px-4 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Prazo (meses)</label>
                <Input type="number" value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="Ex: 12" className="bg-muted border-border h-12 px-4 rounded-xl" />
              </div>
            </div>

            {monthlyAmount > 0 && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl animate-in fade-in zoom-in duration-300">
                <p className="text-[10px] uppercase font-bold text-primary mb-1">Para atingir essa meta:</p>
                <p className="text-sm font-bold text-foreground">Guardar <span className="text-primary">{formatCurrency(monthlyAmount)}</span> por mês.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Prioridade</label>
                <select title="Prioridade" value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-muted px-4 text-sm text-foreground outline-none focus:border-primary">
                  <option value="1">Alta (Urgente)</option>
                  <option value="2">Média (Normal)</option>
                  <option value="3">Baixa (Desejo)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Status</label>
                <select title="Status" value={status} onChange={(e: any) => setStatus(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-muted px-4 text-sm text-foreground outline-none focus:border-primary">
                  <option value="active">Ativa</option>
                  <option value="paused">Pausada</option>
                  <option value="completed">Concluída</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
            </div>

            <Button onClick={saveGoal} className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20">
              Salvar Objetivo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Goals;
