import { useCallback, useEffect, useState } from "react";
import {
  Plus, Trash2, Check, Edit3, Wallet, AlertCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useDebts, useInvalidateFinance } from "@/hooks/use-finance-data";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// ─── Gera lista de meses ao redor do mês atual ───────────────────────────────
const buildMonthList = () => {
  const months: { label: string; value: string }[] = [];
  const now = new Date();
  for (let offset = -1; offset <= 2; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    months.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return months;
};

const MONTHS = buildMonthList();
const TODAY_MY = MONTHS[1].value; // índice 1 = mês atual

// ─── Badge de Status ──────────────────────────────────────────────────────────
const StatusBadge = ({
  status,
  dueDay,
  monthYear,
}: {
  status: string;
  dueDay?: number | null;
  monthYear: string; // formato: "2026-05"
}) => {
  if (status === "pago") {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold text-primary">
        <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" /> Pago
      </span>
    );
  }

  if (dueDay) {
    const [year, month] = monthYear.split("-").map(Number);
    // Data de vencimento real (com mês e ano corretos)
    const dueDate = new Date(year, month - 1, dueDay);
    const now = new Date();
    // Zera as horas para comparar só datas
    now.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((dueDate.getTime() - now.getTime()) / 86400000);

    if (diffDays < 0) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-[10px] font-bold text-destructive">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block" /> Atrasado
        </span>
      );
    }
    if (diffDays <= 7) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-500">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" /> Vence em {diffDays === 0 ? "hoje" : `${diffDays}d`}
        </span>
      );
    }
  }

  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block" /> Pendente
    </span>
  );
};

// ─── Formulário de Nova/Editar Conta ─────────────────────────────────────────
interface AccountFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing?: any;
  userId: string;
  monthYear: string;
}

const AccountForm = ({ open, onClose, onSaved, editing, userId, monthYear }: AccountFormProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [tipo, setTipo] = useState<"monthly" | "debt" | "single">("monthly");
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [startDate, setStartDate] = useState("");
  const [parcelas, setParcelas] = useState("");

  // Preenche ao editar
  useEffect(() => {
    if (editing) {
      if (editing.__source === "debt") {
        setTipo("debt");
        setNome(editing.nome || "");
        setValor(String(editing.parcela_mensal || ""));
        setDueDay(String(editing.dia_vencimento || ""));
        setStartDate("");
        setParcelas(String(editing.parcelas_restantes || ""));
      } else {
        setTipo(editing.billing_type || "monthly");
        setNome(editing.name || "");
        setValor(String(editing.amount || ""));
        setDueDay(String(editing.due_day || ""));
        setStartDate(editing.start_date || "");
        setParcelas(String(editing.remaining_months || ""));
      }
    } else {
      setTipo("monthly");
      setNome("");
      setValor("");
      setDueDay("");
      setStartDate("");
      setParcelas("");
    }
  }, [editing, open]);

  const isDebt = tipo === "debt";

  const save = async () => {
    if (!nome.trim() || !valor) {
      toast({ title: "Preencha nome e valor", variant: "destructive" });
      return;
    }

    setSaving(true);

    let error: any = null;

    if (isDebt) {
      // Dívidas vão para a tabela `debts` (fonte única para Planejamento + Dashboard)
      const parcelasInt = parcelas !== "" ? parseInt(parcelas, 10) : null;
      const valorParcela = parseFloat(valor);
      const debtPayload: any = {
        user_id: userId,
        nome: nome.trim(),
        tipo: "credito",
        valor_total: valorParcela * (parcelasInt || 1),
        valor_restante: valorParcela * (parcelasInt || 1),
        parcela_mensal: valorParcela,
        total_parcelas: parcelasInt,
        parcelas_restantes: parcelasInt,
        juros_mensal: 0,
        dia_vencimento: dueDay ? parseInt(dueDay, 10) : 1,
      };
      if (editing?.__source === "debt") {
        ({ error } = await supabase.from("debts" as any).update(debtPayload).eq("id", editing.id));
      } else {
        ({ error } = await supabase.from("debts" as any).insert(debtPayload));
      }
    } else {
      const payload: any = {
        user_id: userId,
        name: nome.trim(),
        billing_type: tipo,
        amount: parseFloat(valor),
        due_day: dueDay ? parseInt(dueDay, 10) : null,
        month_year: monthYear,
        is_template: tipo === "monthly",
        paid: false,
        account_type: "Outros",
      };
      if (editing && editing.__source !== "debt") {
        ({ error } = await supabase.from("accounts").update(payload).eq("id", editing.id));
      } else {
        ({ error } = await supabase.from("accounts").insert(payload));
      }
    }

    setSaving(false);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editing ? "Atualizado!" : "Criado!" });
      window.dispatchEvent(new CustomEvent("finance-data-updated"));
      onSaved();
      onClose();
    }
  };

  const typeLabels = { monthly: "Mensal", debt: "Dívida", single: "Única" };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {editing ? "Editar Conta" : "Nova Conta"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">

          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-2 block tracking-widest">
              Tipo de Conta
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["monthly", "debt", "single"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`py-2.5 rounded-xl text-[12px] font-bold border transition-all ${
                    tipo === t
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/30"
                      : "bg-muted border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {typeLabels[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block tracking-widest">
              Nome da Conta
            </label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Internet, Nubank, IPTU..."
              className="bg-muted border-border h-12 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block tracking-widest">
                Valor (R$)
              </label>
              <Input
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="bg-muted border-border h-12 rounded-xl"
                step="0.01"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block tracking-widest">
                Dia de Vencimento
              </label>
              <Input
                type="number"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                placeholder="Ex: 10"
                className="bg-muted border-border h-12 rounded-xl"
                min="1"
                max="31"
              />
            </div>
          </div>

          {isDebt && (
            <>
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block tracking-widest">
                  Data de Início
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-muted border-border h-12 rounded-xl"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block tracking-widest">
                  Parcelas Restantes
                </label>
                <Input
                  type="number"
                  value={parcelas}
                  onChange={(e) => setParcelas(e.target.value)}
                  placeholder="Ex: 12"
                  className="bg-muted border-border h-12 rounded-xl"
                  min="1"
                />
              </div>
            </>
          )}

          <Button
            onClick={save}
            disabled={saving}
            className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20"
          >
            {saving ? "Salvando..." : editing ? "Atualizar Conta" : "Salvar Conta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AccountCard = ({
  account,
  monthYear,
  onEdit,
  onDelete,
  onPay,
  accentColor = "blue",
}: {
  account: any;
  monthYear: string;
  onEdit: () => void;
  onDelete: () => void;
  onPay: () => void;
  accentColor?: string;
}) => {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-500",
    red: "bg-destructive/10 text-destructive",
    amber: "bg-amber-500/10 text-amber-500",
  };

  return (
    <Card className="p-4 bg-card border border-border/50 shadow-sm group hover:border-primary/20 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[accentColor]}`}>
          {accentColor === "red" ? <AlertCircle className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <p className="font-bold text-sm text-foreground truncate">{account.name}</p>
            <p className="font-bold text-sm text-foreground whitespace-nowrap shrink-0">
              {formatCurrency(Number(account.amount))}
            </p>
          </div>

          <div className="flex justify-between items-center mt-2 gap-2 flex-wrap">
            <StatusBadge
              status={account.paid ? "pago" : "pendente"}
              dueDay={account.due_day}
              monthYear={monthYear}
            />

            <div className="flex items-center gap-1.5">
              {!account.paid && (
                <button
                  onClick={onPay}
                  title="Marcar como pago"
                  className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onEdit}
                title="Editar"
                className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
                title="Excluir"
                className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {account.billing_type === "debt" && account.remaining_months && (
            <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">
              {account.remaining_months} parcela(s) restante(s)
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

const Accounts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const invalidate = useInvalidateFinance();

  const [selectedMonth, setSelectedMonth] = useState(TODAY_MY);
  const [displayAccounts, setDisplayAccounts] = useState<any[]>([]);
  const [debtPayments, setDebtPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payingAccount, setPayingAccount] = useState<any>(null);
  const [paying, setPaying] = useState(false);

  const { data: debtsData = [] } = useDebts();

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split("-").map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-${String(lastDay).padStart(2, "0")}`;

      const [instRes, tmplRes, payRes] = await Promise.all([
        supabase
          .from("accounts")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_template", false)
          .eq("month_year", selectedMonth)
          .order("due_day", { ascending: true }),
        supabase
          .from("accounts")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_template", true)
          .order("name", { ascending: true }),
        supabase
          .from("debt_payments" as any)
          .select("*")
          .eq("user_id", user.id)
          .gte("data_pagamento", startDate)
          .lte("data_pagamento", endDate),
      ]);

      const instances: any[] = instRes.data ?? [];
      const templates: any[] = tmplRes.data ?? [];
      setDebtPayments(payRes.data ?? []);

      const merged: any[] = templates.map((t) => {
        const inst = instances.find((i) => i.parent_id === t.id);
        return inst ?? t;
      });

      const templateIds = templates.map((t) => t.id);
      const remainingInstances = instances.filter(
        (i) => !i.parent_id || !templateIds.includes(i.parent_id)
      );

      setDisplayAccounts([...merged, ...remainingInstances]);
    } catch (e: any) {
      toast({ title: "Erro ao carregar", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedMonth]);

  useEffect(() => {
    load();
    const sync = () => load();
    window.addEventListener("finance-data-updated", sync);
    return () => window.removeEventListener("finance-data-updated", sync);
  }, [load]);

  const deleteAccount = async (account: any) => {
    if (account.__source === "debt") {
      if (!window.confirm(`Excluir a dívida "${account.nome}" e seu histórico?`)) return;
      const { error } = await supabase.from("debts" as any).delete().eq("id", account.id);
      if (error) {
        toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Dívida excluída!" });
      invalidate();
      return;
    }

    const isTemplate = account.is_template === true;

    if (isTemplate) {
      const deleteAll = window.confirm(
        `"${account.name}" é uma conta recorrente.\n\nClique OK para excluir PERMANENTEMENTE (remove de todos os meses).\nClique Cancelar para manter — ou use a opção de exclusão do mês específico.`
      );
      if (!deleteAll) return;

      await supabase
        .from("accounts")
        .delete()
        .eq("user_id", user!.id)
        .eq("parent_id", account.id);

      const { error } = await supabase.from("accounts").delete().eq("id", account.id);
      if (error) {
        toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      if (!window.confirm(`Excluir "${account.name}"?`)) return;
      const { error } = await supabase.from("accounts").delete().eq("id", account.id);
      if (error) {
        toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
        return;
      }
    }

    toast({ title: "Conta excluída!" });
    invalidate();
    load();
  };

  const confirmPay = async () => {
    if (!payingAccount || !user) return;

    if (payingAccount.__source === "debt") {
      setPaying(true);
      const novoSaldo = Math.max(0, Number(payingAccount.valor_restante) - Number(payingAccount.parcela_mensal));
      const novasParcelas = payingAccount.parcelas_restantes ? Math.max(0, payingAccount.parcelas_restantes - 1) : null;
      const paymentDate = new Date().toISOString().slice(0, 10);
      const [{ error: e1 }, { error: e2 }, { error: e3 }] = await Promise.all([
        supabase.from("debt_payments" as any).insert({
          user_id: user.id,
          debt_id: payingAccount.id,
          valor_pago: Number(payingAccount.parcela_mensal),
          data_pagamento: paymentDate,
          tipo_pagamento: "parcela",
          parcelas_quitadas: 1,
        }),
        supabase.from("debts" as any).update({
          valor_restante: novoSaldo,
          parcelas_restantes: novasParcelas,
        }).eq("id", payingAccount.id),
        supabase.from("accounts").insert({
          user_id: user.id,
          name: payingAccount.nome || payingAccount.name,
          amount: Number(payingAccount.parcela_mensal),
          billing_type: "debt",
          due_day: payingAccount.dia_vencimento || payingAccount.due_day,
          account_type: "Dívida",
          account_category: "expense",
          bank: "Dívida",
          month_year: selectedMonth,
          start_date: new Date().toISOString().slice(0, 10),
          paid: true,
          paid_at: new Date().toISOString(),
        }),
      ]);
      setPaying(false);
      if (e1 || e2 || e3) {
        toast({ title: "Erro ao pagar", description: (e1 || e2 || e3)?.message, variant: "destructive" });
      } else {
        setDebtPayments((prev) => [
          ...prev,
          {
            debt_id: payingAccount.id,
            valor_pago: Number(payingAccount.parcela_mensal),
            data_pagamento: paymentDate,
          },
        ]);
        setDisplayAccounts((prev) => [
          ...prev,
          {
            user_id: user.id,
            name: payingAccount.nome || payingAccount.name,
            amount: Number(payingAccount.parcela_mensal),
            billing_type: "debt",
            due_day: payingAccount.dia_vencimento || payingAccount.due_day,
            account_type: "Dívida",
            account_category: "expense",
            bank: "Dívida",
            start_date: new Date().toISOString().slice(0, 10),
            month_year: selectedMonth,
            is_template: false,
            paid: true,
            paid_at: new Date().toISOString(),
          },
        ]);
        toast({ title: "Parcela quitada!" });
        invalidate();
        load();
        setPayDialogOpen(false);
      }
      return;
    }

    setPaying(true);
    let error: any = null;
    if (payingAccount.is_template) {
      const { error: insertError } = await supabase.from("accounts").insert({
        user_id: user.id,
        parent_id: payingAccount.id,
        name: payingAccount.name,
        amount: payingAccount.amount,
        billing_type: payingAccount.billing_type,
        due_day: payingAccount.due_day,
        account_type: payingAccount.account_type || "Outros",
        account_category: "expense",
        bank: "Mensal",
        start_date: new Date().toISOString().slice(0, 10),
        month_year: selectedMonth,
        is_template: false,
        paid: true,
        paid_at: new Date().toISOString(),
      });
      error = insertError;
    } else {
      const { error: updateError } = await supabase
        .from("accounts")
        .update({ paid: true, paid_at: new Date().toISOString() })
        .eq("id", payingAccount.id);
      error = updateError;
    }

    setPaying(false);
    if (error) {
      toast({ title: "Erro ao pagar", variant: "destructive" });
    } else {
      toast({ title: "Marcado como pago!" });
      invalidate();
      setPayDialogOpen(false);
      load();
    }
  };

  const monthly = displayAccounts.filter((a) => a.billing_type === "monthly");
  const singles = displayAccounts.filter((a) => a.billing_type === "single");

  const debts = (debtsData || []).map((d: any) => {
    // Busca pagamento vinculado ao ID da dívida OU um registro manual com o mesmo nome.
    const hasPayment = debtPayments.some((p) => p.debt_id === d.id);
    const hasAccountRecord = displayAccounts.some(
      (a) => a.billing_type === "debt" && (a.name === d.nome || a.name === d.name) && a.paid
    );
    const isFullySettled = Number(d.parcelas_restantes) === 0 || Number(d.valor_restante) <= 0;
    const isPaid = hasPayment || hasAccountRecord || isFullySettled;

    return {
      ...d,
      __source: "debt",
      name: d.nome,
      amount: d.parcela_mensal,
      due_day: d.dia_vencimento,
      billing_type: "debt",
      paid: isPaid,
      remaining_months: d.parcelas_restantes,
    };
  });

  const totalMonthly = monthly.reduce((s, a) => s + Number(a.amount), 0);
  const totalDebts = debts.reduce((s, a) => s + Number(a.amount || 0), 0);
  const totalSingles = singles.reduce((s, a) => s + Number(a.amount || 0), 0);
  const currentIdx = MONTHS.findIndex((m) => m.value === selectedMonth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 px-4 pt-6 max-w-lg mx-auto bg-background">
      <div className="mb-6 animate-slide-up">
        <h1 className="text-2xl font-bold text-foreground mb-4">Contas</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => currentIdx > 0 && setSelectedMonth(MONTHS[currentIdx - 1].value)}
            disabled={currentIdx === 0}
            className="p-2 rounded-xl bg-card border border-border/50 disabled:opacity-30 hover:border-primary/40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 overflow-x-auto flex gap-2 no-scrollbar">
            {MONTHS.map((m) => (
              <button
                key={m.value}
                onClick={() => setSelectedMonth(m.value)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-[11px] font-bold border transition-all shrink-0 ${
                  m.value === selectedMonth
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/30"
                    : "bg-card border-border/50 text-muted-foreground hover:border-primary/40"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button
            onClick={() =>
              currentIdx < MONTHS.length - 1 && setSelectedMonth(MONTHS[currentIdx + 1].value)
            }
            disabled={currentIdx === MONTHS.length - 1}
            className="p-2 rounded-xl bg-card border border-border/50 disabled:opacity-30 hover:border-primary/40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6 animate-slide-up">
        {[
          { label: "Mensais", value: totalMonthly, color: "text-blue-400" },
          { label: "Dívidas", value: totalDebts, color: "text-destructive" },
          { label: "Únicas", value: totalSingles, color: "text-amber-400" },
        ].map((item) => (
          <Card key={item.label} className="p-3 bg-card border border-border/50 text-center">
            <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">
              {item.label}
            </p>
            <p className={`text-sm font-bold ${item.color}`}>{formatCurrency(item.value)}</p>
          </Card>
        ))}
      </div>

      {/* ── Abas ───────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="mensais" className="space-y-5 animate-slide-up">
        <TabsList className="bg-card/60 p-1 rounded-full border border-border/40 w-full">
          <TabsTrigger
            value="mensais"
            className="rounded-full flex-1 text-[11px] data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            Mensais ({monthly.length})
          </TabsTrigger>
          <TabsTrigger
            value="dividas"
            className="rounded-full flex-1 text-[11px] data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            Dívidas ({debts.length})
          </TabsTrigger>
          <TabsTrigger
            value="unicas"
            className="rounded-full flex-1 text-[11px] data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            Únicas ({singles.length})
          </TabsTrigger>
        </TabsList>

        {/* Mensais */}
        <TabsContent value="mensais" className="space-y-3">
          {monthly.length === 0 ? (
            <EmptyState label="Nenhuma conta mensal" />
          ) : (
            monthly.map((a) => (
              <AccountCard
                key={a.id}
                account={a}
                monthYear={selectedMonth}
                accentColor="blue"
                onEdit={() => { setEditingAccount(a); setDialogOpen(true); }}
                onDelete={() => deleteAccount(a)}
                onPay={() => { setPayingAccount(a); setPayDialogOpen(true); }}
              />
            ))
          )}
        </TabsContent>

        {/* Dívidas */}
        <TabsContent value="dividas" className="space-y-3">
          {debts.length === 0 ? (
            <EmptyState label="Nenhuma dívida registrada 🎉" />
          ) : (
            debts.map((a) => (
              <AccountCard
                key={a.id}
                account={a}
                monthYear={selectedMonth}
                accentColor="red"
                onEdit={() => { setEditingAccount(a); setDialogOpen(true); }}
                onDelete={() => deleteAccount(a)}
                onPay={() => { setPayingAccount(a); setPayDialogOpen(true); }}
              />
            ))
          )}
        </TabsContent>

        {/* Únicas */}
        <TabsContent value="unicas" className="space-y-3">
          {singles.length === 0 ? (
            <EmptyState label="Nenhuma conta única" />
          ) : (
            singles.map((a) => (
              <AccountCard
                key={a.id}
                account={a}
                monthYear={selectedMonth}
                accentColor="amber"
                onEdit={() => { setEditingAccount(a); setDialogOpen(true); }}
                onDelete={() => deleteAccount(a)}
                onPay={() => { setPayingAccount(a); setPayDialogOpen(true); }}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* ── FAB ────────────────────────────────────────────────────────────── */}
      <button
        onClick={() => {
          setEditingAccount(null);
          setDialogOpen(true);
        }}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/40 hover:scale-105 active:scale-95 transition-transform z-50"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      {/* ── Modal Nova / Editar Conta ───────────────────────────────────────── */}
      {user && (
        <AccountForm
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditingAccount(null);
          }}
          onSaved={load}
          editing={editingAccount}
          userId={user.id}
          monthYear={selectedMonth}
        />
      )}

      {/* ── Modal Confirmar Pagamento ───────────────────────────────────────── */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)] rounded-3xl">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 text-center">
              <p className="text-xs text-primary font-bold uppercase tracking-widest mb-1">
                {payingAccount?.name}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(Number(payingAccount?.amount ?? 0))}
              </p>
            </div>
            <Button
              className="w-full h-14 rounded-2xl text-base font-bold"
              onClick={confirmPay}
              disabled={paying}
            >
              {paying ? "Processando..." : "✓ Confirmar Pagamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const EmptyState = ({ label }: { label: string }) => (
  <div className="text-center py-12 rounded-3xl border border-dashed border-border/50">
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

export default Accounts;
