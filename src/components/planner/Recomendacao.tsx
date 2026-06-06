import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import {
  TrendingDown,
  Award,
  ListOrdered,
  Calendar,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { StrategyResult, SimulacaoIndividual } from '@/financial/multiDebtEngine';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(date);

const formatDateFull = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date);

interface RecomendacaoProps {
  estrategia: StrategyResult;
  simulacaoIndividual?: SimulacaoIndividual | null;
  isIndividual?: boolean;
  pagamentoMensal: number;
}

export default function Recomendacao({
  estrategia,
  simulacaoIndividual,
  isIndividual = false,
  pagamentoMensal,
}: RecomendacaoProps) {
  const nomeEstrategia = useMemo(() => {
    if (isIndividual) return `Atacar ${simulacaoIndividual?.nomeDivida}`;
    switch (estrategia.estrategia) {
      case 'avalanche':
        return 'Estratégia Avalanche';
      case 'snowball':
        return 'Estratégia Snowball';
      case 'fluxo-caixa':
        return 'Estratégia Fluxo de Caixa';
      default:
        return 'Estratégia';
    }
  }, [estrategia, simulacaoIndividual, isIndividual]);

  const iconColor = isIndividual
    ? 'text-blue-accent'
    : estrategia.estrategia === 'avalanche'
    ? 'text-destructive'
    : estrategia.estrategia === 'snowball'
    ? 'text-emerald-accent'
    : 'text-gold';

  return (
    <div className="space-y-6">
      {/* Header com Recomendação */}
      <Card className={cn('p-6 border-2', `bg-${iconColor.split('-')[0]}-accent/10 border-${iconColor.split('-')[0]}-accent/30`)}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-1">🏆 {nomeEstrategia}</h2>
            <p className="text-sm text-muted-foreground">
              {isIndividual
                ? `Concentre todo o saldo livre em ${simulacaoIndividual?.nomeDivida}`
                : `Distribua sistematicamente conforme a prioridade ${estrategia.estrategia}`}
            </p>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Tempo Total</p>
            <p className="text-2xl font-bold text-foreground">
              {isIndividual
                ? simulacaoIndividual?.mesesTotais
                : estrategia.mesesTotais < 12
                ? `${estrategia.mesesTotais}m`
                : `${Math.floor(estrategia.mesesTotais / 12)}a${estrategia.mesesTotais % 12}m`}
            </p>
          </div>
          <div className="p-3 bg-emerald-accent/10 rounded-lg border border-emerald-accent/20">
            <p className="text-xs text-muted-foreground mb-2">Economia</p>
            <p className="text-2xl font-bold text-emerald-accent">
              {formatCurrency(isIndividual ? simulacaoIndividual?.economiJuros || 0 : estrategia.economiJuros)}
            </p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Saldo Livre</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(pagamentoMensal)}</p>
          </div>
        </div>
      </Card>

      {/* Prioridade (somente para estratégias globais) */}
      {!isIndividual && (
        <Card className="p-6 border-border">
          <h3 className="font-bold text-foreground text-lg mb-4 flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-sky-accent" />
            Ordem de Prioridade
          </h3>

          <div className="space-y-2">
            {estrategia.prioridade.map((item, idx) => (
              <div
                key={item.debtId}
                className="p-3 bg-muted rounded-lg flex items-start gap-3 hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground/10 text-xs font-bold shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{item.nomeDivida}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.motivo}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Linha do Tempo */}
      <Card className="p-6 border-border">
        <h3 className="font-bold text-foreground text-lg mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-accent" />
          Linha do Tempo de Quitação
        </h3>

        <div className="space-y-4">
          {!isIndividual && estrategia.prioridade.length > 0 ? (
            estrategia.prioridade.map((item, idx) => {
              const dataQuit = estrategia.datasQuitacao.get(item.debtId);
              const efeito = estrategia.efeitos[item.debtId];
              const proximaDivida = idx < estrategia.prioridade.length - 1 ? estrategia.prioridade[idx + 1] : null;

              return (
                <div key={item.debtId}>
                  {/* Evento de Quitação */}
                  <div className="flex gap-3 mb-3">
                    <div className="flex flex-col items-center pt-1">
                      <CheckCircle2 className="w-5 h-5 text-emerald-accent" />
                      {idx < estrategia.prioridade.length - 1 && (
                        <div className="w-0.5 h-8 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="p-3 bg-emerald-accent/5 rounded-lg border border-emerald-accent/30">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-foreground">{item.nomeDivida}</p>
                          <span className="text-sm font-semibold text-emerald-accent">Quitada</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {dataQuit ? formatDate(dataQuit) : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <Zap className="w-3 h-3 inline mr-1" />
                          Economia: <span className="text-emerald-accent font-semibold">{formatCurrency(efeito?.totalJurosPago || 0)}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Efeito Cascata */}
                  {proximaDivida && dataQuit && (
                    <div className="flex gap-3 ml-2 mb-4">
                      <div className="flex flex-col items-center">
                        <Zap className="w-4 h-4 text-sky-accent" />
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="p-3 bg-sky-accent/5 rounded-lg border border-sky-accent/20">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-sky-accent">Efeito Cascata</span>
                            <ArrowRight className="w-3 h-3 text-sky-accent" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatCurrency(pagamentoMensal)} agora redirecionado para <span className="text-sky-accent font-semibold">{proximaDivida.nomeDivida}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 text-sky-accent">→ Acelera quitação</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground text-sm">
              {isIndividual ? `Todas as dívidas serão quitadas em ${simulacaoIndividual?.mesesTotais} meses` : 'Carregando timeline...'}
            </div>
          )}

          {/* Ponto Final */}
          <div className="flex gap-3 pt-2">
            <div className="flex flex-col items-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-accent" />
            </div>
            <div className="flex-1">
              <div className="p-3 bg-emerald-accent/10 rounded-lg border border-emerald-accent/30">
                <p className="font-bold text-emerald-accent text-sm">✅ Todas as Dívidas Quitadas!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isIndividual
                    ? formatDateFull(simulacaoIndividual?.dataQuitacaoTotal || new Date())
                    : formatDateFull(estrategia.dataQuitacaoTotal)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Resumo de Impacto */}
      <Card className="p-4 bg-gradient-to-r from-emerald-accent/10 to-sky-accent/10 border-border">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-emerald-accent mt-0.5 shrink-0" />
          <div className="text-sm space-y-2">
            <p className="font-semibold text-foreground">📊 Impacto Financeiro</p>
            <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-1">Total Pago</p>
                <p className="font-semibold text-foreground">
                  {formatCurrency(isIndividual ? pagamentoMensal * (simulacaoIndividual?.mesesTotais || 0) : estrategia.totalPago)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Juros Economizados</p>
                <p className="font-semibold text-emerald-accent">
                  {formatCurrency(isIndividual ? simulacaoIndividual?.economiJuros || 0 : estrategia.economiJuros)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Total de Juros</p>
                <p className="font-semibold text-destructive">
                  {formatCurrency(isIndividual ? (pagamentoMensal * (simulacaoIndividual?.mesesTotais || 0)) - (pagamentoMensal * (simulacaoIndividual?.mesesTotais || 0)) : estrategia.totalJuros)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Saldo Livre Mensal</p>
                <p className="font-semibold text-sky-accent">{formatCurrency(pagamentoMensal)}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
