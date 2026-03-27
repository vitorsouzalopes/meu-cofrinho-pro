import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, TrendingUp, Wallet, Clock, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { Account, Investment } from "@/integrations/supabase/types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const Today = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const today = new Date();
      const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

      const [accountsResponse, investmentsResponse] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id),
        supabase.from("investments").select("*").eq("user_id", user.id),
      ]);

      if (accountsResponse.error) {
        toast({ title: "Erro ao carregar contas", description: accountsResponse.error.message, variant: "destructive" });
        setAccounts([]);
      } else {
        setAccounts((accountsResponse.data ?? []) as Account[]);
      }

      if (investmentsResponse.error) {
        toast({ title: "Erro ao carregar investimentos", description: investmentsResponse.error.message, variant: "destructive" });
        setInvestments([]);
      } else {
        setInvestments((investmentsResponse.data ?? []) as Investment[]);
      }

      setLoading(false);
    };

    fetchData();
  }, [user, toast]);

  const today = new Date();
  const todayDay = today.getDate();
  const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  // Contas do mês atual
  const currentMonthAccounts = useMemo(
    () => accounts.filter((account) => account.month_year === currentMonthYear),
    [accounts, currentMonthYear],
  );

  // Contas pendentes
  const pendingAccounts = useMemo(
    () => currentMonthAccounts.filter((account) => !account.paid),
    [currentMonthAccounts],
  );

  // Contas a pagar HOJE
  const dueToday = useMemo(
    () => pendingAccounts.filter((account) => account.due_day === todayDay),
    [pendingAccounts, todayDay],
  );

  // Contas ATRASADAS
  const overdueAccounts = useMemo(
    () => pendingAccounts.filter((account) => account.due_day < todayDay),
    [pendingAccounts, todayDay],
  );

  // Próximas 7 dias
  const upcomingThisWeek = useMemo(() => {
    return pendingAccounts.filter((account) => {
      const diff = account.due_day - todayDay;
      return diff > 0 && diff <= 7;
    });
  }, [pendingAccounts, todayDay]);

  // Totais
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

  const investmentTotal = useMemo(
    () => investments.reduce((sum, inv) => sum + Number(inv.current_amount ?? inv.amount), 0),
    [investments],
  );

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

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4 border-gold/30">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-gold" />
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
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

        {/* Resumo Se tudo está ok */}
        {pendingAccounts.length === 0 && (
          <Card className="p-6 text-center border-emerald-accent/30 bg-emerald-accent/5">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-emerald-accent" />
            <p className="text-lg font-semibold text-foreground">Tudo em dia! ✓</p>
            <p className="text-xs text-muted-foreground mt-2">Todas as contas do mês foram pagas.</p>
          </Card>
        )}

        {/* Sugestão de distribuição */}
        <Card className="p-4 border-gold/20 bg-gold/5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-gold" />
            <h2 className="font-semibold text-foreground">💡 Sugestão</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Investir</p>
              <p className="font-medium text-foreground">{formatCurrency(pendingAccounts.length === 0 ? totalCurrentMonth * 0.3 : Math.max(0, totalCurrentMonth * 0.3 - totalPending))}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Guardar no cofrinho</p>
              <p className="font-medium text-foreground">{formatCurrency(pendingAccounts.length === 0 ? totalCurrentMonth * 0.2 : Math.max(0, totalCurrentMonth * 0.2 - totalPending))}</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <p className="text-muted-foreground font-medium">Pagar contas</p>
              <p className="font-semibold text-gold">{formatCurrency(totalPending)}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Today;
