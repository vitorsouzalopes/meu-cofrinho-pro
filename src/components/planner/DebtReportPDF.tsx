import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { StrategyResult } from '@/financial/multiDebtEngine';
import { Debt } from '@/financial/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DebtReportPDFProps {
  debts: Debt[];
  strategyResult: StrategyResult;
  pagamentoMensal: number;
  userName?: string;
}

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

const getMonthName = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
};

export default function DebtReportPDF({
  debts,
  strategyResult,
  pagamentoMensal,
  userName = 'Usuário',
}: DebtReportPDFProps) {
  const reportRef = React.useRef<HTMLDivElement>(null);

  const totalDebts = debts.reduce((sum, d) => sum + d.valorTotal, 0);
  const totalJurosBase = debts.reduce((sum, d) => {
    const meses = 12;
    let saldo = d.valorTotal;
    let totalJuros = 0;
    for (let i = 0; i < meses; i++) {
      totalJuros += saldo * (d.jurosMensal / 100);
      saldo -= d.valorParcela;
      if (saldo <= 0) break;
    }
    return sum + totalJuros;
  }, 0);

  // Simular evolução de saldo
  const generateEvolutionData = () => {
    const data = [];
    let currentSaldo = totalDebts;
    const monthlyPayment = pagamentoMensal;

    for (let i = 0; i <= strategyResult.mesesTotais && i <= 24; i++) {
      data.push({
        mes: i,
        mesLabel: i === 0 ? 'Junho' : `+${i}m`,
        saldo: Math.max(0, currentSaldo),
      });

      if (i > 0) {
        currentSaldo -= monthlyPayment * 0.7; // Simplificado
        currentSaldo = Math.max(0, currentSaldo);
      }
    }

    return data;
  };

  const evolutionData = generateEvolutionData();

  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgData = canvas.toDataURL('image/png');
      let heightLeft = canvas.height * pageWidth / canvas.width;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, (canvas.height * pageWidth) / canvas.width);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - canvas.height * pageWidth / canvas.width;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, (canvas.height * pageWidth) / canvas.width);
        heightLeft -= pageHeight;
      }

      pdf.save(`Relatorio-Dividas-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF');
    }
  };

  const handlePrint = () => {
    if (reportRef.current) {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write(reportRef.current.innerHTML);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Botões de Ação */}
      <div className="flex gap-3">
        <Button
          onClick={handleExportPDF}
          className="flex-1 bg-emerald-accent hover:bg-emerald-accent/90"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
        <Button
          onClick={handlePrint}
          variant="outline"
          className="flex-1"
        >
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
      </div>

      {/* Relatório - Conteúdo para PDF */}
      <div ref={reportRef} className="bg-white p-8 space-y-8 text-black">
        {/* Capa */}
        <div className="border-b-2 border-emerald-600 pb-8">
          <h1 className="text-4xl font-bold text-emerald-600 mb-2">Cofrinho Pro</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Relatório de Planejamento de Dívidas</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Data de emissão:</strong> {new Date().toLocaleDateString('pt-BR')}
            </p>
            <p>
              <strong>Usuário:</strong> {userName}
            </p>
          </div>
        </div>

        {/* Resumo Executivo */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">📊 Resumo Executivo</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-300 p-4 rounded">
              <p className="text-xs text-gray-600 mb-1">Total de Dívidas</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(totalDebts)}</p>
            </div>
            <div className="border border-gray-300 p-4 rounded">
              <p className="text-xs text-gray-600 mb-1">Quantidade</p>
              <p className="text-xl font-bold text-gray-800">{debts.length}</p>
            </div>
            <div className="border border-gray-300 p-4 rounded">
              <p className="text-xs text-gray-600 mb-1">Parcelas Mensais</p>
              <p className="text-xl font-bold text-gray-800">
                {formatCurrency(debts.reduce((sum, d) => sum + d.valorParcela, 0))}
              </p>
            </div>
            <div className="border border-gray-300 p-4 rounded">
              <p className="text-xs text-gray-600 mb-1">Saldo Livre Atual</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(pagamentoMensal)}</p>
            </div>
            <div className="border border-gray-300 p-4 rounded">
              <p className="text-xs text-gray-600 mb-1">Estratégia</p>
              <p className="text-xl font-bold text-gray-800 capitalize">
                {strategyResult.estrategia === 'avalanche'
                  ? 'Avalanche'
                  : strategyResult.estrategia === 'snowball'
                  ? 'Snowball'
                  : 'Fluxo de Caixa'}
              </p>
            </div>
            <div className="border border-gray-300 p-4 rounded">
              <p className="text-xs text-gray-600 mb-1">Previsão de Quitação</p>
              <p className="text-xl font-bold text-gray-800">{getMonthName(strategyResult.dataQuitacaoTotal)}</p>
            </div>
          </div>
        </div>

        {/* Carteira de Dívidas */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">📋 Carteira de Dívidas</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2 text-left text-sm font-semibold">Instituição</th>
                <th className="border border-gray-300 p-2 text-left text-sm font-semibold">Tipo</th>
                <th className="border border-gray-300 p-2 text-right text-sm font-semibold">Saldo</th>
                <th className="border border-gray-300 p-2 text-right text-sm font-semibold">Parcela</th>
                <th className="border border-gray-300 p-2 text-right text-sm font-semibold">Juros</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((debt) => (
                <tr key={debt.id}>
                  <td className="border border-gray-300 p-2 text-sm">{debt.banco}</td>
                  <td className="border border-gray-300 p-2 text-sm capitalize">{debt.tipo}</td>
                  <td className="border border-gray-300 p-2 text-right text-sm">{formatCurrency(debt.valorTotal)}</td>
                  <td className="border border-gray-300 p-2 text-right text-sm">{formatCurrency(debt.valorParcela)}</td>
                  <td className="border border-gray-300 p-2 text-right text-sm">{debt.jurosMensal.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Estratégia Recomendada */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">🎯 Estratégia Recomendada</h2>
          <div className="border border-gray-300 p-4 rounded">
            <p className="text-lg font-bold text-gray-800 capitalize mb-2">
              {strategyResult.estrategia === 'avalanche'
                ? 'Avalanche (Maior Taxa de Juros Primeiro)'
                : strategyResult.estrategia === 'snowball'
                ? 'Snowball (Menor Saldo Primeiro)'
                : 'Fluxo de Caixa (Maior Parcela Primeiro)'}
            </p>
            <p className="text-sm text-gray-700 mb-4">
              <strong>Motivo:</strong> Esta estratégia oferece o melhor equilíbrio entre velocidade de quitação e
              economia de juros para sua situação financeira.
            </p>
            <div className="space-y-2">
              <p className="font-semibold text-gray-800">Ordem de Prioridade:</p>
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                {strategyResult.prioridade.map((item, idx) => (
                  <li key={item.debtId}>
                    {item.nomeDivida} - {item.motivo}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Cronograma de Quitação */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">📅 Cronograma de Quitação</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2 text-left text-sm font-semibold">Dívida</th>
                <th className="border border-gray-300 p-2 text-left text-sm font-semibold">Término Previsto</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(strategyResult.datasQuitacao.entries()).map(([debtId, date]) => {
                const debt = debts.find((d) => d.id === debtId);
                return (
                  <tr key={debtId}>
                    <td className="border border-gray-300 p-2 text-sm">{debt?.banco}</td>
                    <td className="border border-gray-300 p-2 text-sm">{getMonthName(date)}</td>
                  </tr>
                );
              })}
              <tr className="bg-emerald-50">
                <td className="border border-gray-300 p-2 font-semibold text-sm">Todas as Dívidas</td>
                <td className="border border-gray-300 p-2 font-semibold text-sm text-emerald-600">
                  {getMonthName(strategyResult.dataQuitacaoTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Evolução da Dívida */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">📈 Evolução da Dívida</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mesLabel" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  stroke="#10b981"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Economia Gerada */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">💰 Economia Gerada</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-300 p-4 rounded">
              <p className="text-xs text-gray-600 mb-2">Sem Estratégia</p>
              <div className="space-y-1">
                <p className="text-sm text-gray-700">
                  <strong>Quitação:</strong> 48 meses
                </p>
                <p className="text-lg font-bold text-gray-800">{formatCurrency(totalJurosBase)}</p>
              </div>
            </div>
            <div className="border border-emerald-300 bg-emerald-50 p-4 rounded">
              <p className="text-xs text-emerald-700 mb-2">Com Estratégia</p>
              <div className="space-y-1">
                <p className="text-sm text-gray-700">
                  <strong>Quitação:</strong> {formatMonths(strategyResult.mesesTotais)}
                </p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(strategyResult.totalJuros)}</p>
              </div>
            </div>
          </div>
          <div className="border-t-2 border-emerald-600 pt-4">
            <p className="text-sm text-gray-600 mb-1">Economia Total em Juros:</p>
            <p className="text-3xl font-bold text-emerald-600">{formatCurrency(strategyResult.economiJuros)}</p>
          </div>
        </div>

        {/* Recomendações */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">🧠 Recomendações do Cofrinho Pro</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">✓</span>
              <span className="text-sm text-gray-700">
                Manter o pagamento de {formatCurrency(pagamentoMensal)} mensais para as dívidas
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">✓</span>
              <span className="text-sm text-gray-700">
                Priorizar a estratégia {strategyResult.estrategia === 'avalanche' ? 'Avalanche' : 'Snowball'} conforme indicado
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">✓</span>
              <span className="text-sm text-gray-700">
                Considerar negociação de dívidas com altas taxas de juros
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">✓</span>
              <span className="text-sm text-gray-700">
                Não utilizar a reserva de emergência para pagar dívidas
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">✓</span>
              <span className="text-sm text-gray-700">
                Revisar este plano a cada 3 meses para acompanhar o progresso
              </span>
            </li>
          </ul>
        </div>

        {/* Rodapé */}
        <div className="border-t border-gray-300 pt-4 text-center text-xs text-gray-600">
          <p>Relatório gerado pelo Cofrinho Pro - {new Date().toLocaleDateString('pt-BR')}</p>
          <p>Este documento é uma simulação baseada nas informações fornecidas.</p>
        </div>
      </div>
    </div>
  );
}
