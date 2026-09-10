export async function exportPdfFromSvg(svgElement: SVGSVGElement, fileName: string, widthMm: number, heightMm: number): Promise<void> {
  const [{ jsPDF }, { svg2pdf }] = await Promise.all([
    import('jspdf'),
    import('svg2pdf.js'),
  ]);

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
