import { useEffect, useMemo, useState } from "react";
import { Calendar, TrendingDown, Receipt, ShoppingBag, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Expense, Account, AccountPayment } from "@/integrations/supabase/types";

interface HistoryItem {
  id: string;
  name: string;
  amount: number;
  date: string;
  type: "expense" | "bill";
  category?: string;
  receipt_url?: string;
  month_year: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatMonthYear = (monthYear: string) => {
  const [year, month] = monthYear.split("-").map(Number);
  return new Date(year, month - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};

const History = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchAllHistory = async () => {
      setLoading(true);
      
      try {
        // Separate queries for resilience
        const [expensesRes, paymentsRes, accountsRes] = await Promise.allSettled([
          supabase.from("expenses").select("*").eq("user_id", user.id),
          supabase.from("account_payments").select("*").eq("user_id", user.id),
          supabase.from("accounts").select("*").eq("user_id", user.id).eq("paid", true).eq("is_template", false)
        ]);

        const expenses = expensesRes.status === "fulfilled" && !expensesRes.value.error 
          ? (expensesRes.value.data || []) 
          : [];
        const payments = paymentsRes.status === "fulfilled" && !paymentsRes.value.error 
          ? (paymentsRes.value.data || []) 
          : [];
        const accounts = accountsRes.status === "fulfilled" && !accountsRes.value.error 
          ? (accountsRes.value.data || []) 
          : [];

        if (expensesRes.status === "rejected" || (expensesRes.status === "fulfilled" && expensesRes.value.error) ||
            paymentsRes.status === "rejected" || (paymentsRes.status === "fulfilled" && paymentsRes.value.error) ||
            accountsRes.status === "rejected" || (accountsRes.status === "fulfilled" && accountsRes.value.error)) {
          console.warn("Algumas fontes do histórico falharam em carregar");
        }

        const refinedMerged: HistoryItem[] = [];

        // Add expenses
        (expenses || []).forEach((e) => {
          const date = new Date(e.date + "T00:00:00");
          refinedMerged.push({
            id: e.id,
            name: e.description,
            amount: Number(e.amount),
            date: e.date,
            type: "expense",
            category: e.category,
            month_year: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
          });
        });

        // Add Account Payments (with names)
        (payments || []).forEach((p) => {
          const account = (accounts || []).find(a => a.id === p.account_id);
          refinedMerged.push({
            id: p.id,
            name: account?.name || "Conta",
            amount: Number(p.amount),
            date: p.paid_at ? p.paid_at.split("T")[0] : p.month_year + "-01",
            type: "bill",
            receipt_url: p.receipt_url || undefined,
            month_year: p.month_year,
          });
        });

        // Add legacy paid accounts that DON'T have a payment record yet (to avoid duplicates)
        (accounts || []).forEach((a) => {
          const hasPaymentRecord = (payments || []).some(p => p.account_id === a.id && p.month_year === a.month_year);
          if (!hasPaymentRecord && a.paid) {
            refinedMerged.push({
              id: a.id,
              name: a.name,
              amount: Number(a.amount),
              date: a.paid_at ? a.paid_at.split("T")[0] : a.month_year + "-01",
              type: "bill",
              month_year: a.month_year,
            });
          }
        });

        setHistoryItems(refinedMerged.sort((a, b) => (a.date > b.date ? -1 : 1)));
      } catch (error: any) {
        toast({ title: "Erro ao carregar histórico", description: error.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchAllHistory();
  }, [user, toast]);

  const historyByMonth = useMemo(() => {
    return historyItems.reduce<Record<string, HistoryItem[]>>((acc, item) => {
      const monthYear = item.month_year;
      acc[monthYear] = acc[monthYear] || [];
      acc[monthYear].push(item);
      return acc;
    }, {});
  }, [historyItems]);

  const monthlyTotals = useMemo(() => {
    return Object.entries(historyByMonth).reduce<Record<string, { total: number; count: number }>>((acc, [monthYear, items]) => {
      acc[monthYear] = {
        total: items.reduce((sum, item) => sum + item.amount, 0),
        count: items.length,
      };
      return acc;
    }, {});
  }, [historyByMonth]);

  const grandTotal = useMemo(() => {
    return historyItems.reduce((sum, item) => sum + item.amount, 0);
  }, [historyItems]);

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
          <h1 className="font-heading text-xl font-bold text-foreground">Histórico Unificado</h1>
        </div>
        <p className="text-xs text-muted-foreground">Gastos diários e contas pagas em um só lugar.</p>
      </div>

      {historyItems.length === 0 ? (
        <Card className="p-8 text-center">
          <TrendingDown className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">Nenhuma atividade registrada ainda.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total acumulado</p>
              <p className="font-semibold text-lg text-gold">{formatCurrency(grandTotal)}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Lançamentos</p>
              <p className="font-semibold text-lg text-emerald-accent">{historyItems.length}</p>
            </Card>
          </div>

          <div className="space-y-4">
            {Object.keys(historyByMonth)
              .sort((a, b) => (a > b ? -1 : 1))
              .map((monthYear) => {
                const items = historyByMonth[monthYear];
                const { total, count } = monthlyTotals[monthYear];
                return (
                  <div key={monthYear} className="glass-card p-4 rounded-2xl border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{formatMonthYear(monthYear)}</h3>
                        <p className="text-xs text-muted-foreground">{count} lançamentos</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gold">{formatCurrency(total)}</p>
                        <p className="text-xs text-muted-foreground">Total do mês</p>
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-border/30 pt-4">
                      {items
                        .sort((a, b) => (a.date > b.date ? -1 : 1))
                        .map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                item.type === "bill" ? "bg-emerald-accent/10" : "bg-gold/10"
                              }`}>
                                {item.type === "bill" ? (
                                  <Receipt className={`w-4 h-4 text-emerald-accent`} />
                                ) : (
                                  <ShoppingBag className={`w-4 h-4 text-gold`} />
                                )}
                              </div>
                              <div className="truncate">
                                <p className="font-medium text-foreground truncate">{item.name}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(item.date + "T00:00:00").toLocaleDateString("pt-BR")}
                                  {item.type === "bill" ? " • Conta" : " • Gasto"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground whitespace-nowrap">
                                {formatCurrency(item.amount)}
                              </p>
                              {item.receipt_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => window.open(item.receipt_url, "_blank")}
                                  title="Ver comprovante"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                              )}
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
