import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, TrendingUp, Wallet, Clock, AlertCircle, Sparkles, Lightbulb, DollarSign, CheckCircle2, Plus, Trash2, ChevronRight, Target, BrainCircuit, ArrowLeft } from "lucide-react";
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

const Today = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

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

  const today = new Date();
  const todayDay = today.getDate();
  const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);

      // Ensure instances exist for current month
      await ensureMonthlyInstances(user.id, currentMonthYear);

      const [accountsResponse, investmentsResponse, salaryResponse, extraResponse, challengeResponse] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", false),
        supabase.from("investments").select("*").eq("user_id", user.id),
        supabase.from("salary" as any).select("*").eq("user_id", user.id).eq("month_year", currentMonthYear).maybeSingle(),
        supabase.from("extra_income").select("*").eq("user_id", user.id).eq("month_year", currentMonthYear),
        supabase.from("user_challenges" as any).select("*").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle()
      ]);

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
      } else {
        setActiveChallenge(null);
        setChallengeDoneToday(false);
      }

      if (accountsResponse.error) {
        toast({ title: "Erro ao carregar contas", description: accountsResponse.error.message, variant: "destructive" });
        setAccounts([]);
      } else {
        setAccounts((accountsResponse.data ?? []) as Account[]);
      }

      if (investmentsResponse.error) {
        setInvestments([]);
      } else {
        setInvestments((investmentsResponse.data ?? []) as Investment[]);
      }

      if (!salaryResponse.error && salaryResponse.data) {
        const s = salaryResponse.data as any;
        setSalary(Number(s.amount));
        setSalaryReceived(!!s.received);
        setSalaryId(s.id);
      }

      if (!extraResponse.error && extraResponse.data) {
        setExtraIncomes(extraResponse.data);
      }

      setLoading(false);
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentMonthYear]);

  // Contas do mês atual
  const currentMonthAccounts = useMemo(
    () => accounts.filter((account) => account.month_year === currentMonthYear),
    [accounts, currentMonthYear],
  );

  const pendingAccounts = useMemo(
    () => currentMonthAccounts.filter((account) => !account.paid),
    [currentMonthAccounts],
  );

  const dueToday = useMemo(
    () => pendingAccounts.filter((account) => account.due_day === todayDay),
    [pendingAccounts, todayDay],
  );

  const overdueAccounts = useMemo(
    () => pendingAccounts.filter((account) => account.due_day < todayDay),
    [pendingAccounts, todayDay],
  );

  const upcomingThisWeek = useMemo(() => {
    return pendingAccounts.filter((account) => {
      const diff = account.due_day - todayDay;
      return diff > 0 && diff <= 7;
    });
  }, [pendingAccounts, todayDay]);

  const totalPending = useMemo(
    () => pendingAccounts.reduce((sum, account) => sum + Number(account.amount), 0),
    [pendingAccounts],
  );

  const totalOverdue = useMemo(
    () => overdueAccounts.reduce((sum, account) => sum + Number(account.amount), 0),
    [overdueAccounts],
  );

  const totalCurrentMonth = useMemo(
    () => currentMonthAccounts.reduce((sum, account) => sum + Number(account.amount), 0),
    [currentMonthAccounts],
  );

  const totalPaid = useMemo(
    () => currentMonthAccounts.filter(a => a.paid).reduce((sum, a) => sum + Number(a.amount), 0),
    [currentMonthAccounts],
  );

  const investmentTotal = useMemo(
    () => investments.reduce((sum, inv) => sum + Number(inv.current_amount ?? inv.amount), 0),
    [investments],
  );

  const totalExtraIncome = useMemo(
    () => extraIncomes.reduce((sum, item) => sum + Number(item.amount), 0),
    [extraIncomes]
  );

  const totalIncome = salary + totalExtraIncome;
  const remainingBalance = totalIncome - totalCurrentMonth;
  const balanceAfterPending = totalIncome - totalPaid - totalPending;

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

  const markSalaryReceived = async () => {
    if (!salaryId) return;
    const { error } = await supabase
      .from("salary" as any)
      .update({ received: true, received_at: new Date().toISOString() } as any)
      .eq("id", salaryId);
    if (error) {
      toast({ title: "Erro", variant: "destructive" });
      return;
    }
    setSalaryReceived(true);
    toast({ title: "🎉 Salário recebido! Bora organizar as contas!" });
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

  const deleteExtraIncome = async (id: string) => {
    const { error } = await supabase
      .from("extra_income")
      .delete()
      .eq("id", id);
    
    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
      return;
    }
    setExtraIncomes(prev => prev.filter(item => item.id !== id));
    toast({ title: "Removido com sucesso!" });
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

      {/* 🔝 Status geral */}
      <Card className={`p-4 mb-4 flex items-center justify-between ${status === "ATRASO" ? "border-destructive/40 bg-destructive/5" : "border-emerald-accent/40 bg-emerald-accent/5"}`}>
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

      {/* 📊 Cards principais */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <Card className="p-3 border-gold/30 text-center cursor-pointer hover:bg-gold/5 transition-colors" onClick={() => navigate("/accounts")}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Contas</p>
          <p className="font-bold text-gold">{currentMonthAccounts.length}</p>
        </Card>
        <Card className={`p-3 text-center cursor-pointer transition-colors ${overdueAccounts.length > 0 ? "border-destructive/30 hover:bg-destructive/5" : "border-border hover:bg-muted"}`} onClick={() => navigate("/accounts")}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Atrasadas</p>
          <p className={`font-bold ${overdueAccounts.length > 0 ? "text-destructive" : "text-foreground"}`}>{overdueAccounts.length}</p>
        </Card>
        <Card className="p-3 border-sky-accent/30 text-center cursor-pointer hover:bg-sky-accent/5 transition-colors" onClick={() => navigate("/investments")}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Investidos</p>
          <p className="font-bold text-sky-accent">{investments.length}</p>
        </Card>
      </div>

      {/* 💰 Renda do mês */}
      <Card className="p-4 mb-4 border-emerald-accent/20">
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

      {/* 📉 Despesas */}
      <Card className="p-4 mb-4 border-destructive/20">
        <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Wallet className="w-4 h-4 text-destructive" /> Despesas
          </h2>
          <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => navigate("/accounts")}>
            Ver contas
          </Button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total contas</span>
            <span className="font-medium text-foreground">{formatCurrency(totalCurrentMonth)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Já pago</span>
            <span className="font-medium text-emerald-accent">{formatCurrency(totalPaid)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Em andamento</span>
            <span className="font-medium text-gold">{formatCurrency(totalPending)}</span>
          </div>
        </div>
      </Card>

      {/* 🎯 Objetivos e Metas */}
      <Card 
        className="p-5 mb-4 border-gold/20 bg-gold/5 cursor-pointer hover:bg-gold/10 transition-colors group"
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

      {/* 💵 Saldo restante */}
      <Card className={`p-5 mb-6 text-center border ${remainingBalance >= 0 ? "border-sky-accent/40 bg-sky-accent/5" : "border-destructive/40 bg-destructive/5"}`}>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Saldo Restante</p>
        <p className={`text-3xl font-bold ${remainingBalance >= 0 ? "text-sky-accent" : "text-destructive"}`}>
          {formatCurrency(remainingBalance)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">disponível no mês</p>
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
