import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { OCHeader, OCLineItem } from '../types';
import {
  consolidateCategoryItems,
  generateConsolidatedSummary,
  isFreightOrExcluded,
} from './consolidation';

// Safe helper for autoTable invocation across different bundler environments
const runAutoTable = (doc: jsPDF, options: UserOptions) => {
  const fn = typeof autoTable === 'function' ? autoTable : (autoTable as any).default || (doc as any).autoTable;
  if (typeof fn === 'function') {
    fn(doc, options);
  } else if (typeof (doc as any).autoTable === 'function') {
    (doc as any).autoTable(options);
  } else {
    throw new Error('autoTable plugin is not available on jsPDF');
  }
};

// Color Palette Constants - Luxury Dark Purple & Gold Aesthetic
const COLOR_DARK_PURPLE: [number, number, number] = [43, 9, 56]; // #2B0938
const COLOR_GOLD: [number, number, number] = [212, 175, 55]; // #D4AF37
const COLOR_TEXT_DARK: [number, number, number] = [25, 25, 28]; // #19191C
const COLOR_TEXT_MUTED: [number, number, number] = [105, 95, 115]; // Muted purple-gray
const COLOR_LIGHT_BG: [number, number, number] = [248, 247, 251]; // Clean soft neutral
const COLOR_WHITE: [number, number, number] = [255, 255, 255];
const COLOR_TABLE_BORDER: [number, number, number] = [225, 223, 232]; // Subtle divider

/**
 * Text Overflow & Soft-Wrapping Safeguard Helper
 * 
 * Inserts break opportunities (zero-width spaces or clean spaces after slashes/hyphens)
 * in extra-long unbroken alphanumeric strings so jsPDF autoTable wraps them dynamically.
 */
export function formatPdfCellText(rawText: string | number | undefined | null): string {
  if (rawText === undefined || rawText === null) return '—';
  const text = String(rawText).trim();
  if (!text || text === '—' || text === '-' || text.toLowerCase() === 'n/a') return '—';

  return text
    .replace(/([/\\_\-:+,])(?=[^\s])/g, '$1 ')
    .replace(/([A-Za-z0-9]{14})(?=[A-Za-z0-9])/g, '$1\u200B')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes a sanitized and compliant filename for the Lighting Summary PDF based on Project Name.
 * Required format: `[Project Name] - Summary.pdf` (e.g. `MRS group - Durlabhkunj Jaipur - Summary.pdf`)
 * Fallback: `OC Summary.pdf` if no project name is found.
 */
export function getLightingSummaryPdfFilename(header: OCHeader): string {
  const rawProjectName = (header?.projectName || '').trim();
  
  if (rawProjectName && rawProjectName !== '—' && rawProjectName !== '-' && rawProjectName.toLowerCase() !== 'n/a') {
    const sanitizedProject = rawProjectName
      .replace(/[\\/:*?"<>|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (sanitizedProject) {
      return `${sanitizedProject} - Summary.pdf`;
    }
  }

  return 'OC Summary.pdf';
}

/**
 * METHOD 1 (PREFERRED): HTML DOM CAPTURE METHOD
 * 
 * Directly renders and exports the visible `.oc-container` element into a multi-page A4 PDF
 * using html2canvas and jsPDF. This guarantees 100% visual duplication of on-screen styling,
 * typography, tables, and consolidation notes.
 */
export async function exportHtmlToPdf(
  header: OCHeader,
  elementSelector: string = '#printable-oc-summary'
): Promise<boolean> {
  const element = document.querySelector(elementSelector) as HTMLElement || document.querySelector('.oc-container') as HTMLElement;
  if (!element) {
    console.warn(`Target element ${elementSelector} not found in DOM, falling back to data-driven PDF engine`);
    return false;
  }

  const filename = getLightingSummaryPdfFilename(header);

  // Activate PDF export clean mode (hides buttons, borders, edit controls)
  element.classList.add('pdf-capture-active');

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth || 1000,
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = 210; // A4 portrait width in mm
    const pageHeight = 297; // A4 portrait height in mm
    const margin = 10; // 10mm margins for clean printed document framing
    const printWidth = pageWidth - margin * 2; // 190mm
    const printHeight = (canvas.height * printWidth) / canvas.width;

    // Slice canvas into pages with precise A4 height
    const pageCanvasHeight = (pageHeight - margin * 2) * (canvas.width / printWidth);
    let renderedHeight = 0;
    let pageIndex = 0;

    while (renderedHeight < canvas.height) {
      if (pageIndex > 0) {
        pdf.addPage();
      }

      // Create a sub-canvas for this page slice
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      const currentSliceHeight = Math.min(pageCanvasHeight, canvas.height - renderedHeight);
      pageCanvas.height = currentSliceHeight;

      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          renderedHeight,
          canvas.width,
          currentSliceHeight,
          0,
          0,
          pageCanvas.width,
          currentSliceHeight
        );

        const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        const sliceMmHeight = (currentSliceHeight * printWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', margin, margin, printWidth, sliceMmHeight, undefined, 'FAST');
      }

      renderedHeight += pageCanvasHeight;
      pageIndex++;
    }

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('HTML DOM PDF Capture failed:', error);
    return false;
  } finally {
    element.classList.remove('pdf-capture-active');
  }
}

/**
 * METHOD 2: DATA-DRIVEN AUTOTABLE METHOD (Strictly using Transformed/Consolidated State)
 * 
 * Builds the complete jsPDF document for the Lighting Order Confirmation Summary.
 * CRITICAL: NEVER passes raw un-consolidated items to autoTable().
 * Every category and summary section uses the output of consolidateCategoryItems()
 * and generateConsolidatedSummary(), showing merged line numbers (e.g. "8, 11"),
 * merged client codes (e.g. "CL-2, CL-3"), and summed quantities.
 */
export function buildLightingSummaryPDF(header: OCHeader, rawItems: OCLineItem[]): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const margin = 14; // Left & Right margin (usable width = 269mm)
  const topTableMargin = 24; // Safe top margin for multi-page tables below 19.5mm banner
  const bottomTableMargin = 16; // Bottom margin for tables above footer line at 200.5mm
  const cardWidth = pageWidth - margin * 2; // 269mm

  // 1. Filter out freight and exclusions from active materials
  const materialItems = rawItems.filter((i) => !isFreightOrExcluded(i));

  let currentY = margin;

  // -------------------------------------------------------------
  // 1. TOP HEADER BANNER (Consistent on all pages)
  // -------------------------------------------------------------
  const drawHeaderBanner = (isFirstPage: boolean) => {
    // Dark purple top band (0 to 18mm)
    doc.setFillColor(COLOR_DARK_PURPLE[0], COLOR_DARK_PURPLE[1], COLOR_DARK_PURPLE[2]);
    doc.rect(0, 0, pageWidth, 18, 'F');

    // Gold trim band (18 to 19.5mm)
    doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    doc.rect(0, 18, pageWidth, 1.5, 'F');

    // Brand Title
    doc.setTextColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('HAZEL OC ASSISTANT', margin, 11.5);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    doc.text('Lighting Order Confirmation Material Summary', margin + 56, 11.5);

    // Right-aligned reference / date badge
    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const ocRef = header.ocNumber ? `OC: ${header.ocNumber}  •  ` : '';
    doc.setFontSize(8);
    doc.setTextColor(240, 240, 240);
    doc.text(`${ocRef}Generated: ${dateStr}`, pageWidth - margin, 11.5, { align: 'right' });
  };

  // Draw banner on page 1
  drawHeaderBanner(true);
  currentY = 23;

  // -------------------------------------------------------------
  // 2. ORDER CONFIRMATION DETAILS CARD (Structured non-overlapping grid)
  // -------------------------------------------------------------
  const cardHeight = 29;

  // Card container
  doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  doc.setDrawColor(COLOR_TABLE_BORDER[0], COLOR_TABLE_BORDER[1], COLOR_TABLE_BORDER[2]);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 2, 2, 'FD');

  // Left gold vertical accent
  doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.rect(margin, currentY, 2.5, cardHeight, 'F');

  // Card Header Title
  doc.setTextColor(COLOR_DARK_PURPLE[0], COLOR_DARK_PURPLE[1], COLOR_DARK_PURPLE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('ORDER CONFIRMATION DETAILS', margin + 6, currentY + 5.5);

  // 4-column structured key-value cells with strict bounding widths
  const colW = 63.5;
  const colX = [
    margin + 6,
    margin + 6 + colW,
    margin + 6 + colW * 2,
    margin + 6 + colW * 3,
  ];
  const maxValWidth = colW - 5;

  const renderField = (label: string, value: string, x: number, labelY: number, valY: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
    doc.text(label.toUpperCase(), x, labelY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
    
    const cleanVal = (value || '—').trim() || '—';
    doc.text(cleanVal, x, valY, { maxWidth: maxValWidth });
  };

  // Row 1
  renderField('Client / Customer', header.customerName || '—', colX[0], currentY + 10.5, currentY + 14.5);
  renderField('Project Name', header.projectName || '—', colX[1], currentY + 10.5, currentY + 14.5);
  renderField('OC Number', header.ocNumber || '—', colX[2], currentY + 10.5, currentY + 14.5);
  renderField('OC Date', header.ocDate || '—', colX[3], currentY + 10.5, currentY + 14.5);

  // Row 2
  renderField('Ref / Quote No', header.referenceNumber || '—', colX[0], currentY + 19.5, currentY + 23.5);
  renderField('Total Material Items', `${materialItems.length} Extracted Items`, colX[1], currentY + 19.5, currentY + 23.5);
  renderField('Delivery Date', header.deliveryDate || '—', colX[2], currentY + 19.5, currentY + 23.5);
  renderField('OC Amount', header.totalAmount || '—', colX[3], currentY + 19.5, currentY + 23.5);

  currentY += cardHeight + 6;

  // -------------------------------------------------------------
  // 3. PAGINATION & SECTION MANAGEMENT HELPERS
  // -------------------------------------------------------------
  const ensureSpace = (minRequiredHeightMm: number) => {
    if (currentY + minRequiredHeightMm > pageHeight - bottomTableMargin) {
      doc.addPage();
      currentY = topTableMargin;
    }
  };

  const addSectionTitle = (title: string, count: number) => {
    ensureSpace(24);

    doc.setFillColor(COLOR_DARK_PURPLE[0], COLOR_DARK_PURPLE[1], COLOR_DARK_PURPLE[2]);
    doc.roundedRect(margin, currentY, cardWidth, 7, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
    doc.text(title.toUpperCase(), margin + 4, currentY + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    const titleWidth = doc.getTextWidth(title.toUpperCase());
    doc.text(`(${count} ${count === 1 ? 'Consolidated Spec' : 'Consolidated Specs'})`, margin + 6 + titleWidth + 3, currentY + 4.8);

    currentY += 8.5;
  };

  const defaultTableStyles: Partial<UserOptions> = {
    theme: 'plain',
    styles: {
      fontSize: 7.0,
      textColor: COLOR_TEXT_DARK as [number, number, number],
      cellPadding: { top: 2.8, bottom: 2.8, left: 2.2, right: 2.2 },
      lineColor: COLOR_TABLE_BORDER as [number, number, number],
      lineWidth: 0.15,
      valign: 'top',
      overflow: 'linebreak',
      minCellHeight: 6.5,
    },
    headStyles: {
      fillColor: COLOR_DARK_PURPLE as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      valign: 'middle',
      cellPadding: { top: 3.0, bottom: 3.0, left: 2.2, right: 2.2 },
      minCellHeight: 6.8,
    },
    alternateRowStyles: {
      fillColor: COLOR_LIGHT_BG as [number, number, number],
    },
    margin: { top: topTableMargin, bottom: bottomTableMargin, left: margin, right: margin },
    showHead: 'everyPage',
    rowPageBreak: 'avoid',
    dontBreakRows: true,
  } as any;

  // -------------------------------------------------------------
  // 4. PART 1: CATEGORIZED TABLES (STRICTLY CONSOLIDATED STATE)
  // -------------------------------------------------------------
  ensureSpace(18);
  doc.setFillColor(COLOR_DARK_PURPLE[0], COLOR_DARK_PURPLE[1], COLOR_DARK_PURPLE[2]);
  doc.rect(margin, currentY, cardWidth, 7, 'F');
  doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.rect(margin, currentY + 6.5, cardWidth, 0.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.text('PART 1: EXTRACTED OC MATERIAL DETAILS (CONSOLIDATED BY SPECIFICATION)', margin + 4, currentY + 4.8);

  currentY += 9.5;

  // 4.1 POWER SUPPLIES & DRIVERS (CONSOLIDATED)
  const rawPsuItems = materialItems.filter(
    (i) => i.category === 'Power Supplies' || i.category === ('LED Drivers' as any)
  );
  const psuItems = consolidateCategoryItems(rawPsuItems);

  if (psuItems.length > 0) {
    addSectionTitle('Power Supplies & LED Drivers', psuItems.length);

    const head = [['Sr.', 'OC Line Item(s)', 'Client Code', 'Power Supply / Driver Type & Model', 'Wattage', 'Dimming / Control', 'Qty', 'Unit', 'Remarks / Application']];
    const body = psuItems.map((item, idx) => [
      (idx + 1).toString(),
      formatPdfCellText(item.lineItemNumber),
      formatPdfCellText(item.clientCode),
      formatPdfCellText(item.powerSupplyType || item.driverType || item.itemName),
      formatPdfCellText(item.wattage),
      formatPdfCellText(item.dimming),
      item.quantity.toString(),
      formatPdfCellText(item.unit || 'Nos'),
      formatPdfCellText(item.remarks),
    ]);

    runAutoTable(doc, {
      ...defaultTableStyles,
      startY: currentY,
      head,
      body,
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 22 },
        3: { cellWidth: 62 },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 22 },
        6: { cellWidth: 14, halign: 'right', fontStyle: 'bold' },
        7: { cellWidth: 13, halign: 'center' },
        8: { cellWidth: 90 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  // 4.2 LINEAR LIGHTING (CONSOLIDATED)
  const rawLinearItems = materialItems.filter(
    (i) =>
      i.category === 'Linears' ||
      i.category === 'Flexum' ||
      i.category === 'Svelte' ||
      i.itemName?.toLowerCase().includes('linear') ||
      i.itemName?.toLowerCase().includes('coveline')
  );
  const linearItems = consolidateCategoryItems(rawLinearItems);

  if (linearItems.length > 0) {
    addSectionTitle('Linear Lighting / Flexum Strips / Svelte Fixtures', linearItems.length);

    const head = [['Sr.', 'OC Line Item(s)', 'Client Code', 'Item Name / Model Description', 'Wattage', 'CCT', 'Length / Dims', 'Finish', 'Qty', 'Unit', 'Remarks / Spec Details']];
    const body = linearItems.map((item, idx) => [
      (idx + 1).toString(),
      formatPdfCellText(item.lineItemNumber),
      formatPdfCellText(item.clientCode),
      formatPdfCellText(item.itemName || item.productCode),
      formatPdfCellText(item.wattage),
      formatPdfCellText(item.cct),
      formatPdfCellText(item.length || item.dimensions),
      formatPdfCellText(item.finish),
      item.quantity.toString(),
      formatPdfCellText(item.unit || 'Mtrs'),
      formatPdfCellText(item.remarks),
    ]);

    runAutoTable(doc, {
      ...defaultTableStyles,
      startY: currentY,
      head,
      body,
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 20 },
        3: { cellWidth: 48 },
        4: { cellWidth: 16, halign: 'center' },
        5: { cellWidth: 14, halign: 'center' },
        6: { cellWidth: 18, halign: 'center' },
        7: { cellWidth: 18 },
        8: { cellWidth: 14, halign: 'right', fontStyle: 'bold' },
        9: { cellWidth: 13, halign: 'center' },
        10: { cellWidth: 80 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  // 4.3 DOWNLIGHTS & SPOTLIGHTS (CONSOLIDATED)
  const rawDownlightItems = materialItems.filter(
    (i) =>
      i.category === 'Downlights & Spotlights' ||
      i.category === 'Downlights / Spotlights' ||
      i.category === ('Downlights' as any) ||
      i.category === ('Spotlights' as any)
  );
  const downlightItems = consolidateCategoryItems(rawDownlightItems);

  if (downlightItems.length > 0) {
    addSectionTitle('Downlights & Spotlights', downlightItems.length);

    const head = [['Sr.', 'OC Line Item(s)', 'Client Code', 'Item Name / Model', 'Wattage', 'CCT', 'CRI', 'Beam', 'Finish', 'IP', 'Qty', 'Unit', 'Remarks / Driver & Louver']];
    const body = downlightItems.map((item, idx) => [
      (idx + 1).toString(),
      formatPdfCellText(item.lineItemNumber),
      formatPdfCellText(item.clientCode),
      formatPdfCellText(item.itemName || item.productCode),
      formatPdfCellText(item.wattage),
      formatPdfCellText(item.cct),
      formatPdfCellText(item.cri),
      formatPdfCellText(item.beamAngle),
      formatPdfCellText(item.finish),
      formatPdfCellText(item.ipRating),
      item.quantity.toString(),
      formatPdfCellText(item.unit || 'Nos'),
      formatPdfCellText(item.remarks || item.driverType),
    ]);

    runAutoTable(doc, {
      ...defaultTableStyles,
      startY: currentY,
      head,
      body,
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 18 },
        3: { cellWidth: 44 },
        4: { cellWidth: 14, halign: 'center' },
        5: { cellWidth: 14, halign: 'center' },
        6: { cellWidth: 11, halign: 'center' },
        7: { cellWidth: 12, halign: 'center' },
        8: { cellWidth: 16 },
        9: { cellWidth: 12, halign: 'center' },
        10: { cellWidth: 14, halign: 'right', fontStyle: 'bold' },
        11: { cellWidth: 12, halign: 'center' },
        12: { cellWidth: 74 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  // 4.4 ALUMINUM PROFILES (CONSOLIDATED)
  const rawProfileItems = materialItems.filter((i) => i.category === 'Profiles' || i.profileType?.length > 1);
  const profileItems = consolidateCategoryItems(rawProfileItems);

  if (profileItems.length > 0) {
    addSectionTitle('Aluminum Profiles & Extrusions', profileItems.length);

    const head = [['Sr.', 'OC Line Item(s)', 'Client Code', 'Profile Type / Model Description', 'Dimensions', 'Length', 'Finish', 'Qty', 'Unit', 'Remarks / Mount Details']];
    const body = profileItems.map((item, idx) => [
      (idx + 1).toString(),
      formatPdfCellText(item.lineItemNumber),
      formatPdfCellText(item.clientCode),
      formatPdfCellText(item.profileType || item.itemName),
      formatPdfCellText(item.dimensions),
      formatPdfCellText(item.length),
      formatPdfCellText(item.finish),
      item.quantity.toString(),
      formatPdfCellText(item.unit || 'Mtrs'),
      formatPdfCellText(item.remarks),
    ]);

    runAutoTable(doc, {
      ...defaultTableStyles,
      startY: currentY,
      head,
      body,
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 22 },
        3: { cellWidth: 50 },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 20 },
        7: { cellWidth: 14, halign: 'right', fontStyle: 'bold' },
        8: { cellWidth: 13, halign: 'center' },
        9: { cellWidth: 82 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  // 4.5 ACCESSORIES & OTHER ITEMS (CONSOLIDATED)
  const rawOtherItems = materialItems.filter(
    (i) =>
      !rawPsuItems.includes(i) &&
      !rawLinearItems.includes(i) &&
      !rawDownlightItems.includes(i) &&
      !rawProfileItems.includes(i)
  );
  const otherItems = consolidateCategoryItems(rawOtherItems);

  if (otherItems.length > 0) {
    addSectionTitle('Connectors, Hardware & Accessories', otherItems.length);

    const head = [['Sr.', 'OC Line Item(s)', 'Client Code', 'Item Name / Model', 'Specification / Description Details', 'Qty', 'Unit', 'Remarks / Hardware Notes']];
    const body = otherItems.map((item, idx) => [
      (idx + 1).toString(),
      formatPdfCellText(item.lineItemNumber),
      formatPdfCellText(item.clientCode),
      formatPdfCellText(item.itemName || item.productCode),
      formatPdfCellText(item.originalDescription || item.remarks),
      item.quantity.toString(),
      formatPdfCellText(item.unit || 'Nos'),
      formatPdfCellText(item.remarks),
    ]);

    runAutoTable(doc, {
      ...defaultTableStyles,
      startY: currentY,
      head,
      body,
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 22 },
        3: { cellWidth: 48 },
        4: { cellWidth: 75 },
        5: { cellWidth: 14, halign: 'right', fontStyle: 'bold' },
        6: { cellWidth: 13, halign: 'center' },
        7: { cellWidth: 69 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  // -------------------------------------------------------------
  // 5. PART 2: CONSOLIDATED MATERIAL SUMMARY
  // -------------------------------------------------------------
  const consolidatedSummary = generateConsolidatedSummary(rawItems);
  if (consolidatedSummary.length > 0) {
    ensureSpace(26);

    doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    doc.rect(margin, currentY, cardWidth, 8, 'F');
    doc.setFillColor(COLOR_DARK_PURPLE[0], COLOR_DARK_PURPLE[1], COLOR_DARK_PURPLE[2]);
    doc.rect(margin, currentY + 7.5, cardWidth, 0.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(COLOR_DARK_PURPLE[0], COLOR_DARK_PURPLE[1], COLOR_DARK_PURPLE[2]);
    doc.text('PART 2: CONSOLIDATED MATERIAL SUMMARY (PURCHASING & PRODUCTION LIST)', margin + 4, currentY + 5.3);

    doc.setFontSize(7.5);
    doc.text(
      `${consolidatedSummary.length} Distinct Specs (Identical Items Consolidated)`,
      pageWidth - margin - 4,
      currentY + 5.3,
      { align: 'right' }
    );

    currentY += 10.0;

    const summaryHead = [['Sr. No.', 'OC Line Item No(s).', 'Item Name / Exact Specification', 'Client Code', 'Total Qty']];
    const summaryBody = consolidatedSummary.map((s, idx) => {
      const itemHeader = s.productCode && s.productCode !== '—' && s.productCode !== s.itemName
        ? `${s.itemName}  [Code: ${s.productCode}]`
        : s.itemName;
      const formattedHeader = formatPdfCellText(itemHeader);
      const formattedSpec = formatPdfCellText(s.specification);
      const fullSpecText = formattedHeader !== formattedSpec ? `${formattedHeader}\n${formattedSpec}` : formattedHeader;

      return [
        (idx + 1).toString(),
        formatPdfCellText(s.lineItemNumbers),
        fullSpecText,
        formatPdfCellText(s.clientCode),
        `${s.totalQuantity} ${s.unit}`,
      ];
    });

    runAutoTable(doc, {
      ...defaultTableStyles,
      startY: currentY,
      head: summaryHead,
      body: summaryBody,
      headStyles: {
        fillColor: COLOR_DARK_PURPLE as [number, number, number],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        valign: 'middle',
        cellPadding: { top: 3.0, bottom: 3.0, left: 2.5, right: 2.5 },
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 28, halign: 'center', fontStyle: 'bold', textColor: COLOR_DARK_PURPLE as [number, number, number] },
        2: { cellWidth: 162, cellPadding: { top: 2.8, bottom: 2.8, left: 2.5, right: 2.5 } },
        3: { cellWidth: 35 },
        4: { cellWidth: 34, halign: 'right', fontStyle: 'bold' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // -------------------------------------------------------------
  // 6. FINAL PASS: DRAW HEADER BANNERS & FOOTERS ON ALL PAGES
  // -------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    drawHeaderBanner(i === 1);

    // Footer divider line
    doc.setDrawColor(COLOR_TABLE_BORDER[0], COLOR_TABLE_BORDER[1], COLOR_TABLE_BORDER[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 9.5, pageWidth - margin, pageHeight - 9.5);

    // Footer text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);

    const footerClientInfo = `Hazel OC Assistant  •  OC: ${header.ocNumber || 'N/A'}  •  Client: ${header.customerName || 'N/A'}  •  Project: ${header.projectName || 'N/A'}`;
    doc.text(footerClientInfo, margin, pageHeight - 5.5, { maxWidth: 200 });

    // Page X of Y on right
    doc.setFont('helvetica', 'bold');
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5.5, { align: 'right' });
  }

  return doc;
}

/**
 * Main Entry Point: Generates and downloads the Lighting Summary PDF directly.
 * First attempts the preferred HTML DOM capture method from `.oc-container`.
 * If not in DOM or if capture fails, smoothly falls back to the consolidated AutoTable engine.
 */
export async function generateLightingSummaryPDF(header: OCHeader, items: OCLineItem[]): Promise<void> {
  const domSuccess = await exportHtmlToPdf(header, '#printable-oc-summary');
  if (!domSuccess) {
    const doc = buildLightingSummaryPDF(header, items);
    const filename = getLightingSummaryPdfFilename(header);
    doc.save(filename);
  }
}

/**
 * Generates a Blob URL representing the PDF for live in-app previewing.
 */
export function generateLightingSummaryPDFBlobUrl(header: OCHeader, items: OCLineItem[]): string {
  const doc = buildLightingSummaryPDF(header, items);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}
