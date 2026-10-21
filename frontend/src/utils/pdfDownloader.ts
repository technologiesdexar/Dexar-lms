'use client';

/**
 * Downloads a DOM element as a high-quality A4 PDF document.
 * Uses html2canvas-pro (which natively supports modern CSS Level 4 color functions: lab, oklch, oklab)
 * and jsPDF for reliable, multi-page vector-ready PDF generation.
 */
export async function downloadReportPdf(
  elementOrId: HTMLElement | string,
  filename: string
): Promise<void> {
  if (typeof window === 'undefined') return;

  const element = typeof elementOrId === 'string'
    ? document.getElementById(elementOrId)
    : elementOrId;

  if (!element) {
    console.error('PDF element not found:', elementOrId);
    throw new Error('Report container element not found.');
  }

  // Dynamically import html2canvas-pro and jspdf for Next.js client-side execution
  // @ts-ignore
  const html2canvasModule = await import('html2canvas-pro');
  const html2canvas = html2canvasModule.default || html2canvasModule;

  const { jsPDF } = await import('jspdf');

  const cleanFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;

  // Render canvas with html2canvas-pro (supports modern Tailwind v4 color spaces)
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth || 1024,
  });

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const margin = 8;
  const contentWidth = pdfWidth - margin * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;

  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  let heightLeft = contentHeight;
  let position = margin;

  pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
  heightLeft -= (pdfHeight - margin * 2);

  while (heightLeft > 0) {
    position = heightLeft - contentHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
    heightLeft -= (pdfHeight - margin * 2);
  }

  pdf.save(cleanFilename);
}
