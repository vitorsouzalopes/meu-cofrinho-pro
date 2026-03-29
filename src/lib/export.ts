import { saveAs } from "file-saver";

export function exportToCSV(filename: string, rows: object[]) {
  if (!rows.length) return;
  const header = Object.keys(rows[0]);
  const csv = [
    header.join(","),
    ...rows.map(row => header.map(field => JSON.stringify(row[field] ?? "")).join(",")),
  ].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, filename);
}

export async function exportToPDF(filename: string, htmlContent: string) {
  // Lazy load jsPDF
  const jsPDF = (await import("jspdf")).jsPDF;
  const doc = new jsPDF();
  doc.html(htmlContent, {
    callback: function (doc) {
      doc.save(filename);
    },
    x: 10,
    y: 10,
  });
}
