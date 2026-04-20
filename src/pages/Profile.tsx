import { useEffect, useMemo, useState } from "react";
import { User, Camera, LogOut, TrendingUp, Wallet, PiggyBank, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
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

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const today = new Date();
      const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

      const [profRes, accRes, invRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("accounts").select("*").eq("user_id", user.id).eq("month_year", currentMonthYear),
        supabase.from("investments").select("*").eq("user_id", user.id),
      ]);

      if (profRes.data) {
        setProfile(profRes.data as Profile);
        setDisplayName(profRes.data.display_name || "");
      }
      setAccounts((accRes.data ?? []) as Account[]);
      setInvestments((invRes.data ?? []) as Investment[]);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const summary = useMemo(() => {
    const totalAccounts = accounts.reduce((s, a) => s + Number(a.amount), 0);
    const totalPaid = accounts.filter(a => a.paid).reduce((s, a) => s + Number(a.amount), 0);
    const totalPending = accounts.filter(a => !a.paid).reduce((s, a) => s + Number(a.amount), 0);
    const totalInvested = investments.reduce((s, i) => s + Number(i.current_amount ?? i.amount), 0);
    return { totalAccounts, totalPaid, totalPending, totalInvested };
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
          <p className="font-semibold text-foreground">{formatCurrency(summary.totalAccounts)}</p>
        </Card>
        <Card className="p-4 border-emerald-accent/30">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-accent" />
            <p className="text-[10px] text-muted-foreground uppercase">Investido</p>
          </div>
          <p className="font-semibold text-emerald-accent">{formatCurrency(summary.totalInvested)}</p>
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
        <Card className="p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/expenses")}>
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-gold" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Gerenciar Gastos</p>
              <p className="text-xs text-muted-foreground">Exportar PDF, CSV e compartilhar</p>
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
