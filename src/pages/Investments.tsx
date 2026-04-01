import { useEffect, useMemo, useState } from "react";
import { useInvestmentIntelligence } from "@/hooks/use-investment-intelligence";
import { Plus, TrendingUp, ArrowUpRight, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Investment = Tables<"investments">;

const investmentTypes = ["CDB", "Selic", "Poupança", "Tesouro", "Ações", "Outros"];
const popularBanks = ["Itaú", "Nubank", "Banco Inter", "Bradesco", "Santander", "Caixa", "BTG"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const Investments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Inteligência financeira: alertas e previsões
  useInvestmentIntelligence(investments);
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
        let description = "Não foi possível carregar seus investimentos. Verifique sua conexão ou tente novamente mais tarde.";
        if (import.meta.env.DEV && error.message) {
          description += `\n[Detalhe: ${error.message}]`;
        }
        toast({ title: "Erro ao carregar investimentos", description, variant: "destructive" });
        setInvestments([]);
      } else {
        setInvestments((data ?? []) as Investment[]);
      }
      setLoading(false);
    };

    fetchInvestments();
  }, [user, toast]);

  // Contar bancos únicos
  const uniqueBanks = useMemo(() => {
    return [...new Set(investments.map((inv) => inv.bank))];
  }, [investments]);

  const canAddNewBank = uniqueBanks.length < 3;
  const isBankUnused = !uniqueBanks.includes(bank);
  const canProceed = canAddNewBank || !isBankUnused;

  const totalInvested = useMemo(
    () => investments.reduce((sum, investment) => sum + Number(investment.amount), 0),
    [investments],
  );

  const totalCurrent = useMemo(
    () => investments.reduce((sum, investment) => sum + Number(investment.current_amount ?? investment.amount), 0),
    [investments],
  );

  const investmentsByBank = useMemo(() => {
    return investments.reduce<Record<string, Investment[]>>((acc, investment) => {
      acc[investment.bank] = acc[investment.bank] || [];
      acc[investment.bank].push(investment);
      return acc;
    }, {});
  }, [investments]);

  const addInvestment = async () => {
    if (!name.trim() || !amount || !user) return;

    if (!canProceed) {
      toast({ title: "Limite de bancos atingido", description: "Você pode acompanhar até 3 bancos diferentes.", variant: "destructive" });
      return;
    }

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
          <h1 className="font-heading text-xl font-bold text-foreground">Investimentos</h1>
          <p className="text-xs text-muted-foreground">Acompanhe seus investimentos em até 3 bancos.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" size="sm" className="rounded-full px-4" disabled={!canAddNewBank && investments.length > 0}>
              <Plus className="w-4 h-4 mr-2" /> Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)]">
            <DialogHeader>
              <DialogTitle>Novo investimento</DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">Bancos cadastrados: {uniqueBanks.length}/3</p>
            </DialogHeader>
            <div className="space-y-4 mt-3">
              {!canAddNewBank && isBankUnused && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-destructive">
                    <p className="font-semibold">Limite de 3 bancos atingido</p>
                    <p className="text-xs">Escolha um banco já cadastrado ou remova um banco existente.</p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Nome do investimento <span className="text-destructive">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="CDB 12 meses"
                  className="bg-muted border-border"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Banco / Carteira <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2 mb-2">
                  {uniqueBanks.map((b) => (
                    <button
                      key={b}
                      onClick={() => setBank(b)}
                      className={`text-xs px-2 py-1 rounded-full border transition-all ${
                        bank === b
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-border bg-muted text-muted-foreground hover:border-gold"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                <select
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  title="Selecionar banco"
                >
                  <option value="">Ou escolha um banco:</option>
                  {popularBanks.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="">--- Outros ---</option>
                </select>
                <Input
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  placeholder="Digite outro banco"
                  className="bg-muted border-border mt-2"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Tipo de investimento <span className="text-destructive">*</span>
                </label>
                <select
                  value={investmentType}
                  onChange={(e) => setInvestmentType(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  title="Selecionar tipo de investimento"
                >
                  {investmentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Valor inicial (R$) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100"
                    className="bg-muted border-border"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Valor atual (R$)</label>
                  <Input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="120"
                    className="bg-muted border-border"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data de início</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-muted border-border" />
              </div>

              <Button className="w-full" onClick={addInvestment} disabled={saving || !canProceed}>
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

      {uniqueBanks.length > 0 && (
        <Card className="p-4 mb-4 border-gold/30">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Bancos cadastrados</p>
          <div className="flex flex-wrap gap-2">
            {uniqueBanks.map((b) => (
              <span key={b} className="text-xs px-2.5 py-1 rounded-full bg-gold/10 text-gold border border-gold/20">
                {b}
              </span>
            ))}
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {investments.length === 0 ? (
          <Card className="p-8 text-center border-border/50">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-semibold text-foreground">Nenhum investimento cadastrado</p>
            <p className="text-sm text-muted-foreground mt-1">Adicione sua primeira aplicação para começar.</p>
          </Card>
        ) : (
          Object.entries(investmentsByBank).map(([bankName, bankInvestments]) => (
            <div key={bankName} className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-semibold text-foreground text-sm">{bankName}</h3>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(bankInvestments.reduce((sum, inv) => sum + Number(inv.current_amount ?? inv.amount), 0))}
                </p>
              </div>
              {bankInvestments.map((investment) => (
                <Card key={investment.id} className="p-4 border-border/50">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{investment.name}</p>
                      <p className="text-xs text-muted-foreground">{investment.investment_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(Number(investment.current_amount ?? investment.amount))}</p>
                      <p className="text-xs text-muted-foreground">Atual</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{daysInvested(investment.start_date)}</p>
                      <p>Dias</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{formatCurrency(Number(investment.amount))}</p>
                      <p>Inicial</p>
                    </div>
                    <div>
                      <p
                        className={`font-semibold ${
                          percentChange(investment) >= 0 ? "text-emerald-accent" : "text-destructive"
                        }`}
                      >
                        {percentChange(investment).toFixed(1)}%
                      </p>
                      <p>Retorno</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => removeInvestment(investment.id)}>
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Remover
                  </Button>
                </Card>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Investments;
