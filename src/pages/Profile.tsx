import { useCallback, useEffect, useMemo, useState } from "react";
import { User, LogOut, Settings, HelpCircle, RefreshCcw, Target, ChevronRight, FileDown, Plus, MessageCircle, X, Bell, Clock, Sparkles, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ensureMonthlyInstances } from "@/lib/account-utils";
import { calcularTotaisFinanceiros, resolverContasDoMes } from "@/lib/finance-utils";
import type { Tables } from "@/integrations/supabase/types";
import { generateMonthlyReport } from "@/lib/monthly-report";
import { cn } from "@/lib/utils";
import { usePremium } from "@/lib/premium";
import { showInterstitialAd } from "@/lib/ads";
import { safeStorage } from "@/lib/safe-storage";
import { LocalNotifications } from '@capacitor/local-notifications';

type Profile = Tables<"profiles">;
type Account = Tables<"accounts">;
type Investment = Tables<"investments">;
type Goal = any; // For flexibility

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { isPremium, loading: premiumLoading } = usePremium();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportMonth, setExportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isAdmin, setIsAdmin] = useState(false);
  const [uiMode, setUiMode] = useState<"simple" | "advanced">(() =>
    safeStorage.get("ui_mode", "simple")
  );

  const runDiagnostic = async () => {
    toast({ title: "Iniciando diagnóstico...", description: "Verificando conexão e serviços." });
    try {
      // 1. Test local token
      const { fcm_token } = safeStorage.get("auth_data", {} as any);
      console.log("[Diagnostic] Local token exists:", !!fcm_token);

      // 2. Test Supabase connectivity
      const { data: ping, error: pingError } = await supabase.from("profiles").select("id").limit(1);
      if (pingError) throw new Error(`Banco de dados inacessível: ${pingError.message}`);
      console.log("[Diagnostic] Database reachable");

      // 3. Test Edge Function Ping
      const { data: funcData, error: funcError } = await supabase.functions.invoke("notify-event", {
        body: { event: "salary", payload: { amount: 0, month_year: "test" } },
      });

      if (funcError) {
        console.error("[Diagnostic] Edge Function error:", funcError);
        throw new Error(`Edge Function falhou: ${funcError.message}. Verifique se a função foi implantada (deployed).`);
      }

      console.log("[Diagnostic] Edge Function response:", funcData);

      toast({
        title: "Diagnóstico Concluído ✅",
        description: "Conexão e funções básicas estão operacionais. Se o push não chega, verifique os segredos (secrets) no painel Supabase."
      });
    } catch (e: any) {
      console.error("[Diagnostic] Failed:", e);
      toast({
        title: "Falha no Diagnóstico ❌",
        description: e.message,
        variant: "destructive"
      });
    }
  };

  const testNotification = async () => {
    try {
      const granted = await LocalNotifications.checkPermissions();
      if (granted.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: "🔔 Teste de Notificação",
            body: "Parabéns! O sistema de notificações do Cofrinho PRO está funcionando corretamente.",
            id: 123,
            schedule: { at: new Date(Date.now() + 2000) }, // 2 seconds from now
            sound: 'res://default',
          }
        ]
      });
      toast({ title: "Notificação agendada para 2 segundos!" });
    } catch (e) {
      console.error("Test notification fail:", e);
      toast({ title: "Erro ao testar notificação", variant: "destructive" });
    }
  };

  const toggleUiMode = () => {
    const next = uiMode === "simple" ? "advanced" : "simple";
    setUiMode(next);
    safeStorage.set("ui_mode", next);
    toast({ title: `Modo ${next === "simple" ? "Simples" : "Avançado"} ativado!` });
  };

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const today = new Date();
    const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    const [profRes, instancesRes, templatesRes, invRes, goalsRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", false).eq("month_year", currentMonthYear),
      supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", true),
      supabase.from("investments").select("*").eq("user_id", user.id),
      supabase.from("goals" as any).select("*").eq("user_id", user.id).limit(2),
      supabase.from("user_roles" as any).select("role").eq("user_id", user.id).maybeSingle()
    ]);

    if (profRes.data) {
      setProfile(profRes.data as Profile);
      setDisplayName(profRes.data.display_name || "");
      setPhone((profRes.data as any).phone || "");
    }
    
    setIsAdmin((roleRes.data as any)?.role === "admin" || user.email === "vitorsouzalopes@souunisuam.com.br");
    
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
    
    // Tenta salvar nome e telefone
    const { error: fullError } = await supabase
      .from("profiles")
      .update({ display_name: displayName, phone, updated_at: new Date().toISOString() } as any)
      .eq("id", user.id);

    if (fullError) {
      // Se o erro for "coluna inexistente" (PGRST204 ou similar), tenta salvar apenas o nome
      if (fullError.message?.includes("phone") || fullError.code === "PGRST204" || fullError.code === "42703") {
        const { error: nameOnlyError } = await supabase
          .from("profiles")
          .update({ display_name: displayName, updated_at: new Date().toISOString() })
          .eq("id", user.id);

        if (nameOnlyError) {
          toast({ title: "Erro", description: nameOnlyError.message, variant: "destructive" });
        } else {
          toast({ title: "Nome atualizado!", description: "O campo de telefone ainda não está liberado no banco de dados." });
          setEditing(false);
        }
      } else {
        toast({ title: "Erro ao salvar", description: fullError.message, variant: "destructive" });
      }
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
        <div className={cn(
          "mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
          profile?.is_premium
            ? "bg-primary/10 text-primary border-primary/30"
            : "bg-muted text-muted-foreground border-border"
        )}>
          {profile?.is_premium ? "Pro Member" : "Free Plan"}
        </div>
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
          { icon: <Clock className="w-5 h-5" />, label: "Histórico Completo", onClick: () => navigate("/history") },
          { icon: uiMode === "simple" ? <Sparkles className="w-5 h-5" /> : <Settings className="w-5 h-5" />, label: `Modo: ${uiMode === "simple" ? "Simples (Fácil)" : "Avançado (Completo)"}`, onClick: toggleUiMode, color: "text-primary" },
          { icon: <Settings className="w-5 h-5" />, label: "Configurações da conta", onClick: () => setEditing(true) },
          { icon: <Bell className="w-5 h-5" />, label: "Notificações Push", onClick: () => navigate("/telegram") },
          { icon: <Target className="w-5 h-5" />, label: "Metas Financeiras", onClick: () => navigate("/goals") },
          { icon: <FileDown className="w-5 h-5" />, label: "Exportar Relatório Mensal (PDF)", onClick: () => setExportDialogOpen(true) },
          { icon: <HelpCircle className="w-5 h-5" />, label: "Ajuda e Suporte", onClick: () => navigate("/support") },
          ...(isAdmin ? [
            { icon: <RefreshCcw className="w-5 h-5" />, label: "Sincronizar Mês", onClick: loadData },
            { icon: <ShieldAlert className="w-5 h-5" />, label: "Diagnóstico do Sistema", onClick: runDiagnostic, color: "text-blue-500" },
            { icon: <Bell className="w-5 h-5" />, label: "Testar Notificação (Local)", onClick: testNotification, color: "text-amber-500" },
            { icon: <Sparkles className="w-5 h-5" />, label: "Testar Anúncio (Intersticial)", onClick: showInterstitialAd, color: "text-amber-500" },
            { icon: <Bell className="w-5 h-5" />, label: "Testar Push (Ir para Menu)", onClick: () => navigate("/telegram"), color: "text-blue-500" },
          ] : []),
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

      {/* Account Settings Dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configurações da Conta</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                value={profile?.email || user?.email || ""}
                disabled
                className="bg-muted/50 text-muted-foreground"
              />
              <p className="text-[10px] text-muted-foreground">O email não pode ser alterado por aqui.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone / WhatsApp</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Data Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Exportar Relatório</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione o mês desejado para gerar o relatório em PDF com todas as suas informações financeiras.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mês de Referência</label>
              <Input
                type="month"
                value={exportMonth}
                onChange={(e) => setExportMonth(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>Cancelar</Button>
            <Button onClick={async () => {
              try {
                toast({ title: "Gerando relatório...", description: "Aguarde alguns segundos." });
                await generateMonthlyReport(exportMonth);
                toast({ title: "Relatório gerado!", description: "PDF baixado com sucesso." });
                setExportDialogOpen(false);
              } catch (e: any) {
                toast({ title: "Erro ao gerar", description: e.message, variant: "destructive" });
              }
            }}>
              Gerar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ProfilePage;
