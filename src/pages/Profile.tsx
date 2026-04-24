import { useCallback, useEffect, useMemo, useState } from "react";
import { User, LogOut, Settings, HelpCircle, RefreshCcw, Target, ChevronRight, FileDown, Plus, Trash2, MessageCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ensureMonthlyInstances } from "@/lib/account-utils";
import { calcularTotaisFinanceiros, resolverContasDoMes } from "@/lib/finance-utils";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Account = Tables<"accounts">;
type Investment = Tables<"investments">;
type Goal = any; // For flexibility

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const today = new Date();
    const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    const [profRes, instancesRes, templatesRes, invRes, goalsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", false).eq("month_year", currentMonthYear),
      supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", true),
      supabase.from("investments").select("*").eq("user_id", user.id),
      supabase.from("goals" as any).select("*").eq("user_id", user.id).limit(2)
    ]);

    if (profRes.data) {
      setProfile(profRes.data as Profile);
      setDisplayName(profRes.data.display_name || "");
    }
    
    const rawAccounts = (instancesRes.data ?? []) as any[];
    const rawTemplates = (templatesRes.data ?? []) as any[];
    const resolved = resolverContasDoMes(rawAccounts, rawTemplates, currentMonthYear);

    setAccounts(resolved);
    setInvestments((invRes.data ?? []) as Investment[]);
    setGoals(goalsRes.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totais = useMemo(() => {
    return calcularTotaisFinanceiros({
      contas: accounts.filter(a => a.billing_type !== 'divida' && a.billing_type !== 'debt'),
      dividas: accounts.filter(a => a.billing_type === 'divida' || a.billing_type === 'debt')
    });
  }, [accounts]);

  const totalInvestments = investments.reduce((s, i) => s + Number(i.amount), 0);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!" });
      setEditing(false);
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // ── Exportar dados como CSV ────────────────────────────────────────────────
  const exportData = async () => {
    if (!user) return;
    toast({ title: "Preparando exportação..." });

    const today = new Date();
    const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    const { data: accs } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("month_year", currentMonthYear);

    if (!accs || accs.length === 0) {
      toast({ title: "Sem dados para exportar", variant: "destructive" });
      return;
    }

    const header = ["Nome", "Tipo", "Valor", "Vencimento", "Status", "Mês"].join(",");
    const rows = accs.map(a =>
      [
        `"${a.name}"`,
        a.billing_type || "",
        Number(a.amount).toFixed(2),
        a.due_day || "",
        a.paid ? "Pago" : "Pendente",
        a.month_year || "",
      ].join(",")
    );

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cofrinho-${currentMonthYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "✅ CSV exportado com sucesso!" });
  };

  const limparDadosAutoGerados = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      "Isso vai deletar do banco todas as contas do mês atual que foram geradas automaticamente (e ainda não foram pagas). Contas pagas e as que você criou manualmente sem vínculo a template serão preservadas. Deseja continuar?"
    );
    if (!confirmed) return;

    const today = new Date();
    const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    const { error, count } = await supabase
      .from("accounts")
      .delete({ count: "exact" })
      .eq("user_id", user.id)
      .eq("is_template", false)
      .eq("month_year", currentMonthYear)
      .eq("paid", false)
      .not("parent_id", "is", null);

    if (error) {
      toast({ title: "Erro ao limpar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `✅ ${count ?? 0} registro(s) removido(s) com sucesso!` });
      window.dispatchEvent(new CustomEvent("finance-data-updated"));
      loadData();
    }
  };

  // Apaga TODOS os objetivos do usuário
  const limparObjetivos = async () => {
    if (!user) return;
    if (!window.confirm("⚠️ Isso vai APAGAR TODOS os seus objetivos permanentemente. Deseja continuar?")) return;

    const { error, count } = await supabase
      .from("goals" as any)
      .delete({ count: "exact" })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Erro ao limpar objetivos", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `🗑️ ${count ?? 0} objetivo(s) removido(s)!` });
      window.dispatchEvent(new CustomEvent("finance-data-updated"));
      loadData();
    }
  };

  // Apaga TODAS as dívidas (templates + instâncias)
  const limparDividasAtivas = async () => {
    if (!user) return;
    if (!window.confirm("⚠️ Isso vai APAGAR TODAS as dívidas (templates e instâncias mensais). Deseja continuar?")) return;

    // 1. Pega os IDs dos templates de dívida
    const { data: debtTemplates } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_template", true)
      .eq("billing_type", "debt");

    const templateIds = (debtTemplates ?? []).map((t: any) => t.id);

    // 2. Apaga instâncias filhas das dívidas
    if (templateIds.length > 0) {
      await supabase
        .from("accounts")
        .delete()
        .eq("user_id", user.id)
        .in("parent_id", templateIds);
    }

    // 3. Apaga os templates de dívida
    const { error, count } = await supabase
      .from("accounts")
      .delete({ count: "exact" })
      .eq("user_id", user.id)
      .eq("is_template", true)
      .eq("billing_type", "debt");

    if (error) {
      toast({ title: "Erro ao limpar dívidas", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `🗑️ ${count ?? 0} dívida(s) removida(s)!` });
      window.dispatchEvent(new CustomEvent("finance-data-updated"));
      loadData();
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
    <div className="min-h-screen pb-24 px-6 pt-10 max-w-lg mx-auto bg-background">
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-10 animate-slide-up">
        <Avatar className="w-24 h-24 mb-4 border-4 border-card shadow-xl">
          <AvatarImage src={profile?.avatar_url || ""} />
          <AvatarFallback className="bg-primary/20 text-primary text-3xl font-bold">
            {(profile?.display_name || user?.email || "U")[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-xl font-bold text-foreground">{profile?.display_name || "Seu Nome"}</h1>
      </div>

      {/* Resumo Financeiro */}
      <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">Resumo Financeiro</p>
        <Card className="p-5 bg-card border border-border/50 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1 tracking-tighter">Saldo Total Mês</p>
              <p className="text-[10px] text-muted-foreground/60 mb-2 tracking-tight">(Soma Salário+Extra)</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(totais.disponivel)}</p>
            </div>
            <div className="border-l border-border/50 pl-4">
              <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1 tracking-tighter">Investido Pendente</p>
              <p className="text-lg font-bold text-foreground mt-6">{formatCurrency(totalInvestments)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Planejamento Inteligente */}
      <div className="mb-10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">Planejamento Inteligente</p>
        <Card className="bg-card border border-border/50 divide-y divide-border/50 shadow-sm overflow-hidden">
          {/* Objetivos */}
          <div className="p-5">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-5 tracking-widest">Relatório de Objetivos</p>
            <div className="space-y-5">
              {goals.map((goal: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-[10px] font-medium mb-2">
                    <span className="text-foreground">{goal.name}</span>
                    <span className="text-muted-foreground">{Math.round((goal.current_amount / goal.target_amount) * 100)}% | {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${(goal.current_amount / goal.target_amount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dívidas */}
          <div className="p-5">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-4 tracking-widest">Relatório de Dívidas</p>
            <div className="space-y-4">
              <div className="grid grid-cols-3 text-[9px] font-bold text-muted-foreground uppercase tracking-tighter border-b border-border/30 pb-2">
                <span>Sumário</span>
                <span className="text-center">Valor</span>
                <span className="text-right">Vencimento</span>
              </div>
              {accounts.filter(a => a.billing_type === 'debt' || a.billing_type === 'divida').slice(0, 2).map((debt: any, i: number) => (
                <div key={i} className="grid grid-cols-3 text-[10px] items-center">
                  <span className="text-foreground font-medium truncate pr-2">{debt.name}</span>
                  <span className="text-center text-foreground font-semibold">{formatCurrency(debt.amount)}</span>
                  <span className="text-right text-muted-foreground">{debt.due_day}/0{new Date().getMonth() + 1}</span>
                </div>
              ))}
              {accounts.filter(a => a.billing_type === 'debt' || a.billing_type === 'divida').length === 0 && (
                <p className="text-[10px] text-muted-foreground italic text-center py-2">Sem dívidas registradas</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Settings List */}
      <div className="space-y-1 mb-10 animate-slide-up" style={{ animationDelay: "0.3s" }}>
        {[
          { icon: <Settings className="w-5 h-5" />, label: "Configurações da conta", onClick: () => setEditing(true) },
          { icon: <Target className="w-5 h-5" />, label: "Metas Financeiras", onClick: () => navigate("/goals") },
          { icon: <Plus className="w-5 h-5" />, label: "Categorias Personalizadas" },
          { icon: <FileDown className="w-5 h-5" />, label: "Exportar Dados" },
          { icon: <HelpCircle className="w-5 h-5" />, label: "Ajuda e Suporte" },
          { icon: <RefreshCcw className="w-5 h-5" />, label: "Sincronizar Mês", onClick: loadData },
          { icon: <Trash2 className="w-5 h-5" />, label: "Limpar Dados Auto-Gerados do Mês", onClick: limparDadosAutoGerados, color: "text-amber-500" },
          { icon: <Trash2 className="w-5 h-5" />, label: "Apagar Todos os Objetivos", onClick: limparObjetivos, color: "text-destructive" },
          { icon: <Trash2 className="w-5 h-5" />, label: "Apagar Todas as Dívidas Ativas", onClick: limparDividasAtivas, color: "text-destructive" },
          { icon: <LogOut className="w-5 h-5" />, label: "Logout", onClick: handleSignOut, color: "text-destructive" },
        ].map((item, i) => (
          <div 
            key={i} 
            className="flex items-center justify-between p-4 bg-card/40 hover:bg-card/80 transition-colors cursor-pointer rounded-2xl group border border-transparent hover:border-border/30"
            onClick={item.onClick}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors ${item.color || "text-muted-foreground"}`}>
                {item.icon}
              </div>
              <span className={`text-[13px] font-medium ${item.color || "text-foreground"}`}>{item.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;
