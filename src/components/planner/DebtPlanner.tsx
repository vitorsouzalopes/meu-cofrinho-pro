import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Flame, Scale, AlertTriangle, TrendingDown, Sparkles, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useInvalidateFinance } from "@/hooks/use-finance-data";
import {
  type Debt,
  simular,
  estrategiaHard,
  estrategiaMista,
  gerarGraficoDivida,
  ordenarDividasPorJuros,
  sugestaoAutomatica,
  formatBRL,
} from "@/lib/debt-utils";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

interface Props {
  initialIncome: number;
  initialExpenses: number;
}

const TIPOS = [
  { value: "credito", label: "Cartão de Crédito" },
  { value: "emprestimo", label: "Empréstimo" },
  { value: "consignado", label: "Consignado" },
  { value: "cheque_especial", label: "Cheque Especial" },
  { value: "financiamento", label: "Financiamento" },
  { value: "outro", label: "Outro" },
];

export default function DebtPlanner({ initialIncome, initialExpenses }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("credito");
  const [valorTotal, setValorTotal] = useState("");
  const [valorRestante, setValorRestante] = useState("");
  const [parcelaMensal, setParcelaMensal] = useState("");
  const [totalParcelasInput, setTotalParcelasInput] = useState("");
  const [parcelasRestantes, setParcelasRestantes] = useState("");
  const [jurosMensal, setJurosMensal] = useState(""); // em %
  const [diaVencimento, setDiaVencimento] = useState("10");

  const rendaDisponivel = Math.max(0, initialIncome - initialExpenses);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("debts" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("juros_mensal", { ascending: false });
    if (error) {
      console.warn("debts:", error.message);
      setDebts([]);
    } else {
      setDebts((data as any) || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setEditing(null);
    setNome(""); setTipo("credito"); setValorTotal(""); setValorRestante("");
    setParcelaMensal(""); setTotalParcelasInput(""); setParcelasRestantes("");
    setJurosMensal(""); setDiaVencimento("10");
  };

  const handleEdit = (d: Debt) => {
    setEditing(d);
    setNome(d.nome); setTipo(d.tipo);
    setValorTotal(String(d.valor_total));
    setValorRestante(String(d.valor_restante));
    setParcelaMensal(String(d.parcela_mensal));
    setTotalParcelasInput(d.total_parcelas ? String(d.total_parcelas) : "");
    setParcelasRestantes(d.parcelas_restantes ? String(d.parcelas_restantes) : "");
    setJurosMensal(String((d.juros_mensal || 0) * 100));
    setDiaVencimento(String(d.dia_vencimento));
    setOpenDialog(true);
  };

  const save = async () => {
    if (!user || !nome || !valorRestante || !parcelaMensal) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    const payload: any = {
      user_id: user.id,
      nome,
      tipo,
      valor_total: parseFloat(valorTotal || valorRestante),
      valor_restante: parseFloat(valorRestante),
      parcela_mensal: parseFloat(parcelaMensal),
      total_parcelas: totalParcelasInput ? parseInt(totalParcelasInput) : null,
      parcelas_restantes: parcelasRestantes ? parseInt(parcelasRestantes) : null,
      juros_mensal: parseFloat(jurosMensal || "0") / 100,
      dia_vencimento: parseInt(diaVencimento || "1"),
    };
    try {
      if (editing) {
        const { error } = await supabase.from("debts" as any).update(payload).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Dívida atualizada!" });
      } else {
        const { error } = await supabase.from("debts" as any).insert([payload]);
        if (error) throw error;
        toast({ title: "Dívida cadastrada!" });
      }
      setOpenDialog(false);
      reset();
      load();
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remover esta dívida e seu histórico?")) return;
    const { error } = await supabase.from("debts" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Dívida removida" });
    load();
  };

  // Totais agregados
  const totalRestante = debts.reduce((s, d) => s + Number(d.valor_restante || 0), 0);
  const totalParcelasMes = debts.reduce((s, d) => s + Number(d.parcela_mensal || 0), 0);
  const dividasOrdenadas = ordenarDividasPorJuros(debts);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-destructive/10 border-destructive/20">
          <p className="text-[10px] uppercase font-bold text-destructive/80 mb-1">Total em Dívidas</p>
          <p className="text-lg font-bold text-destructive">{formatBRL(totalRestante)}</p>
        </Card>
        <Card className="p-4 bg-card border-border/50">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Parcelas/mês</p>
          <p className="text-lg font-bold text-foreground">{formatBRL(totalParcelasMes)}</p>
        </Card>
      </div>

      {/* Renda disponível para quitar */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-primary/80 mb-1">Renda Disponível p/ Quitar</p>
            <p className="text-base font-bold text-primary">{formatBRL(rendaDisponivel)}</p>
          </div>
          <Sparkles className="w-5 h-5 text-primary/60" />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
          <div className="bg-destructive/10 rounded-lg p-2 border border-destructive/20">
            <p className="font-bold text-destructive flex items-center gap-1"><Flame className="w-3 h-3" /> HARD (90%)</p>
            <p className="text-foreground font-bold mt-0.5">{formatBRL(estrategiaHard(rendaDisponivel))}/mês</p>
          </div>
          <div className="bg-amber-500/10 rounded-lg p-2 border border-amber-500/20">
            <p className="font-bold text-amber-500 flex items-center gap-1"><Scale className="w-3 h-3" /> MISTA (60%)</p>
            <p className="text-foreground font-bold mt-0.5">{formatBRL(estrategiaMista(rendaDisponivel))}/mês</p>
          </div>
        </div>
      </Card>

      {/* Lista de dívidas */}
      <div className="space-y-3">
        {debts.length === 0 ? (
          <div className="text-center py-12 bg-card/50 rounded-2xl border border-dashed border-border">
            <TrendingDown className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-sm text-muted-foreground">Nenhuma dívida cadastrada</p>
            <Button variant="outline" className="mt-4 rounded-xl" onClick={() => { reset(); setOpenDialog(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Cadastrar dívida
            </Button>
          </div>
        ) : (
          dividasOrdenadas.map((d, idx) => {
            const aviso = sugestaoAutomatica(d);
            const isPrioridade = idx === 0 && (d.juros_mensal || 0) > 0.05;
            const expanded = expandedId === d.id;

            // Simulações
            const valorHard = estrategiaHard(rendaDisponivel) || d.parcela_mensal;
            const valorMista = estrategiaMista(rendaDisponivel) || d.parcela_mensal;
            const simAtual = simular(d, d.parcela_mensal);
            const simHard = simular(d, valorHard);
            const simMista = simular(d, valorMista);
            const economiaHard = simAtual.totalJuros - simHard.totalJuros;
            const economiaMista = simAtual.totalJuros - simMista.totalJuros;
            const sobraMista = rendaDisponivel - valorMista;

            const grafico = gerarGraficoDivida(d, valorMista, Math.min(simMista.meses + 2, 36));

            return (
              <Card key={d.id} className="bg-card border-border/50 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {isPrioridade && (
                          <span className="text-[9px] font-bold uppercase bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded">
                            Prioridade
                          </span>
                        )}
                        <h3 className="font-bold text-foreground truncate">{d.nome}</h3>
                      </div>
                      <p className="text-[11px] text-muted-foreground capitalize">
                        {TIPOS.find(t => t.value === d.tipo)?.label || d.tipo} · venc. dia {d.dia_vencimento}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(d)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => remove(d.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    <div className="bg-muted/50 rounded-lg py-2">
                      <p className="text-[9px] uppercase text-muted-foreground font-bold">Saldo</p>
                      <p className="text-sm font-bold text-foreground">{formatBRL(d.valor_restante)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg py-2">
                      <p className="text-[9px] uppercase text-muted-foreground font-bold">Parcela</p>
                      <p className="text-sm font-bold text-foreground">{formatBRL(d.parcela_mensal)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg py-2">
                      <p className="text-[9px] uppercase text-muted-foreground font-bold">Juros</p>
                      <p className="text-sm font-bold text-amber-500">{((d.juros_mensal || 0) * 100).toFixed(2)}%</p>
                    </div>
                  </div>

                  {aviso && (
                    <div className="flex items-start gap-2 bg-destructive/5 border border-destructive/20 rounded-lg p-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-[11px] text-foreground/80">{aviso}</p>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full justify-between text-xs font-bold uppercase tracking-wider h-9"
                    onClick={() => setExpandedId(expanded ? null : d.id)}
                  >
                    {expanded ? "Ocultar simulação" : "Ver simulação e gráfico"}
                    <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                  </Button>
                </div>

                {expanded && (
                  <div className="border-t border-border/50 p-4 space-y-4 bg-background/50 animate-in fade-in-50">
                    {/* Estratégias */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="bg-muted/50 rounded-xl p-3">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Atual</p>
                        <p className="text-xs">{isFinite(simAtual.meses) ? `${simAtual.meses} meses` : "—"}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">Juros: {formatBRL(simAtual.totalJuros)}</p>
                      </div>
                      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                        <p className="text-[10px] uppercase font-bold text-destructive flex items-center gap-1"><Flame className="w-3 h-3" /> Hard</p>
                        <p className="text-xs font-bold">{simHard.meses} meses · {formatBRL(valorHard)}/mês</p>
                        <p className="text-[11px] text-emerald-500 mt-1">Economia: {formatBRL(Math.max(0, economiaHard))}</p>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                        <p className="text-[10px] uppercase font-bold text-amber-500 flex items-center gap-1"><Scale className="w-3 h-3" /> Mista</p>
                        <p className="text-xs font-bold">{simMista.meses} meses · {formatBRL(valorMista)}/mês</p>
                        <p className="text-[11px] text-emerald-500 mt-1">Sobra: {formatBRL(Math.max(0, sobraMista))}</p>
                        <p className="text-[11px] text-emerald-500">Economia: {formatBRL(Math.max(0, economiaMista))}</p>
                      </div>
                    </div>

                    {/* Gráfico */}
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Evolução do Saldo (Estratégia Mista)</p>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={grafico}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                              formatter={(v: number) => formatBRL(v)}
                              labelFormatter={(l) => `Mês ${l}`}
                            />
                            <Line type="monotone" dataKey="saldo" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* FAB */}
      <Button
        className="fixed bottom-24 right-8 w-14 h-14 rounded-full bg-primary shadow-2xl shadow-primary/40 p-0 flex items-center justify-center z-10"
        onClick={() => { reset(); setOpenDialog(true); }}
      >
        <Plus className="w-7 h-7 text-primary-foreground" />
      </Button>

      {/* Dialog */}
      <Dialog open={openDialog} onOpenChange={(o) => { setOpenDialog(o); if (!o) reset(); }}>
        <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editing ? "Editar Dívida" : "Nova Dívida"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Nome *</label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Nubank, Banco X" className="bg-muted h-12 rounded-xl mt-1" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-muted px-4 text-sm mt-1">
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Valor Total</label>
                <Input type="number" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} placeholder="0.00" className="bg-muted h-12 rounded-xl mt-1" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Saldo Restante *</label>
                <Input type="number" value={valorRestante} onChange={(e) => setValorRestante(e.target.value)} placeholder="0.00" className="bg-muted h-12 rounded-xl mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Parcela Mensal *</label>
                <Input type="number" value={parcelaMensal} onChange={(e) => setParcelaMensal(e.target.value)} placeholder="0.00" className="bg-muted h-12 rounded-xl mt-1" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Juros (% a.m.)</label>
                <Input type="number" step="0.01" value={jurosMensal} onChange={(e) => setJurosMensal(e.target.value)} placeholder="ex: 12" className="bg-muted h-12 rounded-xl mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Total Parc.</label>
                <Input type="number" value={totalParcelasInput} onChange={(e) => setTotalParcelasInput(e.target.value)} placeholder="—" className="bg-muted h-12 rounded-xl mt-1" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Restantes</label>
                <Input type="number" value={parcelasRestantes} onChange={(e) => setParcelasRestantes(e.target.value)} placeholder="—" className="bg-muted h-12 rounded-xl mt-1" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Vence dia</label>
                <Input type="number" min={1} max={31} value={diaVencimento} onChange={(e) => setDiaVencimento(e.target.value)} className="bg-muted h-12 rounded-xl mt-1" />
              </div>
            </div>
            <Button onClick={save} className="w-full h-14 rounded-2xl text-base font-bold">
              {editing ? "Atualizar" : "Salvar Dívida"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
