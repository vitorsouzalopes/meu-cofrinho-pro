import { useCallback, useEffect, useRef, useState, useMemo } from "react";
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
import { calcularTotaisFinanceiros, sincronizarDividas, resolverContasDoMes } from "@/lib/finance-utils";
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
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedAccountForPayment, setSelectedAccountForPayment] = useState<any | null>(null);
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
  const [templates, setTemplates] = useState<Account[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [instancesRes, templatesRes, paymentsRes] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", false).eq("month_year", currentMonthYear),
        supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", true),
        supabase.from("account_payments").select("*").eq("user_id", user.id).order("paid_at", { ascending: false }).limit(20)
      ]);

      const rawAccounts = (instancesRes.data ?? []) as any[];
      const rawTemplates = (templatesRes.data ?? []) as any[];

      const resolved = resolverContasDoMes(rawAccounts, rawTemplates, currentMonthYear);

      const mappedAccounts = resolved.map(a => ({
        id: a.id,
        nome: a.name || a.nome,
        valor: Number(a.amount || a.valor || 0),
        tipo: a.billing_type || a.tipo,
        vencimento: a.due_day ? `${currentMonthYear}-${String(a.due_day).padStart(2, '0')}` : (a.vencimento || a.month_year),
        status: (a.paid || a.status === "pago") ? "pago" : "pendente",
        parcela: a.remaining_months,
        parent_id: a.parent_id,
        account_category: a.account_category || "expense",
        virtual: a.virtual
      }));

      setAccounts(mappedAccounts);
      setTemplates(rawTemplates);
      setPaymentsHistory((paymentsRes.data ?? []) as AccountPayment[]);
    } catch (error: any) {
      toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentMonthYear]);

  useEffect(() => {
    if (!user?.id || hasGenerated.current) return;
    hasGenerated.current = true;
    ensureMonthlyInstances(user.id, currentMonthYear).then(() => loadData());
  }, [user?.id, loadData]);

  useEffect(() => {
    loadData();
  }, [user?.id]); // Carrega ao montar ou mudar usuário

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

  const openEditAccountDialog = (account: any) => {
    setEditingAccount(account);
    setName(account.nome || account.name);
    setBank(account.bank || "");
    setAccountType(account.tipo || account.account_type);
    setBillingType((account.tipo || account.billing_type || "single") as "monthly" | "single" | "debt");
    setAmount(String(account.valor || account.amount));
    setDueDay(String(account.due_day || 5));
    setStartDate(account.start_date || today.toISOString().split("T")[0]);
    setRemainingMonths(account.remaining_months ? String(account.remaining_months) : "");
    setTotalDebtAmount(account.total_debt_amount ? String(account.total_debt_amount) : "");
    setDialogOpen(true);
  };

  const saveAccount = async () => {
    if (!name.trim() || !amount || !user) return;
    setSaving(true);
    const record: any = {
      user_id: user.id,
      name: name.trim(),
      account_category: "expense",
      bank: bank.trim() || "Despesa",
      account_type: billingType === "single" ? "Única" : (billingType === "debt" ? "Dívida" : accountType),
      billing_type: billingType,
      amount: parseFloat(amount),
      due_day: parseInt(dueDay, 10),
      month_year: currentMonthYear, // Sempre envia o mês atual para satisfazer o banco
      is_template: billingType === "monthly" || billingType === "debt",
      paid: false,
      start_date: startDate,
    };

    if (billingType === "debt") {
      record.remaining_months = remainingMonths ? parseInt(remainingMonths, 10) : null;
      record.total_debt_amount = totalDebtAmount ? parseFloat(totalDebtAmount) : null;
    }

    const { error } = editingAccount && !String(editingAccount.id).startsWith('virtual-')
      ? await supabase.from("accounts").update(record).eq("id", editingAccount.id)
      : await supabase.from("accounts").insert(record);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Conta salva com sucesso" });
      setDialogOpen(false);
      loadData();
    }
    setSaving(false);
  };

  const deleteAccount = async (id: string) => {
    if (!user) return;
    
    const isVirtual = String(id).startsWith('virtual-');
    const realId = isVirtual ? id.replace('virtual-', '').replace('debt-', '') : id;
    
    const confirmDelete = window.confirm(
      isVirtual 
        ? "Esta é uma conta recorrente. Deseja excluir o MODELO dela para todos os meses futuros?" 
        : "Deseja excluir este registro permanentemente?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase.from("accounts").delete().eq("id", realId);
    
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Removido com sucesso" });
      loadData();
    }
  };

  const markAsPaid = (account: any) => {
    setSelectedAccountForPayment(account);
    setReceiptFile(null);
    setPaymentDialogOpen(true);
  };

  const confirmPayment = async () => {
    if (!selectedAccountForPayment || !user) return;
    setIsUploading(true);
    let targetId = selectedAccountForPayment.id;

    if (String(targetId).startsWith('virtual-')) {
      const templateId = targetId.replace('virtual-', '').replace('debt-', '');
      const { data, error } = await supabase.from("accounts").insert({
        user_id: user.id,
        parent_id: templateId,
        name: selectedAccountForPayment.nome,
        amount: selectedAccountForPayment.valor,
        billing_type: selectedAccountForPayment.tipo,
        month_year: currentMonthYear,
        is_template: false,
        due_day: parseInt(dueDay, 10),
        paid: false
      }).select().single();
      if (error) {
        toast({ title: "Erro ao criar instância", variant: "destructive" });
        setIsUploading(false);
        return;
      }
      targetId = data.id;
    }

    const { error } = await supabase.from("accounts").update({ paid: true, paid_at: new Date().toISOString() }).eq("id", targetId);
    if (!error) {
      await supabase.from("account_payments").insert({
        user_id: user.id,
        account_id: targetId,
        month_year: currentMonthYear,
        amount: selectedAccountForPayment.valor,
        paid_at: new Date().toISOString()
      });
      toast({ title: "Pago com sucesso!" });
      loadData();
    }
    setIsUploading(false);
    setPaymentDialogOpen(false);
  };

  const totais = useMemo(() => calcularTotaisFinanceiros({
    contas: accounts.filter(a => a.tipo !== 'divida' && a.tipo !== 'debt'),
    dividas: accounts.filter(a => a.tipo === 'divida' || a.tipo === 'debt')
  }), [accounts]);

  const totalExpense = totais.gastos;
  const totalDebt = totais.totalDividas;

  const monthlyAccounts = accounts.filter(a => a.tipo === "monthly" && a.status === "pendente");
  const singleAccounts = accounts.filter(a => a.tipo === "single" && a.status === "pendente");
  const debtAccounts = accounts.filter(a => (a.tipo === "divida" || a.tipo === "debt") && a.status === "pendente");
  const overdueAccounts = accounts.filter(a => a.status === "pendente" && new Date(a.vencimento).getDate() < todayDay);
  const dueTodayAccounts = accounts.filter(a => a.status === "pendente" && new Date(a.vencimento).getDate() === todayDay);
  const weekAccounts = accounts.filter(a => a.status === "pendente" && new Date(a.vencimento).getDate() >= todayDay && new Date(a.vencimento).getDate() <= todayDay + 7);

  const paymentsHistoryGrouped = useMemo(() => {
    return paymentsHistory.reduce((acc: any, p) => {
      const my = p.month_year;
      if (!acc[my]) acc[my] = [];
      acc[my].push(p);
      return acc;
    }, {});
  }, [paymentsHistory]);

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

          <div className="glass-card p-4 mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-foreground">Contas Mensais</h2>
              <p className="text-xs text-muted-foreground">Despesas recorrentes do mês.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/monthly-accounts")}>
              Ver contas
            </Button>
          </div>

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
                        <p className="font-semibold text-foreground">{account.nome}</p>
                        <p className="text-xs text-muted-foreground">Vencimento: {account.vencimento}</p>
                      </div>
                      <p className="text-sm font-semibold">{formatCurrency(account.valor)}</p>
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
                        <p className="font-semibold text-foreground">{account.nome}</p>
                        <p className="text-xs text-muted-foreground">Vencimento: {account.vencimento}</p>
                      </div>
                      <p className="text-sm font-semibold text-destructive">{formatCurrency(account.valor)}</p>
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
            <h2 className="font-semibold text-foreground mb-3">Histórico de Pagamentos</h2>
            {paymentsHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pagamento registrado recentemente.</p>
            ) : (
              <div className="space-y-4">
                {Object.keys(paymentsHistoryGrouped).sort().reverse().map(my => (
                  <div key={my}>
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">{formatMonthYear(my)}</p>
                    <div className="space-y-2">
                      {paymentsHistoryGrouped[my].map((p: any) => (
                        <div key={p.id} className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                          <div>
                            <p className="text-foreground font-medium">Pagamento Realizado</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(p.paid_at).toLocaleDateString()}</p>
                          </div>
                          <p className="font-semibold text-emerald-accent">{formatCurrency(p.amount)}</p>
                        </div>
                      ))}
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

      {/* Dialogs */}
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
                onChange={(e) => setBillingType(e.target.value as any)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
              >
                {accountCategories.map((category) => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome da conta</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Internet, Nubank..." className="bg-muted border-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Valor</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="120" className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Dia Vencimento</label>
                <Input type="number" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="5" className="bg-muted border-border" />
              </div>
            </div>

            <Button className="w-full" onClick={saveAccount} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Conta"}
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
            <div className="p-4 rounded-xl bg-muted border border-border text-center">
              <p className="text-sm text-muted-foreground mb-1">{selectedAccountForPayment?.nome}</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(selectedAccountForPayment?.valor || 0)}</p>
            </div>
            <Button className="w-full" onClick={confirmPayment} disabled={isUploading}>
              {isUploading ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounts;
