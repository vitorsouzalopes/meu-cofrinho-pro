import { saveAs } from "file-saver";

export function exportToCSV(filename: string, rows: object[]) {
  if (!rows.length) return;
  const header = Object.keys(rows[0]);
  const csv = [
    header.join(","),
    ...rows.map((row) =>
      header.map((field) => JSON.stringify((row as Record<string, unknown>)[field] ?? "")).join(",")
    ),
  ].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, filename);
}

export async function exportToPDF(filename: string, htmlContent: string) {
  const jsPDF = (await import("jspdf")).jsPDF;
  const doc = new jsPDF();
  doc.html(htmlContent, {
    callback: function (doc) {
      doc.save(filename);
    },
    x: 10,
    y: 10,
    width: 180,
  });
}

export async function shareReport(title: string, text: string, url?: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch {
      return false;
    }
  }
  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(`${title}\n${text}${url ? `\n${url}` : ""}`);
    return true;
  } catch {
    return false;
  }
}
