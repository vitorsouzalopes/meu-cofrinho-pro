import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { StrategyResult } from '@/financial/multiDebtEngine';
import { Debt } from '@/financial/types';

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

  const handlePrint = () => {
    if (reportRef.current) {
      window.print();
    }
  };

  const handleExportCSV = () => {
    if (!reportRef.current) return;

    let csv = 'Relatório de Dívidas - Cofrinho Pro\n';
    csv += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    csv += `Usuário: ${userName}\n\n`;

    csv += 'RESUMO EXECUTIVO\n';
    csv += `Total de Dívidas,${totalDebts}\n`;
    csv += `Quantidade,${debts.length}\n`;
    csv += `Saldo Livre,${pagamentoMensal}\n`;
    csv += `Estratégia,${strategyResult.estrategia}\n`;
    csv += `Quitação Total,${getMonthName(strategyResult.dataQuitacaoTotal)}\n\n`;

    csv += 'CARTEIRA DE DÍVIDAS\n';
    csv += 'Instituição,Tipo,Saldo,Parcela,Juros\n';
    debts.forEach((debt) => {
      csv += `${debt.banco},${debt.tipo},${debt.valorTotal},${debt.valorParcela},${debt.jurosMensal}%\n`;
    });

    csv += '\nCRONOGRAMA\n';
    csv += 'Dívida,Quitação\n';
    Array.from(strategyResult.datasQuitacao.entries()).forEach(([debtId, date]) => {
      const debt = debts.find((d) => d.id === debtId);
      if (debt) {
        csv += `${debt.banco},${getMonthName(date)}\n`;
      }
    });

    csv += `Todas as Dívidas,${getMonthName(strategyResult.dataQuitacaoTotal)}\n`;

    // Criar arquivo
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
    element.setAttribute('download', `Relatorio-Dividas-${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-4">
      {/* Botões de Ação */}
      <div className="flex gap-3">
        <Button
          onClick={handleExportCSV}
          className="flex-1 bg-emerald-accent hover:bg-emerald-accent/90"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
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

      {/* Relatório */}
      <div ref={reportRef} className="bg-white text-black p-6 space-y-6 rounded-lg border">
        {/* Capa */}
        <div className="border-b-2 border-emerald-600 pb-6">
          <h1 className="text-3xl font-bold text-emerald-600 mb-2">Cofrinho Pro</h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Relatório de Planejamento de Dívidas</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
            <p><strong>Usuário:</strong> {userName}</p>
          </div>
        </div>

        {/* Resumo Executivo */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">📊 Resumo Executivo</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="border p-3 rounded bg-gray-50">
              <p className="text-xs text-gray-600">Total</p>
              <p className="font-bold text-lg">{formatCurrency(totalDebts)}</p>
            </div>
            <div className="border p-3 rounded bg-gray-50">
              <p className="text-xs text-gray-600">Quantidade</p>
              <p className="font-bold text-lg">{debts.length}</p>
            </div>
            <div className="border p-3 rounded bg-gray-50">
              <p className="text-xs text-gray-600">Saldo Livre</p>
              <p className="font-bold text-lg">{formatCurrency(pagamentoMensal)}</p>
            </div>
            <div className="border p-3 rounded bg-emerald-50">
              <p className="text-xs text-gray-600">Estratégia</p>
              <p className="font-bold text-lg capitalize">
                {strategyResult.estrategia === 'avalanche' ? 'Avalanche' : strategyResult.estrategia === 'snowball' ? 'Snowball' : 'Fluxo de Caixa'}
              </p>
            </div>
          </div>
        </div>

        {/* Carteira */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">📋 Carteira de Dívidas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2 text-left">Instituição</th>
                  <th className="border p-2 text-right">Saldo</th>
                  <th className="border p-2 text-right">Parcela</th>
                  <th className="border p-2 text-right">Juros</th>
                </tr>
              </thead>
              <tbody>
                {debts.map((debt) => (
                  <tr key={debt.id} className="border-b">
                    <td className="border p-2">{debt.banco}</td>
                    <td className="border p-2 text-right">{formatCurrency(debt.valorTotal)}</td>
                    <td className="border p-2 text-right">{formatCurrency(debt.valorParcela)}</td>
                    <td className="border p-2 text-right">{debt.jurosMensal.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Estratégia */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">🎯 Estratégia Recomendada</h2>
          <div className="border p-3 rounded bg-blue-50">
            <p className="font-semibold capitalize mb-2">
              {strategyResult.estrategia === 'avalanche' ? 'Avalanche' : strategyResult.estrategia === 'snowball' ? 'Snowball' : 'Fluxo de Caixa'}
            </p>
            <div className="text-sm">
              <p className="mb-2"><strong>Ordem de Prioridade:</strong></p>
              <ol className="list-decimal list-inside text-xs space-y-1">
                {strategyResult.prioridade.map((item, idx) => (
                  <li key={item.debtId}>{item.nomeDivida}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Cronograma */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">📅 Cronograma</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2 text-left">Dívida</th>
                  <th className="border p-2 text-left">Quitação</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(strategyResult.datasQuitacao.entries()).map(([debtId, date]) => {
                  const debt = debts.find((d) => d.id === debtId);
                  return (
                    <tr key={debtId} className="border-b">
                      <td className="border p-2">{debt?.banco}</td>
                      <td className="border p-2">{getMonthName(date)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-emerald-50 font-semibold">
                  <td className="border p-2">Todas as Dívidas</td>
                  <td className="border p-2 text-emerald-600">{getMonthName(strategyResult.dataQuitacaoTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Economia */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">💰 Economia Gerada</h2>
          <div className="border-2 border-emerald-600 p-4 rounded bg-emerald-50">
            <p className="text-sm text-gray-700 mb-2">Economia em Juros:</p>
            <p className="text-3xl font-bold text-emerald-600">{formatCurrency(strategyResult.economiJuros)}</p>
            <p className="text-xs text-gray-600 mt-2">
              Tempo: {formatMonths(strategyResult.mesesTotais)} | Juros: {formatCurrency(strategyResult.totalJuros)}
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <div className="border-t pt-4 text-center text-xs text-gray-600">
          <p>Relatório gerado pelo Cofrinho Pro</p>
        </div>
      </div>
    </div>
  );
}
