import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, TrendingUp, Wallet, Clock, AlertCircle, Sparkles, Lightbulb, DollarSign, CheckCircle2, Plus, Trash2, ChevronRight, Target, BrainCircuit, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ensureMonthlyInstances } from "@/lib/account-utils";
import type { Tables } from "@/integrations/supabase/types";

type Account = Tables<"accounts">;
type Investment = Tables<"investments">;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const today = new Date();
const todayDay = today.getDate();
const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

const Today = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [templates, setTemplates] = useState<Account[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(true);

  // Salary state
  const [salary, setSalary] = useState(0);
  const [salaryReceived, setSalaryReceived] = useState(false);
  const [salaryId, setSalaryId] = useState<string | null>(null);
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [salaryInput, setSalaryInput] = useState("");
  
  // Extra Income state
  const [extraIncomes, setExtraIncomes] = useState<any[]>([]);
  const [extraIncomeDialogOpen, setExtraIncomeDialogOpen] = useState(false);
  const [extraIncomeName, setExtraIncomeName] = useState("");
  const [extraIncomeAmount, setExtraIncomeAmount] = useState("");
  const [editingExtraIncomeId, setEditingExtraIncomeId] = useState<string | null>(null);

  // Challenges state
  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  const [challengeDoneToday, setChallengeDoneToday] = useState(false);
  const hasGenerated = useRef(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);

      // 1. First ensure instances are generated for the current month
      if (!hasGenerated.current) {
        hasGenerated.current = true;
        await ensureMonthlyInstances(user.id, currentMonthYear);
      }

      // 2. Fetch all data in parallel
      const [instancesResponse, templatesResponse, investmentsResponse, salaryResponse, extraResponse, challengeResponse] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", false),
        supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", true),
        supabase.from("investments").select("*").eq("user_id", user.id),
        supabase.from("salary" as any).select("*").eq("user_id", user.id).eq("month_year", currentMonthYear).maybeSingle(),
        supabase.from("extra_income").select("*").eq("user_id", user.id).eq("month_year", currentMonthYear),
        supabase.from("user_challenges" as any).select("*").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle()
      ]);

      if (instancesResponse.error) throw instancesResponse.error;
      if (templatesResponse.error) throw templatesResponse.error;

      setAccounts((instancesResponse.data ?? []) as Account[]);
      setTemplates((templatesResponse.data ?? []) as Account[]);
      setInvestments((investmentsResponse.data ?? []) as Investment[]);

      if (salaryResponse.data) {
        const s = salaryResponse.data as any;
        setSalary(Number(s.amount));
        setSalaryReceived(!!s.received);
        setSalaryId(s.id);
      }

      if (extraResponse.data) {
        setExtraIncomes(extraResponse.data);
      }

      const activeUC = challengeResponse?.data as any;
      if (activeUC) {
        setActiveChallenge(activeUC);
        const { data: progressToday } = await supabase
          .from("challenge_progress" as any)
          .select("*")
          .eq("user_challenge_id", activeUC.id)
          .eq("status_date", new Date().toISOString().split("T")[0])
          .maybeSingle();
        
        setChallengeDoneToday(!!progressToday);
      }

    } catch (error: any) {
      console.error("Erro no Today fetchData:", error);
      toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // LÓGICA DE CÁLCULO MENSAL (CONFORME REGRAS) - Refinada para priorizar instâncias
  const calcularTotalMes = (monthYear: string) => {
    // 1. Filtrar instâncias do mês específico
    const instancesDoMes = accounts.filter(a => a.month_year === monthYear);

    // 2. Contas Pontuais (Sempre instâncias)
    const contasPontuais = instancesDoMes.filter(a => a.billing_type === 'single');
    const totalPontuais = contasPontuais.reduce((s, c) => s + Number(c.amount), 0);

    // 3. Contas Mensais - Usar instância se existir, senão template
    const monthlyTemplates = templates.filter(t => t.billing_type === 'monthly');
    let totalMensais = 0;
    const resolvedMensais: Account[] = [];

    monthlyTemplates.forEach(t => {
      const instance = instancesDoMes.find(a => a.parent_id === t.id);
      totalMensais += Number(instance ? instance.amount : t.amount);
      resolvedMensais.push(instance || t);
    });

    // 4. Dívidas - Usar instância se existir, senão template (se ativa)
    const debtTemplates = templates.filter(t => t.billing_type === 'debt' && (t.remaining_months === null || t.remaining_months > 0));
    let totalDividas = 0;
    const resolvedDividas: Account[] = [];

    debtTemplates.forEach(t => {
      const instance = instancesDoMes.find(a => a.parent_id === t.id);
      totalDividas += Number(instance ? instance.amount : t.amount);
      resolvedDividas.push(instance || t);
    });

    return {
      total: totalMensais + totalPontuais + totalDividas,
      breakdown: {
        mensais: resolvedMensais,
        pontuais: contasPontuais,
        dividas: resolvedDividas
      }
    };
  };

  const getNextMonthYear = () => {
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
  };

  const currentMonthData = useMemo(() => calcularTotalMes(currentMonthYear), [templates, accounts, currentMonthYear]);
  const nextMonthData = useMemo(() => calcularTotalMes(getNextMonthYear()), [templates, accounts]);

  // Contas do mês atual (para outras seções do dashboard)
  const currentMonthAccounts = useMemo(
    () => accounts.filter((account) => account.month_year === currentMonthYear),
    [accounts, currentMonthYear],
  );

  const pendingAccounts = useMemo(
    () => currentMonthAccounts.filter((account) => !account.paid),
    [currentMonthAccounts],
  );

  const overdueAccounts = useMemo(
    () => pendingAccounts.filter((account) => account.due_day < todayDay),
    [pendingAccounts, todayDay],
  );

  const totalPending = useMemo(
    () => pendingAccounts.reduce((sum, account) => sum + Number(account.amount), 0),
    [pendingAccounts],
  );

  const totalPaid = useMemo(
    () => currentMonthAccounts.filter(a => a.paid).reduce((sum, a) => sum + Number(a.amount), 0),
    [currentMonthAccounts],
  );

  const totalExtraIncome = useMemo(
    () => extraIncomes.reduce((sum, item) => sum + Number(item.amount), 0),
    [extraIncomes]
  );

  const totalIncome = salary + totalExtraIncome;
  const remainingBalance = totalIncome - currentMonthData.total;

  const saveSalary = async () => {
    if (!user || !salaryInput) return;
    const amount = parseFloat(salaryInput);
    if (isNaN(amount)) return;

    if (salaryId) {
      const { error } = await supabase
        .from("salary" as any)
        .update({ amount, updated_at: new Date().toISOString() } as any)
        .eq("id", salaryId);
      if (error) {
        toast({ title: "Erro ao atualizar salário", variant: "destructive" });
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("salary" as any)
        .insert({ user_id: user.id, amount, month_year: currentMonthYear } as any)
        .select("*")
        .single();
      if (error) {
        toast({ title: "Erro ao salvar salário", variant: "destructive" });
        return;
      }
      setSalaryId((data as any).id);
    }

    setSalary(amount);
    setSalaryDialogOpen(false);
    toast({ title: "💰 Salário atualizado!" });
  };

  const saveExtraIncome = async () => {
    if (!user || !extraIncomeName || !extraIncomeAmount) return;
    const amount = parseFloat(extraIncomeAmount);
    if (isNaN(amount)) return;

    const data = {
      user_id: user.id,
      amount,
      description: extraIncomeName,
      month_year: currentMonthYear,
      date: new Date().toISOString().split("T")[0],
    };

    if (editingExtraIncomeId) {
      const { error } = await supabase
        .from("extra_income")
        .update(data)
        .eq("id", editingExtraIncomeId);
      
      if (error) {
        toast({ 
          title: "Erro ao atualizar ganho", 
          description: (error as any).message,
          variant: "destructive" 
        });
        return;
      }
      setExtraIncomes(prev => prev.map(item => item.id === editingExtraIncomeId ? { ...item, ...data } : item));
    } else {
      const { data: insertedData, error } = await supabase
        .from("extra_income")
        .insert(data)
        .select("*")
        .single();
      
      if (error) {
        toast({ 
          title: "Erro ao salvar ganho", 
          description: (error as any).message,
          variant: "destructive" 
        });
        return;
      }
      setExtraIncomes(prev => [...prev, insertedData]);
    }

    setExtraIncomeDialogOpen(false);
    setExtraIncomeName("");
    setExtraIncomeAmount("");
    setEditingExtraIncomeId(null);
    toast({ title: "💰 Ganho extra registrado!" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const status = overdueAccounts.length > 0 ? "ATRASO" : "OK";

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Visão rápida de tudo.</p>
        </div>
      </div>

      {/* 📊 RESUMO MENSAL (NOVO) */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card className="p-4 border-gold/30 bg-gold/5 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Mês Atual</p>
          <p className="font-bold text-xl text-gold">{formatCurrency(currentMonthData.total)}</p>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Vence este mês</span>
          </div>
        </Card>
        <Card className="p-4 border-sky-accent/30 bg-sky-accent/5 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Próximo Mês</p>
          <p className="font-bold text-xl text-sky-accent">{formatCurrency(nextMonthData.total)}</p>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>Previsão estimada</span>
          </div>
        </Card>
      </div>

      {/* 🔝 Status geral */}
      <Card className={`p-4 mb-4 flex items-center justify-between animate-slide-up ${status === "ATRASO" ? "border-destructive/40 bg-destructive/5" : "border-emerald-accent/40 bg-emerald-accent/5"}`} style={{ animationDelay: "0.3s" }}>
        <div className="flex items-center gap-3">
          {status === "ATRASO" ? (
            <AlertCircle className="w-8 h-8 text-destructive" />
          ) : (
            <CheckCircle2 className="w-8 h-8 text-emerald-accent" />
          )}
          <div>
            <h2 className={`font-bold text-lg ${status === "ATRASO" ? "text-destructive" : "text-emerald-accent"}`}>
              {status === "ATRASO" ? "Contas em Atraso" : "Tudo em dia"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {status === "ATRASO" ? `${overdueAccounts.length} conta(s) pendente(s)` : "Nenhuma conta atrasada."}
            </p>
          </div>
        </div>
      </Card>

      {/* 📂 DETALHAMENTO (NOVO) */}
      <Card className="p-4 mb-4 border-border animate-slide-up" style={{ animationDelay: "0.4s" }}>
        <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" /> Detalhamento Mensal
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)} className="h-7 w-7 p-0">
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
        
        {showDetails && (
          <div className="space-y-4 pt-2">
            {/* Contas Mensais */}
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex justify-between">
                <span>Contas Mensais</span>
                <span>{formatCurrency(currentMonthData.breakdown.mensais.reduce((s, c) => s + Number(c.amount), 0))}</span>
              </p>
              <div className="space-y-1.5">
                {currentMonthData.breakdown.mensais.map(c => (
                  <div key={c.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{c.name}</span>
                    <span className="font-medium text-foreground">{formatCurrency(Number(c.amount))}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contas do Mês */}
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex justify-between">
                <span>Contas deste mês</span>
                <span>{formatCurrency(currentMonthData.breakdown.pontuais.reduce((s, c) => s + Number(c.amount), 0))}</span>
              </p>
              {currentMonthData.breakdown.pontuais.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhuma conta pontual.</p>
              ) : (
                <div className="space-y-1.5">
                  {currentMonthData.breakdown.pontuais.map(c => (
                    <div key={c.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{c.name}</span>
                      <span className="font-medium text-foreground">{formatCurrency(Number(c.amount))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dívidas */}
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex justify-between">
                <span>Dívidas</span>
                <span>{formatCurrency(currentMonthData.breakdown.dividas.reduce((s, d) => s + Number(d.amount), 0))}</span>
              </p>
              <div className="space-y-1.5">
                {currentMonthData.breakdown.dividas.map(d => (
                  <div key={d.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {d.name} {d.remaining_months ? `(${d.remaining_months}x)` : ''}
                    </span>
                    <span className="font-medium text-destructive">{formatCurrency(Number(d.amount))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 💰 Renda do mês */}
      <Card className="p-4 mb-4 border-emerald-accent/20 animate-slide-up" style={{ animationDelay: "0.5s" }}>
        <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-accent" /> Renda do mês
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => { setSalaryInput(String(salary || "")); setSalaryDialogOpen(true); }}>
              Salário
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => { 
              setEditingExtraIncomeId(null); setExtraIncomeName(""); setExtraIncomeAmount(""); setExtraIncomeDialogOpen(true); 
            }}>
              Extra
            </Button>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Salário</span>
            <span className="font-medium text-foreground">{formatCurrency(salary)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Extra</span>
            <span className="font-medium text-emerald-accent">{formatCurrency(totalExtraIncome)}</span>
          </div>
          <div className="pt-2 border-t border-border flex justify-between items-center">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-lg font-bold text-emerald-accent">{formatCurrency(totalIncome)}</span>
          </div>
        </div>
      </Card>

      {/* 💵 Saldo restante */}
      <Card className={`p-5 mb-6 text-center border animate-slide-up ${remainingBalance >= 0 ? "border-sky-accent/40 bg-sky-accent/5" : "border-destructive/40 bg-destructive/5"}`} style={{ animationDelay: "0.6s" }}>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Saldo Restante</p>
        <p className={`text-3xl font-bold ${remainingBalance >= 0 ? "text-sky-accent" : "text-destructive"}`}>
          {formatCurrency(remainingBalance)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">disponível no mês</p>
      </Card>

      {/* 🎯 Objetivos e Metas */}
      <Card 
        className="p-5 mb-4 border-gold/20 bg-gold/5 cursor-pointer hover:bg-gold/10 transition-colors group animate-slide-up"
        style={{ animationDelay: "0.7s" }}
        onClick={() => navigate("/goals")}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gold/20 p-3 rounded-2xl text-gold group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Objetivos</h2>
              <p className="text-xs text-muted-foreground">Planeje seu futuro e metas</p>
            </div>
          </div>
          <ArrowLeft className="w-5 h-5 text-gold rotate-180" />
        </div>
      </Card>

      {/* Salary Dialog */}
      <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>💰 Salário do mês</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Valor do salário</label>
              <Input
                type="number"
                value={salaryInput}
                onChange={(e) => setSalaryInput(e.target.value)}
                placeholder="3000"
                className="bg-muted border-border"
                step="0.01"
                min="0"
              />
            </div>
            <Button className="w-full" onClick={saveSalary}>
              Salvar salário
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Extra Income Dialog */}
      <Dialog open={extraIncomeDialogOpen} onOpenChange={setExtraIncomeDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>💰 Ganho extra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
              <Input
                value={extraIncomeName}
                onChange={(e) => setExtraIncomeName(e.target.value)}
                placeholder="Ex: Venda de celular, Freela..."
                className="bg-muted border-border"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Valor</label>
              <Input
                type="number"
                value={extraIncomeAmount}
                onChange={(e) => setExtraIncomeAmount(e.target.value)}
                placeholder="0.00"
                className="bg-muted border-border"
                step="0.01"
                min="0"
              />
            </div>
            <Button className="w-full" onClick={saveExtraIncome}>
              {editingExtraIncomeId ? "Atualizar" : "Salvar ganho"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Today;
