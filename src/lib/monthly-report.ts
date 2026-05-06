import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

Chart.register(
  LineController, LineElement, PointElement, LinearScale, CategoryScale,
  BarController, BarElement, DoughnutController, ArcElement, Title, Tooltip, Legend, Filler
);

const BRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n) || 0);

const COLORS = {
  navy: "#0B1F3A",
  gold: "#D4AF37",
  emerald: "#10B981",
  red: "#DC2626",
  gray: "#6B7280",
  light: "#F3F4F6",
};

async function renderChartToImage(
  type: "line" | "bar" | "doughnut",
  data: any,
  options: any = {},
  width = 800,
  height = 360,
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const chart = new Chart(ctx, {
    type,
    data,
    options: {
      responsive: false,
      animation: false,
      plugins: {
        legend: { position: "bottom", labels: { font: { size: 12 } } },
        ...options.plugins,
      },
      ...options,
    } as any,
  });
  // wait one frame for render
  await new Promise((r) => setTimeout(r, 50));
  const img = canvas.toDataURL("image/png");
  chart.destroy();
  return img;
}

interface ReportData {
  monthYear: string; // 2026-05
  monthLabel: string; // Maio 2026
  user: { name: string; email: string };
  salary: number;
  extras: Array<{ description: string; amount: number; date: string }>;
  accounts: Array<{ name: string; amount: number; due_day: number; paid: boolean; account_type: string }>;
  debts: Array<{ nome: string; valor_total: number; valor_restante: number; parcela_mensal: number; parcelas_restantes: number | null }>;
  goals: Array<{ name: string; target_amount: number; current_amount: number; monthly_amount: number }>;
  payments: Array<{ name: string; amount: number; paid_at: string }>;
  expenses: Array<{ description: string; amount: number; category: string; date: string }>;
  balanceHistory: Array<{ month: string; balance: number }>;
}

async function fetchReportData(monthYear: string): Promise<ReportData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: profile } = await supabase.from("profiles").select("display_name, email").eq("id", user.id).maybeSingle();

  const [
    { data: salaryRow },
    { data: extras },
    { data: accounts },
    { data: debts },
    { data: goals },
    { data: expenses },
  ] = await Promise.all([
    supabase.from("salary").select("amount").eq("user_id", user.id).eq("month_year", monthYear).maybeSingle(),
    supabase.from("extra_income").select("description, amount, date").eq("user_id", user.id).eq("month_year", monthYear).order("date"),
    supabase.from("accounts").select("name, amount, due_day, paid, account_type, paid_at").eq("user_id", user.id).eq("month_year", monthYear),
    supabase.from("debts").select("nome, valor_total, valor_restante, parcela_mensal, parcelas_restantes").eq("user_id", user.id),
    supabase.from("goals").select("name, target_amount, current_amount, monthly_amount").eq("user_id", user.id),
    supabase.from("expenses").select("description, amount, category, date").eq("user_id", user.id).gte("date", `${monthYear}-01`).lte("date", `${monthYear}-31`),
  ]);

  // Balance history (last 6 months)
  const balanceHistory: Array<{ month: string; balance: number }> = [];
  const [yy, mm] = monthYear.split("-").map(Number);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(yy, mm - 1 - i, 1);
    const my = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const [{ data: s }, { data: ex }, { data: ac }] = await Promise.all([
      supabase.from("salary").select("amount").eq("user_id", user.id).eq("month_year", my).maybeSingle(),
      supabase.from("extra_income").select("amount").eq("user_id", user.id).eq("month_year", my),
      supabase.from("accounts").select("amount").eq("user_id", user.id).eq("month_year", my),
    ]);
    const income = Number(s?.amount || 0) + (ex || []).reduce((a, e) => a + Number(e.amount), 0);
    const out = (ac || []).reduce((a, c) => a + Number(c.amount), 0);
    balanceHistory.push({
      month: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      balance: income - out,
    });
  }

  const payments = (accounts || [])
    .filter((a: any) => a.paid && a.paid_at)
    .map((a: any) => ({ name: a.name, amount: Number(a.amount), paid_at: a.paid_at }));

  const monthLabel = new Date(yy, mm - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return {
    monthYear,
    monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
    user: { name: profile?.display_name || user.email || "Usuário", email: profile?.email || user.email || "" },
    salary: Number(salaryRow?.amount || 0),
    extras: (extras || []).map((e: any) => ({ description: e.description, amount: Number(e.amount), date: e.date })),
    accounts: (accounts || []).map((a: any) => ({ name: a.name, amount: Number(a.amount), due_day: a.due_day, paid: a.paid, account_type: a.account_type })),
    debts: (debts || []).map((d: any) => ({ nome: d.nome, valor_total: Number(d.valor_total), valor_restante: Number(d.valor_restante), parcela_mensal: Number(d.parcela_mensal), parcelas_restantes: d.parcelas_restantes })),
    goals: (goals || []).map((g: any) => ({ name: g.name, target_amount: Number(g.target_amount), current_amount: Number(g.current_amount), monthly_amount: Number(g.monthly_amount) })),
    payments,
    expenses: (expenses || []).map((e: any) => ({ description: e.description, amount: Number(e.amount), category: e.category, date: e.date })),
    balanceHistory,
  };
}

function addHeader(pdf: jsPDF, data: ReportData) {
  pdf.setFillColor(COLORS.navy);
  pdf.rect(0, 0, 210, 36, "F");
  pdf.setFillColor(COLORS.gold);
  pdf.rect(0, 36, 210, 1.2, "F");

  pdf.setFillColor(COLORS.gold);
  pdf.circle(20, 18, 7, "F");
  pdf.setTextColor(COLORS.navy);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("C", 20, 21, { align: "center" });

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("Cofrinho Pro", 32, 16);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(212, 175, 55);
  pdf.text(`Relatório Financeiro · ${data.monthLabel}`, 32, 22);
  pdf.setTextColor(220, 220, 220);
  pdf.setFontSize(8);
  pdf.text(`${data.user.name}  ·  ${data.user.email}`, 32, 28);
}

function sectionTitle(pdf: jsPDF, text: string, y: number) {
  pdf.setFillColor(COLORS.gold);
  pdf.rect(14, y - 4, 2.5, 6, "F");
  pdf.setTextColor(COLORS.navy);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text(text, 20, y);
  pdf.setDrawColor(230, 230, 230);
  pdf.setLineWidth(0.3);
  pdf.line(14, y + 2.5, 196, y + 2.5);
}

function addFooter(pdf: jsPDF) {
  const pageCount = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.3);
    pdf.line(14, 285, 196, 285);
    pdf.setFontSize(8);
    pdf.setTextColor(COLORS.gray);
    pdf.text(`Cofrinho Pro · Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 290);
    pdf.text(`Página ${i} de ${pageCount}`, 196, 290, { align: "right" });
  }
}

export async function generateMonthlyReport(monthYear?: string): Promise<void> {
  const today = new Date();
  const my = monthYear || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const data = await fetchReportData(my);

  const pdf = new jsPDF("p", "mm", "a4");

  // ---------- PAGE 1: Summary ----------
  addHeader(pdf, data);
  let y = 42;

  const totalExtras = data.extras.reduce((a, e) => a + e.amount, 0);
  const totalIncome = data.salary + totalExtras;
  const totalAccounts = data.accounts.reduce((a, c) => a + c.amount, 0);
  const totalDebts = data.debts.reduce((a, d) => a + d.parcela_mensal, 0);
  const totalExpenses = data.expenses.reduce((a, e) => a + e.amount, 0);
  const balance = totalIncome - totalAccounts - totalExpenses;

  pdf.setTextColor(COLORS.navy);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("📊 Resumo do Mês", 14, y);
  y += 8;

  // KPI cards
  const kpis = [
    { label: "Receita Total", value: BRL(totalIncome), color: COLORS.emerald },
    { label: "Contas Mensais", value: BRL(totalAccounts), color: COLORS.gold },
    { label: "Dívidas (parcelas)", value: BRL(totalDebts), color: COLORS.red },
    { label: "Saldo Final", value: BRL(balance), color: balance >= 0 ? COLORS.emerald : COLORS.red },
  ];
  const cardW = 44; const cardH = 22; const gap = 4;
  kpis.forEach((k, i) => {
    const x = 14 + i * (cardW + gap);
    pdf.setFillColor(COLORS.light);
    pdf.roundedRect(x, y, cardW, cardH, 2, 2, "F");
    pdf.setFontSize(8);
    pdf.setTextColor(COLORS.gray);
    pdf.setFont("helvetica", "normal");
    pdf.text(k.label, x + 3, y + 6);
    pdf.setFontSize(11);
    pdf.setTextColor(k.color);
    pdf.setFont("helvetica", "bold");
    pdf.text(k.value, x + 3, y + 16);
  });
  y += cardH + 10;

  // Balance evolution chart
  pdf.setTextColor(COLORS.navy);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("📈 Evolução do Saldo (últimos 6 meses)", 14, y);
  y += 4;

  const balanceImg = await renderChartToImage("line", {
    labels: data.balanceHistory.map((b) => b.month),
    datasets: [{
      label: "Saldo",
      data: data.balanceHistory.map((b) => b.balance),
      borderColor: COLORS.emerald,
      backgroundColor: "rgba(16,185,129,0.15)",
      fill: true,
      tension: 0.35,
    }],
  }, { plugins: { legend: { display: false } } });
  pdf.addImage(balanceImg, "PNG", 14, y, 182, 70);
  y += 76;

  // Income vs Outflow
  if (totalIncome + totalAccounts + totalDebts > 0) {
    const doughImg = await renderChartToImage("doughnut", {
      labels: ["Contas", "Dívidas", "Despesas extras", "Sobra"],
      datasets: [{
        data: [totalAccounts, totalDebts, totalExpenses, Math.max(balance, 0)],
        backgroundColor: [COLORS.gold, COLORS.red, "#9CA3AF", COLORS.emerald],
      }],
    }, {}, 600, 360);
    if (y > 200) { pdf.addPage(); addHeader(pdf, data); y = 42; }
    pdf.setTextColor(COLORS.navy);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("💸 Distribuição da Renda", 14, y);
    y += 4;
    pdf.addImage(doughImg, "PNG", 50, y, 110, 65);
    y += 72;
  }

  // ---------- PAGE 2: Accounts + Debts ----------
  pdf.addPage();
  addHeader(pdf, data);
  y = 42;
  pdf.setTextColor(COLORS.navy);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("🧾 Contas Mensais", 14, y);
  y += 4;

  autoTable(pdf, {
    startY: y + 2,
    head: [["Conta", "Categoria", "Vencimento", "Valor", "Status"]],
    body: data.accounts.length
      ? data.accounts.map((a) => [a.name, a.account_type, `Dia ${a.due_day}`, BRL(a.amount), a.paid ? "✓ Paga" : "Pendente"])
      : [["—", "—", "—", "—", "—"]],
    headStyles: { fillColor: [11, 31, 58], textColor: [212, 175, 55] },
    styles: { fontSize: 9 },
    foot: [["", "", "Total", BRL(totalAccounts), ""]],
    footStyles: { fillColor: [243, 244, 246], textColor: [11, 31, 58], fontStyle: "bold" },
  });

  y = (pdf as any).lastAutoTable.finalY + 10;
  if (y > 230) { pdf.addPage(); addHeader(pdf, data); y = 42; }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("💳 Dívidas", 14, y);
  y += 4;

  autoTable(pdf, {
    startY: y + 2,
    head: [["Dívida", "Total", "Restante", "Parcela", "Parcelas restantes", "Progresso"]],
    body: data.debts.length
      ? data.debts.map((d) => {
          const pct = d.valor_total > 0 ? Math.round(((d.valor_total - d.valor_restante) / d.valor_total) * 100) : 0;
          return [d.nome, BRL(d.valor_total), BRL(d.valor_restante), BRL(d.parcela_mensal), d.parcelas_restantes ?? "—", `${pct}%`];
        })
      : [["—", "—", "—", "—", "—", "—"]],
    headStyles: { fillColor: [11, 31, 58], textColor: [212, 175, 55] },
    styles: { fontSize: 9 },
  });

  // Debt chart
  if (data.debts.length > 0) {
    y = (pdf as any).lastAutoTable.finalY + 8;
    if (y > 200) { pdf.addPage(); addHeader(pdf, data); y = 42; }
    const debtImg = await renderChartToImage("bar", {
      labels: data.debts.map((d) => d.nome),
      datasets: [
        { label: "Pago", data: data.debts.map((d) => d.valor_total - d.valor_restante), backgroundColor: COLORS.emerald },
        { label: "Restante", data: data.debts.map((d) => d.valor_restante), backgroundColor: COLORS.red },
      ],
    }, { scales: { x: { stacked: true }, y: { stacked: true } } });
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(COLORS.navy);
    pdf.text("Progresso por dívida", 14, y);
    pdf.addImage(debtImg, "PNG", 14, y + 3, 182, 70);
  }

  // ---------- PAGE 3: Goals + Payment History ----------
  pdf.addPage();
  addHeader(pdf, data);
  y = 42;
  pdf.setTextColor(COLORS.navy);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("🎯 Metas", 14, y);
  y += 4;

  autoTable(pdf, {
    startY: y + 2,
    head: [["Meta", "Objetivo", "Atual", "Mensal", "Progresso", "Tempo estimado"]],
    body: data.goals.length
      ? data.goals.map((g) => {
          const pct = g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0;
          const remaining = Math.max(g.target_amount - g.current_amount, 0);
          const months = g.monthly_amount > 0 ? Math.ceil(remaining / g.monthly_amount) : null;
          return [g.name, BRL(g.target_amount), BRL(g.current_amount), BRL(g.monthly_amount), `${pct}%`, months ? `${months} meses` : "—"];
        })
      : [["—", "—", "—", "—", "—", "—"]],
    headStyles: { fillColor: [11, 31, 58], textColor: [212, 175, 55] },
    styles: { fontSize: 9 },
  });

  y = (pdf as any).lastAutoTable.finalY + 10;
  if (y > 230) { pdf.addPage(); addHeader(pdf, data); y = 42; }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("📜 Histórico de Pagamentos", 14, y);
  y += 4;

  autoTable(pdf, {
    startY: y + 2,
    head: [["Conta", "Valor", "Data"]],
    body: data.payments.length
      ? data.payments.map((p) => [p.name, BRL(p.amount), new Date(p.paid_at).toLocaleDateString("pt-BR")])
      : [["—", "—", "—"]],
    headStyles: { fillColor: [11, 31, 58], textColor: [212, 175, 55] },
    styles: { fontSize: 9 },
  });

  // ---------- PAGE 4: Extras ----------
  pdf.addPage();
  addHeader(pdf, data);
  y = 42;
  pdf.setTextColor(COLORS.navy);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("💰 Renda Extra", 14, y);

  autoTable(pdf, {
    startY: y + 4,
    head: [["Descrição", "Data", "Valor"]],
    body: data.extras.length
      ? data.extras.map((e) => [e.description, new Date(e.date).toLocaleDateString("pt-BR"), BRL(e.amount)])
      : [["—", "—", "—"]],
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
    styles: { fontSize: 9 },
    foot: [["", "Total", BRL(totalExtras)]],
    footStyles: { fillColor: [243, 244, 246], textColor: [11, 31, 58], fontStyle: "bold" },
  });

  y = (pdf as any).lastAutoTable.finalY + 10;
  if (y > 230) { pdf.addPage(); addHeader(pdf, data); y = 42; }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("🛒 Despesas Extras", 14, y);

  autoTable(pdf, {
    startY: y + 4,
    head: [["Descrição", "Categoria", "Data", "Valor"]],
    body: data.expenses.length
      ? data.expenses.map((e) => [e.description, e.category, new Date(e.date).toLocaleDateString("pt-BR"), BRL(e.amount)])
      : [["—", "—", "—", "—"]],
    headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
    styles: { fontSize: 9 },
    foot: [["", "", "Total", BRL(totalExpenses)]],
    footStyles: { fillColor: [243, 244, 246], textColor: [11, 31, 58], fontStyle: "bold" },
  });

  addFooter(pdf);
  pdf.save(`cofrinho-pro-relatorio-${data.monthYear}.pdf`);
}
