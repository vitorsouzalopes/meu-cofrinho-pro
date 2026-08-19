import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type Account = Tables<"accounts">;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

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

  const loadAccounts = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_template", true)
        .eq("billing_type", "monthly")
        .order("due_day", { ascending: true });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      toast({ title: "Erro ao carregar modelos", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

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
      is_template: true,
    };

    const { data, error } = await supabase
      .from("accounts")
      .update(record)
      .eq("id", editingAccount.id)
      .select("*")
      .single();

    if (error) {
      toast({ title: "Erro ao atualizar modelo", description: error.message, variant: "destructive" });
    } else {
      setAccounts((prev) => prev.map((item) => (item.id === data.id ? (data as Account) : item)));
      toast({ title: "Modelo atualizado!" });
    }

    setDialogOpen(false);
    setSaving(false);
  };

  const deleteAccount = async (id: string) => {
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover modelo", description: error.message, variant: "destructive" });
      return;
    }
    setAccounts((prev) => prev.filter((account) => account.id !== id));
    toast({ title: "Modelo removido" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto bg-background">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/accounts")} className="h-8 w-8 rounded-full">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Button>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Gerenciar Modelos</h1>
          <p className="text-xs text-muted-foreground">Configuração de contas recorrentes.</p>
        </div>
      </div>

      <div className="glass-card p-4 mb-4">
        <div className="mb-3">
          <h2 className="font-semibold text-foreground">Modelos Ativos</h2>
          <p className="text-xs text-muted-foreground">Estes itens geram contas automáticas todo mês.</p>
        </div>

        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-2xl mt-4">
            Nenhum modelo cadastrado.
          </p>
        ) : (
          <div className="space-y-3 mt-4">
            {accounts.map((account) => (
              <div key={account.id} className="rounded-2xl border border-border p-4 bg-card/50">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{account.name}</p>
                    <p className="text-xs text-muted-foreground">Dia {account.due_day} • {account.account_type}</p>
                  </div>
                  <p className="text-sm font-semibold text-gold">{formatCurrency(Number(account.amount))}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(account)} className="rounded-full h-8">
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteAccount(account.id)} className="rounded-full h-8 text-destructive hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
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
            <DialogTitle>Editar modelo mensal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome do modelo</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Internet, Aluguel..." className="bg-muted border-none" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
              <select
                title="Categoria da despesa"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full rounded-lg border-none bg-muted px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-gold"
              >
                {expenseTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Valor</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-muted border-none" step="0.01" min="0" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Vencimento (dia)</label>
                <Input type="number" value={dueDay} onChange={(e) => setDueDay(e.target.value)} className="bg-muted border-none" min="1" max="31" />
              </div>
            </div>

            <Button onClick={saveAccount} disabled={saving} className="w-full bg-gold hover:bg-gold/90 text-background font-bold shadow-lg shadow-gold/20">
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonthlyAccounts;
