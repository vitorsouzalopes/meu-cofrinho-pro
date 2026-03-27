import { useEffect, useMemo, useState } from "react";
import { Calendar, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Account } from "@/integrations/supabase/types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatMonthYear = (monthYear: string) => {
  const [year, month] = monthYear.split("-").map(Number);
  return new Date(year, month - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};

const History = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchPaidAccounts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("paid", true)
        .order("paid_at", { ascending: false });

      if (error) {
        toast({ title: "Erro ao carregar histórico", description: error.message, variant: "destructive" });
        setAccounts([]);
      } else {
        setAccounts((data ?? []) as Account[]);
      }
      setLoading(false);
    };

    fetchPaidAccounts();
  }, [user, toast]);

  const historyByMonth = useMemo(() => {
    return accounts.reduce<Record<string, Account[]>>((acc, account) => {
      const monthYear = account.month_year;
      acc[monthYear] = acc[monthYear] || [];
      acc[monthYear].push(account);
      return acc;
    }, {});
  }, [accounts]);

  const monthlyTotals = useMemo(() => {
    return Object.entries(historyByMonth).reduce<Record<string, { total: number; count: number }>>((acc, [monthYear, monthAccounts]) => {
      acc[monthYear] = {
        total: monthAccounts.reduce((sum, acc) => sum + Number(acc.amount), 0),
        count: monthAccounts.length,
      };
      return acc;
    }, {});
  }, [historyByMonth]);

  const grandTotal = useMemo(() => {
    return accounts.reduce((sum, account) => sum + Number(account.amount), 0);
  }, [accounts]);

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
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-gold" />
          <h1 className="font-heading text-xl font-bold text-foreground">Histórico</h1>
        </div>
        <p className="text-xs text-muted-foreground">Acompanhe todas as contas que você pagou.</p>
      </div>

      {accounts.length === 0 ? (
        <Card className="p-8 text-center">
          <TrendingDown className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">Nenhuma conta paga registrada ainda.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total gasto</p>
              <p className="font-semibold text-lg text-gold">{formatCurrency(grandTotal)}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contas pagas</p>
              <p className="font-semibold text-lg text-emerald-accent">{accounts.length}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Meses</p>
              <p className="font-semibold text-lg text-blue-accent">{Object.keys(historyByMonth).length}</p>
            </Card>
          </div>

          <div className="space-y-4">
            {Object.keys(historyByMonth)
              .sort((a, b) => (a > b ? -1 : 1))
              .map((monthYear) => {
                const monthAccounts = historyByMonth[monthYear];
                const { total, count } = monthlyTotals[monthYear];
                return (
                  <div key={monthYear} className="glass-card p-4 rounded-2xl border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{formatMonthYear(monthYear)}</h3>
                        <p className="text-xs text-muted-foreground">{count} contas pagas</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gold">{formatCurrency(total)}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-border/30 pt-3">
                      {monthAccounts
                        .sort((a, b) => (a.name > b.name ? 1 : -1))
                        .map((account) => (
                          <div key={account.id} className="flex items-center justify-between text-sm">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{account.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {account.billing_type === "monthly" ? "Mensal" : "Única"}
                                {account.paid_at && ` • Pago em ${new Date(account.paid_at).toLocaleDateString("pt-BR")}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-foreground">{formatCurrency(Number(account.amount))}</p>
                              <p className="text-xs text-emerald-accent">✓ Pago</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
