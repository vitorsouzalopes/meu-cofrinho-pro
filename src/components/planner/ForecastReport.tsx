import { useMemo, useState, useRef } from "react";
import { exportForecastPDF } from "@/lib/forecast-pdf";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  TrendingUp,
  Wallet,
  Receipt,
  CreditCard,
  PiggyBank,
  Trophy,
  Flame,
  Calendar,
  Sparkles,
  Gauge,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Zap,
  Rocket,
  Scale,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useDebts, useGoals } from "@/hooks/use-finance-data";
import type { Strategy } from "@/financial/forecastSimulation";
import type { Debt } from "@/financial/types";
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
  smart: "Fluxo de Caixa (maior parcela)",
};

const STRATEGY_SHORT_LABEL: Record<Strategy, string> = {
  avalanche: "Avalanche",
  snowball: "Snowball",
  smart: "Fluxo de Caixa",
};

type Profile = "conservador" | "moderado" | "agressivo";
type Usage = "hard" | "mista";

const PROFILE_PCT: Record<Profile, number> = {
  conservador: 0.30,
  moderado: 0.20,
  agressivo: 0.10,
};
const USAGE_PCT: Record<Usage, number> = { hard: 0.9, mista: 0.5 };
const MAX_SIMULATION_MONTHS = 360;

interface PayoffProjection {
  meses: number;
  termino: string;
  jurosTotal: number;
  extraMensal: number;
  economiaTempo: number;
  economiaJuros: number;
  valorLivrePreservado: number;
  balances: number[];
}

export interface DebtSimulation {
  id: string;
  nome: string;
  banco: string;
  saldoDevedor: number;
  parcelaMensal: number;
  jurosMensal: number;
  normal: PayoffProjection;
  hard: PayoffProjection;
  mista: PayoffProjection;
}

export interface EvolutionRow {
  label: string;
  normal: number;
  hard: number;
  mista: number;
  selected: number;
}

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
  const ratio = receita > 0 ? (parcelas + contas) / receita : 1;
  if (ratio < 0.5) score += 20;
  else if (ratio < 0.7) score += 10;
  else if (ratio > 0.9) score -= 20;
  else if (ratio > 1) score -= 30;
  if (saldoLivre > receita * 0.2) score += 15;
  else if (saldoLivre > 0) score += 5;
  else score -= 10;
  if (investimentos > 0) score += 10;
  if (goalsCount > 0) score += 5;
  if (debtsCount === 0) score += 15;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function formatMonthFromNow(months: number) {
  if (months >= MAX_SIMULATION_MONTHS) return "—";
  const d = addMonths(new Date(new Date().getFullYear(), new Date().getMonth(), 1), months - 1);
  const labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${labels[d.getMonth()]}/${d.getFullYear()}`;
}

function formatMonthLabel(offset: number) {
  const d = addMonths(new Date(new Date().getFullYear(), new Date().getMonth(), 1), offset);
  const labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${labels[d.getMonth()]}/${d.getFullYear()}`;
}

function simulateSingleDebt(debt: Debt, extraMensal: number, saldoLivre: number) {
  let saldo = Math.max(0, Number(debt.valorTotal || 0));
  const parcela = Math.max(0, Number(debt.valorParcela || 0));
  const juros = Math.max(0, Number(debt.jurosMensal || 0)) / 100;
  const pagamentoBase = parcela + Math.max(0, extraMensal);
  let jurosTotal = 0;
  const balances: number[] = [];

  if (saldo <= 0 || pagamentoBase <= 0) {
    return {
      meses: MAX_SIMULATION_MONTHS,
      termino: "—",
      jurosTotal: 0,
      balances: Array.from({ length: MAX_SIMULATION_MONTHS }, () => saldo),
    };
  }

  for (let mes = 1; mes <= MAX_SIMULATION_MONTHS; mes++) {
    const jurosMes = saldo * juros;
    saldo += jurosMes;
    jurosTotal += jurosMes;

    const pagamento = Math.min(pagamentoBase, saldo);
    saldo = Math.max(0, saldo - pagamento);
    balances.push(saldo);

    if (saldo <= 0.01) {
      while (balances.length < MAX_SIMULATION_MONTHS) balances.push(0);
      return {
        meses: mes,
        termino: formatMonthFromNow(mes),
        jurosTotal,
        balances,
      };
    }
  }

  return {
    meses: MAX_SIMULATION_MONTHS,
    termino: "—",
    jurosTotal,
    balances,
  };
}

function buildProjection(debt: Debt, extraMensal: number, saldoLivre: number, normal?: PayoffProjection): PayoffProjection {
  const raw = simulateSingleDebt(debt, extraMensal, saldoLivre);
  const normalProjection = normal;
  return {
    ...raw,
    extraMensal,
    economiaTempo: normalProjection ? Math.max(0, normalProjection.meses - raw.meses) : 0,
    economiaJuros: normalProjection ? Math.max(0, normalProjection.jurosTotal - raw.jurosTotal) : 0,
    valorLivrePreservado: Math.max(0, saldoLivre - extraMensal),
  };
}

function buildDebtSimulation(debt: Debt, saldoLivre: number, saldoUtilizavel: number): DebtSimulation {
  const normal = buildProjection(debt, 0, saldoLivre);
  const hard = buildProjection(debt, saldoUtilizavel * USAGE_PCT.hard, saldoLivre, normal);
  const mista = buildProjection(debt, saldoUtilizavel * USAGE_PCT.mista, saldoLivre, normal);
  return {
    id: debt.id,
    nome: debt.nome,
    banco: debt.banco,
    saldoDevedor: debt.valorTotal,
    parcelaMensal: debt.valorParcela,
    jurosMensal: debt.jurosMensal,
    normal,
    hard,
    mista,
  };
}

function formatDuration(months: number) {
  if (months >= MAX_SIMULATION_MONTHS) return `> ${MAX_SIMULATION_MONTHS}m`;
  if (months <= 1) return "1 mês";
  return `${months} meses`;
}

function sortSimulations(items: DebtSimulation[], strategy: Strategy) {
  const arr = [...items];
  if (strategy === "avalanche") return arr.sort((a, b) => b.jurosMensal - a.jurosMensal);
  if (strategy === "snowball") return arr.sort((a, b) => a.saldoDevedor - b.saldoDevedor);
  return arr.sort((a, b) => b.parcelaMensal - a.parcelaMensal || b.jurosMensal - a.jurosMensal);
}

interface ForecastReportProps {
  debts?: Debt[];
}

export default function ForecastReport({ debts: debtsProp }: ForecastReportProps = {}) {
  const { user } = useAuth();
  const my = monthYear();
  const { data: debtsHook = [] } = useDebts();
  const debts = useMemo(() => {
    const seenIds = new Set<string>();
    const seenKeys = new Set<string>();
    return [...(debtsProp ?? []), ...debtsHook]
      .map((debt) => {
        const parcela = Number(debt.valorParcela || 0);
        const saldo = Number(debt.valorTotal || 0) || parcela * Math.max(1, Number(debt.parcelasRestantes || 1));
        return {
          ...debt,
          nome: debt.nome || debt.banco || "Dívida",
          banco: debt.banco || debt.nome || "Instituição",
          valorTotal: saldo,
          valorParcela: parcela,
          parcelasRestantes: Math.max(1, Number(debt.parcelasRestantes || Math.ceil(saldo / Math.max(1, parcela)))),
          jurosMensal: Number(debt.jurosMensal || 0),
        };
      })
      .filter((debt) => debt.valorTotal > 0 && debt.valorParcela > 0)
      .filter((debt) => {
        if (debt.id) {
          if (seenIds.has(debt.id)) return false;
          seenIds.add(debt.id);
        }
        const key = `${debt.id || ""}|${debt.nome.toLowerCase()}|${debt.banco.toLowerCase()}|${debt.valorTotal}|${debt.valorParcela}`;
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
      });
  }, [debtsProp, debtsHook]);
  const { data: goals = [] } = useGoals();
  const [strategy, setStrategy] = useState<Strategy>(
    () => (localStorage.getItem("cofrinho:strategy") as Strategy) || "avalanche",
  );
  const [usage, setUsage] = useState<Usage>(
    () => (localStorage.getItem("cofrinho:usage") as Usage) || "hard",
  );
  const [profile, setProfile] = useState<Profile>(
    () => (localStorage.getItem("cofrinho:profile") as Profile) || "moderado",
  );
  const [horizon, setHorizon] = useState<3 | 6 | 12>(12);

  const persist = (key: string, val: string) => localStorage.setItem(`cofrinho:${key}`, val);

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
  const reservaMinima = saldoLivre * PROFILE_PCT[profile];
  const saldoUtilizavel = Math.max(0, saldoLivre - reservaMinima);
  const extraDirigido = saldoUtilizavel * USAGE_PCT[usage];

  const debtSimulations = useMemo(
    () => sortSimulations(debts.map((debt) => buildDebtSimulation(debt, saldoLivre, saldoUtilizavel)), strategy),
    [debts, saldoLivre, saldoUtilizavel, strategy],
  );

  const selectedScenario = usage;
  const selectedScenarioLabel = usage === "hard" ? "Hard" : "Mista";
  const totalSaldoDevedor = debts.reduce((s, d) => s + d.valorTotal, 0);
  const normalQuitacaoMeses = Math.max(0, ...debtSimulations.map((d) => d.normal.meses));
  const hardQuitacaoMeses = Math.max(0, ...debtSimulations.map((d) => d.hard.meses));
  const mistaQuitacaoMeses = Math.max(0, ...debtSimulations.map((d) => d.mista.meses));
  const selectedQuitacaoMeses = selectedScenario === "hard" ? hardQuitacaoMeses : mistaQuitacaoMeses;
  const selectedTermino = selectedQuitacaoMeses ? formatMonthFromNow(selectedQuitacaoMeses) : "—";
  const hardEconomiaJuros = debtSimulations.reduce((s, d) => s + d.hard.economiaJuros, 0);
  const mistaEconomiaJuros = debtSimulations.reduce((s, d) => s + d.mista.economiaJuros, 0);
  const selectedEconomiaJuros = selectedScenario === "hard" ? hardEconomiaJuros : mistaEconomiaJuros;
  const selectedEconomiaTempo = Math.max(0, normalQuitacaoMeses - selectedQuitacaoMeses);
  const selectedValorLivrePreservado = Math.max(0, saldoLivre - extraDirigido);

  const evolutionData = useMemo<EvolutionRow[]>(
    () =>
      Array.from({ length: horizon }, (_, index) => {
        const monthIndex = index + 1;
        const normal = debtSimulations.reduce((sum, debt) => sum + (debt.normal.balances[monthIndex - 1] ?? 0), 0);
        const hard = debtSimulations.reduce((sum, debt) => sum + (debt.hard.balances[monthIndex - 1] ?? 0), 0);
        const mista = debtSimulations.reduce((sum, debt) => sum + (debt.mista.balances[monthIndex - 1] ?? 0), 0);
        return {
          label: formatMonthLabel(index),
          normal,
          hard,
          mista,
          selected: selectedScenario === "hard" ? hard : mista,
        };
      }),
    [debtSimulations, horizon, selectedScenario],
  );

  const maxSaldoDevedor = Math.max(
    1,
    totalSaldoDevedor,
    ...evolutionData.flatMap((m) => [m.normal, m.hard, m.mista, m.selected]),
  );

  const score = calcScore({
    saldoLivre,
    receita,
    parcelas: parcelasTotais,
    contas: contasMensais,
    debtsCount: debts.length,
    goalsCount: goals.length,
    investimentos: finance?.investimentos ?? 0,
  });

  const scoreLabel =
    score >= 80 ? "Excelente" : score >= 60 ? "Bom" : score >= 40 ? "Atenção" : "Crítico";
  const scoreColor =
    score >= 80 ? "text-emerald-accent" : score >= 60 ? "text-sky-accent" : score >= 40 ? "text-amber-300" : "text-red-400";

  // Modo Crise
  const ratio = receita > 0 ? (parcelasTotais + contasMensais) / receita : 1;
  const crisisActive = saldoLivre <= 0 || ratio >= 0.9;

  // Previsão de sobra futura (saldo livre + parcelas liberadas nas simulações individuais)
  const surplusFuture = (m: number) => {
    const liberado = debtSimulations
      .filter((debt) => debt[selectedScenario].meses <= m)
      .reduce((s, debt) => s + debt.parcelaMensal, 0);
    return saldoLivre + liberado;
  };

  // Motor de Oportunidades — usa investimentos como "guardado"
  const guardado = finance?.investimentos ?? 0;
  const oportunidades = useMemo(() => {
    return debts
      .map((d) => {
        const falta = Math.max(0, d.valorTotal - guardado);
        const proximidade = guardado / Math.max(1, d.valorTotal);
        return { debt: d, falta, proximidade };
      })
      .filter((o) => o.proximidade >= 0.6 && o.falta <= saldoUtilizavel * 6)
      .sort((a, b) => b.proximidade - a.proximidade)
      .slice(0, 3);
  }, [debts, guardado, saldoUtilizavel]);

  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      console.log("[PDF] Exportando relatório", {
        debts: debts.length,
        simulations: debtSimulations.length,
        strategy,
        usage,
      });
      await exportForecastPDF({
        debts,
        debtSimulations,
        evolutionData,
        receita,
        contas: contasMensais,
        parcelas: parcelasTotais,
        totalSaldoDevedor,
        saldoLivre,
        reservaMinima,
        saldoUtilizavel,
        extraDirigido,
        strategy,
        usage,
        profile,
        horizon,
        score,
        normalQuitacaoMeses,
        hardQuitacaoMeses,
        mistaQuitacaoMeses,
        selectedEconomiaJuros,
        selectedEconomiaTempo,
        selectedValorLivrePreservado,
      });
      toast({ title: "PDF gerado", description: `Relatório com ${debts.length} dívida(s) exportado.` });
    } catch (e) {
      console.error("Erro PDF:", e);
      toast({ title: "Erro ao gerar PDF", description: String((e as Error)?.message || e), variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

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
      <div ref={reportRef} className="space-y-4">
      {/* Modo Crise */}
      {crisisActive && (
        <Card className="p-4 bg-gradient-to-br from-red-500/15 to-transparent border border-red-500/50">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-heading font-bold text-red-300">Modo Crise ativado</h3>
              <p className="text-xs text-foreground/80 mt-1">
                Seu saldo livre é insuficiente ({fmt(saldoLivre)}) ou suas contas + parcelas
                consomem {Math.round(ratio * 100)}% da renda.
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-0.5 list-disc list-inside">
                <li>Suspenda metas e novos investimentos</li>
                <li>Pague apenas parcelas mínimas</li>
                <li>Negocie juros, vencimentos ou parcelas das dívidas mais pesadas</li>
                <li>Priorize sobrevivência financeira</li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Header / Controles */}
      <Card className="p-4 bg-gradient-to-br from-emerald-accent/10 via-sky-accent/5 to-transparent border border-emerald-accent/30">
        <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-accent" />
            <h3 className="font-heading font-bold text-foreground">Relatório de Previsão Financeira</h3>
          </div>
          <Button
            type="button" data-html2canvas-ignore="true"
            onClick={handleExportPDF}
            disabled={exporting}
            className="w-full bg-emerald-accent hover:bg-emerald-accent/90 sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? "Gerando PDF..." : "Gerar Relatório PDF"}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground uppercase mb-1">Horizonte</p>
        <div className="flex flex-wrap gap-2 mb-3">
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
        </div>

        <p className="text-[10px] text-muted-foreground uppercase mb-1">Ordenação das simulações</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {(["avalanche", "snowball", "smart"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={strategy === s ? "default" : "outline"}
              onClick={() => { setStrategy(s); persist("strategy", s); }}
              className="text-xs"
            >
              {STRATEGY_SHORT_LABEL[s]}
            </Button>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground uppercase mb-1">Uso do saldo utilizável</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {(["hard", "mista"] as const).map((u) => (
            <Button
              key={u}
              size="sm"
              variant={usage === u ? "default" : "outline"}
              onClick={() => { setUsage(u); persist("usage", u); }}
              className="text-xs capitalize"
            >
              {u} ({Math.round(USAGE_PCT[u] * 100)}%)
            </Button>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground uppercase mb-1">Nível de segurança</p>
        <div className="flex flex-wrap gap-2">
          {(["conservador", "moderado", "agressivo"] as const).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={profile === p ? "default" : "outline"}
              onClick={() => { setProfile(p); persist("profile", p); }}
              className="text-xs capitalize"
            >
              {p === "conservador" && <Shield className="w-3 h-3 mr-1" />}
              {p === "moderado" && <ShieldCheck className="w-3 h-3 mr-1" />}
              {p === "agressivo" && <Flame className="w-3 h-3 mr-1" />}
              {p} ({Math.round(PROFILE_PCT[p] * 100)}%)
            </Button>
          ))}
        </div>
      </Card>

      {/* Saldo Livre x Saldo Utilizável */}
      <Card className="p-5 bg-card border border-border">
        <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-amber-300" />
          Saldo Livre x Utilizável
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <Stat icon={<PiggyBank className="w-4 h-4 text-amber-300" />} label="Saldo Livre" value={fmt(saldoLivre)} />
          <Stat icon={<Shield className="w-4 h-4 text-sky-accent" />} label={`Reserva (${Math.round(PROFILE_PCT[profile] * 100)}%)`} value={fmt(reservaMinima)} />
          <Stat icon={<Zap className="w-4 h-4 text-emerald-accent" />} label="Utilizável" value={fmt(saldoUtilizavel)} />
        </div>
        <div className="mt-3 p-3 rounded-lg bg-emerald-accent/5 border border-emerald-accent/30">
          <p className="text-[10px] text-muted-foreground uppercase">Extra direcionado às dívidas ({usage} · {Math.round(USAGE_PCT[usage] * 100)}%)</p>
          <p className="text-lg font-bold text-emerald-accent">{fmt(extraDirigido)}/mês</p>
        </div>
      </Card>

      {/* Comparação Hard x Mista */}
      <Card className="p-5 bg-card border border-border">
        <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
          <Scale className="w-5 h-5 text-sky-accent" />
          Comparação Hard x Mista
        </h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          Simulação individual de todas as dívidas variando apenas o uso do saldo utilizável.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Modo</TableHead>
              <TableHead className="text-xs text-right">Extra/mês</TableHead>
              <TableHead className="text-xs text-right">Quitação</TableHead>
              <TableHead className="text-xs text-right">Economia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className={cn(usage === "hard" && "bg-emerald-accent/10")}>
              <TableCell className="py-2 text-sm font-medium">Hard (90%)</TableCell>
              <TableCell className="py-2 text-right text-sm">{fmt(saldoUtilizavel * 0.9)}</TableCell>
              <TableCell className="py-2 text-right text-sm">{formatDuration(hardQuitacaoMeses)}</TableCell>
              <TableCell className="py-2 text-right text-sm text-emerald-accent">{fmt(hardEconomiaJuros)}</TableCell>
            </TableRow>
            <TableRow className={cn(usage === "mista" && "bg-sky-accent/10")}>
              <TableCell className="py-2 text-sm font-medium">Mista (50%)</TableCell>
              <TableCell className="py-2 text-right text-sm">{fmt(saldoUtilizavel * 0.5)}</TableCell>
              <TableCell className="py-2 text-right text-sm">{formatDuration(mistaQuitacaoMeses)}</TableCell>
              <TableCell className="py-2 text-right text-sm text-emerald-accent">{fmt(mistaEconomiaJuros)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      {/* Motor de Oportunidades */}
      {oportunidades.length > 0 && (
        <Card className="p-5 bg-gradient-to-br from-fuchsia-500/10 to-transparent border border-fuchsia-500/40">
          <h3 className="font-heading font-bold text-foreground mb-2 flex items-center gap-2">
            <Rocket className="w-5 h-5 text-fuchsia-300" />
            Motor de Oportunidades
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Você possui <span className="text-foreground font-bold">{fmt(guardado)}</span> guardados.
          </p>
          <div className="space-y-2">
            {oportunidades.map(({ debt, falta }) => (
              <div key={debt.id} className="p-3 rounded-lg bg-background/40 border border-border/60">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-foreground">{debt.nome}</p>
                  <Badge className="text-[10px] bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40">
                    🔥 Oportunidade
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Saldo: {fmt(debt.valorTotal)} · Faltam {fmt(falta)} para quitar
                </p>
                <p className="text-xs text-emerald-accent mt-1">
                  Liberaria {fmt(debt.valorParcela)}/mês de fluxo de caixa.
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Previsão de Sobra Futura */}
      <Card className="p-5 bg-card border border-border">
        <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-accent" />
          Previsão de Sobra Futura
        </h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          Saldo livre projetado considerando parcelas liberadas a cada dívida quitada.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[3, 6, 12].map((m) => (
            <div key={m} className="p-3 rounded-lg bg-background/40 border border-border/60 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Em {m}m</p>
              <p className="text-sm font-bold text-emerald-accent tabular-nums">{fmt(surplusFuture(m))}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Score Financeiro */}
      <Card className="p-5 bg-card border border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
            <Gauge className="w-5 h-5 text-sky-accent" />
            Score Financeiro
          </h3>
          <span className={cn("text-2xl font-bold tabular-nums", scoreColor)}>
            {score}<span className="text-sm text-muted-foreground">/100</span>
          </span>
        </div>
        <Progress value={score} className="h-2 mb-2" />
        <p className={cn("text-xs font-medium mb-2", scoreColor)}>{scoreLabel}</p>
        <p className="text-[11px] text-muted-foreground">
          Baseado em: dívidas vs renda, saldo livre, investimentos e metas ativas.
        </p>
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
              <p className="text-sm font-bold text-foreground">{STRATEGY_LABEL[strategy]} · {usage}</p>
            </div>
            <Flame className="w-5 h-5 text-amber-300" />
          </div>
          <div className="flex items-center justify-between bg-background/40 rounded-lg p-3 border border-border/60">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Previsão de quitação total</p>
              <p className="text-sm font-bold text-foreground">
                {selectedTermino === "—" ? formatDuration(selectedQuitacaoMeses) : selectedTermino}
              </p>
            </div>
            <Calendar className="w-5 h-5 text-sky-accent" />
          </div>
          <div className="flex items-center justify-between bg-emerald-accent/5 rounded-lg p-3 border border-emerald-accent/30">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Economia estimada ({selectedScenarioLabel})</p>
              <p className="text-lg font-bold text-emerald-accent">{fmt(selectedEconomiaJuros)}</p>
            </div>
            <Sparkles className="w-5 h-5 text-emerald-accent" />
          </div>
        </div>
      </Card>

      {/* Simulação Individual das Dívidas */}
      <Card className="p-5 bg-card border border-border">
        <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-accent" />
          Simulação Individual das Dívidas
          <Badge variant="outline" className="ml-auto text-[10px]">{debtSimulations.length} dívida(s)</Badge>
        </h3>
        <div className="space-y-3">
          {debtSimulations.map((debt) => {
            const selected = debt[selectedScenario];
            return (
              <div key={debt.id} className="rounded-lg border border-border/60 bg-background/40 p-3">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">{debt.nome}</p>
                    <p className="text-[11px] text-muted-foreground">{debt.banco}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-emerald-accent/40 text-emerald-accent bg-emerald-accent/10">
                    {selectedScenarioLabel}: {selected.termino}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Stat icon={<CreditCard className="w-4 h-4 text-red-400" />} label="Saldo" value={fmt(debt.saldoDevedor)} />
                  <Stat icon={<Receipt className="w-4 h-4 text-sky-accent" />} label="Parcela" value={fmt(debt.parcelaMensal)} />
                  <Stat icon={<TrendingUp className="w-4 h-4 text-amber-300" />} label="Juros" value={`${debt.jurosMensal.toFixed(2)}%`} />
                </div>

                <div className="overflow-x-auto -mx-1">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Cenário</TableHead>
                        <TableHead className="text-xs text-right">Extra/mês</TableHead>
                        <TableHead className="text-xs text-right">Prazo</TableHead>
                        <TableHead className="text-xs text-right">Término</TableHead>
                        <TableHead className="text-xs text-right">Economia tempo</TableHead>
                        <TableHead className="text-xs text-right">Livre preservado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <ScenarioRow label="Normal" projection={debt.normal} />
                      <ScenarioRow label="Hard" projection={debt.hard} highlight={selectedScenario === "hard"} />
                      <ScenarioRow label="Mista" projection={debt.mista} highlight={selectedScenario === "mista"} />
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <Button
        type="button" data-html2canvas-ignore="true"
        onClick={handleExportPDF}
        disabled={exporting}
        className="w-full bg-emerald-accent hover:bg-emerald-accent/90"
      >
        <Download className="w-4 h-4 mr-2" />
        {exporting ? "Gerando PDF..." : "Gerar Relatório PDF"}
      </Button>

      {/* Cronograma de Término */}
      <Card className="p-5 bg-card border border-border">
        <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-400" />
          Cronograma de Término
        </h3>
        <div className="overflow-x-auto -mx-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Dívida</TableHead>
                <TableHead className="text-xs text-right">Normal</TableHead>
                <TableHead className="text-xs text-right">Hard</TableHead>
                <TableHead className="text-xs text-right">Mista</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debtSimulations.map((debt) => (
                <TableRow key={debt.id}>
                  <TableCell className="py-2">
                    <div className="text-sm font-medium text-foreground truncate max-w-[140px]">{debt.nome}</div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{debt.banco}</div>
                  </TableCell>
                  <TableCell className="py-2 text-right text-xs">{debt.normal.termino}</TableCell>
                  <TableCell className="py-2 text-right text-xs text-emerald-accent">{debt.hard.termino}</TableCell>
                  <TableCell className="py-2 text-right text-xs text-sky-accent">{debt.mista.termino}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Gráfico de Saldo Devedor */}
      <Card className="p-5 bg-card border border-border">
        <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-accent rotate-180" />
          Evolução do Saldo Devedor
        </h3>
        <div className="space-y-1.5">
          {evolutionData.map((m) => {
            const pct = (m.selected / maxSaldoDevedor) * 100;
            return (
              <div key={m.label} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-16 shrink-0">{m.label}</span>
                <div className="flex-1 h-5 bg-background/40 rounded-md overflow-hidden border border-border/40">
                  <div
                    className="h-full bg-gradient-to-r from-red-500/60 to-amber-400/60 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-foreground/80 w-20 text-right tabular-nums">
                  {fmt(m.selected)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
      </div>
    </div>
  );
}

function ScenarioRow({
  label,
  projection,
  highlight,
}: {
  label: string;
  projection: PayoffProjection;
  highlight?: boolean;
}) {
  return (
    <TableRow className={cn(highlight && "bg-emerald-accent/10")}>
      <TableCell className="py-2 text-xs font-medium">{label}</TableCell>
      <TableCell className="py-2 text-right text-xs tabular-nums">{fmt(projection.extraMensal)}</TableCell>
      <TableCell className="py-2 text-right text-xs tabular-nums">{formatDuration(projection.meses)}</TableCell>
      <TableCell className="py-2 text-right text-xs tabular-nums">{projection.termino}</TableCell>
      <TableCell className="py-2 text-right text-xs tabular-nums text-emerald-accent">
        {projection.economiaTempo > 0 ? `${projection.economiaTempo}m` : "—"}
      </TableCell>
      <TableCell className="py-2 text-right text-xs tabular-nums">{fmt(projection.valorLivrePreservado)}</TableCell>
    </TableRow>
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
