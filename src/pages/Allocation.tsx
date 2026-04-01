import { useEffect, useMemo, useState } from "react";
import { Target, PieChart, Sparkles, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Account = Tables<"accounts">;
type Investment = Tables<"investments">;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const Allocation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
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

  const currentTotal = useMemo(() => {
    const accountTotal = accounts.reduce((sum, account) => sum + Number(account.amount), 0);
    const investmentTotal = investments.reduce((sum, investment) => sum + Number(investment.current_amount ?? investment.amount), 0);
    return accountTotal + investmentTotal;
  }, [accounts, investments]);

  const recommendedAmount = currentTotal > 0 ? currentTotal : 100;
  const distribution = [
    { name: "Emergência", percent: 40 },
    { name: "Investimento", percent: 30 },
    { name: "Banco digital", percent: 20 },
    { name: "Cofrinho", percent: 10 },
  ];

  const earliestDate = useMemo(() => {
    const dates = [...accounts.map((item) => item.start_date), ...investments.map((item) => item.start_date)].filter(Boolean);
    return dates.length ? dates.reduce((min, value) => (value < min ? value : min), dates[0]) : null;
  }, [accounts, investments]);

  const formatPeriod = (value: string | null) => (value ? new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR") : "-");

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-xl font-bold text-foreground">Distribuição Inteligente</h1>
        <p className="text-xs text-muted-foreground">Veja como distribuir cada depósito em emergência, investimentos, banco digital e cofrinho.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <PieChart className="w-5 h-5 text-gold" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total guardado</p>
              <p className="font-semibold text-lg">{formatCurrency(currentTotal)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-emerald-accent" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Sugestão</p>
              <p className="font-semibold text-lg">{formatCurrency(recommendedAmount)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="glass-card p-4 mb-4">
        <h2 className="font-semibold text-foreground mb-2">Distribuição sugerida</h2>
        <div className="space-y-3">
          {distribution.map((option) => (
            <div key={option.name} className="rounded-2xl border border-border p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">{option.name}</p>
                <p className="text-xs text-muted-foreground">{option.percent}% do total</p>
              </div>
              <p className="font-semibold">{formatCurrency(Math.round((recommendedAmount * option.percent) / 100))}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-4 mb-4">
        <h2 className="font-semibold text-foreground mb-2">Resumo</h2>
        <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
          <div className="rounded-2xl border border-border p-4">
            <p className="font-medium text-foreground">Total guardado</p>
            <p>{formatCurrency(currentTotal)}</p>
          </div>
          <div className="rounded-2xl border border-border p-4">
            <p className="font-medium text-foreground">Investido</p>
            <p>{formatCurrency(investments.reduce((sum, item) => sum + Number(item.current_amount ?? item.amount), 0))}</p>
          </div>
          <div className="rounded-2xl border border-border p-4">
            <p className="font-medium text-foreground">Cofrinho</p>
            <p>{formatCurrency(accounts.filter((item) => item.account_type === "Cofrinho").reduce((sum, item) => sum + Number(item.amount), 0))}</p>
          </div>
          <div className="rounded-2xl border border-border p-4">
            <p className="font-medium text-foreground">Período</p>
            <p>{earliestDate ? `${formatPeriod(earliestDate)} até hoje` : "Sem dados"}</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-gold mt-1" />
          <div>
            <h2 className="font-semibold text-foreground">Sugestão automática</h2>
            <p className="text-sm text-muted-foreground mt-1">Se você guardar R$100 hoje, o app sugere: 40% emergência, 30% investimento, 20% banco digital e 10% cofrinho.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Allocation;
