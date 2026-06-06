import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { StrategyResult } from '@/financial/multiDebtEngine';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(date);

const formatDateFull = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date);

interface TimelineProps {
  resultado: StrategyResult;
}

export default function DebtTimeline({ resultado }: TimelineProps) {
  const eventos = useMemo(() => {
    const eventos: {
      data: Date;
      tipo: 'quitacao' | 'cascata';
      debtId?: string;
      nomeDivida: string;
      valor?: number;
      proximaDivida?: string;
    }[] = [];

    // Adicionar eventos de quitação
    const dataAtual = new Date();
    
    for (const [debtId, dataQuit] of Array.from(resultado.datasQuitacao.entries())) {
      if (dataQuit >= dataAtual) {
        const efeito = resultado.efeitos[debtId];
        eventos.push({
          data: dataQuit,
          tipo: 'quitacao',
          debtId,
          nomeDivida: efeito.nomeDivida,
          valor: efeito.totalJurosPago,
        });
      }
    }

    // Calcular efeito cascata
    const prioridade = resultado.prioridade;
    for (let i = 0; i < prioridade.length - 1; i++) {
      const atual = prioridade[i];
      const proxima = prioridade[i + 1];
      const dataQuitacao = resultado.datasQuitacao.get(atual.debtId);
      
      if (dataQuitacao && dataQuitacao >= dataAtual) {
        eventos.push({
          data: new Date(dataQuitacao.getTime() + 1000 * 60 * 60 * 24), // Próximo dia
          tipo: 'cascata',
          nomeDivida: atual.nomeDivida,
          proximaDivida: proxima.nomeDivida,
        });
      }
    }

    // Ordenar por data
    return eventos.sort((a, b) => a.data.getTime() - b.data.getTime());
  }, [resultado]);

  const meses = Math.ceil(resultado.mesesTotais / 1);
  const anosCompletos = Math.floor(resultado.mesesTotais / 12);

  return (
    <div className="space-y-4">
      {/* Header Summary */}
      <Card className="p-4 bg-gradient-to-r from-emerald-accent/10 to-sky-accent/10 border-emerald-accent/30">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tempo Total</p>
            <p className="font-bold text-foreground text-lg">
              {anosCompletos > 0 ? `${anosCompletos}a ${resultado.mesesTotais % 12}m` : `${resultado.mesesTotais}m`}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Data Estimada</p>
            <p className="font-bold text-foreground text-lg">{formatDate(resultado.dataQuitacaoTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Economia Total</p>
            <p className="font-bold text-emerald-accent text-lg">{formatCurrency(resultado.economiJuros)}</p>
          </div>
        </div>
      </Card>

      {/* Timeline Visual */}
      <Card className="p-6 border-border bg-card">
        <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-accent" />
          Linha do Tempo de Quitação
        </h3>

        {eventos.length === 0 ? (
          <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground text-sm">
            Nenhum evento futuro no horizonte.
          </div>
        ) : (
          <div className="space-y-4">
            {eventos.map((evento, idx) => (
              <div key={idx} className="relative">
                {/* Connecting Line */}
                {idx < eventos.length - 1 && (
                  <div className="absolute left-[11px] top-[40px] w-0.5 h-12 bg-border" />
                )}

                <div className="flex gap-4">
                  {/* Timeline Marker */}
                  <div className="relative pt-2 flex flex-col items-center">
                    {evento.tipo === 'quitacao' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-accent flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-sky-accent bg-background flex items-center justify-center">
                        <ArrowRight className="w-3 h-3 text-sky-accent" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    {evento.tipo === 'quitacao' ? (
                      <div className="p-4 bg-emerald-accent/5 rounded-lg border border-emerald-accent/30">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold text-foreground">{evento.nomeDivida}</p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDateFull(evento.data)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Juros economizados</p>
                            <p className="font-bold text-emerald-accent">{formatCurrency(evento.valor || 0)}</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-emerald-accent/20">
                          <p className="text-xs text-emerald-accent font-medium">✓ Dívida Quitada</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-sky-accent/5 rounded-lg border border-sky-accent/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Efeito Cascata</p>
                            <p className="text-sm font-semibold text-foreground">{evento.nomeDivida} quitada</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-sky-accent" />
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Realocar para</p>
                            <p className="text-sm font-semibold text-sky-accent">{evento.proximaDivida}</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-sky-accent/20">
                          <p className="text-xs text-sky-accent font-medium">→ Acelera a próxima dívida</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Final Point */}
            <div className="flex gap-4 pt-2">
              <div className="flex flex-col items-center pt-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-accent flex-shrink-0" />
              </div>
              <div className="flex-1">
                <div className="p-4 bg-emerald-accent/10 rounded-lg border border-emerald-accent/30">
                  <p className="font-bold text-emerald-accent">Todas as Dívidas Quitadas! 🎉</p>
                  <p className="text-xs text-muted-foreground mt-2">{formatDateFull(resultado.dataQuitacaoTotal)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Detalhes de Cada Dívida */}
      <Card className="p-6 border-border bg-card space-y-4">
        <h3 className="font-semibold text-foreground">Detalhes de Quitação</h3>

        <div className="grid grid-cols-1 gap-3">
          {resultado.prioridade.map((item, idx) => {
            const dataQuit = resultado.datasQuitacao.get(item.debtId);
            const efeito = resultado.efeitos[item.debtId];
            const diasAte = dataQuit
              ? Math.ceil((dataQuit.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : 0;

            return (
              <div key={item.debtId} className="p-4 bg-muted rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-foreground/10 text-xs font-bold">
                        {idx + 1}
                      </span>
                      <p className="font-bold text-foreground">{item.nomeDivida}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.motivo}</p>
                  </div>
                  {dataQuit && (
                    <span className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Data Estimada</p>
                      <p className="text-sm font-semibold text-emerald-accent">{formatDate(dataQuit)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">em ~{diasAte} dias</p>
                    </span>
                  )}
                </div>

                {dataQuit && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-1">Juros Economizados</p>
                      <p className="font-semibold text-emerald-accent">{formatCurrency(efeito.totalJurosPago)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Parcelas Quitadas</p>
                      <p className="font-semibold text-foreground">{efeito.parcelasQuitadas}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Tempo</p>
                      <p className="font-semibold text-foreground">
                        {Math.ceil((dataQuit.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))}m
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Resumo de Economia */}
      <Card className="p-4 bg-gradient-to-r from-emerald-accent/10 to-sky-accent/10 border-border">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-emerald-accent mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-foreground mb-2">Resumo da Economia</p>
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">
                Total pago: <span className="font-semibold text-foreground">{formatCurrency(resultado.totalPago)}</span>
              </p>
              <p className="text-muted-foreground">
                Juros pagos: <span className="font-semibold text-destructive">{formatCurrency(resultado.totalJuros)}</span>
              </p>
              <p className="text-muted-foreground border-t border-current pt-1 mt-1">
                Economia estimada: <span className="font-bold text-emerald-accent">{formatCurrency(resultado.economiJuros)}</span>
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
