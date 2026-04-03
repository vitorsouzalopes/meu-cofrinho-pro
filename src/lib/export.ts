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

export async function exportToPDF(filename: string, elementOrHtml: string | HTMLElement) {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  let element: HTMLElement;
  let tempContainer: HTMLElement | null = null;

  if (typeof elementOrHtml === "string") {
    // Create a temporary styled container for HTML string
    tempContainer = document.createElement("div");
    tempContainer.innerHTML = elementOrHtml;
    Object.assign(tempContainer.style, {
      position: "absolute",
      left: "-9999px",
      top: "0",
      width: "800px",
      padding: "24px",
      background: "white",
      color: "black",
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      lineHeight: "1.6",
    });
    // Style tables inside
    tempContainer.querySelectorAll("table").forEach((table) => {
      Object.assign(table.style, {
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "12px",
      });
    });
    tempContainer.querySelectorAll("th, td").forEach((cell) => {
      Object.assign((cell as HTMLElement).style, {
        border: "1px solid #ccc",
        padding: "8px 12px",
        textAlign: "left",
        fontSize: "13px",
      });
    });
    tempContainer.querySelectorAll("th").forEach((th) => {
      Object.assign((th as HTMLElement).style, {
        background: "#f5f5f5",
        fontWeight: "bold",
      });
    });
    document.body.appendChild(tempContainer);
    element = tempContainer;
  } else {
    element = elementOrHtml;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgWidth = 210; // A4 mm
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/png");

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } finally {
    if (tempContainer) {
      document.body.removeChild(tempContainer);
    }
  }
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
  try {
    await navigator.clipboard.writeText(`${title}\n${text}${url ? `\n${url}` : ""}`);
    return true;
  } catch {
    return false;
  }
}
