import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TrendingUp, Wallet, Clock, AlertCircle, Sparkles, CheckCircle2, Target, Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ensureMonthlyInstances } from "@/lib/account-utils";
import { calcularTotaisFinanceiros, resolverContasDoMes } from "@/lib/finance-utils";
import type { Tables } from "@/integrations/supabase/types";

type Account = Tables<"accounts">;
type Investment = Tables<"investments">;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const today = new Date();
const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

const DonutChart = ({ percentage, label, color = "var(--primary)" }: { percentage: number, label: string, color?: string }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-muted/20"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className="absolute text-sm font-bold text-foreground">{percentage}%</span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-3 font-medium text-center leading-tight">{label}</p>
    </div>
  );
};

const Today = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<Account[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [salary, setSalary] = useState(0);
  const [salaryId, setSalaryId] = useState<string | null>(null);
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [salaryInput, setSalaryInput] = useState("");
  const [extraIncomes, setExtraIncomes] = useState<any[]>([]);
  const [extraDialogOpen, setExtraDialogOpen] = useState(false);
  const [extraInput, setExtraInput] = useState("");
  const [extraDesc, setExtraDesc] = useState("");
  const [savingExtra, setSavingExtra] = useState(false);
  
  const hasGenerated = useRef(false);
  const currentMonthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(today).toUpperCase();
  const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(nextMonthDate).toUpperCase();

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);

      // Consultas individuais para evitar que um erro 404 trave tudo
      const [resInst, resTemp, resSal, resExtra, resGoals] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", false).eq("month_year", currentMonthYear),
        supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", true),
        supabase.from("salary" as any).select("*").eq("user_id", user.id).eq("month_year", currentMonthYear).maybeSingle(),
        supabase.from("extra_income").select("*").eq("user_id", user.id).eq("month_year", currentMonthYear),
        supabase.from("goals" as any).select("*").eq("user_id", user.id).limit(2)
      ]);

      const rawAccounts = resInst.data || [];
      const rawTemplates = resTemp.data || [];

      const resolved = resolverContasDoMes(rawAccounts, rawTemplates, currentMonthYear);

      const mappedAccounts = resolved.map(a => ({
        id: a.id,
        nome: a.name || a.nome,
        valor: Number(a.amount || a.valor || 0),
        tipo: a.billing_type || a.tipo,
        status: (a.paid || a.status === "pago") ? "pago" : "pendente",
      }));

      setAccounts(mappedAccounts);
      setTemplates(rawTemplates);
      setExtraIncomes(resExtra.data || []);
      setGoals(resGoals.data || []);
      
      if (resSal.data) {
        const s = resSal.data as any;
        setSalary(Number(s.amount));
        setSalaryId(s.id);
      } else {
        setSalary(0);
        setSalaryId(null);
      }
    } catch (error: any) {
      toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    fetchData();
    const handleSync = () => fetchData();
    window.addEventListener("finance-data-updated", handleSync);
    return () => window.removeEventListener("finance-data-updated", handleSync);
  }, [user?.id, fetchData]);

  const totais = useMemo(() => {
    const totalExtra = extraIncomes.reduce((s, e) => s + Number(e.amount), 0);
    return calcularTotaisFinanceiros({
      salario: salary,
      extra: totalExtra,
      contas: accounts.filter(a => a.tipo !== 'divida' && a.tipo !== 'debt'),
      dividas: accounts.filter(a => a.tipo === 'divida' || a.tipo === 'debt')
    });
  }, [accounts, salary, extraIncomes]);

  const saveSalary = async () => {
    if (!user) return;
    const amount = parseFloat(salaryInput);
    if (isNaN(amount)) return;
    if (salaryId) {
      await supabase.from("salary" as any).update({ amount }).eq("id", salaryId);
    } else {
      await supabase.from("salary" as any).insert({ user_id: user.id, amount, month_year: currentMonthYear });
    }
    setSalaryDialogOpen(false);
    fetchData();
    toast({ title: "Salário atualizado!" });
  };

  const saveExtra = async () => {
    if (!user || !extraInput) return;
    setSavingExtra(true);
    const { error } = await supabase.from("extra_income").insert({
      user_id: user.id,
      description: extraDesc.trim() || "Renda extra",
      amount: parseFloat(extraInput),
      month_year: currentMonthYear,
      date: new Date().toISOString().split("T")[0],
    });
    setSavingExtra(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Renda extra adicionada!" });
      setExtraInput("");
      setExtraDesc("");
      setExtraDialogOpen(false);
      fetchData();
      window.dispatchEvent(new CustomEvent("finance-data-updated"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-6 pt-6 max-w-lg mx-auto bg-background overflow-x-hidden">
      {/* Top Navigation */}
      <div className="flex justify-between items-center mb-8">
        <Menu className="w-6 h-6 text-foreground" />
        <p className="font-heading font-bold text-lg text-foreground">
          Cofrinho <span className="text-primary">Pro</span>
        </p>
        <div className="bg-card p-2 rounded-xl border border-border/50" onClick={() => navigate("/profile")}>
          <Settings className="w-5 h-5 text-foreground" />
        </div>
      </div>

      {/* Header Section */}
      <div className="animate-slide-up mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Página Inicial</h1>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          Data atual de <span className="text-foreground font-semibold">{currentMonthName}</span>
        </p>
      </div>

      {/* Financial Summary Cards */}
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 px-1">Resumo Financeiro</p>
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="p-5 border-none bg-primary shadow-xl shadow-primary/20 animate-scale-in cursor-pointer relative overflow-hidden group"
            onClick={() => { setSalaryInput(String(salary || "")); setSalaryDialogOpen(true); }}
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-1">
                <p className="text-white/70 text-[10px] uppercase font-bold">Renda do Mês</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setExtraInput(""); setExtraDesc(""); setExtraDialogOpen(true); }}
                  className="text-[9px] bg-white/20 hover:bg-white/30 text-white font-bold px-2 py-0.5 rounded-full transition-colors"
                >
                  + Extra
                </button>
              </div>
              <p className="text-[9px] text-white/50 mb-2 tracking-tight">Salário + Extra:</p>
              <p className="text-xl font-bold text-white leading-none">{formatCurrency(totais.renda)}</p>
              {extraIncomes.length > 0 && (
                <div className="mt-3 space-y-1">
                  {extraIncomes.slice(0, 2).map((e: any) => (
                    <p key={e.id} className="text-[9px] text-white/60 truncate">
                      + {formatCurrency(Number(e.amount))} {e.description && `(${e.description})`}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform">
              <Wallet className="w-16 h-16 text-white" />
            </div>
          </Card>
          
          <Card className="p-5 border-none bg-card shadow-lg animate-scale-in" style={{ animationDelay: "0.1s" }}>
            <p className="text-muted-foreground text-[10px] uppercase font-bold mb-1">Saldo Restante</p>
            <p className="text-xl font-bold text-foreground leading-none mt-7">{formatCurrency(totais.disponivel)}</p>
          </Card>
        </div>
      </div>

      {/* Expenses Comparison Section */}
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 px-1">Despesas</p>
        <div className="grid grid-cols-2 gap-4">
          {/* Current Month Column */}
          <Card className="p-4 bg-card border border-border/50 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <p className="text-[9px] font-bold uppercase text-muted-foreground mb-4 border-b border-border/40 pb-2 flex justify-between items-center">
              <span>Contas ({currentMonthName})</span>
              <span className="text-[8px] opacity-60">ATIVO</span>
            </p>
            <div className="space-y-4">
              {accounts.slice(0, 3).map(acc => (
                <div key={acc.id} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Wallet className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-foreground truncate">{acc.nome}</p>
                    <p className="text-[9px] text-muted-foreground font-mono">({formatCurrency(acc.valor)})</p>
                  </div>
                </div>
              ))}
              {accounts.length === 0 && <p className="text-[10px] text-muted-foreground italic py-4 text-center">Tudo pago!</p>}
            </div>
          </Card>

          {/* Next Month Column */}
          <Card className="p-4 bg-card border border-border/50 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <p className="text-[9px] font-bold uppercase text-muted-foreground mb-4 border-b border-border/40 pb-2">Próximos ({nextMonthName})</p>
            <div className="space-y-4">
              {templates.slice(0, 3).map(tmp => (
                <div key={tmp.id} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Wallet className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-foreground truncate">{tmp.name}</p>
                    <p className="text-[9px] text-muted-foreground font-mono">({formatCurrency(Number(tmp.amount))})</p>
                  </div>
                </div>
              ))}
              <div 
                className="pt-2 text-[9px] text-primary font-bold cursor-pointer hover:underline flex items-center justify-center gap-1 border-t border-border/30 mt-2"
                onClick={() => navigate("/accounts")}
              >
                + ADICIONAR CONTA
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Progress Widgets Section - dados reais */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        {/* Objetivos */}
        {goals.length > 0 ? goals.slice(0, 2).map((goal: any) => {
          const pct = goal.target_amount > 0
            ? Math.min(100, Math.round(((goal.current_amount || 0) / goal.target_amount) * 100))
            : 0;
          return (
            <Card key={goal.id} className="p-5 bg-card border border-border/50 flex flex-col items-center animate-slide-up hover:border-primary/30 transition-colors" style={{ animationDelay: "0.4s" }}>
              <p className="text-[10px] font-bold uppercase text-muted-foreground self-start mb-6 truncate w-full">{goal.name}</p>
              <DonutChart
                percentage={pct}
                label={`R$ ${(goal.current_amount || 0).toLocaleString('pt-BR')} / R$ ${goal.target_amount.toLocaleString('pt-BR')}`}
              />
            </Card>
          );
        }) : (
          <Card
            className="p-5 bg-card border border-dashed border-border/50 flex flex-col items-center justify-center animate-slide-up cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => navigate("/goals")}
          >
            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Objetivos</p>
            <p className="text-[10px] text-muted-foreground/60 text-center">Nenhuma meta cadastrada</p>
            <p className="text-[9px] text-primary font-bold mt-3">+ Adicionar</p>
          </Card>
        )}

        {/* Dívidas Ativas */}
        {(() => {
          const debts = accounts.filter(a => a.tipo === 'debt' || a.tipo === 'divida');
          const totalDebt = debts.reduce((s: number, d: any) => s + d.valor, 0);
          const paid = debts.filter((d: any) => d.status === 'pago').reduce((s: number, d: any) => s + d.valor, 0);
          const pct = totalDebt > 0 ? Math.min(100, Math.round((paid / totalDebt) * 100)) : 0;
          return debts.length > 0 ? (
            <Card className="p-5 bg-card border border-border/50 flex flex-col items-center animate-slide-up hover:border-primary/30 transition-colors" style={{ animationDelay: "0.5s" }}>
              <p className="text-[10px] font-bold uppercase text-muted-foreground self-start mb-6">Dívidas Ativas</p>
              <DonutChart
                percentage={pct}
                label={`R$ ${paid.toLocaleString('pt-BR')} / R$ ${totalDebt.toLocaleString('pt-BR')}`}
                color="hsl(var(--destructive))"
              />
            </Card>
          ) : (
            <Card
              className="p-5 bg-card border border-dashed border-border/50 flex flex-col items-center justify-center animate-slide-up cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => navigate("/accounts")}
            >
              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Dívidas Ativas</p>
              <p className="text-[10px] text-primary font-bold">Nenhuma dívida 🎉</p>
            </Card>
          );
        })()}
      </div>

      {/* Extra Income Dialog */}
      <Dialog open={extraDialogOpen} onOpenChange={setExtraDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Adicionar Renda Extra
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block tracking-widest">Descrição</label>
              <Input
                value={extraDesc}
                onChange={(e) => setExtraDesc(e.target.value)}
                placeholder="Ex: Freelance, Venda, Presente..."
                className="bg-muted border-border h-12 rounded-xl"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block tracking-widest">Valor (R$)</label>
              <Input
                type="number"
                value={extraInput}
                onChange={(e) => setExtraInput(e.target.value)}
                placeholder="0,00"
                className="bg-muted border-border h-12 rounded-xl"
                step="0.01"
              />
            </div>
            <Button className="w-full h-14 rounded-2xl text-base font-bold" onClick={saveExtra} disabled={savingExtra}>
              {savingExtra ? "Salvando..." : "Adicionar Renda Extra"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Salary Dialog */}
      <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Salário do mês
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-3">
            <div className="p-4 bg-muted rounded-2xl">
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-2 block tracking-widest">Valor do salário</label>
              <Input
                type="number"
                value={salaryInput}
                onChange={(e) => setSalaryInput(e.target.value)}
                placeholder="0.00"
                className="bg-transparent border-none text-2xl font-bold p-0 focus-visible:ring-0 h-auto"
                step="0.01"
              />
            </div>
            <Button className="w-full py-6 text-base font-bold shadow-lg shadow-primary/20" onClick={saveSalary}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Today;
