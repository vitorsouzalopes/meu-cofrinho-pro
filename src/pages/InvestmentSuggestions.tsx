import { useEffect, useMemo, useState } from "react";
import {
  Flame, TrendingUp, Shield, Clock, Zap, PiggyBank,
  Building2, BarChart3, Wallet, RefreshCw, Sparkles, AlertCircle,
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type Account = Tables<"accounts">;
type Investment = Tables<"investments">;

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface Suggestion {
  name: string;
  type: string;
  risk: "low" | "medium" | "high";
  term: "short" | "long";
  amount: number;
  description: string;
  icon: React.ElementType;
  highlight?: boolean;
  bankSpecific?: string;
}

const riskLabels = { low: "Baixo risco", medium: "Médio risco", high: "Alto risco" };
const riskColors = { low: "text-emerald-accent", medium: "text-gold", high: "text-destructive" };
const termLabels = { short: "Curto prazo", long: "Longo prazo" };

const InvestmentSuggestions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const today = new Date();
    const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    const [acRes, invRes] = await Promise.all([
      supabase.from("accounts").select("*").eq("user_id", user.id).eq("month_year", currentMonthYear),
      supabase.from("investments").select("*").eq("user_id", user.id),
    ]);

    setAccounts((acRes.data ?? []) as Account[]);
    setInvestments((invRes.data ?? []) as Investment[]);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  // Financial analysis
  const analysis = useMemo(() => {
    const totalInvested = investments.reduce((s, i) => s + Number(i.current_amount ?? i.amount), 0);
    const pendingBills = accounts.filter((a) => !a.paid && a.account_category === "expense");
    const totalPending = pendingBills.reduce((s, a) => s + Number(a.amount), 0);
    const totalAccounts = accounts.reduce((s, a) => s + Number(a.amount), 0);
    const availableToInvest = Math.max(0, totalAccounts * 0.3 - totalPending * 0.1);
    const userBanks = [...new Set(investments.map((i) => i.bank))];

    return { totalInvested, totalPending, totalAccounts, availableToInvest, userBanks, pendingBills };
  }, [accounts, investments]);

  // Generate smart suggestions
  const suggestions = useMemo((): Suggestion[] => {
    const { availableToInvest, userBanks, totalInvested } = analysis;
    if (availableToInvest <= 0) return [];

    const result: Suggestion[] = [];
    let remaining = availableToInvest;

    // Reserva de emergência (always first if total < 5000)
    if (totalInvested < 5000) {
      const emergencyAmount = Math.min(remaining * 0.4, remaining);
      result.push({
        name: "Tesouro Selic",
        type: "Renda Fixa",
        risk: "low",
        term: "short",
        amount: Math.round(emergencyAmount),
        description: "Liquidez diária • Ideal para reserva de emergência",
        icon: Shield,
        highlight: true,
      });
      remaining -= emergencyAmount;
    }

    // CDB
    if (remaining > 50) {
      const cdbAmount = Math.min(remaining * 0.4, remaining);
      const bankHint = userBanks.length > 0 ? userBanks[0] : undefined;
      result.push({
        name: "CDB 110% CDI",
        type: "Renda Fixa",
        risk: "medium",
        term: "long",
        amount: Math.round(cdbAmount),
        description: "Rendimento acima da poupança • Prazo: 1 ano",
        icon: Building2,
        bankSpecific: bankHint ? `Sugestão: Investir no CDB do ${bankHint}` : undefined,
      });
      remaining -= cdbAmount;
    }

    // LCI/LCA
    if (remaining > 100) {
      result.push({
        name: "LCI/LCA",
        type: "Renda Fixa",
        risk: "low",
        term: "long",
        amount: Math.round(remaining * 0.3),
        description: "Isento de IR • Garantido pelo FGC",
        icon: Shield,
      });
      remaining -= remaining * 0.3;
    }

    // Cofrinho / Caixinha digital
    if (remaining > 0) {
      const bankHint = userBanks.find((b) => ["Nubank", "PicPay", "Banco Inter"].includes(b));
      result.push({
        name: "Cofrinho Digital",
        type: "Alternativo",
        risk: "low",
        term: "short",
        amount: Math.round(remaining),
        description: "Rendimento automático • Resgate rápido",
        icon: PiggyBank,
        bankSpecific: bankHint ? `Usar rendimento do ${bankHint}` : undefined,
      });
    }

    // ETFs if significant amount
    if (availableToInvest > 500) {
      result.push({
        name: "ETF BOVA11",
        type: "Renda Variável",
        risk: "high",
        term: "long",
        amount: Math.round(availableToInvest * 0.1),
        description: "Diversificação automática • Acompanha Ibovespa",
        icon: BarChart3,
      });
    }

    // Fundos Imobiliários
    if (availableToInvest > 300) {
      result.push({
        name: "Fundos Imobiliários",
        type: "Renda Variável",
        risk: "medium",
        term: "long",
        amount: Math.round(availableToInvest * 0.1),
        description: "Renda mensal • Dividendos isentos de IR",
        icon: Building2,
      });
    }

    return result;
  }, [analysis]);

  // Category filters
  const [riskFilter, setRiskFilter] = useState<string | null>(null);
  const [termFilter, setTermFilter] = useState<string | null>(null);

  const filteredSuggestions = suggestions.filter((s) => {
    if (riskFilter && s.risk !== riskFilter) return false;
    if (termFilter && s.term !== termFilter) return false;
    return true;
  });

  const highlightSuggestion = suggestions.find((s) => s.highlight);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Sugestões de Investimento</h1>
          <p className="text-xs text-muted-foreground">
            Atualizado {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" onClick={fetchData}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Card className="p-3 text-center">
          <Wallet className="w-4 h-4 text-gold mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground uppercase">Saldo</p>
          <p className="font-semibold text-sm">{formatCurrency(analysis.totalAccounts)}</p>
        </Card>
        <Card className="p-3 text-center">
          <AlertCircle className="w-4 h-4 text-destructive mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground uppercase">Pendentes</p>
          <p className="font-semibold text-sm">{formatCurrency(analysis.totalPending)}</p>
        </Card>
        <Card className="p-3 text-center">
          <TrendingUp className="w-4 h-4 text-emerald-accent mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground uppercase">Disponível</p>
          <p className="font-semibold text-sm text-emerald-accent">{formatCurrency(analysis.availableToInvest)}</p>
        </Card>
      </div>

      {/* Alert: available to invest */}
      {analysis.availableToInvest > 0 && (
        <Card className="p-3 mb-4 border-emerald-accent/30 bg-emerald-accent/5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-accent" />
            <p className="text-sm text-foreground">
              Você tem <span className="font-bold text-emerald-accent">{formatCurrency(analysis.availableToInvest)}</span> disponível para investir!
            </p>
          </div>
        </Card>
      )}

      {/* Highlight suggestion */}
      {highlightSuggestion && (
        <Card className="p-4 mb-4 border-gold/50 bg-gold/5">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-gold" />
            <span className="text-xs font-bold text-gold uppercase tracking-wider">Melhor oportunidade hoje</span>
          </div>
          <h3 className="font-semibold text-foreground text-lg">{highlightSuggestion.name}</h3>
          <p className="text-sm text-muted-foreground mb-2">{highlightSuggestion.description}</p>
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-xs font-medium ${riskColors[highlightSuggestion.risk]}`}>
              {riskLabels[highlightSuggestion.risk]}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{termLabels[highlightSuggestion.term]}</span>
          </div>
          <Button variant="gold" size="sm" className="w-full" onClick={() => navigate("/investments")}>
            👉 Investir {formatCurrency(highlightSuggestion.amount)}
          </Button>
        </Card>
      )}

      {/* Category filters */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Filtrar por</p>
        <div className="flex gap-2 flex-wrap">
          {(["low", "medium", "high"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(riskFilter === r ? null : r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                riskFilter === r
                  ? "bg-primary/20 text-gold border border-primary/50"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {riskLabels[r]}
            </button>
          ))}
          {(["short", "long"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTermFilter(termFilter === t ? null : t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                termFilter === t
                  ? "bg-primary/20 text-gold border border-primary/50"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {termLabels[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Suggestions list */}
      <div className="space-y-3 mb-6">
        <h2 className="font-heading font-semibold text-foreground text-sm">
          Sugestões de hoje ({filteredSuggestions.length})
        </h2>
        {filteredSuggestions.length === 0 ? (
          <Card className="p-6 text-center">
            <PiggyBank className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {suggestions.length === 0
                ? "Pague suas contas pendentes para liberar saldo para investir."
                : "Nenhuma sugestão com esses filtros."}
            </p>
          </Card>
        ) : (
          filteredSuggestions.map((suggestion, i) => {
            const Icon = suggestion.icon;
            return (
              <Card key={i} className="p-4 border-border/50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Icon className={`w-5 h-5 ${riskColors[suggestion.risk]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-foreground text-sm">{suggestion.name}</h3>
                      <span className="text-xs text-muted-foreground">{suggestion.type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{suggestion.description}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium ${riskColors[suggestion.risk]}`}>
                        💰 {riskLabels[suggestion.risk]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        📅 {termLabels[suggestion.term]}
                      </span>
                    </div>
                    {suggestion.bankSpecific && (
                      <p className="text-xs text-gold bg-gold/10 rounded-lg px-2 py-1 mb-2">
                        🏦 {suggestion.bankSpecific}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate("/investments")}
                    >
                      👉 Investir {formatCurrency(suggestion.amount)}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* User banks integration */}
      {analysis.userBanks.length > 0 && (
        <Card className="p-4 border-gold/20 bg-gold/5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-gold" />
            <h3 className="font-semibold text-foreground text-sm">Seus bancos</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.userBanks.map((bank) => (
              <span
                key={bank}
                className="text-xs px-2.5 py-1 rounded-full bg-gold/10 text-gold border border-gold/20"
              >
                {bank}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            As sugestões acima consideram seus bancos cadastrados.
          </p>
        </Card>
      )}

      {/* Smart analysis card */}
      <Card className="p-4 border-border/50">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-gold mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground text-sm">🧠 Análise inteligente</h3>
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <p>• Saldo total: {formatCurrency(analysis.totalAccounts)}</p>
              <p>• Contas pendentes: {formatCurrency(analysis.totalPending)}</p>
              <p>• Disponível: {formatCurrency(analysis.availableToInvest)}</p>
              <p>• Total investido: {formatCurrency(analysis.totalInvested)}</p>
              {suggestions.length > 0 && (
                <div className="pt-2 border-t border-border/30 mt-2">
                  <p className="font-medium text-foreground">Distribuição sugerida:</p>
                  {suggestions.slice(0, 4).map((s, i) => (
                    <p key={i}>
                      {formatCurrency(s.amount)} → {s.name}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InvestmentSuggestions;
