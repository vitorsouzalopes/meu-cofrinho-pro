import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, TrendingUp, Wallet, Clock, AlertCircle, Sparkles, Lightbulb, DollarSign, CheckCircle2, Plus, Trash2, ChevronRight, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
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

      const [accountsResponse, investmentsResponse, salaryResponse, extraResponse, challengeResponse] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id),
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

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-xs text-muted-foreground">Acompanhe suas contas e finanças.</p>
      </div>

      {/* Challenge Reminder */}
      {activeChallenge && !challengeDoneToday && (
        <Card 
          className="p-4 mb-4 border-primary/40 bg-primary/5 animate-pulse-gold cursor-pointer"
          onClick={() => navigate("/progress")}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl">
              🎯
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-sm">Fazer check-in de hoje</h3>
              <p className="text-xs text-muted-foreground">Não esqueça de guardar sua reserva hoje!</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </Card>
      )}

      {/* Salary Card */}
      <Card className="p-4 mb-4 border-gold/40 bg-gold/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gold" />
            <h2 className="font-semibold text-foreground">Salário do mês</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setSalaryInput(String(salary || "")); setSalaryDialogOpen(true); }}>
            {salary > 0 ? "Editar" : "Adicionar"}
          </Button>
        </div>
        {salary > 0 ? (
          <div className="space-y-2">
            <p className="text-2xl font-bold text-gold">{formatCurrency(salary)}</p>
            {!salaryReceived ? (
              <Button variant="emerald" size="sm" className="w-full" onClick={markSalaryReceived}>
                <CheckCircle2 className="w-4 h-4 mr-1" /> Marcar como recebido
              </Button>
            ) : (
              <p className="text-xs text-emerald-accent font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Salário recebido ✓
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Informe seu salário para ver a previsão de saldo.</p>
        )}
      </Card>

      {/* Extra Income Card */}
      <Card className="p-4 mb-4 border-emerald-accent/40 bg-emerald-accent/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-accent" />
            <div>
              <h2 className="font-semibold text-foreground">Ganho extra</h2>
              <p className="text-[10px] text-muted-foreground">Freelas, vendas, bicos…</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { 
            setEditingExtraIncomeId(null);
            setExtraIncomeName("");
            setExtraIncomeAmount("");
            setExtraIncomeDialogOpen(true); 
          }}>
            + Adicionar
          </Button>
        </div>
        
        {extraIncomes.length > 0 ? (
          <div className="space-y-3">
            {/* Total acumulado do mês */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-accent/10 border border-emerald-accent/20">
              <div>
                <p className="text-[10px] text-emerald-accent uppercase tracking-wider font-medium">Total do mês</p>
                <p className="text-2xl font-bold text-emerald-accent mt-0.5">{formatCurrency(totalExtraIncome)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{extraIncomes.length} {extraIncomes.length === 1 ? "entrada" : "entradas"}</p>
              </div>
            </div>

            {/* Lista de entradas */}
            <div className="space-y-1.5">
              {extraIncomes.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg hover:bg-emerald-accent/5 group transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.description}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.date ? new Date(item.date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-sm font-semibold text-emerald-accent">+{formatCurrency(Number(item.amount))}</p>
                    <button
                      title="Excluir ganho"
                      className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                      onClick={() => deleteExtraIncome(item.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-accent/10 flex items-center justify-center mb-2">
              <Plus className="w-5 h-5 text-emerald-accent" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhum ganho extra este mês.</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">Freelas, vendas e bicos somam à sua renda total.</p>
          </div>
        )}
      </Card>

      {/* Balance Forecast */}
      {(salary > 0 || totalExtraIncome > 0) && (
        <Card className="p-4 mb-4 border-border">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-foreground" />
            <h2 className="font-semibold text-foreground">Previsão do mês</h2>
          </div>

          {/* Composição da Renda Total */}
          <div className="p-3 rounded-lg bg-gold/5 border border-gold/20 mb-3">
            <p className="text-[10px] text-gold uppercase tracking-wider font-medium mb-2">Composição da renda</p>
            <div className="space-y-1.5 text-sm">
              {salary > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Salário</span>
                  <span className="font-medium text-foreground">{formatCurrency(salary)}</span>
                </div>
              )}
              {totalExtraIncome > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ganho extra</span>
                  <span className="font-medium text-emerald-accent">+ {formatCurrency(totalExtraIncome)}</span>
                </div>
              )}
              <div className="border-t border-gold/20 pt-1.5 flex justify-between">
                <span className="font-semibold text-foreground">Renda total</span>
                <span className="font-bold text-gold">{formatCurrency(totalIncome)}</span>
              </div>
            </div>
          </div>

          {/* Balanço */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total de contas</span>
              <span className="font-semibold text-destructive">- {formatCurrency(totalCurrentMonth)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Já pago</span>
              <span className="font-semibold text-foreground">- {formatCurrency(totalPaid)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pendente</span>
              <span className="font-semibold text-foreground">- {formatCurrency(totalPending)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between items-center">
              <span className="font-medium text-foreground">Saldo restante</span>
              <span className={`text-xl font-bold ${remainingBalance >= 0 ? "text-emerald-accent" : "text-destructive"}`}>
                {formatCurrency(remainingBalance)}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4 border-gold/30">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-gold" />
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Contas</p>
          </div>
          <p className="font-semibold text-lg text-gold">{formatCurrency(totalCurrentMonth)}</p>
        </Card>

        <Card className="p-4 border-emerald-accent/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-accent" />
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Invest.</p>
          </div>
          <p className="font-semibold text-lg text-emerald-accent">{formatCurrency(investmentTotal)}</p>
        </Card>

        <Card className={`p-4 ${overdueAccounts.length > 0 ? "border-destructive/30" : "border-gold/30"}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`w-4 h-4 ${overdueAccounts.length > 0 ? "text-destructive" : "text-foreground/50"}`} />
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Atrasadas</p>
          </div>
          <p className={`font-semibold text-lg ${overdueAccounts.length > 0 ? "text-destructive" : "text-foreground/50"}`}>
            {overdueAccounts.length}
          </p>
        </Card>

        <Card className="p-4 border-sky-accent/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-sky-accent" />
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Hoje</p>
          </div>
          <p className="font-semibold text-lg text-sky-accent">{dueToday.length}</p>
        </Card>
      </div>

      <div className="space-y-4">
        {/* Contas atrasadas */}
        {overdueAccounts.length > 0 && (
          <Card className="p-4 border-destructive/50 bg-destructive/5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <h2 className="font-semibold text-foreground">⚠️ Contas Atrasadas</h2>
            </div>
            <div className="space-y-2">
              {overdueAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">{account.name}</p>
                    <p className="text-xs text-muted-foreground">Desde dia {account.due_day}</p>
                  </div>
                  <p className="font-semibold text-destructive">{formatCurrency(Number(account.amount))}</p>
                </div>
              ))}
            </div>
            <Button variant="destructive" size="sm" className="w-full mt-3" onClick={() => navigate("/accounts")}>
              Resolver agora
            </Button>
          </Card>
        )}

        {/* Contas a pagar HOJE */}
        {dueToday.length > 0 && (
          <Card className="p-4 border-sky-accent/30">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-sky-accent" />
              <h2 className="font-semibold text-foreground">⏰ Vence Hoje</h2>
            </div>
            <div className="space-y-2">
              {dueToday.map((account) => (
                <div key={account.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{account.billing_type === "monthly" ? "Mensal" : "Única"}</p>
                  </div>
                  <p className="font-semibold text-sky-accent">{formatCurrency(Number(account.amount))}</p>
                </div>
              ))}
            </div>
            <Button size="sm" className="w-full mt-3" onClick={() => navigate("/accounts")}>
              Ver contas
            </Button>
          </Card>
        )}

        {/* Próximos 7 dias */}
        {upcomingThisWeek.length > 0 && (
          <Card className="p-4 border-gold/30">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-gold" />
              <h2 className="font-semibold text-foreground">📅 Próximos 7 Dias</h2>
            </div>
            <div className="space-y-2">
              {upcomingThisWeek.sort((a, b) => a.due_day - b.due_day).map((account) => (
                <div key={account.id} className="flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{account.name}</p>
                    <p className="text-xs text-muted-foreground">Dia {account.due_day}</p>
                  </div>
                  <p className="font-semibold text-gold">{formatCurrency(Number(account.amount))}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tudo em dia */}
        {pendingAccounts.length === 0 && (
          <Card className="p-6 text-center border-emerald-accent/30 bg-emerald-accent/5">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-emerald-accent" />
            <p className="text-lg font-semibold text-foreground">Tudo em dia! ✓</p>
            <p className="text-xs text-muted-foreground mt-2">Todas as contas do mês foram pagas.</p>
          </Card>
        )}

        {/* Sobrou para investir */}
        {salary > 0 && remainingBalance > 0 && (
          <Card className="p-4 border-emerald-accent/30 bg-emerald-accent/5">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-emerald-accent" />
              <h2 className="font-semibold text-foreground">💰 Sobrou para investir</h2>
            </div>
            <p className="text-2xl font-bold text-emerald-accent mb-2">
              {formatCurrency(remainingBalance)}
            </p>
            <Button size="sm" className="w-full" onClick={() => navigate("/suggestions")}>
              Ver sugestões de investimento
            </Button>
          </Card>
        )}

        {/* Sugestão de distribuição */}
        {salary > 0 && (
          <Card className="p-4 border-gold/20 bg-gold/5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-gold" />
              <h2 className="font-semibold text-foreground">💡 Sugestão</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Investir (30%)</p>
                <p className="font-medium text-foreground">{formatCurrency(salary * 0.3)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Guardar no cofrinho (20%)</p>
                <p className="font-medium text-foreground">{formatCurrency(salary * 0.2)}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <p className="text-muted-foreground font-medium">Contas (50%)</p>
                <p className="font-semibold text-gold">{formatCurrency(salary * 0.5)}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

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
