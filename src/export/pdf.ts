import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';

export async function exportPdfFromSvg(svgElement: SVGSVGElement, fileName: string, widthMm: number, heightMm: number): Promise<void> {
  const pdf = new jsPDF({
    unit: 'mm',
    format: [widthMm, heightMm],
    orientation: widthMm > heightMm ? 'landscape' : 'portrait'
  });

  await svg2pdf(svgElement, pdf, {
    x: 0,
    y: 0,
    width: widthMm,
    height: heightMm
  });

  pdf.save(fileName);
}
