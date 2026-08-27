import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { OCHeader, OCLineItem, LightingCategory } from '../types';
import { consolidateCategoryItems, generateConsolidatedSummary } from './consolidation';

// Color Palette Constants
const COLOR_DARK_PURPLE = [43, 9, 56]; // #2B0938
const COLOR_GOLD = [212, 175, 55]; // #D4AF37
const COLOR_TEXT_DARK = [30, 30, 30]; // #1E1E1E
const COLOR_TEXT_MUTED = [100, 100, 100];
const COLOR_LIGHT_BG = [248, 247, 250];
const COLOR_WHITE = [255, 255, 255];
const COLOR_TABLE_BORDER = [225, 225, 230];

export function generateLightingSummaryPDF(header: OCHeader, items: OCLineItem[]): void {
  // Use Landscape A4 for wide table presentation with many lighting columns
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  let currentY = margin;

  // Header Banner & Decorative Accents
  const drawHeaderBanner = (isFirstPage: boolean) => {
    // Top purple accent band
    doc.setFillColor(COLOR_DARK_PURPLE[0], COLOR_DARK_PURPLE[1], COLOR_DARK_PURPLE[2]);
    doc.rect(0, 0, pageWidth, 18, 'F');

    // Gold trim line below purple band
    doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    doc.rect(0, 18, pageWidth, 1.5, 'F');

    // Title inside band
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('HAZEL OC ASSISTANT', margin, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    doc.text('Lighting Order Confirmation Material Summary', margin + 65, 12);

    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    doc.setTextColor(230, 230, 230);
    doc.text(`Generated: ${dateStr}`, pageWidth - margin - 35, 12);
  };

  drawHeaderBanner(true);
  currentY = 25;

  // OC Metadata Section Card
  doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  doc.setDrawColor(COLOR_TABLE_BORDER[0], COLOR_TABLE_BORDER[1], COLOR_TABLE_BORDER[2]);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 24, 2, 2, 'FD');

  // Left gold vertical accent inside card
  doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.rect(margin, currentY, 2, 24, 'F');

  // Content of Metadata Card
  doc.setTextColor(COLOR_DARK_PURPLE[0], COLOR_DARK_PURPLE[1], COLOR_DARK_PURPLE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ORDER CONFIRMATION DETAILS', margin + 5, currentY + 6);

  doc.setFontSize(8.5);
  const col1X = margin + 5;
  const col2X = margin + 75;
  const col3X = margin + 145;
  const col4X = margin + 215;

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
  doc.text('Client / Customer:', col1X, currentY + 12);
  doc.text('Project Name:', col2X, currentY + 12);
  doc.text('OC Number:', col3X, currentY + 12);
  doc.text('OC Date:', col4X, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
  doc.text(header.customerName || '—', col1X + 28, currentY + 12);
  doc.text(header.projectName || '—', col2X + 22, currentY + 12);
  doc.text(header.ocNumber || '—', col3X + 18, currentY + 12);
  doc.text(header.ocDate || '—', col4X + 15, currentY + 12);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
  doc.text('Ref / Quote No:', col1X, currentY + 19);
  doc.text('Total Items:', col2X, currentY + 19);
  doc.text('Prepared By:', col3X, currentY + 19);
  doc.text('Purpose:', col4X, currentY + 19);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
  doc.text(header.referenceNumber || '—', col1X + 28, currentY + 19);
  doc.text(`${items.length} Line Items`, col2X + 22, currentY + 19);
  doc.text(header.preparedBy || 'Hazel Lighting Team', col3X + 18, currentY + 19);
  doc.text('Purchase / QC / Production', col4X + 15, currentY + 19);

  currentY += 28;

  // Helper to add table section title
  const addSectionTitle = (title: string, count: number) => {
    if (currentY > pageHeight - 35) {
      doc.addPage();
      drawHeaderBanner(false);
      currentY = 25;
    }

    doc.setFillColor(COLOR_DARK_PURPLE[0], COLOR_DARK_PURPLE[1], COLOR_DARK_PURPLE[2]);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 7, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), margin + 4, currentY + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    doc.text(`(${count} ${count === 1 ? 'Item' : 'Items'})`, margin + 6 + doc.getTextWidth(title.toUpperCase()) + 5, currentY + 4.8);

    currentY += 9;
  };

  // Base Table Theme
  const defaultTableStyles: Partial<UserOptions> = {
    theme: 'plain',
    styles: {
      fontSize: 7.5,
      textColor: COLOR_TEXT_DARK as [number, number, number],
      cellPadding: 2,
      lineColor: COLOR_TABLE_BORDER as [number, number, number],
      lineWidth: 0.15,
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: COLOR_DARK_PURPLE as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: COLOR_LIGHT_BG as [number, number, number],
    },
    margin: { left: margin, right: margin },
    showHead: 'everyPage',
  };

  // 1. POWER SUPPLIES
  const psuItems = items.filter(
    i => i.category === 'Power Supplies' || i.category === ('LED Drivers' as any)
  );
  if (psuItems.length > 0) {
    const consolidated = consolidateCategoryItems(psuItems);
    addSectionTitle('Power Supplies & Drivers', consolidated.length);

    const head = [['Sr.', 'Line Item No.', 'Client Code', 'Power Supply / Driver Type', 'Wattage', 'Dimming', 'Qty', 'Unit', 'Remarks']];
    const body = consolidated.map((item, idx) => [
      (idx + 1).toString(),
      item.lineItemNumber || '—',
      item.clientCode || '—',
      item.powerSupplyType || item.driverType || item.itemName || '—',
      item.wattage || '—',
      item.dimming || '—',
      item.quantity.toString(),
      item.unit || 'Nos',
      item.remarks || '—',
    ]);

    autoTable(doc, {
      ...defaultTableStyles,
      startY: currentY,
      head,
      body,
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 28 },
        3: { cellWidth: 70 },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 26 },
        6: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
        7: { cellWidth: 16, halign: 'center' },
        8: { cellWidth: 'auto' },
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) drawHeaderBanner(false);
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 2. LINEARS & SVELTE & FLEXUM
  const linearItems = items.filter(
    i => i.category === 'Linears' || i.category === 'Flexum' || i.category === 'Svelte'
  );
  if (linearItems.length > 0) {
    const consolidated = consolidateCategoryItems(linearItems);
    addSectionTitle('Linear Lighting / Flexum / Svelte', consolidated.length);

    const head = [['Sr.', 'Line Item No.', 'Client Code', 'Item Name / Model', 'Wattage', 'CCT', 'Length', 'Finish', 'Qty', 'Unit', 'Remarks']];
    const body = consolidated.map((item, idx) => [
      (idx + 1).toString(),
      item.lineItemNumber || '—',
      item.clientCode || '—',
      item.itemName || item.productCode || '—',
      item.wattage || '—',
      item.cct || '—',
      item.length || item.dimensions || '—',
      item.finish || '—',
      item.quantity.toString(),
      item.unit || 'Mtrs',
      item.remarks || '—',
    ]);

    autoTable(doc, {
      ...defaultTableStyles,
      startY: currentY,
      head,
      body,
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 26 },
        3: { cellWidth: 55 },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 22, halign: 'center' },
        7: { cellWidth: 24 },
        8: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
        9: { cellWidth: 14, halign: 'center' },
        10: { cellWidth: 'auto' },
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) drawHeaderBanner(false);
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 3. DOWNLIGHTS / SPOTLIGHTS
  const downlightItems = items.filter(
    i => i.category === 'Downlights / Spotlights' || i.category === ('Downlights' as any) || i.category === ('Spotlights' as any)
  );
  if (downlightItems.length > 0) {
    const consolidated = consolidateCategoryItems(downlightItems);
    addSectionTitle('Downlights & Spotlights', consolidated.length);

    const head = [['Sr.', 'Line Item No.', 'Client Code', 'Item Name', 'Wattage', 'CCT', 'CRI', 'Beam', 'Finish', 'IP', 'Qty', 'Unit', 'Remarks']];
    const body = consolidated.map((item, idx) => [
      (idx + 1).toString(),
      item.lineItemNumber || '—',
      item.clientCode || '—',
      item.itemName || item.productCode || '—',
      item.wattage || '—',
      item.cct || '—',
      item.cri || '—',
      item.beamAngle || '—',
      item.finish || '—',
      item.ipRating || '—',
      item.quantity.toString(),
      item.unit || 'Nos',
      item.remarks || '—',
    ]);

    autoTable(doc, {
      ...defaultTableStyles,
      startY: currentY,
      head,
      body,
      columnStyles: {
        0: { cellWidth: 9, halign: 'center' },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 24 },
        3: { cellWidth: 48 },
        4: { cellWidth: 16, halign: 'center' },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 14, halign: 'center' },
        7: { cellWidth: 16, halign: 'center' },
        8: { cellWidth: 20 },
        9: { cellWidth: 14, halign: 'center' },
        10: { cellWidth: 15, halign: 'right', fontStyle: 'bold' },
        11: { cellWidth: 13, halign: 'center' },
        12: { cellWidth: 'auto' },
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) drawHeaderBanner(false);
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 4. PROFILES
  const profileItems = items.filter(i => i.category === 'Profiles');
  if (profileItems.length > 0) {
    const consolidated = consolidateCategoryItems(profileItems);
    addSectionTitle('Aluminum Profiles & Extrusions', consolidated.length);

    const head = [['Sr.', 'Line Item No.', 'Client Code', 'Profile Type', 'Dimension', 'Length', 'Finish', 'Qty', 'Unit', 'Remarks']];
    const body = consolidated.map((item, idx) => [
      (idx + 1).toString(),
      item.lineItemNumber || '—',
      item.clientCode || '—',
      item.profileType || item.itemName || '—',
      item.dimensions || '—',
      item.length || '—',
      item.finish || '—',
      item.quantity.toString(),
      item.unit || 'Mtrs',
      item.remarks || '—',
    ]);

    autoTable(doc, {
      ...defaultTableStyles,
      startY: currentY,
      head,
      body,
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 28 },
        3: { cellWidth: 60 },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 22, halign: 'center' },
        6: { cellWidth: 26 },
        7: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
        8: { cellWidth: 15, halign: 'center' },
        9: { cellWidth: 'auto' },
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) drawHeaderBanner(false);
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 5. GRIDS & DIFFUSERS
  const gridAndDiffuserItems = items.filter(
    i => i.category === 'Grids' || i.category === 'Diffusers'
  );
  if (gridAndDiffuserItems.length > 0) {
    const consolidated = consolidateCategoryItems(gridAndDiffuserItems);
    addSectionTitle('Grids & Diffusers', consolidated.length);

    const head = [['Sr.', 'Line Item No.', 'Category', 'Client Code', 'Type / Name', 'Dimension / Length', 'Finish', 'Qty', 'Unit', 'Remarks']];
    const body = consolidated.map((item, idx) => [
      (idx + 1).toString(),
      item.lineItemNumber || '—',
      item.category,
      item.clientCode || '—',
      item.itemName || item.productCode || '—',
      item.dimensions || item.length || '—',
      item.finish || '—',
      item.quantity.toString(),
      item.unit || 'Nos',
      item.remarks || '—',
    ]);

    autoTable(doc, {
      ...defaultTableStyles,
      startY: currentY,
      head,
      body,
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 24 },
        3: { cellWidth: 28 },
        4: { cellWidth: 55 },
        5: { cellWidth: 32 },
        6: { cellWidth: 24 },
        7: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
        8: { cellWidth: 15, halign: 'center' },
        9: { cellWidth: 'auto' },
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) drawHeaderBanner(false);
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 6. CONNECTORS & ACCESSORIES & OTHER ITEMS
  const otherItems = items.filter(
    i =>
      i.category === 'Connectors' ||
      i.category === 'Accessories / Other Items' ||
      i.category === 'Other Lighting Products' ||
      (!psuItems.includes(i) &&
        !linearItems.includes(i) &&
        !downlightItems.includes(i) &&
        !profileItems.includes(i) &&
        !gridAndDiffuserItems.includes(i))
  );

  if (otherItems.length > 0) {
    const consolidated = consolidateCategoryItems(otherItems);
    addSectionTitle('Connectors, Accessories & Other Items', consolidated.length);

    const head = [['Sr.', 'Line Item No.', 'Client Code', 'Item Name / Model', 'Specification / Description', 'Qty', 'Unit', 'Remarks']];
    const body = consolidated.map((item, idx) => [
      (idx + 1).toString(),
      item.lineItemNumber || '—',
      item.clientCode || '—',
      item.itemName || item.productCode || '—',
      item.originalDescription || item.remarks || '—',
      item.quantity.toString(),
      item.unit || 'Nos',
      item.remarks || '—',
    ]);

    autoTable(doc, {
      ...defaultTableStyles,
      startY: currentY,
      head,
      body,
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 28 },
        3: { cellWidth: 65 },
        4: { cellWidth: 75 },
        5: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
        6: { cellWidth: 15, halign: 'center' },
        7: { cellWidth: 'auto' },
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) drawHeaderBanner(false);
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 7. CONSOLIDATED MATERIAL SUMMARY SECTION
  const consolidatedSummary = generateConsolidatedSummary(items);
  if (consolidatedSummary.length > 0) {
    if (currentY > pageHeight - 45) {
      doc.addPage();
      drawHeaderBanner(false);
      currentY = 25;
    }

    doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    doc.rect(margin, currentY, pageWidth - margin * 2, 7.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(COLOR_DARK_PURPLE[0], COLOR_DARK_PURPLE[1], COLOR_DARK_PURPLE[2]);
    doc.text('CONSOLIDATED MATERIAL SUMMARY (GROUPED BY EXACT SPECIFICATION)', margin + 4, currentY + 5.2);

    currentY += 9.5;

    const summaryHead = [['Sr.', 'Line Nos.', 'Category', 'Item Name / Code', 'Exact Specification', 'Total Qty', 'Unit']];
    const summaryBody = consolidatedSummary.map((s, idx) => [
      (idx + 1).toString(),
      s.lineItemNumbers || '—',
      s.category,
      s.itemName || s.productCode,
      s.specification,
      s.totalQuantity.toString(),
      s.unit,
    ]);

    autoTable(doc, {
      ...defaultTableStyles,
      startY: currentY,
      head: summaryHead,
      body: summaryBody,
      headStyles: {
        fillColor: COLOR_DARK_PURPLE as [number, number, number],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 35 },
        3: { cellWidth: 50 },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
        6: { cellWidth: 16, halign: 'center' },
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) drawHeaderBanner(false);
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setDrawColor(COLOR_TABLE_BORDER[0], COLOR_TABLE_BORDER[1], COLOR_TABLE_BORDER[2]);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
    doc.text(
      `Hazel OC Assistant • OC: ${header.ocNumber || 'N/A'} • Client: ${header.customerName || 'N/A'} • Project: ${header.projectName || 'N/A'}`,
      margin,
      pageHeight - 6
    );

    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 6);
  }

  // Dynamic Filename Generation with Sanitized OC Number & Project Name
  const cleanOcNumber = (header.ocNumber || header.referenceNumber || 'OC_Summary')
    .trim()
    .replace(/[\/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_');

  const cleanProjectName = header.projectName
    ? `_${header.projectName.trim().replace(/[\/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_')}`
    : '';

  const currentDate = new Date().toISOString().slice(0, 10);
  const filename = `Hazel_OC_${cleanOcNumber}${cleanProjectName}_${currentDate}.pdf`;

  // Download the generated PDF
  doc.save(filename);
}
