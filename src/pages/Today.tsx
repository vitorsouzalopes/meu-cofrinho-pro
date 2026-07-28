import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TrendingUp, Wallet, Clock, AlertCircle, Sparkles, CheckCircle2, Target, Menu, Settings, Pencil, Trash2, Calendar as CalendarIcon, CreditCard } from "lucide-react";
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
import { notifyEvent } from "@/lib/notify";
import { useDebts } from "@/hooks/use-finance-data";
import { forecastMonth } from "@/financial/forecastEngine";
import { analyzeFinancialRisk } from "@/financial/notificationEngine";
import { cn } from "@/lib/utils";
import { initializeAds, showBannerAd, hideBannerAd } from "@/lib/ads";
import { usePremium } from "@/lib/premium";

type Account = Tables<"accounts">;
type Profile = Tables<"profiles">;

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
  const { isPremium, loading: premiumLoading } = usePremium();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<Account[]>([]);
  const { data: debts = [] } = useDebts();
  const [goals, setGoals] = useState<any[]>([]);
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [salary, setSalary] = useState(0);
  const [salaryId, setSalaryId] = useState<string | null>(null);
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [salaryInput, setSalaryInput] = useState("");
  const [extraIncomes, setExtraIncomes] = useState<any[]>([]);
  const [extraDialogOpen, setExtraDialogOpen] = useState(false);
  const [extraInput, setExtraInput] = useState("");
  const [extraDesc, setExtraDesc] = useState("");
  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);
  const [extraListOpen, setExtraListOpen] = useState(false);
  const [savingExtra, setSavingExtra] = useState(false);

  const uiMode = localStorage.getItem("cofrinho:ui_mode") || "simple";

  const hasGenerated = useRef(false);
  const currentMonthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(today).toUpperCase();

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);

      if (!hasGenerated.current) {
        await ensureMonthlyInstances(user.id, currentMonthYear);
        hasGenerated.current = true;
      }

      const [resProf, resInst, resTemp, resSal, resExtra, resGoals, resExp] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", false).eq("month_year", currentMonthYear),
        supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", true),
        supabase.from("salary" as any).select("*").eq("user_id", user.id).eq("month_year", currentMonthYear).maybeSingle(),
        supabase.from("extra_income").select("*").eq("user_id", user.id).eq("month_year", currentMonthYear),
        supabase.from("goals" as any).select("*").eq("user_id", user.id),
        supabase.from("expenses").select("*").eq("user_id", user.id).gte("date", `${currentMonthYear}-01`).lte("date", `${currentMonthYear}-31`),
      ]);

      if (resProf.data) setProfile(resProf.data as Profile);

      const resolved = resolverContasDoMes(resInst.data || [], resTemp.data || [], currentMonthYear);

      const mappedAccounts = resolved.map(a => ({
        id: a.id,
        nome: a.name || a.nome,
        valor: Number(a.amount || a.valor || 0),
        due_day: a.due_day,
        tipo: a.billing_type || a.tipo,
        status: (a.paid || a.status === "pago") ? "pago" : "pendente",
      }));

      setAccounts(mappedAccounts);
      setTemplates(resTemp.data || []);
      setExtraIncomes(resExtra.data || []);
      setGoals(resGoals.data || []);
      setExpensesData(resExp.data || []);
      
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

  // Ads initialization - Non-blocking
  useEffect(() => {
    let active = true;
    const handleAds = async () => {
      try {
        await initializeAds();
        if (!active) return;
        if (!premiumLoading && !isPremium) {
          showBannerAd();
        } else {
          hideBannerAd();
        }
      } catch (err) {
        console.error("Ads fail:", err);
      }
    };
    handleAds();
    return () => {
      active = false;
      hideBannerAd().catch(() => {});
    };
  }, [isPremium, premiumLoading]);

  const totais = useMemo(() => {
    const totalExtra = extraIncomes.reduce((s, e) => s + Number(e.amount), 0);
    const dividasParaSoma = debts.map((d: any) => ({ amount: d.parcela_mensal }));
    
    const allContas = [
      ...accounts,
      ...expensesData.map(e => ({ amount: e.amount, tipo: "expense", billing_type: "expense" }))
    ];

    return calcularTotaisFinanceiros({
      salario: salary,
      extra: totalExtra,
      contas: allContas,
      dividas: dividasParaSoma,
      metas: goals
    });
  }, [accounts, salary, extraIncomes, debts, expensesData, goals]);

  const stats = useMemo(() => {
    const pendentes = accounts.filter(a => a.status !== "pago");
    const nextAccount = [...pendentes].sort((a, b) => (a.due_day || 99) - (b.due_day || 99))[0];
    const economy = goals.reduce((s, g) => s + Number(g.current_amount || 0), 0);

    return {
      remainingAccounts: pendentes.length,
      nextAccount,
      economy
    };
  }, [accounts, goals]);

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
    notifyEvent("salary", { amount, month_year: currentMonthYear, received: !!salaryId });
  };

  const saveExtra = async () => {
    if (!user || !extraInput) return;
    setSavingExtra(true);
    const payload = {
      description: extraDesc.trim() || "Renda extra",
      amount: parseFloat(extraInput),
    };
    const { error } = editingExtraId
      ? await supabase.from("extra_income").update(payload).eq("id", editingExtraId)
      : await supabase.from("extra_income").insert({
          ...payload,
          user_id: user.id,
          month_year: currentMonthYear,
          date: new Date().toISOString().split("T")[0],
        });
    setSavingExtra(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingExtraId ? "Renda extra atualizada!" : "Renda extra adicionada!" });
      setExtraInput("");
      setExtraDesc("");
      setEditingExtraId(null);
      setExtraDialogOpen(false);
      fetchData();
    }
  };

  const deleteExtra = async (id: string) => {
    if (!window.confirm("Excluir esta renda extra?")) return;
    await supabase.from("extra_income").delete().eq("id", id);
    fetchData();
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
      <div className="flex justify-between items-center mb-8">
        <Menu className="w-6 h-6 text-foreground" />
        <p className="font-heading font-bold text-lg text-foreground">
          Cofrinho <span className="text-gold">PRO</span>
        </p>
        <div className="bg-card p-2 rounded-xl border border-border/50 cursor-pointer" onClick={() => navigate("/profile")}>
          <Settings className="w-5 h-5 text-foreground" />
        </div>
      </div>

      {/* Header Section */}
      <div className="animate-slide-up mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Bom dia, {profile?.display_name?.split(' ')[0] || "usuário"}
        </h1>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
          {uiMode === "simple" ? "Seu resumo de" : "Seu planejamento de"} <span className="text-foreground font-semibold">{currentMonthName}</span>
        </p>
      </div>

      {/* Main Money Card */}
      <div className="mb-8">
        <Card className="p-8 border-none bg-primary shadow-2xl shadow-primary/30 animate-scale-in relative overflow-hidden group">
          <div className="relative z-10 text-center">
            <p className="text-white/70 text-xs uppercase font-bold mb-2 tracking-widest">Você ainda pode gastar</p>
            <h2 className="text-4xl font-bold text-white mb-2">{formatCurrency(totais.disponivel)}</h2>
            <div className="bg-white/20 rounded-full px-4 py-1 inline-block">
              <p className="text-[10px] text-white font-medium italic">Dinheiro Livre</p>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet className="w-24 h-24 text-white" />
          </div>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5 border border-border/50 bg-card shadow-sm flex flex-col justify-between">
            <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1 tracking-tighter">Saldo Disponível Hoje</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(totais.renda - accounts.filter(a => a.status === "pago").reduce((s, a) => s + a.valor, 0))}</p>
          </Card>
          <Card className="p-5 border border-border/50 bg-card shadow-sm flex flex-col justify-between cursor-pointer" onClick={() => navigate("/accounts")}>
            <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1 tracking-tighter">Contas Restantes</p>
            <p className="text-lg font-bold text-foreground">{stats.remainingAccounts}</p>
          </Card>
        </div>

        <Card className="p-5 border border-border/50 bg-card shadow-sm flex items-center justify-between cursor-pointer" onClick={() => navigate("/accounts")}>
          <div>
            <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1 tracking-tighter">Próxima Conta</p>
            {stats.nextAccount ? (
              <p className="text-sm font-bold text-foreground">{stats.nextAccount.nome}</p>
            ) : (
              <p className="text-sm font-bold text-emerald-accent">Tudo pago! 🎉</p>
            )}
          </div>
          {stats.nextAccount && (
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground uppercase font-bold">Vence dia</p>
              <p className="text-sm font-bold text-primary">{stats.nextAccount.due_day}/0{today.getMonth() + 1}</p>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5 border border-border/50 bg-card shadow-sm flex flex-col justify-between cursor-pointer" onClick={() => navigate("/goals")}>
            <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1 tracking-tighter">Objetivos Ativos</p>
            <p className="text-lg font-bold text-foreground">{goals.length}</p>
          </Card>
          <Card className="p-5 border border-border/50 bg-card shadow-sm flex flex-col justify-between">
            <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1 tracking-tighter">Você economizou</p>
            <p className="text-lg font-bold text-emerald-accent">{formatCurrency(stats.economy)}</p>
          </Card>
        </div>
      </div>

      {/* IA Consultant Quick Access */}
      <div className="mb-8">
        <Card
          className="p-5 border border-primary/20 bg-primary/5 shadow-lg relative overflow-hidden group cursor-pointer"
          onClick={() => navigate("/ai-consultant")}
        >
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Consultor IA</p>
              <p className="text-[10px] text-muted-foreground font-medium italic">"Posso comprar um tênis de R$ 600?"</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Settings */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 rounded-2xl text-[11px] font-bold" onClick={() => { setSalaryInput(String(salary || "")); setSalaryDialogOpen(true); }}>
          Configurar Renda
        </Button>
        <Button variant="outline" className="flex-1 rounded-2xl text-[11px] font-bold" onClick={() => { setEditingExtraId(null); setExtraInput(""); setExtraDesc(""); setExtraDialogOpen(true); }}>
          + Renda Extra
        </Button>
      </div>

      {/* Advanced Mode extra details */}
      {uiMode === "advanced" && (
        <div className="mt-10 animate-slide-up">
           <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Detalhamento Avançado</p>
           {/* Aqui entrariam os gráficos e tabelas detalhadas que estavam antes */}
           <Card className="p-5 bg-card border border-border/50">
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Contas Mensais</span>
                    <span className="font-bold">{formatCurrency(totais.totalContas)}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Dívidas ativas</span>
                    <span className="font-bold">{formatCurrency(totais.totalDividas)}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Reserva para Metas</span>
                    <span className="font-bold">{formatCurrency(totais.totalMetas)}</span>
                 </div>
              </div>
           </Card>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)]">
          <DialogHeader><DialogTitle>Configurar Renda</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-3">
            <Input type="number" value={salaryInput} onChange={(e) => setSalaryInput(e.target.value)} placeholder="0.00" className="h-12" />
            <Button className="w-full h-12" onClick={saveSalary}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={extraDialogOpen} onOpenChange={setExtraDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)]">
          <DialogHeader><DialogTitle>Renda Extra</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-3">
            <Input value={extraDesc} onChange={(e) => setExtraDesc(e.target.value)} placeholder="Descrição" className="h-12" />
            <Input type="number" value={extraInput} onChange={(e) => setExtraInput(e.target.value)} placeholder="Valor" className="h-12" />
            <Button className="w-full h-12" onClick={saveExtra} disabled={savingExtra}>Adicionar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Today;
