import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Zap,
  Calendar,
  PiggyBank,
  Award,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StrategyResult, compararEstrategias } from '@/financial/multiDebtEngine';
import { Debt } from '@/financial/types';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date);

interface StrategyComparisonProps {
  debts: Debt[];
  pagamentoMensal: number;
}

export default function StrategyComparison({ debts, pagamentoMensal }: StrategyComparisonProps) {
  const [expandedStrategy, setExpandedStrategy] = useState<'avalanche' | 'snowball' | 'fluxo-caixa' | null>(
    'avalanche'
  );
  const [expandedTimeline, setExpandedTimeline] = useState<boolean>(false);

  if (debts.length === 0 || pagamentoMensal <= 0) {
    return (
      <div className="p-4 bg-muted rounded-lg border border-border text-sm text-muted-foreground">
        Adicione dívidas e defina um pagamento mensal para simular estratégias.
      </div>
    );
  }

  const strategies = compararEstrategias(debts, pagamentoMensal);

  const renderStrategyCard = (result: StrategyResult, icon: React.ReactNode, color: string, title: string) => {
    const isExpanded = expandedStrategy === result.estrategia;

    return (
      <Card
        key={result.estrategia}
        className={cn(
          'p-4 border-2 cursor-pointer transition-all hover:shadow-lg',
          isExpanded ? `bg-${color}/5 border-${color}` : `border-border bg-card`
        )}
        onClick={() => setExpandedStrategy(isExpanded ? null : result.estrategia)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', `bg-${color}/20 text-${color}`)}>{icon}</div>
            <div>
              <h3 className={cn('font-bold text-lg', `text-${color}`)}>{title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{getStrategyDescription(result.estrategia)}</p>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Tempo Total</p>
            <p className="font-bold text-foreground">{formatMonths(result.mesesTotais)}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Total Pago</p>
            <p className="font-bold text-foreground">{formatCurrency(result.totalPago)}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Juros Totais</p>
            <p className="font-bold text-destructive">{formatCurrency(result.totalJuros)}</p>
          </div>
          <div className="p-3 bg-emerald-accent/10 rounded-lg border border-emerald-accent/30">
            <p className="text-xs text-muted-foreground mb-1">Economia</p>
            <p className="font-bold text-emerald-accent">{formatCurrency(result.economiJuros)}</p>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-4 mt-4 pt-4 border-t border-border animate-in fade-in-50">
            {/* Prioridade */}
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">Ordem de Prioridade</h4>
              <div className="space-y-2">
                {result.prioridade.map((p) => (
                  <div key={p.debtId} className="p-3 bg-muted rounded-lg flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground/10 text-xs font-bold shrink-0">
                      {p.ordem}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">{p.nomeDivida}</p>
                      <p className="text-xs text-muted-foreground mt-1">{p.motivo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Datas de Quitação */}
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">Estimativa de Quitação</h4>
              <div className="space-y-2">
                {Array.from(result.datasQuitacao.entries()).map(([debtId, date]) => {
                  const efeito = result.efeitos[debtId];
                  return (
                    <div key={debtId} className="p-3 bg-emerald-accent/5 rounded-lg border border-emerald-accent/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-foreground text-sm">{efeito.nomeDivida}</p>
                        <CheckCircle2 className="w-4 h-4 text-emerald-accent" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(date)} ({calcularDiasAteData(date)} dias)
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Juros economizados: <span className="text-emerald-accent font-semibold">-{formatCurrency(efeito.totalJurosPago)}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Efeito Cascata */}
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">Efeito Cascata (Parcelas Liberadas)</h4>
              <div className="space-y-2">
                {result.prioridade.map((p, idx) => {
                  if (idx === 0) return null; // Primeira não tem cascata
                  const anterior = result.prioridade[idx - 1];
                  const dataAnterior = result.datasQuitacao.get(anterior.debtId);
                  if (!dataAnterior) return null;

                  return (
                    <div key={p.debtId} className="flex items-center gap-2 text-xs">
                      <div className="p-2 rounded bg-muted">{formatDate(dataAnterior)}</div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 p-2 rounded bg-blue-accent/10 border border-blue-accent/30 text-blue-accent font-semibold">
                        Realocar para: {p.nomeDivida}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Completa */}
            <div>
              <button
                onClick={() => setExpandedTimeline(!expandedTimeline)}
                className="w-full flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">Visualizar Timeline Completa ({result.timeline.length} meses)</span>
                {expandedTimeline ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandedTimeline && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="py-2 px-2 text-left">Mês</th>
                        <th className="py-2 px-2 text-left">Dívida</th>
                        <th className="py-2 px-2 text-right">Pagamento</th>
                        <th className="py-2 px-2 text-right">Juros</th>
                        <th className="py-2 px-2 text-right">Saldo</th>
                        <th className="py-2 px-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.timeline.slice(0, 60).map((row, idx) => (
                        <tr key={idx} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="py-2 px-2 font-mono">{row.mes}</td>
                          <td className="py-2 px-2 text-left">{row.nomeDivida}</td>
                          <td className="py-2 px-2 text-right font-medium">{formatCurrency(row.pagamento)}</td>
                          <td className="py-2 px-2 text-right text-destructive">{formatCurrency(row.juros)}</td>
                          <td className="py-2 px-2 text-right">{formatCurrency(row.saldoPos)}</td>
                          <td className="py-2 px-2 text-center">
                            {row.quitar ? <CheckCircle2 className="w-3 h-3 text-emerald-accent mx-auto" /> : '—'}
                          </td>
                        </tr>
                      ))}
                      {result.timeline.length > 60 && (
                        <tr className="text-muted-foreground text-center">
                          <td colSpan={6} className="py-2 text-xs">
                            ... {result.timeline.length - 60} meses adicionais
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-accent/10 border border-blue-accent/30 rounded-lg flex items-start gap-3">
        <Zap className="w-5 h-5 text-blue-accent mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-blue-accent text-sm mb-1">Comparação de Estratégias</p>
          <p className="text-xs text-muted-foreground">
            Clique em cada estratégia abaixo para ver detalhes completos, prioridades, datas de quitação e efeitos em cascata.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {renderStrategyCard(
          strategies.avalanche,
          <TrendingDown className="w-5 h-5" />,
          'destructive',
          'Estratégia Avalanche'
        )}
        {renderStrategyCard(
          strategies.snowball,
          <PiggyBank className="w-5 h-5" />,
          'emerald-accent',
          'Estratégia Snowball'
        )}
        {renderStrategyCard(strategies.fluxoCaixa, <Award className="w-5 h-5" />, 'gold', 'Estratégia Fluxo de Caixa')}
      </div>

      {/* Recomendações */}
      <Card className="p-4 border-sky-accent/30 bg-sky-accent/5">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-sky-accent" />
          Recomendações
        </h3>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium text-foreground">Melhor Economia:</span>{' '}
            <span className="text-muted-foreground">
              {strategies.melhorEconomia.estrategia.toUpperCase()} — Economiza{' '}
              {formatCurrency(strategies.melhorEconomia.economiJuros)}
            </span>
          </p>
          <p>
            <span className="font-medium text-foreground">Mais Rápido:</span>{' '}
            <span className="text-muted-foreground">
              {strategies.melhorVelocidade.estrategia.toUpperCase()} — {formatMonths(strategies.melhorVelocidade.mesesTotais)}
            </span>
          </p>
          <p>
            <span className="font-medium text-foreground">Melhor Fluxo de Caixa:</span>{' '}
            <span className="text-muted-foreground">FLUXO_CAIXA — Libera parcelas mais rapidamente</span>
          </p>
        </div>
      </Card>
    </div>
  );
}

function getStrategyDescription(estrategia: string): string {
  switch (estrategia) {
    case 'avalanche':
      return 'Foca nas dívidas com maior taxa de juros para economizar ao máximo';
    case 'snowball':
      return 'Começa pelas dívidas menores para ganhar velocidade e motivação';
    case 'fluxo-caixa':
      return 'Prioriza parcelas maiores para liberar fluxo de caixa rapidamente';
    default:
      return '';
  }
}

function formatMonths(months: number): string {
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years}a${remainingMonths > 0 ? ` ${remainingMonths}m` : ''}`;
  }
  return `${months}m`;
}

function calcularDiasAteData(data: Date): number {
  const hoje = new Date();
  const differenceInTime = data.getTime() - hoje.getTime();
  return Math.ceil(differenceInTime / (1000 * 60 * 60 * 24));
}
