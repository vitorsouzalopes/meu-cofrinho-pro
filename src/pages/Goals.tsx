import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Plus, Target, TrendingUp, Edit2, PlusCircle, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number; // For demo, let's assume we might want to track current progress too
  monthly_amount: number;
  priority: number; // 1: High, 2: Medium, 3: Low
  is_auto: boolean;
}

const DEFAULT_INTEREST = 0.008; // 0.8% a.m.

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const Goals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);

  // Form states
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [priority, setPriority] = useState("2");

  const loadGoals = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("priority", { ascending: true });

      if (error) throw error;
      setGoals(data || []);
    } catch (error: any) {
      toast({ title: "Erro ao carregar objetivos", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const saveGoal = async () => {
    if (!user || !name || !targetAmount || !monthlyAmount) return;

    const goalData = {
      user_id: user.id,
      name,
      target_amount: parseFloat(targetAmount),
      monthly_amount: parseFloat(monthlyAmount),
      priority: parseInt(priority),
      is_auto: true,
    };

    try {
      if (editingGoal) {
        const { error } = await supabase.from("goals").update(goalData).eq("id", editingGoal.id);
        if (error) throw error;
        toast({ title: "Objetivo atualizado!" });
      } else {
        const { error } = await supabase.from("goals").insert([goalData]);
        if (error) throw error;
        toast({ title: "Objetivo criado!" });
      }
      setIsDialogOpen(false);
      resetForm();
      loadGoals();
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Objetivo removido" });
      loadGoals();
    } catch (error: any) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setName("");
    setTargetAmount("");
    setMonthlyAmount("");
    setPriority("2");
    setEditingGoal(null);
  };

  const handleEdit = (goal: any) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(goal.target_amount.toString());
    setMonthlyAmount(goal.monthly_amount.toString());
    setPriority(goal.priority.toString());
    setIsDialogOpen(true);
  };

  const generateEvolutionData = (monthly: number, target: number) => {
    let current = 0;
    let data = [];
    let month = 0;
    const maxMonths = 120; // Cap at 10 years for safety

    while (current < target && month < maxMonths) {
      month++;
      current = (current + monthly) * (1 + DEFAULT_INTEREST);
      data.push({ mes: month, valor: Math.round(current) });
    }
    return data;
  };

  const calculateMonths = (monthly: number, target: number) => {
    let current = 0;
    let months = 0;
    while (current < target && months < 600) { // Safety cap
      months++;
      current = (current + monthly) * (1 + DEFAULT_INTEREST);
    }
    return months;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto bg-background">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold font-heading">Objetivos</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gold hover:bg-gold/90 text-background font-bold rounded-full h-10 w-10 p-0 shadow-lg shadow-gold/20">
              <Plus className="w-6 h-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{editingGoal ? "Editar Objetivo" : "Novo Objetivo"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Objetivo</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Viagem, Carro..." className="bg-muted border-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor da Meta (R$)</label>
                <Input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="30000" className="bg-muted border-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quanto guardar por mês (R$)</label>
                <Input type="number" value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value)} placeholder="1000" className="bg-muted border-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prioridade</label>
                <select 
                  value={priority} 
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-muted rounded-md border-none p-2 text-sm outline-none"
                >
                  <option value="1">Alta</option>
                  <option value="2">Média</option>
                  <option value="3">Baixa</option>
                </select>
              </div>
              <Button onClick={saveGoal} className="w-full bg-gold hover:bg-gold/90 text-background font-bold">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {goals.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border p-8">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Nenhum objetivo cadastrado. <br/> Comece agora!</p>
          </div>
        ) : (
          goals.map((goal) => {
            const months = calculateMonths(goal.monthly_amount, goal.target_amount);
            const years = Math.floor(months / 12);
            const remainingMonths = months % 12;
            const evolutionData = generateEvolutionData(goal.monthly_amount, goal.target_amount);
            
            // Simulation
            const monthsPlus = calculateMonths(goal.monthly_amount + 200, goal.target_amount);
            const diff = months - monthsPlus;

            return (
              <Card key={goal.id} className="p-6 bg-card border-border overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-2 flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(goal)} className="h-8 w-8 text-muted-foreground hover:text-gold transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteGoal(goal.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${goal.priority === 1 ? 'bg-destructive' : goal.priority === 2 ? 'bg-gold' : 'bg-emerald- accent'}`} />
                    <h3 className="text-xl font-bold">{goal.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Meta</p>
                      <p className="font-semibold">{formatCurrency(goal.target_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Poupando</p>
                      <p className="font-semibold text-gold">{formatCurrency(goal.monthly_amount)}/mês</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Previsão automática
                    </p>
                    <span className="text-sm font-bold text-foreground">
                      {years > 0 ? `${years} ${years === 1 ? 'ano' : 'anos'}` : ''} 
                      {remainingMonths > 0 ? ` ${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}` : ''}
                    </span>
                  </div>
                </div>

                <div className="h-40 w-full mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolutionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="mes" hide />
                      <YAxis hide domain={[0, goal.target_amount]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '12px' }}
                        formatter={(value) => formatCurrency(Number(value))}
                        labelFormatter={(label) => `Mês ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="valor" 
                        stroke="hsl(var(--gold))" 
                        strokeWidth={3} 
                        dot={false} 
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {diff > 0 && (
                  <div className="bg-emerald-accent/5 border border-emerald-accent/20 rounded-2xl p-4 flex items-start gap-3">
                    <div className="bg-emerald-accent/20 p-2 rounded-xl text-emerald-accent">
                      <PlusCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-accent uppercase tracking-wider">Sugestão Inteligente</p>
                      <p className="text-sm text-foreground/80 mt-1">
                        Se guardar <span className="font-bold text-emerald-accent">+R$ 200</span>, você atinge sua meta <span className="font-bold text-emerald-accent">{diff} {diff === 1 ? 'mês' : 'meses'} antes</span>.
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-4 rounded-2xl">
        <Info className="w-4 h-4 flex-shrink-0" />
        <p>Cálculo baseado em rendimento médio de {(DEFAULT_INTEREST * 100).toFixed(1)}% ao mês.</p>
      </div>
    </div>
  );
};

export default Goals;
