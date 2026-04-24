import { useCallback, useEffect, useMemo, useState } from "react";
import { User, Camera, LogOut, TrendingUp, Wallet, PiggyBank, Settings, Bell, Smartphone, ShieldCheck, RefreshCcw } from "lucide-react";
import { ensureMonthlyInstances } from "@/lib/account-utils";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { VAPID_PUBLIC_KEY } from "@/constants/vapid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { calcularTotaisFinanceiros, sincronizarDividas, resolverContasDoMes } from "@/lib/finance-utils";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Account = Tables<"accounts">;
type Investment = Tables<"investments">;

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [registeringPush, setRegisteringPush] = useState(false);

  const [templates, setTemplates] = useState<Account[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const today = new Date();
    const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    const [profRes, instancesRes, templatesRes, invRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", false).eq("month_year", currentMonthYear),
      supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", true),
      supabase.from("investments").select("*").eq("user_id", user.id),
    ]);

    if (profRes.data) {
      setProfile(profRes.data as Profile);
      setDisplayName(profRes.data.display_name || "");
    }
    
    const rawAccounts = (instancesRes.data ?? []) as any[];
    const rawTemplates = (templatesRes.data ?? []) as any[];

    // RESOLVER (Instâncias + Templates Virtuais) - SEM DUPLICAÇÃO
    const resolved = resolverContasDoMes(rawAccounts, rawTemplates, currentMonthYear);

    // MAPEAR PARA ESTRUTURA ÚNICA
    const mappedAccounts = resolved.map(a => ({
      id: a.id,
      nome: a.name || a.nome,
      valor: Number(a.amount || a.valor || 0),
      tipo: a.billing_type || a.tipo,
      vencimento: a.due_day ? `${currentMonthYear}-${String(a.due_day).padStart(2, '0')}` : (a.vencimento || a.month_year),
      status: (a.paid || a.status === "pago") ? "pago" : "pendente",
      parcela: a.remaining_months,
      parent_id: a.parent_id,
      virtual: a.virtual
    }));

    setAccounts(mappedAccounts);
    setTemplates(rawTemplates);
    setInvestments((invRes.data ?? []) as Investment[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResetData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const today = new Date();
      const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
      
      // 1. Limpar instâncias do mês (preserva templates e dívidas originais)
      await supabase
        .from("accounts")
        .delete()
        .eq("user_id", user.id)
        .eq("is_template", false)
        .eq("month_year", currentMonthYear);
      
      // 2. Regerar instâncias a partir dos templates
      await ensureMonthlyInstances(user.id, currentMonthYear);
      
      toast({ 
        title: "Dados sincronizados!", 
        description: "As contas e dívidas do mês foram regeradas com sucesso." 
      });
      
      loadData();
    } catch (error: any) {
      toast({ 
        title: "Erro ao resetar", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const results = calcularTotaisFinanceiros({
      contas: accounts.filter(a => a.tipo !== 'divida' && a.tipo !== 'debt'),
      dividas: accounts.filter(a => a.tipo === 'divida' || a.tipo === 'debt')
    });

    const totalPaid = accounts.filter(a => a.status === "pago").reduce((s, a) => s + a.valor, 0);
    const totalPending = accounts.filter(a => a.status === "pendente").reduce((s, a) => s + a.valor, 0);
    const totalInv = investments.reduce((s, i) => s + Number(i.amount), 0);

    return {
      totalPaid,
      totalPending,
      totalInv,
      totalGeral: results.gastos
    };
  }, [accounts, investments]);

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

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeUserToWebPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications não são suportadas neste navegador.');
    }

    const registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      throw new Error('As notificações push requerem o PWA instalado ou não funcionam no modo Preview da IDE.');
    }

    // Check if subscription already exists
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    const { error } = await supabase
      .from('push_tokens' as any)
      .upsert({ 
        user_id: user?.id, 
        token: JSON.stringify(subscription),
        platform: 'web'
      }, { onConflict: 'user_id,token' });

    if (error) throw error;
    
    setPushEnabled(true);
    toast({ title: "Notificações ativadas!", description: "Você receberá lembretes neste navegador." });
  };

  const handleRegisterPush = async () => {
    if (Capacitor.getPlatform() === 'web') {
      try {
        setRegisteringPush(true);
        await subscribeUserToWebPush();
      } catch (error: any) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } finally {
        setRegisteringPush(false);
      }
      return;
    }

    setRegisteringPush(true);
    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        throw new Error('Permissão negada pelo usuário');
      }

      await PushNotifications.register();

      // Listeners should be set up once, ideally in a global context or useEffect
      // But for simplicity here, we ensure we handle the token
      PushNotifications.addListener('registration', async (token) => {
        const { error } = await supabase
          .from('push_tokens' as any)
          .upsert({ 
            user_id: user?.id, 
            token: token.value,
            platform: Capacitor.getPlatform()
          }, { onConflict: 'user_id,token' });
        
        if (error) console.error("Error saving push token:", error);
        setPushEnabled(true);
        toast({ title: "Notificações ativadas!", description: "Você receberá lembretes no seu celular." });
      });

      PushNotifications.addListener('registrationError', (err) => {
        console.error('Registration error: ', err.error);
        toast({ title: "Erro", description: "Falha ao registrar para notificações", variant: "destructive" });
      });

    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setRegisteringPush(false);
    }
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
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-6">
        <Avatar className="w-20 h-20 mb-3 border-2 border-gold/50">
          <AvatarImage src={profile?.avatar_url || ""} />
          <AvatarFallback className="bg-gold/20 text-gold text-2xl font-bold">
            {(profile?.display_name || user?.email || "U")[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {editing ? (
          <div className="flex gap-2 items-center w-full max-w-xs">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu nome"
              className="bg-muted border-border text-center"
            />
            <Button size="sm" variant="gold" onClick={handleSave} disabled={saving}>
              {saving ? "..." : "Salvar"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>✕</Button>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="font-heading text-xl font-bold text-foreground">
              {profile?.display_name || "Usuário"}
            </h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <Button variant="ghost" size="sm" className="mt-1 text-xs text-gold" onClick={() => setEditing(true)}>
              Editar nome
            </Button>
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <h2 className="font-heading font-semibold text-foreground text-sm mb-3">Resumo Financeiro</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4 border-gold/30">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-gold" />
            <p className="text-[10px] text-muted-foreground uppercase">Total mês</p>
          </div>
          <p className="font-semibold text-foreground">{formatCurrency(summary.totalGeral)}</p>
        </Card>
        <Card className="p-4 border-emerald-accent/30">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-accent" />
            <p className="text-[10px] text-muted-foreground uppercase">Investido</p>
          </div>
          <p className="font-semibold text-emerald-accent">{formatCurrency(summary.totalInv)}</p>
        </Card>
        <Card className="p-4 border-sky-accent/30">
          <div className="flex items-center gap-2 mb-1">
            <PiggyBank className="w-4 h-4 text-sky-accent" />
            <p className="text-[10px] text-muted-foreground uppercase">Pago</p>
          </div>
          <p className="font-semibold text-sky-accent">{formatCurrency(summary.totalPaid)}</p>
        </Card>
        <Card className={`p-4 ${summary.totalPending > 0 ? "border-destructive/30" : "border-emerald-accent/30"}`}>
          <div className="flex items-center gap-2 mb-1">
            <Wallet className={`w-4 h-4 ${summary.totalPending > 0 ? "text-destructive" : "text-emerald-accent"}`} />
            <p className="text-[10px] text-muted-foreground uppercase">Pendente</p>
          </div>
          <p className={`font-semibold ${summary.totalPending > 0 ? "text-destructive" : "text-emerald-accent"}`}>
            {formatCurrency(summary.totalPending)}
          </p>
        </Card>
      </div>

      {/* Quick Links */}
      <h2 className="font-heading font-semibold text-foreground text-sm mb-3">Configurações</h2>
      <div className="space-y-2 mb-6">
        <Card className="p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/telegram")}>
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gold" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Notificações Telegram</p>
              <p className="text-xs text-muted-foreground">Configurar lembretes via bot</p>
            </div>
            <span className="text-muted-foreground text-sm">→</span>
          </div>
        </Card>
        <Card className="p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleRegisterPush}>
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-gold" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Notificações Push</p>
              <p className="text-xs text-muted-foreground">Receber alertas no celular</p>
            </div>
            {pushEnabled ? (
              <ShieldCheck className="w-4 h-4 text-emerald-accent" />
            ) : (
              <span className="text-muted-foreground text-sm">{registeringPush ? "..." : "→"}</span>
            )}
          </div>
        </Card>
        <Card className="p-3 cursor-pointer hover:bg-muted/50 transition-colors border-gold/20" onClick={handleResetData}>
          <div className="flex items-center gap-3">
            <RefreshCcw className={`w-5 h-5 text-gold ${loading ? 'animate-spin' : ''}`} />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Sincronizar Mês Atual</p>
              <p className="text-xs text-muted-foreground">Limpa duplicados e regera contas</p>
            </div>
            <span className="text-muted-foreground text-sm">→</span>
          </div>
        </Card>
      </div>

      {/* Sign Out */}
      <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
        <LogOut className="w-4 h-4 mr-2" />
        Sair da conta
      </Button>
    </div>
  );
};

export default ProfilePage;
