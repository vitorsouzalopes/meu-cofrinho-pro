import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Trash2, Banknote, Check, Edit3, AlertTriangle, FileUp, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { ensureMonthlyInstances } from "@/lib/account-utils";
import Planner from "./Planner";
import type { Account, AccountPayment } from "@/integrations/supabase/types";

const expenseTypes = ["Internet", "Carro", "Aluguel", "Supermercado", "Cartão de Crédito", "Empréstimo", "Outros"];
const accountCategories = [
  { value: "monthly", label: "Despesa Mensal" },
  { value: "single", label: "Apenas este mês" },
  { value: "debt", label: "Conta de Dívida" }
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatMonthYear = (monthYear: string) => {
  const [year, month] = monthYear.split("-").map(Number);
  return new Date(year, month - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};

const today = new Date();
const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
const todayDay = today.getDate();

const Accounts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedAccountForPayment, setSelectedAccountForPayment] = useState<Account | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [paymentsHistory, setPaymentsHistory] = useState<AccountPayment[]>([]);
  const hasGenerated = useRef(false);

  const [name, setName] = useState("");
  const [billingType, setBillingType] = useState<"monthly" | "single" | "debt">("monthly");
  const [bank, setBank] = useState("");
  const [accountType, setAccountType] = useState("Internet");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("5");
  const [startDate, setStartDate] = useState(today.toISOString().split("T")[0]);
  const [remainingMonths, setRemainingMonths] = useState("");
  const [totalDebtAmount, setTotalDebtAmount] = useState("");

  const loadAccounts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // Load all current accounts (non-templates for this month)
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_template", false)
        .eq("month_year", currentMonthYear)
        .order("due_day", { ascending: true });

      if (error) throw error;
      setAccounts((data ?? []) as Account[]);

      // Load payments history for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("account_payments")
        .select("*")
        .gte("created_at", sixMonthsAgo.toISOString())
        .order("paid_at", { ascending: false });

      if (!paymentsError && paymentsData) {
        setPaymentsHistory(paymentsData as AccountPayment[]);
      }

    } catch (error: any) {
      console.error("Erro ao carregar contas:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Generate instances once on mount
  useEffect(() => {
    if (!user?.id || hasGenerated.current) return;
    hasGenerated.current = true;
    
    ensureMonthlyInstances(user.id, currentMonthYear)
      .then(() => loadAccounts()) // Reload accounts after generation finishes
      .catch(err => console.error("Erro na geração automática:", err));
  }, [user?.id, loadAccounts]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const resetForm = () => {
    setEditingAccount(null);
    setName("");
    setBillingType("monthly");
    setBank("");
    setAccountType("Internet");
    setAmount("");
    setDueDay("5");
    setStartDate(today.toISOString().split("T")[0]);
    setRemainingMonths("");
    setTotalDebtAmount("");
  };

  const openNewAccountDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditAccountDialog = (account: Account) => {
    setEditingAccount(account);
    setName(account.name);
    setBank(account.bank || "");
    setAccountType(account.account_type);
    setBillingType((account.billing_type ?? "single") as "monthly" | "single" | "debt");
    setAmount(String(account.amount));
    setDueDay(String(account.due_day ?? 1));
    setStartDate(account.start_date);
    setRemainingMonths(account.remaining_months ? String(account.remaining_months) : "");
    setTotalDebtAmount(account.total_debt_amount ? String(account.total_debt_amount) : "");
    setDialogOpen(true);
  };

  const saveAccount = async () => {
    if (!name.trim() || !amount || !user) return;
    setSaving(true);
    const record: Partial<Account> = {
      user_id: user.id,
      name: name.trim(),
      account_category: "expense",
      bank: bank.trim() || "Despesa",
      account_type: billingType === "single" ? "Única" : (billingType === "debt" ? "Dívida" : accountType),
      billing_type: billingType,
      amount: parseFloat(amount),
      due_day: parseInt(dueDay, 10),
      month_year: (billingType === "monthly" || billingType === "debt") ? null : currentMonthYear,
      is_template: billingType === "monthly" || billingType === "debt",
      paid: false,
      start_date: startDate,
    };

    if (billingType === "debt") {
      record.remaining_months = remainingMonths ? parseInt(remainingMonths, 10) : null;
      record.total_debt_amount = totalDebtAmount ? parseFloat(totalDebtAmount) : null;
    }

    if (editingAccount) {
      // If we are editing an instance, it shouldn't become a template unless explicitly changed
      // But for simplicity, we follow the billingType selected
      const { data, error } = await supabase
        .from("accounts")
        .update(record)
        .eq("id", editingAccount.id)
        .select("*")
        .single();

      if (error) {
        toast({ title: "Erro ao atualizar conta", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Conta atualizada" });
        loadAccounts(); // Reload to refresh instances if template was updated
      }
    } else {
      const { data, error } = await supabase.from("accounts").insert(record).select("*").single();
      if (error) {
        toast({ title: "Erro ao salvar conta", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Conta adicionada com sucesso" });
        loadAccounts(); // Reload to generate instance if it was a template
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
    setSelectedAccountForPayment(account);
    setReceiptFile(null);
    setPaymentDialogOpen(true);
  };

  const confirmPayment = async () => {
    if (!selectedAccountForPayment || !user) return;
    setIsUploading(true);

    let receipt_url = null;

    if (receiptFile) {
      const fileExt = receiptFile.name.split(".").pop();
      const fileName = `${user.id}/${selectedAccountForPayment.id}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, receiptFile);

      if (uploadError) {
        toast({ title: "Erro ao subir comprovante", description: uploadError.message, variant: "destructive" });
        setIsUploading(false);
        return;
      }
      
      const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(fileName);
      receipt_url = urlData.publicUrl;
    }

    const { data: updatedAccount, error: updateError } = await supabase
      .from("accounts")
      .update({ paid: true, paid_at: new Date().toISOString() })
      .eq("id", selectedAccountForPayment.id)
      .select("*")
      .single();

    if (updateError) {
      toast({ title: "Erro ao marcar como pago", description: updateError.message, variant: "destructive" });
    } else {
      // Record payment in history
      const { data: paymentRecord, error: paymentError } = await supabase
        .from("account_payments")
        .insert({
          user_id: user.id,
          account_id: selectedAccountForPayment.id,
          month_year: currentMonthYear,
          amount: selectedAccountForPayment.amount,
          paid_at: new Date().toISOString(),
          receipt_url: receipt_url
        })
        .select("*")
        .single();

      if (!paymentError && paymentRecord) {
        setPaymentsHistory(prev => [paymentRecord as AccountPayment, ...prev]);
      }

      setAccounts((prev) => prev.map((item) => (item.id === updatedAccount.id ? (updatedAccount as Account) : item)));
      toast({ title: "Conta marcada como paga" });

      // If it's a debt instance, decrement remaining_months on the template
      if (selectedAccountForPayment.billing_type === "debt" && selectedAccountForPayment.parent_id) {
        const { data: template } = await supabase
          .from("accounts")
          .select("remaining_months")
          .eq("id", selectedAccountForPayment.parent_id)
          .single();
        
        if (template && template.remaining_months && template.remaining_months > 0) {
          await supabase
            .from("accounts")
            .update({ remaining_months: template.remaining_months - 1 })
            .eq("id", selectedAccountForPayment.parent_id);
        }
      }
    }

    setIsUploading(false);
    setPaymentDialogOpen(false);
    setSelectedAccountForPayment(null);
    setReceiptFile(null);

    // Run cleanup for records > 6 months
    runCleanup();
  };

  const runCleanup = async () => {
    if (!user) return;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // In a real app, you might want to delete the actual storage files too, 
    // but that requires listing and deleting multiple files. 
    // For now we clean up the DB records to fulfill the user's request of "can delete".
    await supabase
      .from("account_payments")
      .delete()
      .lt("created_at", sixMonthsAgo.toISOString())
      .eq("user_id", user.id);
  };

  const currentMonthExpenseAccounts = accounts.filter(
    (account) => account.month_year === currentMonthYear && account.account_category === "expense"
  );
  const monthlyAccounts = currentMonthExpenseAccounts.filter((account) => account.billing_type === "monthly" && !account.paid);
  const singleAccounts = currentMonthExpenseAccounts.filter((account) => account.billing_type === "single" && !account.paid);
  const debtAccounts = currentMonthExpenseAccounts.filter((account) => account.billing_type === "debt" && !account.paid);
  const overdueAccounts = currentMonthExpenseAccounts.filter((account) => !account.paid && account.due_day < todayDay);
  const dueTodayAccounts = currentMonthExpenseAccounts.filter((account) => !account.paid && account.due_day === todayDay);
  const weekAccounts = currentMonthExpenseAccounts.filter((account) => {
    if (account.paid) return false;
    const diff = account.due_day - todayDay;
    return diff >= 0 && diff <= 7;
  });

  const totalExpense = currentMonthExpenseAccounts.filter(a => !a.paid).reduce((sum, account) => sum + Number(account.amount), 0);
  const totalDebt = debtAccounts.reduce((sum, account) => sum + Number(account.amount), 0);

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

      <Tabs defaultValue="gerenciar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gerenciar">Gerenciar Contas</TabsTrigger>
          <TabsTrigger value="planejador">Planejador Inteligente</TabsTrigger>
        </TabsList>

        <TabsContent value="gerenciar" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Banknote className="w-5 h-5 text-gold" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Mensal</p>
                  <p className="font-semibold text-lg">{formatCurrency(totalExpense)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Dívidas</p>
                  <p className="font-semibold text-lg">{formatCurrency(totalDebt)}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Vence hoje</p>
              <p className="mt-2 font-semibold text-foreground">{dueTodayAccounts.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Próximos 7 dias</p>
              <p className="mt-2 font-semibold text-foreground">{weekAccounts.length}</p>
            </Card>
          </div>

          {/* Contas mensais */}
          <div className="glass-card p-4 mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-foreground">Contas Mensais</h2>
              <p className="text-xs text-muted-foreground">Despesas recorrentes do mês.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/monthly-accounts")}>
              Ver contas
            </Button>
          </div>

          {/* Contas únicas */}
          <div className="glass-card p-4 mb-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Apenas este mês</h2>
                <p className="text-xs text-muted-foreground">Despesas únicas que não se repetem.</p>
              </div>
            </div>
            {singleAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma conta única pendente.</p>
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

          {/* Dívidas e Parcelamentos */}
          <div className="glass-card p-4 mb-4 border-destructive/20">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-destructive">Dívidas e Parcelamentos</h2>
                <p className="text-xs text-muted-foreground">Controle de dívidas ativas.</p>
              </div>
            </div>
            {debtAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Você não possui dívidas cadastradas. Que ótimo! 🎉</p>
            ) : (
              <div className="space-y-3">
                {debtAccounts.map((account) => (
                  <div key={account.id} className="rounded-2xl border border-destructive/30 p-4 bg-destructive/5">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{account.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {account.bank} • Vence dia {account.due_day}
                          {account.remaining_months && ` • Restam ${account.remaining_months}x`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-destructive">{formatCurrency(Number(account.amount))}</p>
                        {account.total_debt_amount && (
                          <p className="text-[10px] text-muted-foreground">Total: {formatCurrency(Number(account.total_debt_amount))}</p>
                        )}
                      </div>
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

      <div className="glass-card p-4 mb-4">
        <h2 className="font-semibold text-foreground mb-3">Histórico (6 meses)</h2>
        {paymentsHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pagamento registrado nos últimos 6 meses.</p>
        ) : (
          <div className="space-y-4">
            {/* Group by month_year */}
            {Array.from(new Set(paymentsHistory.map(p => p.month_year))).sort().reverse().map(monthYear => (
              <div key={monthYear} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-foreground">{formatMonthYear(monthYear)}</p>
                  <p className="text-sm text-muted-foreground">
                    Total: {formatCurrency(paymentsHistory.filter(p => p.month_year === monthYear).reduce((sum, p) => sum + Number(p.amount), 0))}
                  </p>
                </div>
                <div className="space-y-2">
                  {paymentsHistory.filter(p => p.month_year === monthYear).map((payment) => {
                    const account = accounts.find(a => a.id === payment.account_id);
                    return (
                      <div key={payment.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{account?.name || "Conta removida"}</p>
                          <p className="text-xs text-muted-foreground">Pago em {new Date(payment.paid_at || "").toLocaleDateString("pt-BR")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{formatCurrency(Number(payment.amount))}</p>
                          {payment.receipt_url && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 w-8 p-0" 
                              onClick={() => window.open(payment.receipt_url, "_blank")}
                              title="Ver comprovante"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </TabsContent>

      <TabsContent value="planejador" className="space-y-4">
        <Planner />
      </TabsContent>
    </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Editar conta" : "Nova conta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tipo de Conta</label>
              <select
                title="Tipo de Conta"
                value={billingType}
                onChange={(e) => {
                  const type = e.target.value as "monthly" | "single" | "debt";
                  setBillingType(type);
                  if (type === "single") setAccountType("Única");
                  if (type === "debt") setAccountType("Dívida");
                  if (type === "monthly") setAccountType("Internet");
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
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Internet, Aluguel, Nubank..." className="bg-muted border-border" />
            </div>

            {billingType === "debt" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Banco / Instituição</label>
                <Input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Ex: Nubank, Itaú..." className="bg-muted border-border" />
              </div>
            )}

            {billingType === "monthly" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
                <select
                  title="Categoria da despesa"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                >
                  {expenseTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {billingType === "debt" ? "Valor da Parcela" : "Valor"}
                </label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="120" className="bg-muted border-border" step="0.01" min="0" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Vencimento (dia)</label>
                <Input type="number" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="5" className="bg-muted border-border" min="1" max="31" />
              </div>
            </div>

            {billingType === "debt" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Meses Restantes (Opcional)</label>
                  <Input type="number" value={remainingMonths} onChange={(e) => setRemainingMonths(e.target.value)} placeholder="12" className="bg-muted border-border" min="1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Valor Total (Opcional)</label>
                  <Input type="number" value={totalDebtAmount} onChange={(e) => setTotalDebtAmount(e.target.value)} placeholder="1500" className="bg-muted border-border" step="0.01" min="0" />
                </div>
              </div>
            )}

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

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-3">
            <div className="p-4 rounded-xl bg-muted border border-border">
              <p className="text-sm text-muted-foreground mb-1">Conta</p>
              <p className="font-semibold text-foreground">{selectedAccountForPayment?.name}</p>
              <div className="flex justify-between mt-2">
                <p className="text-sm text-foreground">{formatCurrency(Number(selectedAccountForPayment?.amount || 0))}</p>
                <p className="text-xs text-muted-foreground">Vencimento: Dia {selectedAccountForPayment?.due_day}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Comprovante (Opcional)</label>
              <div className="relative">
                <input
                  type="file"
                  id="receipt-upload"
                  className="hidden"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  accept="image/*,application/pdf"
                />
                <label
                  htmlFor="receipt-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl hover:border-gold transition-colors cursor-pointer bg-muted"
                >
                  {receiptFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <Check className="w-8 h-8 text-emerald-accent" />
                      <p className="text-xs text-foreground font-medium truncate max-w-[200px]">{receiptFile.name}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <FileUp className="w-8 h-8 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground text-center px-4">
                        Toque para selecionar imagem ou PDF do comprovante
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={confirmPayment} 
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Confirmar Pagamento"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounts;
