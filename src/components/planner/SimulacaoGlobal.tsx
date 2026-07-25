import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import {
  TrendingDown,
  Target,
  Award,
  AlertCircle,
  ChevronRight,
  Zap,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { ComparacaoGlobal, compararGlobalmente } from '@/financial/multiDebtEngine';
import { Debt } from '@/financial/types';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatMonths = (months: number): string => {
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years}a${remainingMonths > 0 ? ` ${remainingMonths}m` : ''}`;
  }
  return `${months}m`;
};

interface SimulacaoGlobalProps {
  debts: Debt[];
  pagamentoMensal: number;
  onSelectCenario?: (tipo: string, debtId?: string) => void;
}

export default function SimulacaoGlobal({
  debts,
  pagamentoMensal,
  onSelectCenario,
}: SimulacaoGlobalProps) {
  const comparacao = useMemo(() => {
    if (debts.length === 0 || pagamentoMensal <= 0) return null;
    try {
      console.log('📊 SimulacaoGlobal - Dívidas recebidas:', debts.length, debts.map(d => d.nome));
      const resultado = compararGlobalmente(debts, pagamentoMensal);
      console.log('📊 SimulacaoGlobal - Simulações individuais:', resultado.simulacoesIndividuais.length);
      return resultado;
    } catch (error) {
      console.error('Erro ao comparar globalmente:', error);
      return null;
    }
  }, [debts, pagamentoMensal]);

  if (!comparacao || debts.length === 0) {
    return (
      <div className="p-4 bg-muted rounded-lg border border-border text-sm text-muted-foreground">
        Adicione dívidas e defina um pagamento mensal para ver a simulação global.
      </div>
    );
  }

  const melhor = comparacao.melhorCenario;
  const isBetter = (scenario: any) => {
    if (melhor.tipo === 'individual') {
      return scenario.tipo === 'individual' && scenario.debtId === melhor.debtId;
    } else {
      return scenario.tipo === 'estrategia' && scenario.estrategia === melhor.estrategia;
    }
  };

  return (
    <div className="space-y-6">
      {/* Recomendação Principal */}
      <Card className="p-5 bg-gradient-to-r from-emerald-accent/20 to-sky-accent/20 border-emerald-accent/40">
        <div className="flex items-start gap-3">
          <Award className="w-6 h-6 text-emerald-accent mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold text-foreground text-lg mb-2">🏆 Recomendação</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{comparacao.recomendacao}</p>
            <div className="mt-3 flex gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-accent" />
                <span className="text-sm font-semibold text-foreground">{formatMonths(melhor.tempo)}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-accent" />
                <span className="text-sm font-semibold text-emerald-accent">{formatCurrency(melhor.economia)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Comparação Tabs */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Todos os Cenários</h3>

        {/* Cenários Individuais */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Atacar uma dívida com todo o saldo livre
          </h4>
          {comparacao.simulacoesIndividuais.map((sim) => {
            const isBest = melhor.tipo === 'individual' && melhor.debtId === sim.debtId;
            return (
              <Card
                key={sim.debtId}
                className={cn(
                  'p-4 border-2 cursor-pointer transition-all hover:shadow-lg',
                  isBest
                    ? 'bg-emerald-accent/10 border-emerald-accent/50'
                    : 'bg-card border-border hover:border-foreground/30'
                )}
                onClick={() => onSelectCenario?.('individual', sim.debtId)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-blue-accent" />
                      <h4 className="font-semibold text-foreground">{sim.nomeDivida}</h4>
                      {isBest && (
                        <span className="px-2 py-0.5 bg-emerald-accent/20 text-emerald-accent rounded text-xs font-bold">
                          MELHOR
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Concentrar R${pagamentoMensal.toLocaleString('pt-BR')} aqui
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs text-muted-foreground mb-1">Tempo Total</p>
                    <p className="font-bold text-foreground">{formatMonths(sim.mesesTotais)}</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs text-muted-foreground mb-1">Economia</p>
                    <p className="font-bold text-emerald-accent">{formatCurrency(sim.economiJuros)}</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs text-muted-foreground mb-1">% Economia</p>
                    <p className="font-bold text-sky-accent">{sim.percentualEconomia.toFixed(1)}%</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Estratégias Globais */}
        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-muted-foreground">
            Seu planejamento
          </h4>

          {/* Avalanche */}
          <Card
            className={cn(
              'p-4 border-2 cursor-pointer transition-all hover:shadow-lg',
              melhor.tipo === 'estrategia' && melhor.estrategia === 'avalanche'
                ? 'bg-destructive/10 border-destructive/50'
                : 'bg-card border-border hover:border-foreground/30'
            )}
            onClick={() => onSelectCenario?.('estrategia', undefined)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-destructive" />
                  <h4 className="font-semibold text-foreground">Foco em Juros</h4>
                  {melhor.tipo === 'estrategia' && melhor.estrategia === 'avalanche' && (
                    <span className="px-2 py-0.5 bg-destructive/20 text-destructive rounded text-xs font-bold">
                      MAIOR ECONOMIA
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Prioriza dívidas mais caras</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground mb-1">Tempo Total</p>
                <p className="font-bold text-foreground">{formatMonths(comparacao.estrategias.avalanche.mesesTotais)}</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground mb-1">Economia</p>
                <p className="font-bold text-emerald-accent">
                  {formatCurrency(comparacao.estrategias.avalanche.economiJuros)}
                </p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground mb-1">Juros</p>
                <p className="font-bold text-destructive">
                  {formatCurrency(comparacao.estrategias.avalanche.totalJuros)}
                </p>
              </div>
            </div>
          </Card>

          {/* Snowball */}
          <Card
            className={cn(
              'p-4 border-2 cursor-pointer transition-all hover:shadow-lg',
              melhor.tipo === 'estrategia' && melhor.estrategia === 'snowball'
                ? 'bg-emerald-accent/10 border-emerald-accent/50'
                : 'bg-card border-border hover:border-foreground/30'
            )}
            onClick={() => onSelectCenario?.('estrategia', undefined)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-emerald-accent" />
                  <h4 className="font-semibold text-foreground">Bola de Neve</h4>
                  {melhor.tipo === 'estrategia' && melhor.estrategia === 'snowball' && (
                    <span className="px-2 py-0.5 bg-emerald-accent/20 text-emerald-accent rounded text-xs font-bold">
                      RECOMENDADO
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Prioriza dívidas menores</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground mb-1">Tempo Total</p>
                <p className="font-bold text-foreground">{formatMonths(comparacao.estrategias.snowball.mesesTotais)}</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground mb-1">Economia</p>
                <p className="font-bold text-emerald-accent">
                  {formatCurrency(comparacao.estrategias.snowball.economiJuros)}
                </p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground mb-1">Juros</p>
                <p className="font-bold text-destructive">
                  {formatCurrency(comparacao.estrategias.snowball.totalJuros)}
                </p>
              </div>
            </div>
          </Card>

          {/* Fluxo de Caixa */}
          <Card
            className={cn(
              'p-4 border-2 cursor-pointer transition-all hover:shadow-lg',
              melhor.tipo === 'estrategia' && melhor.estrategia === 'fluxo-caixa'
                ? 'bg-gold/10 border-gold/50'
                : 'bg-card border-border hover:border-foreground/30'
            )}
            onClick={() => onSelectCenario?.('estrategia', undefined)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-gold" />
                  <h4 className="font-semibold text-foreground">Libera Saldo</h4>
                  {melhor.tipo === 'estrategia' && melhor.estrategia === 'fluxo-caixa' && (
                    <span className="px-2 py-0.5 bg-gold/20 text-gold rounded text-xs font-bold">
                      MAIOR FOLGA
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Libera dinheiro livre mais rápido</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground mb-1">Tempo Total</p>
                <p className="font-bold text-foreground">{formatMonths(comparacao.estrategias.fluxoCaixa.mesesTotais)}</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground mb-1">Economia</p>
                <p className="font-bold text-emerald-accent">
                  {formatCurrency(comparacao.estrategias.fluxoCaixa.economiJuros)}
                </p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground mb-1">Juros</p>
                <p className="font-bold text-destructive">
                  {formatCurrency(comparacao.estrategias.fluxoCaixa.totalJuros)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Insights */}
      <Card className="p-4 bg-blue-accent/10 border-blue-accent/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-accent mt-0.5 shrink-0" />
          <div className="text-sm space-y-2">
            <p className="font-semibold text-foreground">💡 Insights</p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>
                • Diferença entre melhor e pior cenário:{' '}
                <span className="font-semibold text-foreground">
                  {Math.max(
                    ...comparacao.simulacoesIndividuais.map((s) => s.mesesTotais),
                    comparacao.estrategias.avalanche.mesesTotais,
                    comparacao.estrategias.snowball.mesesTotais,
                    comparacao.estrategias.fluxoCaixa.mesesTotais
                  ) -
                    Math.min(
                      ...comparacao.simulacoesIndividuais.map((s) => s.mesesTotais),
                      comparacao.estrategias.avalanche.mesesTotais,
                      comparacao.estrategias.snowball.mesesTotais,
                      comparacao.estrategias.fluxoCaixa.mesesTotais
                    )}{' '}
                  meses
                </span>
              </li>
              <li>
                • Maior economia:{' '}
                <span className="font-semibold text-emerald-accent">
                  {formatCurrency(
                    Math.max(
                      ...comparacao.simulacoesIndividuais.map((s) => s.economiJuros),
                      comparacao.estrategias.avalanche.economiJuros,
                      comparacao.estrategias.snowball.economiJuros,
                      comparacao.estrategias.fluxoCaixa.economiJuros
                    )
                  )}
                </span>
              </li>
              <li>
                • Melhor velocidade: <span className="font-semibold text-foreground">{formatMonths(melhor.tempo)}</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
