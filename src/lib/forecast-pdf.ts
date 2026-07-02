import type { ForecastResult, Strategy } from "@/financial/forecastSimulation";
import type { Debt } from "@/financial/types";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const STRATEGY_LABEL: Record<Strategy, string> = {
  avalanche: "Avalanche (maior juro)",
  snowball: "Snowball (menor saldo)",
  smart: "Fluxo de Caixa (maior parcela)",
};

interface ExportArgs {
  debts: Debt[];
  forecast: ForecastResult;
  receita: number;
  contas: number;
  parcelas: number;
  saldoLivre: number;
  reservaMinima: number;
  saldoUtilizavel: number;
  extraDirigido: number;
  strategy: Strategy;
  usage: "hard" | "mista";
  profile: string;
  horizon: number;
  score: number;
}

export async function exportForecastPDF(args: ExportArgs) {
  const { jsPDF } = await import("jspdf");
  const autoTableMod = await import("jspdf-autotable");
  const autoTable = (autoTableMod as any).default || (autoTableMod as any).autoTable;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  let y = 16;

  // Cabeçalho
  doc.setFillColor(16, 122, 87);
  doc.rect(0, 0, pageWidth, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Cofrinho Pro", marginX, 10);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Relatório de Previsão Financeira", marginX, 16);
  doc.setFontSize(9);
  doc.text(
    `Gerado em ${new Date().toLocaleDateString("pt-BR")} · Horizonte ${args.horizon} meses`,
    pageWidth - marginX,
    16,
    { align: "right" },
  );

  y = 30;
  doc.setTextColor(20, 20, 20);

  // Resumo Executivo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Resumo Executivo", marginX, y);
  y += 2;

  autoTable(doc, {
    startY: y + 2,
    theme: "grid",
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [16, 122, 87], textColor: 255 },
    head: [["Indicador", "Valor"]],
    body: [
      ["Renda mensal", fmt(args.receita)],
      ["Contas mensais", fmt(args.contas)],
      ["Total de parcelas (mínimas)", fmt(args.parcelas)],
      ["Saldo livre", fmt(args.saldoLivre)],
      [`Reserva de segurança (${args.profile})`, fmt(args.reservaMinima)],
      ["Saldo utilizável", fmt(args.saldoUtilizavel)],
      [`Extra direcionado (${args.usage})`, fmt(args.extraDirigido) + " / mês"],
      ["Estratégia", STRATEGY_LABEL[args.strategy]],
      ["Previsão de quitação total", args.forecast.mesQuitacaoFinal ?? `> ${args.horizon} meses`],
      ["Economia estimada em juros", fmt(args.forecast.economiaJuros)],
      ["Score financeiro", `${args.score} / 100`],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Linha do Tempo das Dívidas
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Linha do Tempo — Todas as Dívidas", marginX, y);

  const timelineRows = [...args.forecast.timeline]
    .sort((a, b) => a.prioridade - b.prioridade)
    .map((t) => [
      `${t.prioridade}ª`,
      t.nome,
      t.banco,
      fmt(t.saldoAtual),
      fmt(t.parcela),
      `${t.jurosMensal.toFixed(2)}%`,
      t.extraRecebido > 0 ? fmt(t.extraRecebido) : "—",
      t.mesTermino,
      t.economiaJuros > 0 ? fmt(t.economiaJuros) : "—",
    ]);

  autoTable(doc, {
    startY: y + 2,
    theme: "striped",
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 8, cellPadding: 1.8 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255 },
    head: [["Pri.", "Dívida", "Instituição", "Saldo", "Parcela", "Juros", "Extra", "Término", "Economia"]],
    body: timelineRows,
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Efeito Cascata (mês a mês)
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Efeito Cascata — Mês a Mês", marginX, y);

  const cascadeRows = args.forecast.months.map((m) => [
    m.label,
    fmt(m.saldoDevedorTotal),
    fmt(m.dividas),
    m.prioridades[0]?.nome ?? "—",
    m.quitadas.length
      ? m.quitadas.map((q) => `${q.nome} (libera ${fmt(q.parcelaLiberada)})`).join(", ")
      : "—",
  ]);

  autoTable(doc, {
    startY: y + 2,
    theme: "grid",
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 8, cellPadding: 1.8, overflow: "linebreak" },
    headStyles: { fillColor: [180, 83, 9], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 30 },
      2: { cellWidth: 28 },
      3: { cellWidth: 40 },
      4: { cellWidth: "auto" },
    },
    head: [["Mês", "Saldo devedor", "Pago no mês", "Prioridade", "Quitações / Cascata"]],
    body: cascadeRows,
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Recomendações
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Recomendações", marginX, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const priority = [...args.forecast.timeline].sort((a, b) => a.prioridade - b.prioridade)[0];
  const recs: string[] = [];
  if (priority && args.extraDirigido > 0) {
    recs.push(
      `Direcione ${fmt(args.extraDirigido)}/mês como extra na dívida "${priority.nome}" (estratégia ${args.strategy}).`,
    );
  }
  if (args.saldoLivre <= 0) {
    recs.push("Modo crise: reduza gastos essenciais e pague apenas parcelas mínimas até equilibrar o fluxo.");
  }
  recs.push(
    `Mantenha uma reserva mínima de ${fmt(args.reservaMinima)} para imprevistos antes de acelerar quitações.`,
  );
  recs.push(
    "Quando uma dívida for quitada, a parcela liberada é somada automaticamente ao pagamento da próxima prioridade (efeito cascata).",
  );

  recs.forEach((r) => {
    const lines = doc.splitTextToSize(`• ${r}`, pageWidth - marginX * 2);
    if (y + lines.length * 4 > 285) { doc.addPage(); y = 20; }
    doc.text(lines, marginX, y);
    y += lines.length * 4 + 2;
  });

  // Rodapé em cada página
  const total = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Cofrinho Pro · Página ${i}/${total}`, pageWidth / 2, 292, { align: "center" });
  }

  doc.save(`Relatorio-Previsao-${new Date().toISOString().split("T")[0]}.pdf`);
}
