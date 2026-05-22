import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TrendingUp, Wallet, Clock, AlertCircle, Sparkles, CheckCircle2, Target, Menu, Settings, Pencil, Trash2, Calendar as CalendarIcon } from "lucide-react";
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
import { smartPriority, shouldAmortize, shouldNegotiate, debtScore } from "@/financial/debtEngine";
import { forecastMonth } from "@/financial/forecastEngine";
import { analyzeFinancialRisk } from "@/financial/notificationEngine";
import { cn } from "@/lib/utils";

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

      // Garantir instâncias do mês atual
      if (!hasGenerated.current) {
        await ensureMonthlyInstances(user.id, currentMonthYear);
        hasGenerated.current = true;
      }

      // Consultas individuais para evitar que um erro 404 trave tudo
      const [resInst, resTemp, resSal, resExtra, resGoals, resExp] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", false).eq("month_year", currentMonthYear),
        supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", true),
        supabase.from("salary" as any).select("*").eq("user_id", user.id).eq("month_year", currentMonthYear).maybeSingle(),
        supabase.from("extra_income").select("*").eq("user_id", user.id).eq("month_year", currentMonthYear),
        supabase.from("goals" as any).select("*").eq("user_id", user.id).limit(2),
        supabase.from("expenses").select("*").eq("user_id", user.id).gte("date", `${currentMonthYear}-01`).lte("date", `${currentMonthYear}-31`),
      ]);

      const rawAccounts = resInst.data || [];
      const rawTemplates = resTemp.data || [];

      const resolved = resolverContasDoMes(rawAccounts, rawTemplates, currentMonthYear);

      const mappedAccounts = resolved.map(a => ({
        id: a.id,
        nome: a.name || a.nome,
        valor: Number(a.amount || a.valor || 0),
        due_day: a.due_day,
        tipo: a.billing_type || a.tipo,
        status: (a.paid || a.status === "pago") ? "pago" : "pendente",
      }));

      setAccounts(mappedAccounts);
      setTemplates(rawTemplates);
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
    });
  }, [accounts, salary, extraIncomes, debts, expensesData]);

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
      if (!editingExtraId) {
        notifyEvent("extra_income", { description: payload.description, amount: payload.amount });
      }
      setExtraInput("");
      setExtraDesc("");
      setEditingExtraId(null);
      setExtraDialogOpen(false);
      fetchData();
      window.dispatchEvent(new CustomEvent("finance-data-updated"));
    }
  };

  const startEditExtra = (e: any) => {
    setEditingExtraId(e.id);
    setExtraInput(String(e.amount));
    setExtraDesc(e.description || "");
    setExtraListOpen(false);
    setExtraDialogOpen(true);
  };

  const deleteExtra = async (id: string) => {
    if (!window.confirm("Excluir esta renda extra?")) return;
    const { error } = await supabase.from("extra_income").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Renda extra removida" });
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
                <div className="flex gap-1">
                  {extraIncomes.length > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setExtraListOpen(true); }}
                      className="text-[9px] bg-white/20 hover:bg-white/30 text-white font-bold px-2 py-0.5 rounded-full transition-colors"
                    >
                      Gerenciar
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingExtraId(null); setExtraInput(""); setExtraDesc(""); setExtraDialogOpen(true); }}
                    className="text-[9px] bg-white/20 hover:bg-white/30 text-white font-bold px-2 py-0.5 rounded-full transition-colors"
                  >
                    + Extra
                  </button>
                </div>
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

      {/* Dynamic Alerts Section */}
      <div className="space-y-4 mb-8">
        {(() => {
          const currentDay = new Date().getDate();
          const overdue = accounts.filter(a => a.status !== "pago" && a.due_day && a.due_day < currentDay);
          const isToday = accounts.filter(a => a.status !== "pago" && a.due_day === currentDay);
          const upcoming = accounts.filter(a => a.status !== "pago" && a.due_day > currentDay && a.due_day <= currentDay + 7);

          // Risco Financeiro / Previsão do mês
          const totalExtra = extraIncomes.reduce((s, e) => s + Number(e.amount), 0);
          const forecastInput = {
            salario: salary,
            rendaExtra: totalExtra,
            contas: accounts
              .filter(c => c.tipo !== "divida" && c.billing_type !== "debt")
              .map(c => ({ valor: Number(c.valor || c.amount || 0) })),
            dividas: debts.map(d => ({ valorParcela: Number(d.valorParcela || d.parcela_mensal || 0) }))
          };
          const forecast = forecastMonth(forecastInput);
          const risk = analyzeFinancialRisk(forecast);

          return (
            <>
              {risk && (
                <Card className={cn(
                  "p-4 border-none animate-slide-up",
                  risk.type === "danger" 
                    ? "bg-destructive/10 border border-destructive/20 text-destructive animate-pulse" 
                    : "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      risk.type === "danger" ? "bg-destructive/20" : "bg-amber-500/20"
                    )}>
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest">
                        {risk.type === "danger" ? "Risco Financeiro Próximo" : "Saldo Baixo Previsto"}
                      </p>
                      <p className="text-xs opacity-90 mt-0.5">
                        {risk.message}. Margem líquida estimada: {formatCurrency(forecast)}.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
              {/* Atrasadas */}
              {overdue.length > 0 && (
                <Card className="p-4 border-none bg-destructive/10 border border-destructive/20 animate-slide-up">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-destructive tracking-widest">Contas Atrasadas</p>
                      <p className="text-xs text-destructive/80">Você tem {overdue.length} {overdue.length === 1 ? "pendência" : "pendências"} de dias anteriores</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    {overdue.map(acc => (
                      <div key={acc.id} className="flex justify-between items-center text-xs">
                        <span className="text-foreground font-medium">{acc.nome}</span>
                        <span className="text-destructive font-bold">{formatCurrency(acc.valor)}</span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full h-9 rounded-xl text-[11px] font-bold"
                    onClick={() => navigate("/accounts")}
                  >
                    Resolver agora
                  </Button>
                </Card>
              )}

              {/* Vence Hoje */}
              {isToday.length > 0 && (
                <Card className="p-4 border-none bg-amber-500/10 border border-amber-500/20 animate-slide-up">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase text-amber-500 tracking-widest">Vence Hoje</p>
                      <p className="text-xs text-amber-500/80">{isToday.length} {isToday.length === 1 ? "conta vence" : "contas vencem"} hoje</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 rounded-lg border-amber-500/30 text-amber-500 text-[10px] font-bold hover:bg-amber-500/10"
                      onClick={() => navigate("/accounts")}
                    >
                      Ver contas
                    </Button>
                  </div>
                </Card>
              )}

              {/* Próximos 7 Dias */}
              {!overdue.length && !isToday.length && upcoming.length > 0 && (
                <Card className="p-4 border-none bg-blue-500/10 border border-blue-500/20 animate-slide-up">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <CalendarIcon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase text-blue-500 tracking-widest">Próximos 7 Dias</p>
                      <p className="text-xs text-blue-500/80">{upcoming.length} {upcoming.length === 1 ? "conta vence" : "contas vencem"} em breve</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Tudo em dia */}
              {!overdue.length && !isToday.length && !upcoming.length && (
                <Card className="p-4 border-none bg-emerald-500/10 border border-emerald-500/20 animate-slide-up">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-emerald-500 tracking-widest">Tudo em dia!</p>
                      <p className="text-xs text-emerald-500/80">Nenhuma conta pendente para os próximos dias.</p>
                    </div>
                  </div>
                </Card>
              )}
            </>
          );
        })()}
      </div>

      {/* Seção Dívida Prioritária */}
      {(() => {
        if (!debts || debts.length === 0) return null;
        const sorted = smartPriority(debts);
        const priorityDebt = sorted[0];
        if (!priorityDebt) return null;

        const saldo = totais.disponivel;
        
        let prioritySuggestion;
        if (shouldNegotiate(priorityDebt, saldo)) {
          prioritySuggestion = {
            label: "Negociação Recomendada",
            description: `Seu saldo livre de ${formatCurrency(saldo)} é suficiente para negociar à vista (cobre mais de 30% do total de ${formatCurrency(priorityDebt.valorTotal)}).`,
            color: "bg-sky-500/10 border-sky-500/30 text-sky-400 border",
            icon: Wallet
          };
        } else if (shouldAmortize(priorityDebt, saldo)) {
          prioritySuggestion = {
            label: "Amortização Recomendada",
            description: `Juros altos (${priorityDebt.jurosMensal}% a.m.) e prazo longo. Abata parcelas com seu saldo de ${formatCurrency(saldo)}.`,
            color: "bg-amber-500/10 border-amber-500/30 text-amber-400 border",
            icon: Sparkles
          };
        } else if (priorityDebt.permiteQuitacao && saldo >= priorityDebt.valorTotal) {
          prioritySuggestion = {
            label: "Quitação Recomendada",
            description: `Seu saldo atual de ${formatCurrency(saldo)} cobre o valor total de ${formatCurrency(priorityDebt.valorTotal)}. Livre-se desta dívida!`,
            color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 border",
            icon: CheckCircle2
          };
        } else {
          prioritySuggestion = {
            label: "Foco no Pagamento",
            description: `Evite atrasos para não acumular juros abusivos de ${priorityDebt.jurosMensal}% a.m.`,
            color: "bg-muted/50 border-border text-muted-foreground border",
            icon: Clock
          };
        }

        return (
          <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.45s" }}>
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">💳 Dívida Prioritária</p>
              <button
                className="text-[9px] text-primary font-bold hover:underline"
                onClick={() => navigate("/goals")}
              >
                Planejamento Completo
              </button>
            </div>
            <Card className="p-5 border border-border/50 bg-gradient-to-br from-card to-card/70 relative overflow-hidden group hover:border-primary/30 transition-all rounded-3xl">
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1">Banco / Credor</p>
                    <h4 className="text-lg font-bold text-foreground">{priorityDebt.banco || priorityDebt.nome}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1">Prioridade</p>
                    <span className="text-xs font-bold text-destructive font-mono bg-destructive/10 px-2.5 py-1 rounded-lg border border-destructive/20">
                      {debtScore(priorityDebt).toFixed(0)} pts
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/30 border border-border/30 rounded-2xl p-2.5 text-center">
                    <p className="text-[8px] uppercase font-bold text-muted-foreground mb-1">Juros</p>
                    <p className="text-xs font-bold text-amber-500 font-mono">{priorityDebt.jurosMensal.toFixed(1)}% a.m.</p>
                  </div>
                  <div className="bg-muted/30 border border-border/30 rounded-2xl p-2.5 text-center">
                    <p className="text-[8px] uppercase font-bold text-muted-foreground mb-1">Valor Total</p>
                    <p className="text-xs font-bold text-foreground font-mono">{formatCurrency(priorityDebt.valorTotal)}</p>
                  </div>
                  <div className="bg-muted/30 border border-border/30 rounded-2xl p-2.5 text-center">
                    <p className="text-[8px] uppercase font-bold text-muted-foreground mb-1">Parcela</p>
                    <p className="text-xs font-bold text-foreground font-mono">{formatCurrency(priorityDebt.valorParcela)}</p>
                  </div>
                </div>

                <div className={cn("p-3 rounded-2xl flex gap-3 items-start", prioritySuggestion.color)}>
                  <prioritySuggestion.icon className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase">{prioritySuggestion.label}</p>
                    <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">{prioritySuggestion.description}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );
      })()}

      {/* Expenses Section */}
      {(() => {
        const contasDespesas = accounts.filter(a => a.tipo !== "divida" && a.tipo !== "debt");
        const contasEGastos = [
          ...contasDespesas,
          ...expensesData.map(e => ({
            id: e.id,
            nome: e.description,
            valor: Number(e.amount),
            status: "pago",
          }))
        ];
        
        const totalMes = contasEGastos.reduce((s, a) => s + Number(a.valor || 0), 0);
        const pendentes = contasEGastos.filter(a => a.status !== "pago");
        const totalPendente = pendentes.reduce((s, a) => s + Number(a.valor || 0), 0);
        const pagas = contasEGastos.length - pendentes.length;
        
        return (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Despesas — {currentMonthName}</p>
              <button
                className="text-[9px] text-primary font-bold hover:underline"
                onClick={() => navigate("/accounts")}
              >
                + Adicionar
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Total a pagar no mês */}
              <Card className="p-4 bg-card border border-border/50 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <div className="flex items-center justify-between mb-2 border-b border-border/40 pb-2">
                  <span className="text-[9px] font-bold uppercase text-muted-foreground">Total do mês</span>
                  <span className="text-[8px] text-muted-foreground">{contasEGastos.length} {contasEGastos.length === 1 ? "conta" : "contas"}</span>
                </div>
                <p className="font-heading text-xl font-bold text-foreground mb-3">{formatCurrency(totalMes)}</p>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {contasEGastos.slice(0, 4).map(acc => (
                    <div key={acc.id} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Wallet className="w-3 h-3 text-blue-500" />
                      </div>
                      <p className="text-[10px] font-medium text-foreground truncate flex-1">{acc.nome}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{formatCurrency(acc.valor)}</p>
                    </div>
                  ))}
                  {contasEGastos.length === 0 && <p className="text-[10px] text-muted-foreground italic py-2 text-center">Nenhuma conta</p>}
                  {contasEGastos.length > 4 && <p className="text-[9px] text-muted-foreground text-center pt-1">+{contasEGastos.length - 4} outras</p>}
                </div>
              </Card>

              {/* Falta pagar */}
              <Card className="p-4 bg-card border border-border/50 animate-slide-up" style={{ animationDelay: "0.3s" }}>
                <div className="flex items-center justify-between mb-2 border-b border-border/40 pb-2">
                  <span className="text-[9px] font-bold uppercase text-muted-foreground">Falta pagar</span>
                  <span className="text-[8px] text-emerald-accent font-semibold">{pagas} pagas</span>
                </div>
                <p className={`font-heading text-xl font-bold mb-3 ${totalPendente > 0 ? "text-amber-500" : "text-emerald-accent"}`}>
                  {formatCurrency(totalPendente)}
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {pendentes.slice(0, 4).map(acc => (
                    <div key={acc.id} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Wallet className="w-3 h-3 text-amber-500" />
                      </div>
                      <p className="text-[10px] font-medium text-foreground truncate flex-1">{acc.nome}</p>
                      <p className="text-[10px] text-amber-500 font-mono font-semibold">{formatCurrency(acc.valor)}</p>
                    </div>
                  ))}
                  {pendentes.length === 0 && <p className="text-[10px] text-emerald-accent italic py-2 text-center">Tudo pago! 🎉</p>}
                  {pendentes.length > 4 && <p className="text-[9px] text-muted-foreground text-center pt-1">+{pendentes.length - 4} pendentes</p>}
                </div>
              </Card>
            </div>
          </div>
        );
      })()}

      {/* Distribution Suggestion */}
      {totais.disponivel > 0 && (
        <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sugestão de Distribuição</p>
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <Card className="p-5 border-none bg-gradient-to-br from-card to-card/50 shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs text-muted-foreground mb-4">Com base no seu saldo de <span className="text-foreground font-bold">{formatCurrency(totais.disponivel)}</span>, sugerimos:</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Emergência (40%)</p>
                  <p className="text-sm font-bold text-foreground">{formatCurrency(totais.disponivel * 0.4)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Investir (30%)</p>
                  <p className="text-sm font-bold text-primary">{formatCurrency(totais.disponivel * 0.3)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Banco Digital (20%)</p>
                  <p className="text-sm font-bold text-foreground">{formatCurrency(totais.disponivel * 0.2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Cofrinho (10%)</p>
                  <p className="text-sm font-bold text-foreground">{formatCurrency(totais.disponivel * 0.1)}</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5">
              <Sparkles className="w-24 h-24 text-primary" />
            </div>
          </Card>
        </div>
      )}

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

        {/* Dívidas Ativas (vem da tabela `debts`) */}
        {(() => {
          const totalDebt = debts.reduce((s: number, d: any) => s + Number(d.valor_total || 0), 0);
          const restante = debts.reduce((s: number, d: any) => s + Number(d.valor_restante || 0), 0);
          const paid = Math.max(0, totalDebt - restante);
          const pct = totalDebt > 0 ? Math.min(100, Math.round((paid / totalDebt) * 100)) : 0;
          return debts.length > 0 ? (
            <Card
              className="p-5 bg-card border border-border/50 flex flex-col items-center animate-slide-up hover:border-primary/30 transition-colors cursor-pointer"
              style={{ animationDelay: "0.5s" }}
              onClick={() => navigate("/goals")}
            >
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
              <TrendingUp className="w-5 h-5 text-primary" /> {editingExtraId ? "Editar Renda Extra" : "Adicionar Renda Extra"}
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
              {savingExtra ? "Salvando..." : editingExtraId ? "Salvar Alterações" : "Adicionar Renda Extra"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Extra Income List / Manage */}
      <Dialog open={extraListOpen} onOpenChange={setExtraListOpen}>
        <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Rendas Extras do Mês
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-3 max-h-[60vh] overflow-y-auto">
            {extraIncomes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma renda extra cadastrada.</p>
            )}
            {extraIncomes.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{e.description || "Renda extra"}</p>
                  <p className="text-xs text-primary font-bold">{formatCurrency(Number(e.amount))}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => startEditExtra(e)} className="h-9 w-9">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteExtra(e.id)} className="h-9 w-9 text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
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
