import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Plus, Trash2, Check, Edit3, Wallet, CopyPlus, ClipboardCheck, AlertCircle, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { ensureMonthlyInstances } from "@/lib/account-utils";
import { resolverContasDoMes } from "@/lib/finance-utils";
import type { Account } from "@/integrations/supabase/types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const today = new Date();
const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
const currentMonthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(today);

const StatusBadge = ({ status, dueDate }: { status: string, dueDate: string }) => {
  if (status === "pago") {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-[10px] font-bold text-primary">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        Paid
      </div>
    );
  }

  const d = new Date(dueDate).getDate();
  const todayDay = new Date().getDate();
  
  if (d < todayDay) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/10 text-[10px] font-bold text-destructive">
        <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
        Overdue
      </div>
    );
  }

  if (d <= todayDay + 3) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-500">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Due Soon
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
      Pending
    </div>
  );
};

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
  const [isUploading, setIsUploading] = useState(false);
  const hasGenerated = useRef(false);

  // Form states
  const [name, setName] = useState("");
  const [billingType, setBillingType] = useState<"monthly" | "single" | "debt">("monthly");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("5");

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [instancesRes, templatesRes] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", false).eq("month_year", currentMonthYear),
        supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", true),
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
        parent_id: a.parent_id,
        virtual: a.virtual
      }));

      setAccounts(mappedAccounts);
    } catch (error: any) {
      toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [user?.id, loadData]);

  const openNewAccountDialog = () => {
    setEditingAccount(null);
    setName("");
    setAmount("");
    setDueDay("5");
    setBillingType("monthly");
    setDialogOpen(true);
  };

  const openEditAccountDialog = (account: any) => {
    setEditingAccount(account);
    setName(account.nome);
    setAmount(String(account.valor));
    setDueDay(account.vencimento.split('-')[2] || "5");
    setBillingType(account.tipo);
    setDialogOpen(true);
  };

  const saveAccount = async () => {
    if (!user || !name || !amount) return;
    setSaving(true);

    const record: any = {
      user_id: user.id,
      name: name.trim(),
      account_type: "Outros",
      billing_type: billingType,
      amount: parseFloat(amount),
      due_day: parseInt(dueDay, 10),
      month_year: currentMonthYear,
      is_template: billingType === "monthly" || billingType === "debt",
      paid: false,
    };

    const { error } = editingAccount && !String(editingAccount.id).startsWith('virtual-')
      ? await supabase.from("accounts").update(record).eq("id", editingAccount.id)
      : await supabase.from("accounts").insert(record);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Conta salva!" });
      setDialogOpen(false);
      loadData();
      window.dispatchEvent(new CustomEvent("finance-data-updated"));
    }
    setSaving(false);
  };

  const deleteAccount = async (id: string) => {
    if (!user) return;
    const isVirtual = String(id).startsWith('virtual-');
    const realId = isVirtual ? id.replace('virtual-', '').replace('debt-', '') : id;
    
    if (!window.confirm("Deseja realmente excluir esta conta?")) return;

    await supabase.from("accounts").delete().eq("user_id", user.id).eq("name", accounts.find(a => a.id === id)?.nome).eq("month_year", currentMonthYear);
    const { error } = await supabase.from("accounts").delete().eq("id", realId);
    
    if (!error) {
      toast({ title: "Removido!" });
      loadData();
      window.dispatchEvent(new CustomEvent("finance-data-updated"));
    }
  };

  const markAsPaid = (account: any) => {
    setSelectedAccountForPayment(account);
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
        paid: true,
        paid_at: new Date().toISOString()
      }).select().single();
      if (error) {
        toast({ title: "Erro ao pagar", variant: "destructive" });
        setIsUploading(false);
        return;
      }
      targetId = data.id;
    } else {
      await supabase.from("accounts").update({ paid: true, paid_at: new Date().toISOString() }).eq("id", targetId);
    }

    toast({ title: "Pago com sucesso!" });
    loadData();
    window.dispatchEvent(new CustomEvent("finance-data-updated"));
    setIsUploading(false);
    setPaymentDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const monthlyAccounts = accounts.filter(a => a.tipo === "monthly");
  const debtAccounts = accounts.filter(a => a.tipo === "debt" || a.tipo === "divida");
  const singleAccounts = accounts.filter(a => a.tipo === "single");

  return (
    <div className="min-h-screen pb-24 px-6 pt-8 max-w-lg mx-auto bg-background">
      <div className="text-center mb-8 animate-slide-up">
        <h1 className="text-2xl font-bold text-foreground">Contas - <span className="capitalize">{currentMonthName}</span></h1>
      </div>

      <Tabs defaultValue="mensais" className="space-y-8">
        <TabsList className="bg-card/50 p-1 rounded-full border border-border/40 w-full">
          <TabsTrigger value="mensais" className="rounded-full flex-1 data-[state=active]:bg-primary data-[state=active]:text-white">Mensais</TabsTrigger>
          <TabsTrigger value="dividas" className="rounded-full flex-1 data-[state=active]:bg-primary data-[state=active]:text-white">Dívidas</TabsTrigger>
          <TabsTrigger value="extra" className="rounded-full flex-1 data-[state=active]:bg-primary data-[state=active]:text-white">Dívida Extra</TabsTrigger>
        </TabsList>

        <TabsContent value="mensais" className="space-y-4">
          {monthlyAccounts.map((account) => (
            <Card key={account.id} className="p-5 bg-card border border-border/50 animate-slide-up relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 shadow-inner">
                  <Wallet className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-foreground text-sm leading-tight">{account.nome}</p>
                      <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(account.valor)}</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="bg-muted p-1.5 rounded-lg cursor-pointer" onClick={() => openEditAccountDialog(account)}>
                        <CopyPlus className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="bg-muted p-1.5 rounded-lg cursor-pointer" onClick={() => markAsPaid(account)}>
                        <ClipboardCheck className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-end mt-3">
                    <p className="text-[10px] text-muted-foreground font-medium">Due {new Date(account.vencimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                    <StatusBadge status={account.status} dueDate={account.vencimento} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {monthlyAccounts.length === 0 && <p className="text-center text-muted-foreground py-10">Nenhuma conta mensal.</p>}
        </TabsContent>

        <TabsContent value="dividas" className="space-y-4">
          {debtAccounts.map((account) => (
            <Card key={account.id} className="p-5 bg-card border border-border/50 animate-slide-up">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-foreground text-sm">{account.nome}</p>
                      <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(account.valor)}</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="bg-muted p-1.5 rounded-lg cursor-pointer" onClick={() => openEditAccountDialog(account)}>
                        <Edit3 className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="bg-muted p-1.5 rounded-lg cursor-pointer" onClick={() => deleteAccount(account.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-end mt-3">
                    <p className="text-[10px] text-muted-foreground font-medium">Parcelas: {account.parcela || 'N/A'}</p>
                    <StatusBadge status={account.status} dueDate={account.vencimento} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="extra" className="space-y-4">
          {singleAccounts.map((account) => (
            <Card key={account.id} className="p-5 bg-card border border-border/50 animate-slide-up">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Banknote className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-foreground text-sm">{account.nome}</p>
                      <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(account.valor)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Check className="w-5 h-5 text-primary cursor-pointer" onClick={() => markAsPaid(account)} />
                    </div>
                  </div>
                  <div className="flex justify-between items-end mt-3">
                    <p className="text-[10px] text-muted-foreground font-medium">Vence: {new Date(account.vencimento).toLocaleDateString('pt-BR')}</p>
                    <StatusBadge status={account.status} dueDate={account.vencimento} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* FAB (Floating Action Button) */}
      <Button 
        className="fixed bottom-24 right-8 w-14 h-14 rounded-full bg-primary shadow-2xl shadow-primary/40 p-0 flex items-center justify-center animate-bounce-slow"
        onClick={openNewAccountDialog}
      >
        <Plus className="w-7 h-7 text-white" />
      </Button>

      {/* Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Editar conta" : "Nova conta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tipo de Conta</label>
              <div className="grid grid-cols-3 gap-2">
                {['monthly', 'debt', 'single'].map(type => (
                  <Button 
                    key={type}
                    variant={billingType === type ? 'default' : 'outline'}
                    size="sm"
                    className="capitalize text-[10px]"
                    onClick={() => setBillingType(type as any)}
                  >
                    {type === 'monthly' ? 'Mensal' : type === 'debt' ? 'Dívida' : 'Única'}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome da conta</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Internet, Nubank..." className="bg-muted border-border h-12" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Valor</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="120" className="bg-muted border-border h-12" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Dia Vencimento</label>
                <Input type="number" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="5" className="bg-muted border-border h-12" />
              </div>
            </div>
            <Button className="w-full py-6 font-bold" onClick={saveAccount} disabled={saving}>
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
            <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 text-center">
              <p className="text-xs text-primary font-bold uppercase tracking-widest mb-1">{selectedAccountForPayment?.nome}</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(selectedAccountForPayment?.valor || 0)}</p>
            </div>
            <Button className="w-full py-6 text-base font-bold" onClick={confirmPayment} disabled={isUploading}>
              {isUploading ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounts;
