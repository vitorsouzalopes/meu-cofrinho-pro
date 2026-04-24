import { useEffect, useMemo, useState } from "react";
import { Calendar, TrendingDown, Receipt, ShoppingBag, Eye, Search, Filter, ArrowLeft, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) return;
    
    const fetchAllHistory = async () => {
      setLoading(true);
      try {
        const [expensesRes, paymentsRes, accountsRes] = await Promise.allSettled([
          supabase.from("expenses").select("*").eq("user_id", user.id),
          supabase.from("account_payments").select("*").eq("user_id", user.id),
          supabase.from("accounts").select("*").eq("user_id", user.id).eq("paid", true)
        ]);

        const expenses = expensesRes.status === "fulfilled" && !expensesRes.value.error ? (expensesRes.value.data || []) : [];
        const payments = paymentsRes.status === "fulfilled" && !paymentsRes.value.error ? (paymentsRes.value.data || []) : [];
        const accounts = accountsRes.status === "fulfilled" && !accountsRes.value.error ? (accountsRes.value.data || []) : [];

        const refinedMerged: HistoryItem[] = [];

        expenses.forEach((e) => {
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

        payments.forEach((p) => {
          const account = (accounts || []).find(a => a.id === p.account_id);
          refinedMerged.push({
            id: p.id,
            name: account?.name || "Conta Paga",
            amount: Number(p.amount),
            date: p.paid_at ? p.paid_at.split("T")[0] : p.month_year + "-01",
            type: "bill",
            receipt_url: p.receipt_url || undefined,
            month_year: p.month_year,
          });
        });

        setHistoryItems(refinedMerged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (error: any) {
        toast({ title: "Erro ao carregar histórico", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchAllHistory();
  }, [user, toast]);

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, HistoryItem[]> = {};
    const filtered = historyItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    filtered.forEach((item) => {
      if (!groups[item.month_year]) groups[item.month_year] = [];
      groups[item.month_year].push(item);
    });
    return groups;
  }, [historyItems, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-6 pt-10 max-w-lg mx-auto bg-background">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl bg-card border border-border/50">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Histórico Financeiro</h1>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8 animate-slide-up">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Pesquisar por nome ou categoria..." 
          className="pl-11 h-12 bg-card border-border/50 rounded-2xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-10">
        {Object.keys(groupedByMonth).length === 0 ? (
          <div className="text-center py-20 bg-card/30 rounded-3xl border border-dashed border-border p-8 animate-slide-up">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Nenhuma transação encontrada.</p>
          </div>
        ) : (
          Object.keys(groupedByMonth).sort().reverse().map((monthYear, monthIdx) => {
            const items = groupedByMonth[monthYear];
            const total = items.reduce((s, i) => s + i.amount, 0);
            
            return (
              <div key={monthYear} className="animate-slide-up" style={{ animationDelay: `${monthIdx * 0.1}s` }}>
                <div className="flex justify-between items-end mb-4 px-1">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">Mês de Referência</p>
                    <h2 className="text-lg font-bold text-foreground capitalize">{formatMonthYear(monthYear)}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Gastos</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(total)}</p>
                  </div>
                </div>

                <div className="space-y-3 relative">
                  {/* Timeline Line */}
                  <div className="absolute left-[23px] top-0 bottom-0 w-px bg-border/40 z-0" />
                  
                  {items.map((item, idx) => (
                    <Card key={item.id} className="p-4 bg-card border-border/40 shadow-sm relative z-10 group hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                          item.type === "bill" ? "bg-blue-500/10 text-blue-500" : "bg-primary/10 text-primary"
                        }`}>
                          {item.type === "bill" ? <Receipt className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="text-[13px] font-bold text-foreground truncate">{item.name}</h3>
                            <p className="text-[13px] font-bold text-foreground whitespace-nowrap">{formatCurrency(item.amount)}</p>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {new Date(item.date).toLocaleDateString('pt-BR')}
                            </p>
                            {item.receipt_url && (
                              <Button variant="ghost" size="sm" className="h-6 text-[9px] px-2 rounded-lg bg-muted text-muted-foreground hover:text-primary" onClick={() => window.open(item.receipt_url, '_blank')}>
                                <Eye className="w-3 h-3 mr-1" /> Ver Recibo
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Footer */}
      {!searchTerm && historyItems.length > 0 && (
        <Card className="mt-12 p-6 bg-gradient-to-br from-primary to-primary/80 border-none shadow-xl shadow-primary/20 animate-scale-in">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/70 text-[10px] uppercase font-bold mb-1 tracking-widest">Resumo Geral</p>
              <h3 className="text-white text-xl font-bold">Consolidado</h3>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-[10px] uppercase font-bold mb-1 tracking-widest">Total Acumulado</p>
              <p className="text-2xl font-bold text-white leading-none">
                {formatCurrency(historyItems.reduce((s, i) => s + i.amount, 0))}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default History;
