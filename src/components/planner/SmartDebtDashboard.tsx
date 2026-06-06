import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Lightbulb, AlertTriangle, TrendingDown, Snowflake, Brain, HandCoins } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebts } from "@/hooks/use-finance-data";
import {
  smartPriority,
  avalancheStrategy,
  snowballStrategy,
  shouldAmortize,
  shouldNegotiate,
  debtScore,
} from "@/financial/debtEngine";
import { forecastMonth } from "@/financial/forecastEngine";
import { analyzeFinancialRisk } from "@/financial/notificationEngine";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const monthYear = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function SmartDebtDashboard() {
  const { user } = useAuth();
  const my = monthYear();
  const { data: debts = [] } = useDebts();

  const { data: finance } = useQuery({
    queryKey: ["smart-finance", user?.id, my],
    enabled: !!user?.id,
    queryFn: async () => {
      const [sal, extra, accs] = await Promise.all([
        supabase.from("salary" as any).select("amount").eq("user_id", user!.id).eq("month_year", my).maybeSingle(),
        supabase.from("extra_income").select("amount").eq("user_id", user!.id).eq("month_year", my),
        supabase.from("accounts").select("amount").eq("user_id", user!.id).eq("is_template", false).eq("month_year", my),
      ]);
      const salario = Number((sal.data as any)?.amount ?? 0);
      const rendaExtra = (extra.data ?? []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
      const contas = (accs.data ?? []).map((a: any) => ({ valor: Number(a.amount || 0) }));
      return { salario, rendaExtra, contas };
    },
  });

  const saldoAtual = useMemo(() => {
    if (!finance) return 0;
    const renda = finance.salario + finance.rendaExtra;
    const gastos = finance.contas.reduce((s, c) => s + c.valor, 0);
    const parc = debts.reduce((s, d) => s + (d.valorParcela || 0), 0);
    return renda - gastos - parc;
  }, [finance, debts]);

  const previsao = useMemo(() => {
    if (!finance) return 0;
    return forecastMonth({
      salario: finance.salario,
      rendaExtra: finance.rendaExtra,
      contas: finance.contas,
      dividas: debts.map((d) => ({ valorParcela: d.valorParcela })),
    });
  }, [finance, debts]);

  const smart = useMemo(() => smartPriority([...debts]), [debts]);
  const avalanche = useMemo(() => avalancheStrategy([...debts]), [debts]);
  const snowball = useMemo(() => snowballStrategy([...debts]), [debts]);
  const prioritaria = smart[0];
  const risco = analyzeFinancialRisk(previsao);

  if (!debts.length) {
    return (
      <Card className="p-6 text-center bg-card/50 border-dashed">
        <Brain className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Cadastre suas dívidas para ativar a inteligência de priorização.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Prioridade */}
      {prioritaria && (
        <Card className="p-5 bg-gradient-to-br from-red-500/10 via-amber-500/5 to-transparent border border-red-500/30">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-400" />
              <h3 className="font-heading font-bold text-foreground">Dívida prioritária</h3>
            </div>
            <Badge variant="outline" className="border-red-400/40 text-red-300 bg-red-500/10">
              Score {Math.round(debtScore(prioritaria))}
            </Badge>
          </div>
          <p className="text-xl font-bold text-foreground">{prioritaria.nome}</p>
          <p className="text-xs text-muted-foreground mb-3">{prioritaria.banco}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-background/40 rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground">Juros</p>
              <p className="text-sm font-bold text-red-300">{prioritaria.jurosMensal.toFixed(1)}%</p>
            </div>
            <div className="bg-background/40 rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground">Parcela</p>
              <p className="text-sm font-bold text-foreground">{fmt(prioritaria.valorParcela)}</p>
            </div>
            <div className="bg-background/40 rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground">Restante</p>
              <p className="text-sm font-bold text-foreground">{prioritaria.parcelasRestantes}x</p>
            </div>
          </div>
        </Card>
      )}

      {/* Sugestões IA */}
      <Card className="p-5 bg-card border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-amber-300" />
          <h3 className="font-heading font-bold text-foreground">Sugestões inteligentes</h3>
        </div>
        <div className="space-y-2">
          {debts.map((d) => {
            const amortizar = shouldAmortize(d, saldoAtual);
            const negociar = shouldNegotiate(d, saldoAtual);
            if (!amortizar && !negociar) return null;
            return (
              <div key={d.id} className="flex items-start gap-2 p-3 rounded-lg bg-background/50 border border-border/60">
                <HandCoins className="w-4 h-4 mt-0.5 text-emerald-accent shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{d.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {amortizar && "Amortize parcelas finais para reduzir juros. "}
                    {negociar && "Você tem caixa para negociar quitação à vista."}
                  </p>
                </div>
              </div>
            );
          })}
          {!debts.some((d) => shouldAmortize(d, saldoAtual) || shouldNegotiate(d, saldoAtual)) && (
            <p className="text-xs text-muted-foreground">Nenhuma ação prioritária no momento. Mantenha o pagamento em dia.</p>
          )}
        </div>
      </Card>

      {/* Risco futuro */}
      <Card
        className={cn(
          "p-5 border",
          risco?.type === "danger" && "border-red-500/40 bg-red-500/5",
          risco?.type === "warning" && "border-amber-500/40 bg-amber-500/5",
          !risco && "border-emerald-accent/30 bg-emerald-accent/5",
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className={cn(
            "w-5 h-5",
            risco?.type === "danger" && "text-red-400",
            risco?.type === "warning" && "text-amber-300",
            !risco && "text-emerald-accent",
          )} />
          <h3 className="font-heading font-bold text-foreground">Previsão do mês</h3>
        </div>
        <p className="text-2xl font-bold text-foreground">{fmt(previsao)}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {risco ? risco.message : "Cenário saudável para o próximo mês."}
        </p>
      </Card>

      {/* Comparativo estratégias */}
      <Card className="p-5 bg-card border border-border">
        <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-sky-accent" />
          Comparativo de estratégias
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StrategyCol icon={<Flame className="w-4 h-4 text-red-400" />} title="Avalanche" subtitle="Maior juro" items={avalanche.slice(0, 3)} />
          <StrategyCol icon={<Snowflake className="w-4 h-4 text-sky-accent" />} title="Snowball" subtitle="Menor saldo" items={snowball.slice(0, 3)} />
          <StrategyCol icon={<Brain className="w-4 h-4 text-emerald-accent" />} title="Smart" subtitle="IA híbrida" items={smart.slice(0, 3)} />
        </div>
      </Card>
    </div>
  );
}

function StrategyCol({
  icon, title, subtitle, items,
}: { icon: React.ReactNode; title: string; subtitle: string; items: any[] }) {
  return (
    <div className="rounded-lg bg-background/40 p-3 border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <ol className="space-y-1">
        {items.map((d, i) => (
          <li key={d.id} className="text-xs text-muted-foreground flex justify-between">
            <span className="truncate"><span className="text-foreground/70 font-medium mr-1">{i + 1}.</span>{d.nome}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
