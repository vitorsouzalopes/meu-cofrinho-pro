import type { DebtSimulation, EvolutionRow } from "@/components/planner/ForecastReport";
import type { Strategy } from "@/financial/forecastSimulation";
import type { Debt } from "@/financial/types";

const safe = (v: number) => (Number.isFinite(v) ? v : 0);
const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(safe(v));

const STRATEGY_LABEL: Record<Strategy, string> = {
  avalanche: "Avalanche (maior juro)",
  snowball: "Snowball (menor saldo)",
  smart: "Fluxo de Caixa (maior parcela)",
};

interface ExportArgs {
  debts: Debt[];
  debtSimulations: DebtSimulation[];
  evolutionData: EvolutionRow[];
  receita: number;
  contas: number;
  parcelas: number;
  totalSaldoDevedor: number;
  saldoLivre: number;
  reservaMinima: number;
  saldoUtilizavel: number;
  extraDirigido: number;
  strategy: Strategy;
  usage: "hard" | "mista";
  profile: string;
  horizon: number;
  score: number;
  normalQuitacaoMeses: number;
  hardQuitacaoMeses: number;
  mistaQuitacaoMeses: number;
  selectedEconomiaJuros: number;
  selectedEconomiaTempo: number;
  selectedValorLivrePreservado: number;
}

const duration = (months: number) => {
  if (months >= 360) return "> 360m";
  if (months <= 1) return "1 mês";
  return `${months} meses`;
};

export async function exportForecastPDF(args: ExportArgs) {
  const { jsPDF } = await import("jspdf");
  const autoTableMod = await import("jspdf-autotable");
  const autoTable = (autoTableMod as any).default || (autoTableMod as any).autoTable;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  let y = 16;

  const addSectionTitle = (title: string) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, marginX, y);
    y += 4;
  };

  doc.setFillColor(16, 122, 87);
  doc.rect(0, 0, pageWidth, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Cofrinho Pro", marginX, 10);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Relatório de Planejamento de Dívidas", marginX, 16);
  doc.setFontSize(9);
  doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, pageWidth - marginX, 16, {
    align: "right",
  });

  y = 30;
  addSectionTitle("Resumo Executivo");
  autoTable(doc, {
    startY: y,
    theme: "grid",
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [16, 122, 87], textColor: 255 },
    head: [["Indicador", "Valor"]],
    body: [
      ["Renda mensal", fmt(args.receita)],
      ["Contas mensais", fmt(args.contas)],
      ["Total de dívidas", fmt(args.totalSaldoDevedor)],
      ["Total de parcelas", fmt(args.parcelas)],
      ["Saldo livre", fmt(args.saldoLivre)],
      [`Reserva preservada (${args.profile})`, fmt(args.reservaMinima)],
      ["Saldo utilizável", fmt(args.saldoUtilizavel)],
      [`Modo selecionado (${args.usage})`, `${fmt(args.extraDirigido)}/mês`],
      ["Estratégia de ordenação", STRATEGY_LABEL[args.strategy]],
      ["Quitação normal", duration(args.normalQuitacaoMeses)],
      ["Quitação Hard", duration(args.hardQuitacaoMeses)],
      ["Quitação Mista", duration(args.mistaQuitacaoMeses)],
      ["Economia de tempo selecionada", `${args.selectedEconomiaTempo} meses`],
      ["Economia de juros selecionada", fmt(args.selectedEconomiaJuros)],
      ["Valor livre preservado", fmt(args.selectedValorLivrePreservado)],
      ["Score financeiro", `${args.score} / 100`],
    ],
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  addSectionTitle("Todas as Dívidas — Simulação Hard e Mista");
  autoTable(doc, {
    startY: y,
    theme: "striped",
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 7.4, cellPadding: 1.5, overflow: "linebreak" },
    headStyles: { fillColor: [30, 64, 175], textColor: 255 },
    head: [["Dívida", "Instituição", "Saldo", "Parcela", "Juros", "Normal", "Hard", "Mista"]],
    body: args.debtSimulations.map((debt) => [
      debt.nome,
      debt.banco,
      fmt(debt.saldoDevedor),
      fmt(debt.parcelaMensal),
      `${debt.jurosMensal.toFixed(2)}%`,
      `${duration(debt.normal.meses)}\n${debt.normal.termino}`,
      `${duration(debt.hard.meses)}\n${debt.hard.termino}\nExtra ${fmt(debt.hard.extraMensal)}`,
      `${duration(debt.mista.meses)}\n${debt.mista.termino}\nExtra ${fmt(debt.mista.extraMensal)}`,
    ]),
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  addSectionTitle("Comparação entre Cenários de Quitação");
  autoTable(doc, {
    startY: y,
    theme: "grid",
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 8.5, cellPadding: 2 },
    headStyles: { fillColor: [180, 83, 9], textColor: 255 },
    head: [["Cenário", "Extra/mês", "Prazo total", "Economia juros"]],
    body: [
      ["Normal", fmt(0), duration(args.normalQuitacaoMeses), fmt(0)],
      ["Hard", fmt(args.saldoUtilizavel * 0.9), duration(args.hardQuitacaoMeses), fmt(args.debtSimulations.reduce((s, d) => s + d.hard.economiaJuros, 0))],
      ["Mista", fmt(args.saldoUtilizavel * 0.5), duration(args.mistaQuitacaoMeses), fmt(args.debtSimulations.reduce((s, d) => s + d.mista.economiaJuros, 0))],
    ],
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  addSectionTitle("Cronograma de Término de Cada Dívida");
  autoTable(doc, {
    startY: y,
    theme: "striped",
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 8, cellPadding: 1.8 },
    headStyles: { fillColor: [16, 122, 87], textColor: 255 },
    head: [["Dívida", "Normal", "Hard", "Mista", "Economia Hard", "Economia Mista"]],
    body: args.debtSimulations.map((debt) => [
      debt.nome,
      debt.normal.termino,
      debt.hard.termino,
      debt.mista.termino,
      debt.hard.economiaTempo > 0 ? `${debt.hard.economiaTempo}m` : "—",
      debt.mista.economiaTempo > 0 ? `${debt.mista.economiaTempo}m` : "—",
    ]),
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  addSectionTitle("Linha do Tempo e Evolução das Dívidas");
  autoTable(doc, {
    startY: y,
    theme: "grid",
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 8, cellPadding: 1.8 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255 },
    head: [["Mês", "Normal", "Hard", "Mista"]],
    body: args.evolutionData.map((row) => [row.label, fmt(row.normal), fmt(row.hard), fmt(row.mista)]),
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  if (y > 215) {
    doc.addPage();
    y = 20;
  }
  addSectionTitle("Gráfico de Evolução das Dívidas");
  const chartX = marginX;
  const chartY = y + 4;
  const chartW = pageWidth - marginX * 2;
  const chartH = 46;
  const max = Math.max(1, args.totalSaldoDevedor, ...args.evolutionData.flatMap((r) => [r.normal, r.hard, r.mista]));
  doc.setDrawColor(220, 220, 220);
  doc.rect(chartX, chartY, chartW, chartH);
  const drawLine = (values: number[], color: [number, number, number]) => {
    doc.setDrawColor(...color);
    values.forEach((value, index) => {
      if (index === 0) return;
      const prev = values[index - 1];
      const x1 = chartX + ((index - 1) / Math.max(1, values.length - 1)) * chartW;
      const y1 = chartY + chartH - (prev / max) * chartH;
      const x2 = chartX + (index / Math.max(1, values.length - 1)) * chartW;
      const y2 = chartY + chartH - (value / max) * chartH;
      doc.line(x1, y1, x2, y2);
    });
  };
  drawLine(args.evolutionData.map((r) => r.normal), [120, 120, 120]);
  drawLine(args.evolutionData.map((r) => r.hard), [16, 122, 87]);
  drawLine(args.evolutionData.map((r) => r.mista), [30, 64, 175]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("Normal", chartX, chartY + chartH + 7);
  doc.setTextColor(16, 122, 87);
  doc.text("Hard", chartX + 30, chartY + chartH + 7);
  doc.setTextColor(30, 64, 175);
  doc.text("Mista", chartX + 55, chartY + chartH + 7);
  y = chartY + chartH + 14;

  addSectionTitle("Recomendações Financeiras");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  const recs = [
    `Use o modo ${args.usage} apenas se o valor livre preservado (${fmt(args.selectedValorLivrePreservado)}) mantiver segurança no mês.`,
    `Compare Hard e Mista por dívida: Hard acelera quitação; Mista preserva mais caixa livre.`,
    `Mantenha a reserva mínima de ${fmt(args.reservaMinima)} antes de aumentar pagamentos extras.`,
  ];
  recs.forEach((rec) => {
    const lines = doc.splitTextToSize(`• ${rec}`, pageWidth - marginX * 2);
    if (y + lines.length * 4 > 285) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, marginX, y);
    y += lines.length * 4 + 2;
  });

  const total = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Cofrinho Pro · Página ${i}/${total}`, pageWidth / 2, 292, { align: "center" });
  }

  doc.save(`Relatorio-Dividas-${new Date().toISOString().split("T")[0]}.pdf`);
}