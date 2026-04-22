import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Edit3, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type Account = Tables<"accounts">;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatMonthYear = (monthYear: string) => {
  const [year, month] = monthYear.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).replace(/^\w/, (c) => c.toUpperCase());
};

const expenseTypes = ["Casa", "Alimentação", "Transporte", "Saúde", "Educação", "Lazer", "Internet", "Telefone", "Outros"];

const MonthlyAccounts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState("Internet");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("5");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  // Payment Dialog State
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedAccountForPayment, setSelectedAccountForPayment] = useState<Account | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const loadAccounts = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("billing_type", "monthly")
        .eq("month_year", currentMonthYear)
        .order("due_day", { ascending: true });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      toast({ title: "Erro ao carregar contas", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast, currentMonthYear]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const openEditDialog = (account: Account) => {
    setEditingAccount(account);
    setName(account.name);
    setAccountType(account.account_type);
    setAmount(String(account.amount));
    setDueDay(String(account.due_day ?? 1));
    setStartDate(account.start_date);
    setDialogOpen(true);
  };

  const saveAccount = async () => {
    if (!name.trim() || !amount || !user || !editingAccount) return;
    setSaving(true);
    const record: Partial<Account> = {
      name: name.trim(),
      account_type: accountType,
      amount: parseFloat(amount),
      due_day: parseInt(dueDay, 10),
      start_date: startDate,
    };

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

    setDialogOpen(false);
    setSaving(false);
  };

  const deleteAccount = async (id: string) => {
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover conta", description: error.message, variant: "destructive" });
      return;
    }
    setAccounts((prev) => prev.filter((account) => account.id !== id));
    toast({ title: "Conta removida com sucesso" });
  };

  const markAsPaid = async (account: Account) => {
    setSelectedAccountForPayment(account);
    setReceiptFile(null);
    setPaymentDialogOpen(true);
  };

  const confirmPayment = async () => {
    if (!selectedAccountForPayment || !user) return;
    setUploadingReceipt(true);

    try {
      let receipt_url = null;
      if (receiptFile) {
        const fileExt = receiptFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from("receipts").upload(filePath, receiptFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("receipts").getPublicUrl(filePath);
        receipt_url = publicUrl;
      }

      // Record payment
      const { error: paymentError } = await supabase.from("account_payments").insert({
        user_id: user.id,
        account_id: selectedAccountForPayment.id,
        month_year: currentMonthYear,
        amount: selectedAccountForPayment.amount,
        paid_at: new Date().toISOString(),
        receipt_url,
      });
      if (paymentError) throw paymentError;

      // Update account status
      const { error: accountError } = await supabase
        .from("accounts")
        .update({ paid: true, paid_at: new Date().toISOString() })
        .eq("id", selectedAccountForPayment.id);
      if (accountError) throw accountError;

      toast({ title: "Conta marcada como paga!" });
      setAccounts((prev) => prev.filter((a) => a.id !== selectedAccountForPayment.id));
      setPaymentDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Erro ao confirmar pagamento", description: error.message, variant: "destructive" });
    } finally {
      setUploadingReceipt(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const unpaidAccounts = accounts.filter(a => !a.paid);

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/accounts")} className="h-8 w-8">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Button>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Contas Mensais</h1>
          <p className="text-xs text-muted-foreground">Gerencie suas assinaturas e despesas recorrentes.</p>
        </div>
      </div>

      <div className="glass-card p-4 mb-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Pendentes este mês</h2>
            <p className="text-xs text-muted-foreground">{formatMonthYear(currentMonthYear)}</p>
          </div>
        </div>

        {unpaidAccounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma conta mensal pendente.</p>
        ) : (
          <div className="space-y-3">
            {unpaidAccounts.map((account) => (
              <div key={account.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{account.name}</p>
                    <p className="text-xs text-muted-foreground">Dia {account.due_day} • {account.account_type}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(Number(account.amount))}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(account)}>
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteAccount(account.id)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                  </Button>
                  <Button variant="emerald" size="sm" onClick={() => markAsPaid(account)}>
                    <Check className="w-3.5 h-3.5 mr-1" /> Pago
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Editar conta mensal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome da conta</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Internet, Aluguel..." className="bg-muted border-border" />
            </div>

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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Valor</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-muted border-border" step="0.01" min="0" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Vencimento (dia)</label>
                <Input type="number" value={dueDay} onChange={(e) => setDueDay(e.target.value)} className="bg-muted border-border" min="1" max="31" />
              </div>
            </div>

            <Button onClick={saveAccount} disabled={saving} className="w-full bg-gold hover:bg-gold/90 text-background font-bold">
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Confirmar pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-3">
            <p className="text-sm text-muted-foreground">
              Você está prestes a marcar <strong className="text-foreground">{selectedAccountForPayment?.name}</strong> como pago no valor de <strong className="text-foreground">{formatCurrency(Number(selectedAccountForPayment?.amount))}</strong>.
            </p>
            
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Anexar comprovante (opcional)</label>
              <Input 
                type="file" 
                accept="image/*,.pdf"
                onChange={(e) => setReceiptFile(e.target.files ? e.target.files[0] : null)}
                className="bg-muted border-border"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPaymentDialogOpen(false)} disabled={uploadingReceipt}>
                Cancelar
              </Button>
              <Button className="flex-1" variant="emerald" onClick={confirmPayment} disabled={uploadingReceipt}>
                {uploadingReceipt ? "Enviando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonthlyAccounts;
