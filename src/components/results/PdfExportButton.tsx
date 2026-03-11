"use client";

import { useState, type RefObject } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";

interface PdfExportButtonProps {
  targetRef: RefObject<HTMLDivElement | null>;
  filename?: string;
}

export default function PdfExportButton({
  targetRef,
  filename = "juego-del-limon-resultados",
}: PdfExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (!targetRef.current) return;

    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(targetRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#faf5f0",
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // A4 dimensions in mm
      const pdfWidth = 210;
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

      const pdf = new jsPDF({
        orientation: pdfHeight > 297 ? "portrait" : "portrait",
        unit: "mm",
        format: [pdfWidth, Math.max(pdfHeight, 297)],
      });

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${filename}.pdf`);

      toast.success("PDF descargado");
    } catch (err: any) {
      toast.error("Error al exportar: " + (err.message || err));
    }
    setExporting(false);
  }

  return (
    <Button variant="secondary" onClick={handleExport} loading={exporting}>
      Descargar PDF
    </Button>
  );
}
