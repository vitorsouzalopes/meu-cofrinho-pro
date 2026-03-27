import { useEffect, useMemo, useState } from "react";
import { Bell, PiggyBank, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Account, Investment } from "@/integrations/supabase/types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const Today = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedToday, setSavedToday] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [accountsResponse, investmentsResponse] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id),
        supabase.from("investments").select("*").eq("user_id", user.id),
      ]);

      if (accountsResponse.error) {
        toast({ title: "Não foi possível carregar contas", description: accountsResponse.error.message, variant: "destructive" });
        setAccounts([]);
      } else {
        setAccounts((accountsResponse.data ?? []) as Account[]);
      }

      if (investmentsResponse.error) {
        toast({ title: "Não foi possível carregar investimentos", description: investmentsResponse.error.message, variant: "destructive" });
        setInvestments([]);
      } else {
        setInvestments((investmentsResponse.data ?? []) as Investment[]);
      }

      setLoading(false);
    };

    fetchData();
  }, [user, toast]);

  const totalSaved = useMemo(() => {
    const accountTotal = accounts.reduce((sum, account) => sum + Number(account.amount), 0);
    const investmentTotal = investments.reduce((sum, investment) => sum + Number(investment.current_amount ?? investment.amount), 0);
    return accountTotal + investmentTotal;
  }, [accounts, investments]);

  const cofrinho = useMemo(
    () => accounts.filter((account) => account.account_type === "Cofrinho").reduce((sum, account) => sum + Number(account.amount), 0),
    [accounts],
  );

  const hasCdb = investments.some((investment) => investment.investment_type.toLowerCase().includes("cdb"));
  const suggestion = hasCdb ? "Continue investindo em CDB" : "Investir no CDB";
  const amountToday = 10;
  const weeklyGoal = 100;

  const handleSavedToday = () => {
    setSavedToday((current) => current + amountToday);
    toast({ title: "Bom trabalho!", description: `Você guardou ${formatCurrency(amountToday)} hoje.`, variant: "default" });
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-xl font-bold text-foreground">Hoje</h1>
        <p className="text-xs text-muted-foreground">Acompanhe lembretes, sugestões e seu progresso financeiro.</p>
      </div>

      <div className="space-y-4">
        <Card className="p-4 border-gold/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Lembrete</p>
              <h2 className="text-lg font-semibold text-foreground">Guardar {formatCurrency(amountToday)} hoje</h2>
              <p className="mt-1 text-sm text-muted-foreground">Organize sua reserva e mantenha o hábito.</p>
            </div>
            <Button onClick={handleSavedToday} size="sm">
              Já guardei
            </Button>
          </div>
        </Card>

        <Card className="p-4 border-emerald-accent/20">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-emerald-accent" />
            <h2 className="font-semibold text-foreground">Sugestão</h2>
          </div>
          <p className="text-sm text-foreground font-medium">{suggestion}</p>
          <p className="mt-2 text-sm text-muted-foreground">Com base nos seus investimentos, esta é a sugestão mais equilibrada para hoje.</p>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Guardado hoje</p>
            <p className="text-xl font-semibold text-foreground">{formatCurrency(savedToday)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Meta semanal</p>
            <p className="text-xl font-semibold text-foreground">{formatCurrency(Math.max(0, weeklyGoal - savedToday))} falta</p>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total guardado</p>
              <p className="text-2xl font-semibold text-foreground">{formatCurrency(totalSaved)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Cofrinho</p>
              <p className="text-lg font-semibold text-foreground">{formatCurrency(cofrinho)}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border p-4 bg-muted">
            <p className="text-sm text-muted-foreground">Investimentos</p>
            <p className="mt-1 text-base font-semibold text-foreground">{formatCurrency(investments.reduce((sum, item) => sum + Number(item.current_amount ?? item.amount), 0))}</p>
          </div>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gold" />
            <div>
              <p className="font-semibold text-foreground">Sistema de lembretes</p>
              <p className="text-sm text-muted-foreground">"Você não guardou ontem" e "Meta semanal: falta R$20" aparecerão conforme você usar mais o app.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Today;
