import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  Wallet,
  Receipt,
  CreditCard,
  PiggyBank,
  Trophy,
  Flame,
  ArrowRight,
  Calendar,
  Sparkles,
  Gauge,
  Lightbulb,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useDebts, useGoals } from "@/hooks/use-finance-data";
import { runForecast, Strategy } from "@/financial/forecastSimulation";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const monthYear = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const STRATEGY_LABEL: Record<Strategy, string> = {
  avalanche: "Avalanche (maior juro)",
  snowball: "Snowball (menor saldo)",
  smart: "Smart (IA híbrida)",
};

function calcScore(args: {
  saldoLivre: number;
  receita: number;
  parcelas: number;
  contas: number;
  debtsCount: number;
  goalsCount: number;
  investimentos: number;
}) {
  const { saldoLivre, receita, parcelas, contas, debtsCount, goalsCount, investimentos } = args;
  let score = 50;
  // Dívidas vs renda (até -30)
  const ratio = receita > 0 ? (parcelas + contas) / receita : 1;
  if (ratio < 0.5) score += 20;
  else if (ratio < 0.7) score += 10;
  else if (ratio > 0.9) score -= 20;
  else if (ratio > 1) score -= 30;
  // Saldo livre (até +15)
  if (saldoLivre > receita * 0.2) score += 15;
  else if (saldoLivre > 0) score += 5;
  else score -= 10;
  // Investimentos
  if (investimentos > 0) score += 10;
  // Metas
  if (goalsCount > 0) score += 5;
  // Sem dívidas = excelente
  if (debtsCount === 0) score += 15;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export default function ForecastReport() {
  const { user } = useAuth();
  const my = monthYear();
  const { data: debts = [] } = useDebts();
  const { data: goals = [] } = useGoals();
  const [strategy, setStrategy] = useState<Strategy>("avalanche");
  const [horizon, setHorizon] = useState<3 | 6 | 12>(12);

  const { data: finance } = useQuery({
    queryKey: ["forecast-finance", user?.id, my],
    enabled: !!user?.id,
    queryFn: async () => {
      const [sal, extra, accs, inv] = await Promise.all([
        supabase.from("salary" as any).select("amount").eq("user_id", user!.id).eq("month_year", my).maybeSingle(),
        supabase.from("extra_income").select("amount").eq("user_id", user!.id).eq("month_year", my),
        supabase.from("accounts").select("amount,billing_type,tipo").eq("user_id", user!.id).eq("is_template", false).eq("month_year", my),
        supabase.from("investments" as any).select("amount").eq("user_id", user!.id),
      ]);
      const salario = Number((sal.data as any)?.amount ?? 0);
      const rendaExtra = (extra.data ?? []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
      const contas = (accs.data ?? [])
        .filter((a: any) => a.billing_type !== "debt" && a.tipo !== "divida")
        .reduce((s: number, a: any) => s + Number(a.amount || 0), 0);
      const investimentos = (inv.data ?? []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
      return { salario, rendaExtra, contas, investimentos };
    },
  });

  const receita = (finance?.salario ?? 0) + (finance?.rendaExtra ?? 0);
  const contasMensais = finance?.contas ?? 0;
  const parcelasTotais = debts.reduce((s, d) => s + d.valorParcela, 0);
  const saldoLivre = Math.max(0, receita - contasMensais - parcelasTotais);

  const forecast = useMemo(
    () =>
      runForecast({
        debts,
        receita,
        contas: contasMensais,
        saldoLivre,
        strategy,
        horizonMonths: horizon,
      }),
    [debts, receita, contasMensais, saldoLivre, strategy, horizon],
  );

  const maxSaldoDevedor = Math.max(1, ...forecast.months.map((m) => m.saldoDevedorTotal));

  const score = calcScore({
    saldoLivre,
    receita,
    parcelas: parcelasTotais,
    contas: contasMensais,
    debtsCount: debts.length,
    goalsCount: goals.length,
    investimentos: finance?.investimentos ?? 0,
  });

  const priorityDebt = forecast.timeline.sort((a, b) => a.mesesAteQuitar - b.mesesAteQuitar)[0];
  const scoreLabel =
    score >= 80 ? "Excelente" : score >= 60 ? "Bom" : score >= 40 ? "Atenção" : "Crítico";
  const scoreColor =
    score >= 80 ? "text-emerald-accent" : score >= 60 ? "text-sky-accent" : score >= 40 ? "text-amber-300" : "text-red-400";

  if (!debts.length) {
    return (
      <Card className="p-6 text-center bg-card/50 border-dashed">
        <Sparkles className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Cadastre suas dívidas para gerar a previsão financeira.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header / Controles */}
      <Card className="p-4 bg-gradient-to-br from-emerald-accent/10 via-sky-accent/5 to-transparent border border-emerald-accent/30">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-emerald-accent" />
          <h3 className="font-heading font-bold text-foreground">Relatório de Previsão Financeira</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {([3, 6, 12] as const).map((h) => (
            <Button
              key={h}
              size="sm"
              variant={horizon === h ? "default" : "outline"}
              onClick={() => setHorizon(h)}
              className="text-xs"
            >
              Próx. {h} meses
            </Button>
          ))}
          <div className="w-full" />
          {(["avalanche", "snowball", "smart"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={strategy === s ? "default" : "outline"}
              onClick={() => setStrategy(s)}
              className="text-xs capitalize"
            >
              {s}
            </Button>
          ))}
        </div>
      </Card>

      {/* Resumo Executivo */}
      <Card className="p-5 bg-card border border-border">
        <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-300" />
          Resumo Executivo
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <Stat icon={<Wallet className="w-4 h-4 text-emerald-accent" />} label="Renda Mensal" value={fmt(receita)} />
          <Stat icon={<Receipt className="w-4 h-4 text-sky-accent" />} label="Contas Mensais" value={fmt(contasMensais)} />
          <Stat icon={<CreditCard className="w-4 h-4 text-red-400" />} label="Dívidas (parcelas)" value={fmt(parcelasTotais)} />
          <Stat icon={<PiggyBank className="w-4 h-4 text-amber-300" />} label="Saldo Livre" value={fmt(saldoLivre)} />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2">
          <div className="flex items-center justify-between bg-background/40 rounded-lg p-3 border border-border/60">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Estratégia atual</p>
              <p className="text-sm font-bold text-foreground">{STRATEGY_LABEL[strategy]}</p>
            </div>
            <Flame className="w-5 h-5 text-amber-300" />
          </div>
          <div className="flex items-center justify-between bg-background/40 rounded-lg p-3 border border-border/60">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Previsão de quitação total</p>
              <p className="text-sm font-bold text-foreground">
                {forecast.mesQuitacaoFinal ?? `> ${horizon} meses`}
              </p>
            </div>
            <Calendar className="w-5 h-5 text-sky-accent" />
          </div>
          <div className="flex items-center justify-between bg-emerald-accent/5 rounded-lg p-3 border border-emerald-accent/30">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Economia estimada em juros</p>
              <p className="text-lg font-bold text-emerald-accent">{fmt(forecast.economiaJuros)}</p>
            </div>
            <Sparkles className="w-5 h-5 text-emerald-accent" />
          </div>
        </div>
      </Card>

      {/* Linha do Tempo das Dívidas */}
      <Card className="p-5 bg-card border border-border">
        <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-accent" />
          Linha do Tempo das Dívidas
        </h3>
        <div className="overflow-x-auto -mx-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Dívida</TableHead>
                <TableHead className="text-xs text-right">Saldo</TableHead>
                <TableHead className="text-xs text-right">Parcela</TableHead>
                <TableHead className="text-xs text-right">Término</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...forecast.timeline]
                .sort((a, b) => a.mesesAteQuitar - b.mesesAteQuitar)
                .map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="py-2">
                      <div className="text-sm font-medium text-foreground truncate max-w-[120px]">{t.nome}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">{t.banco}</div>
                    </TableCell>
                    <TableCell className="py-2 text-right text-sm text-foreground">{fmt(t.saldoAtual)}</TableCell>
                    <TableCell className="py-2 text-right text-sm text-foreground">{fmt(t.parcela)}</TableCell>
                    <TableCell className="py-2 text-right">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          t.mesTermino === "—"
                            ? "border-amber-500/40 text-amber-300 bg-amber-500/10"
                            : "border-emerald-accent/40 text-emerald-accent bg-emerald-accent/10",
                        )}
                      >
                        {t.mesTermino}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Prioridade dos Próximos Meses + Efeito Cascata */}
      <Card className="p-5 bg-card border border-border">
        <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-400" />
          Prioridade & Efeito Cascata
        </h3>
        <div className="space-y-2">
          {forecast.months.map((m) => (
            <div
              key={m.monthYear}
              className={cn(
                "rounded-lg p-3 border",
                m.quitadas.length
                  ? "border-emerald-accent/40 bg-emerald-accent/5"
                  : "border-border/60 bg-background/40",
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold text-foreground">{m.label}</p>
                <span className="text-[10px] text-muted-foreground">
                  Saldo devedor: {fmt(m.saldoDevedorTotal)}
                </span>
              </div>
              {m.quitadas.length > 0 && (
                <div className="mb-1.5 flex flex-wrap gap-1.5">
                  {m.quitadas.map((q) => (
                    <Badge
                      key={q.id}
                      className="text-[10px] bg-emerald-accent/20 text-emerald-accent border border-emerald-accent/40"
                    >
                      <Trophy className="w-3 h-3 mr-1" />
                      {q.nome} quitada · libera {fmt(q.parcelaLiberada)}
                    </Badge>
                  ))}
                </div>
              )}
              <ol className="text-xs text-muted-foreground space-y-0.5">
                {m.prioridades.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-1.5">
                    <span className="text-foreground/70 font-semibold">{i + 1}°</span>
                    <span className="truncate">{p.nome}</span>
                    {i === 0 && <ArrowRight className="w-3 h-3 text-amber-300 ml-auto" />}
                  </li>
                ))}
                {m.prioridades.length === 0 && (
                  <li className="text-emerald-accent font-medium">🎉 Todas as dívidas quitadas!</li>
                )}
              </ol>
            </div>
          ))}
        </div>
      </Card>

      {/* Gráfico de Saldo Devedor (barras horizontais) */}
      <Card className="p-5 bg-card border border-border">
        <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-accent rotate-180" />
          Evolução do Saldo Devedor
        </h3>
        <div className="space-y-1.5">
          {forecast.months.map((m) => {
            const pct = (m.saldoDevedorTotal / maxSaldoDevedor) * 100;
            return (
              <div key={m.monthYear} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-16 shrink-0">{m.label}</span>
                <div className="flex-1 h-5 bg-background/40 rounded-md overflow-hidden border border-border/40">
                  <div
                    className="h-full bg-gradient-to-r from-red-500/60 to-amber-400/60 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-foreground/80 w-20 text-right tabular-nums">
                  {fmt(m.saldoDevedorTotal)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-background/40 rounded-lg p-3 border border-border/60">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] text-muted-foreground uppercase">{label}</span>
      </div>
      <p className="text-sm font-bold text-foreground tabular-nums">{value}</p>
    </div>
  );
}
