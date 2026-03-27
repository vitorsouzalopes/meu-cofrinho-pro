import { useEffect, useMemo, useState } from "react";
import { Plus, TrendingUp, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Investment } from "@/integrations/supabase/types";

const investmentTypes = ["CDB", "Selic", "Poupança", "Tesouro", "Ações", "Outros"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const Investments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [name, setName] = useState("");
  const [bank, setBank] = useState("Itaú");
  const [investmentType, setInvestmentType] = useState("CDB");
  const [amount, setAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (!user) return;
    const fetchInvestments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast({ title: "Erro ao carregar investimentos", description: error.message, variant: "destructive" });
        setInvestments([]);
      } else {
        setInvestments((data ?? []) as Investment[]);
      }
      setLoading(false);
    };

    fetchInvestments();
  }, [user, toast]);

  const totalInvested = useMemo(
    () => investments.reduce((sum, investment) => sum + Number(investment.amount), 0),
    [investments],
  );

  const totalCurrent = useMemo(
    () => investments.reduce((sum, investment) => sum + Number(investment.current_amount ?? investment.amount), 0),
    [investments],
  );

  const addInvestment = async () => {
    if (!name.trim() || !amount || !user) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("investments")
      .insert({
        user_id: user.id,
        name: name.trim(),
        bank: bank.trim(),
        investment_type: investmentType,
        amount: parseFloat(amount),
        current_amount: currentAmount ? parseFloat(currentAmount) : parseFloat(amount),
        start_date: startDate,
      })
      .select("*")
      .single();

    if (error) {
      toast({ title: "Erro ao salvar investimento", description: error.message, variant: "destructive" });
    } else if (data) {
      setInvestments((prev) => [data as Investment, ...prev]);
      setName("");
      setBank("Itaú");
      setInvestmentType("CDB");
      setAmount("");
      setCurrentAmount("");
      setStartDate(new Date().toISOString().split("T")[0]);
      setDialogOpen(false);
      toast({ title: "Investimento cadastrado!" });
    }

    setSaving(false);
  };

  const removeInvestment = async (id: string) => {
    const { error } = await supabase.from("investments").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      return;
    }
    setInvestments((prev) => prev.filter((investment) => investment.id !== id));
  };

  const investmentsByType = useMemo(() => {
    return investments.reduce<Record<string, Investment[]>>((acc, investment) => {
      acc[investment.investment_type] = acc[investment.investment_type] || [];
      acc[investment.investment_type].push(investment);
      return acc;
    }, {});
  }, [investments]);

  const daysInvested = (date: string) => {
    const diff = Date.now() - new Date(`${date}T00:00:00`).getTime();
    return Math.max(0, Math.floor(diff / 86_400_000));
  };

  const percentChange = (investment: Investment) => {
    const start = Number(investment.amount);
    const current = Number(investment.current_amount ?? investment.amount);
    if (!start || start === 0) return 0;
    return ((current - start) / start) * 100;
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Investimentos</h1>
          <p className="text-xs text-muted-foreground">Cadastre onde você investe e acompanhe a evolução.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" size="sm" className="rounded-full px-4">
              <Plus className="w-4 h-4 mr-2" /> Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)]">
            <DialogHeader>
              <DialogTitle>Novo investimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="CDB Itaú" className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Banco / carteira</label>
                <Input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Itaú" className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
                <select value={investmentType} onChange={(e) => setInvestmentType(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold">
                  {investmentTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Valor inicial</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" className="bg-muted border-border" step="0.01" min="0" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Valor atual</label>
                <Input type="number" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} placeholder="120" className="bg-muted border-border" step="0.01" min="0" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data início</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-muted border-border" />
              </div>
              <Button className="w-full" onClick={addInvestment} disabled={saving}>
                {saving ? "Salvando..." : "Salvar investimento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-gold" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total investido</p>
              <p className="font-semibold text-lg">{formatCurrency(totalInvested)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ArrowUpRight className="w-5 h-5 text-emerald-accent" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Saldo atual</p>
              <p className="font-semibold text-lg">{formatCurrency(totalCurrent)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="glass-card p-4 mb-4">
        <h2 className="font-semibold text-foreground mb-2">Evolução rápida</h2>
        <p className="text-sm text-muted-foreground">Cada investimento mostra dias investidos e retorno estimado.</p>
      </div>

      <div className="space-y-4">
        {investments.length === 0 ? (
          <Card className="p-4">
            <CardTitle>Nenhum investimento cadastrado</CardTitle>
            <CardDescription>Adicione sua primeira aplicação para começar a acompanhar.</CardDescription>
          </Card>
        ) : (
          investments.map((investment) => (
            <Card key={investment.id} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-foreground">{investment.name}</p>
                  <p className="text-xs text-muted-foreground">{investment.bank} · {investment.investment_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(Number(investment.current_amount ?? investment.amount))}</p>
                  <p className="text-xs text-muted-foreground">Atual</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground">{daysInvested(investment.start_date)} dias</p>
                  <p>Investido</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{formatCurrency(Number(investment.amount))}</p>
                  <p>Valor inicial</p>
                </div>
                <div>
                  <p className={`font-semibold ${percentChange(investment) >= 0 ? "text-emerald-accent" : "text-destructive"}`}>
                    {percentChange(investment).toFixed(1)}%
                  </p>
                  <p>Retorno</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => removeInvestment(investment.id)}>
                  Remover
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Investments;
