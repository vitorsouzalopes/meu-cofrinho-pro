import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Banknote, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Account } from "@/integrations/supabase/types";

const accountTypes = ["CDB", "Poupança", "Selic", "Cofrinho", "Digital", "Outros"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const Accounts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [name, setName] = useState("");
  const [bank, setBank] = useState("Itaú");
  const [accountType, setAccountType] = useState("CDB");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (!user) return;
    const fetchAccounts = async () => {
      setLoading(true);
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
    };

    fetchAccounts();
  }, [user, toast]);

  const totalSaved = accounts.reduce((sum, account) => sum + Number(account.amount), 0);
  const totalByBank = useMemo(() => {
    return accounts.reduce<Record<string, number>>((acc, account) => {
      acc[account.bank] = (acc[account.bank] || 0) + Number(account.amount);
      return acc;
    }, {});
  }, [accounts]);

  const accountsByBank = useMemo(() => {
    return accounts.reduce<Record<string, Account[]>>((acc, account) => {
      acc[account.bank] = acc[account.bank] || [];
      acc[account.bank].push(account);
      return acc;
    }, {});
  }, [accounts]);

  const addAccount = async () => {
    if (!name.trim() || !amount || !user) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("accounts")
      .insert({
        user_id: user.id,
        name: name.trim(),
        bank: bank.trim(),
        account_type: accountType,
        amount: parseFloat(amount),
        start_date: startDate,
      })
      .select("*")
      .single();

    if (error) {
      toast({ title: "Erro ao salvar conta", description: error.message, variant: "destructive" });
    } else if (data) {
      setAccounts((prev) => [data as Account, ...prev]);
      setName("");
      setBank("Itaú");
      setAccountType("CDB");
      setAmount("");
      setStartDate(new Date().toISOString().split("T")[0]);
      setDialogOpen(false);
      toast({ title: "Conta adicionada com sucesso" });
    }

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

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Contas e Bancos</h1>
          <p className="text-xs text-muted-foreground">Veja onde você guarda e quanto cada banco tem.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" size="sm" className="rounded-full px-4">
              <Plus className="w-4 h-4 mr-2" /> Nova conta
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)]">
            <DialogHeader>
              <DialogTitle>Nova conta ou cofrinho</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Itaú CDB" className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Banco / carteira</label>
                <Input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Itaú" className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
                <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold">
                  {accountTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Valor (R$)</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" className="bg-muted border-border" step="0.01" min="0" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data início</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-muted border-border" />
              </div>
              <Button className="w-full" onClick={addAccount} disabled={saving}>
                {saving ? "Salvando..." : "Salvar conta"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Banknote className="w-5 h-5 text-gold" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total guardado</p>
              <p className="font-semibold text-lg">{formatCurrency(totalSaved)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <PiggyBank className="w-5 h-5 text-streak" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Cofrinho</p>
              <p className="font-semibold text-lg">{formatCurrency(accounts.filter((item) => item.account_type === "Cofrinho").reduce((sum, item) => sum + Number(item.amount), 0))}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="glass-card p-4 mb-4">
        <h2 className="font-semibold text-foreground mb-2">Resumo por banco</h2>
        {Object.keys(totalByBank).length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não há contas cadastradas.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(totalByBank).map(([bankName, total]) => (
              <div key={bankName} className="rounded-2xl border border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{bankName}</p>
                    <p className="text-xs text-muted-foreground">Contas cadastradas</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(total)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {Object.entries(accountsByBank).map(([bankName, bankAccounts]) => (
          <div key={bankName} className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{bankName}</p>
                <p className="text-xs text-muted-foreground">{bankAccounts.length} conta(s)</p>
              </div>
              <p className="text-sm font-semibold">{formatCurrency(bankAccounts.reduce((sum, account) => sum + Number(account.amount), 0))}</p>
            </div>
            <div className="space-y-3">
              {bankAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between rounded-2xl border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{account.account_type} · {new Date(account.start_date).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{formatCurrency(Number(account.amount))}</p>
                    <Button variant="outline" size="sm" onClick={() => deleteAccount(account.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Accounts;
