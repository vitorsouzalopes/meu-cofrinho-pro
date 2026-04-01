import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Banknote, Check, Edit3, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Account = Tables<"accounts">;

const bankAccountTypes = ["CDB", "Poupança", "Selic", "Cofrinho", "Digital", "Outros"];
const expenseTypes = ["Internet", "Carro", "Aluguel", "Supermercado", "Outros"];
const billingTypes = [
  { value: "monthly", label: "Mensal" },
  { value: "single", label: "Apenas este mês" },
];
const accountCategories = [
  { value: "expense", label: "Conta de despesa" },
  { value: "bank", label: "Conta de banco" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatMonthYear = (monthYear: string) => {
  const [year, month] = monthYear.split("-").map(Number);
  return new Date(year, month - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};

const Accounts = () => {
  const today = new Date();
  const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const todayDay = today.getDate();

  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [name, setName] = useState("");
  const [accountCategory, setAccountCategory] = useState<"bank" | "expense">("expense");
  const [bank, setBank] = useState("Despesa");
  const [accountType, setAccountType] = useState("Internet");
  const [billingType, setBillingType] = useState<"monthly" | "single">("monthly");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("5");
  const [startDate, setStartDate] = useState(today.toISOString().split("T")[0]);

    const loadAccounts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const resetResponse = await supabase
      .from("accounts")
      .update({ paid: false, paid_at: null, month_year: currentMonthYear })
      .eq("user_id", user.id)
      .eq("billing_type", "monthly")
      .neq("month_year", currentMonthYear);

    if (resetResponse.error) {
      toast({ title: "Erro ao atualizar contas mensais", description: resetResponse.error.message, variant: "destructive" });
    }

    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Não foi possível carregar contas", description: error.message, variant: "destructive" });
      setAccounts([]);
    } else {
      setAccounts((data ?? []) as Account[]);
    }
    setLoading(false);
  }, [currentMonthYear, toast, user]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const resetForm = () => {
    setEditingAccount(null);
    setName("");
    setAccountCategory("expense");
    setBank("Despesa");
    setAccountType("Internet");
    setBillingType("monthly");
    setAmount("");
    setDueDay("5");
    setStartDate(today.toISOString().split("T")[0]);
  };

  const openNewAccountDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditAccountDialog = (account: Account) => {
    setEditingAccount(account);
    setName(account.name);
    setAccountCategory(account.account_category ?? "expense");
    setBank(account.account_category === "bank" ? account.bank : account.bank);
    setAccountType(account.account_type);
    setBillingType(account.billing_type ?? "single");
    setAmount(String(account.amount));
    setDueDay(String(account.due_day ?? 1));
    setStartDate(account.start_date);
    setDialogOpen(true);
  };

  const saveAccount = async () => {
    if (!name.trim() || !amount || !user) return;
    setSaving(true);
    const record = {
      user_id: user.id,
      name: name.trim(),
      account_category: accountCategory,
      bank: accountCategory === "bank" ? bank.trim() : "Despesa",
      account_type: accountType,
      billing_type: accountCategory === "expense" ? billingType : "single",
      amount: parseFloat(amount),
      due_day: accountCategory === "expense" ? parseInt(dueDay, 10) : 1,
      month_year: currentMonthYear,
      paid: false,
      start_date: startDate,
    };

    if (editingAccount) {
      const { data, error } = await supabase
        .from("accounts")
        .update(record)
        .eq("id", editingAccount.id)
        .select("*")
        .single();

      if (error) {
        toast({ title: "Erro ao atualizar conta", description: error.message, variant: "destructive" });
      } else {
        setAccounts((prev) => prev.map((item) => (item.id === data.id ? (data as Account) : item)));
        toast({ title: "Conta atualizada" });
      }
    } else {
      const { data, error } = await supabase.from("accounts").insert(record).select("*").single();
      if (error) {
        toast({ title: "Erro ao salvar conta", description: error.message, variant: "destructive" });
      } else {
        setAccounts((prev) => [data as Account, ...prev]);
        toast({ title: "Conta adicionada com sucesso" });
      }
    }

    setDialogOpen(false);
    resetForm();
    setSaving(false);
  };

  const deleteAccount = async (id: string) => {
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover conta", description: error.message, variant: "destructive" });
      return;
    }
    setAccounts((prev) => prev.filter((account) => account.id !== id));
  };

  const markAsPaid = async (account: Account) => {
    const { data, error } = await supabase
      .from("accounts")
      .update({ paid: true, paid_at: new Date().toISOString() })
      .eq("id", account.id)
      .select("*")
      .single();

    if (error) {
      toast({ title: "Erro ao marcar como pago", description: error.message, variant: "destructive" });
      return;
    }

    setAccounts((prev) => prev.map((item) => (item.id === data.id ? (data as Account) : item)));
    toast({ title: "Conta marcada como paga" });
  };

  const bankAccounts = accounts.filter((account) => account.account_category === "bank");
  const currentMonthExpenseAccounts = accounts.filter(
    (account) => account.month_year === currentMonthYear && account.account_category === "expense"
  );
  const monthlyAccounts = currentMonthExpenseAccounts.filter((account) => account.billing_type === "monthly" && !account.paid);
  const singleAccounts = currentMonthExpenseAccounts.filter((account) => account.billing_type === "single" && !account.paid);
  const overdueAccounts = currentMonthExpenseAccounts.filter((account) => !account.paid && account.due_day < todayDay);
  const dueTodayAccounts = currentMonthExpenseAccounts.filter((account) => !account.paid && account.due_day === todayDay);
  const weekAccounts = currentMonthExpenseAccounts.filter((account) => {
    if (account.paid) return false;
    const diff = account.due_day - todayDay;
    return diff >= 0 && diff <= 7;
  });

  const totalExpense = currentMonthExpenseAccounts.reduce((sum, account) => sum + Number(account.amount), 0);
  const totalBank = bankAccounts.reduce((sum, account) => sum + Number(account.amount), 0);

  const paidHistory = accounts.filter((account) => account.paid).sort((a, b) => (a.month_year > b.month_year ? -1 : 1));
  const historyByMonth = paidHistory.reduce<Record<string, Account[]>>((acc, account) => {
    acc[account.month_year] = acc[account.month_year] || [];
    acc[account.month_year].push(account);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Contas</h1>
          <p className="text-xs text-muted-foreground">Contas mensais, despesas do mês e histórico de pagamentos.</p>
        </div>
        <Button variant="gold" size="sm" className="rounded-full px-4" onClick={openNewAccountDialog}>
          <Plus className="w-4 h-4 mr-2" /> Nova conta
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Banknote className="w-5 h-5 text-gold" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total de despesas</p>
              <p className="font-semibold text-lg">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Banknote className="w-5 h-5 text-emerald-accent" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Investimentos</p>
              <p className="font-semibold text-lg">{formatCurrency(totalBank)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="glass-card p-4 mb-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Contas de banco</h2>
            <p className="text-xs text-muted-foreground">Investimentos e contas bancárias apenas para visualização.</p>
          </div>
          <p className="text-xs text-muted-foreground">{formatCurrency(totalBank)}</p>
        </div>
        {bankAccounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma conta de banco cadastrada.</p>
        ) : (
          <div className="space-y-3">
            {bankAccounts.map((account) => (
              <div key={account.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{account.bank} • {account.account_type}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(Number(account.amount))}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Button variant="outline" size="sm" onClick={() => openEditAccountDialog(account)}>
                    <Edit3 className="w-3.5 h-3.5" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteAccount(account.id)}>
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card p-4 mb-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Contas deste mês</h2>
            <p className="text-xs text-muted-foreground">Despesas únicas que não se repetem.</p>
          </div>
          <p className="text-xs text-muted-foreground">{formatMonthYear(currentMonthYear)}</p>
        </div>
        {singleAccounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma conta única para este mês.</p>
        ) : (
          <div className="space-y-3">
            {singleAccounts.map((account) => (
              <div key={account.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{account.name}</p>
                    <p className="text-xs text-muted-foreground">Dia {account.due_day}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(Number(account.amount))}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Button variant="outline" size="sm" onClick={() => openEditAccountDialog(account)}>
                    <Edit3 className="w-3.5 h-3.5" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteAccount(account.id)}>
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </Button>
                  <Button variant="emerald" size="sm" onClick={() => markAsPaid(account)}>
                    <Check className="w-3.5 h-3.5" /> Pago
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Vence hoje</p>
          <p className="mt-2 font-semibold text-foreground">{dueTodayAccounts.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Próximas 7 dias</p>
          <p className="mt-2 font-semibold text-foreground">{weekAccounts.length}</p>
        </Card>
      </div>

      <div className="glass-card p-4 mb-4">
        <h2 className="font-semibold text-foreground mb-3">Histórico</h2>
        {Object.keys(historyByMonth).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma conta paga ainda.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(historyByMonth).map(([monthYear, monthAccounts]) => (
              <div key={monthYear} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-foreground">{formatMonthYear(monthYear)}</p>
                  <p className="text-sm text-muted-foreground">Total pago: {formatCurrency(monthAccounts.reduce((sum, account) => sum + Number(account.amount), 0))}</p>
                </div>
                <div className="space-y-2">
                  {monthAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between gap-3 text-sm">
                      <div>
                        <p className="font-medium text-foreground">{account.name}</p>
                        <p className="text-xs text-muted-foreground">{account.billing_type === "monthly" ? "Mensal" : "Único"}</p>
                      </div>
                      <p className="text-sm text-foreground">{formatCurrency(Number(account.amount))} ✔</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Editar conta" : "Nova conta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Categoria da conta</label>
              <select
                value={accountCategory}
                onChange={(e) => {
                  const nextCategory = e.target.value as "bank" | "expense";
                  setAccountCategory(nextCategory);
                  setAccountType(nextCategory === "bank" ? bankAccountTypes[0] : expenseTypes[0]);
                  setBank(nextCategory === "bank" ? "Itaú" : "Despesa");
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
              >
                {accountCategories.map((category) => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome da conta</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={accountCategory === "bank" ? "Itaú CDB" : "Internet"} className="bg-muted border-border" />
            </div>
            {accountCategory === "bank" ? (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Banco</label>
                <Input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Itaú" className="bg-muted border-border" />
              </div>
            ) : null}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
              >
                {(accountCategory === "bank" ? bankAccountTypes : expenseTypes).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Valor</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="120" className="bg-muted border-border" step="0.01" min="0" />
              </div>
              {accountCategory === "expense" ? (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Vencimento (dia)</label>
                  <Input type="number" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="5" className="bg-muted border-border" min="1" max="31" />
                </div>
              ) : null}
            </div>
            {accountCategory === "expense" ? (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tipo de cobrança</label>
                <select value={billingType} onChange={(e) => setBillingType(e.target.value as "monthly" | "single")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold">
                  {billingTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            ) : null}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Data de início</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-muted border-border" />
            </div>
            <Button className="w-full" onClick={saveAccount} disabled={saving}>
              {saving ? "Salvando..." : editingAccount ? "Salvar alterações" : "Salvar conta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounts;
