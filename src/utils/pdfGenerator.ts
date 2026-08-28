// src/utils/pdfGenerator.ts

import { getConsolidatedItems, OCLineItem } from './consolidation';

export interface OrderConfirmationData {
  ocNumber?: string;
  clientName?: string;
  projectName?: string;
  refQuoteNo?: string;
  ocDate?: string;
  preparedBy?: string;
  purpose?: string;
  items: OCLineItem[];
  [key: string]: any;
}

/**
 * Generates formatted HTML for PDF export.
 * Table 1 retains individual line items.
 * Table 2 merges items with matching specs via getConsolidatedItems().
 */
export function generateOCHtml(data: OrderConfirmationData): string {
  const rawItems = data.items || [];
  
  // Group identical specifications and merge quantities for Table 2
  const consolidatedItems = getConsolidatedItems(rawItems);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Hazel OC - ${data.ocNumber || 'Export'}</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #222; font-size: 11px; line-height: 1.4; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 14px; }
        .header-title { font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
        .header-subtitle { font-size: 12px; color: #555; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 18px; font-size: 11px; background: #f9f9f9; padding: 10px; border-radius: 4px; }
        .section-header { font-size: 12px; font-weight: bold; text-transform: uppercase; margin: 20px 0 8px 0; border-bottom: 1px solid #444; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; vertical-align: top; }
        th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; font-size: 10px; color: #444; }
        .text-right { text-align: right; }
        .font-mono { font-family: monospace; }
        .font-bold { font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="header-title">HAZEL OC ASSISTANT</div>
          <div class="header-subtitle">Lighting Order Confirmation Material Summary</div>
        </div>
        <div class="text-right">
          <div><strong>OC Number:</strong> ${data.ocNumber || '-'}</div>
          <div><strong>Generated:</strong> ${new Date().toLocaleDateString('en-GB')}</div>
        </div>
      </div>

      <div class="meta-grid">
        <div><strong>Client/Customer:</strong> ${data.clientName || '-'}</div>
        <div><strong>Project:</strong> ${data.projectName || '-'}</div>
        <div><strong>Ref/Quote No:</strong> ${data.refQuoteNo || '-'}</div>
        <div><strong>Prepared By:</strong> ${data.preparedBy || '-'}</div>
      </div>

      <!-- TABLE 1: DETAILED MATERIAL SUMMARY (RAW ITEMS) -->
      <div class="section-header">Detailed Material Summary (${rawItems.length} Line Items)</div>
      <table>
        <thead>
          <tr>
            <th>Sr No</th>
            <th>Line Item</th>
            <th>Client Code</th>
            <th>Item Name / Model</th>
            <th>Specification / Description</th>
            <th class="text-right">Qty</th>
            <th>Unit</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${rawItems.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td class="font-mono">${item.lineItemNumber || index + 1}</td>
              <td class="font-mono">${item.clientCode || '-'}</td>
              <td class="font-bold">${item.itemName || item.productCode || '-'}</td>
              <td>${formatSpecString(item)}</td>
              <td class="text-right font-bold">${item.quantity}</td>
              <td>${item.unit || 'Nos'}</td>
              <td>${item.remarks || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- TABLE 2: CONSOLIDATED MATERIAL SUMMARY (MERGED BY SPECIFICATION) -->
      <div class="section-header">CONSOLIDATED MATERIAL SUMMARY (GROUPED BY EXACT SPECIFICATION)</div>
      <table>
        <thead>
          <tr>
            <th>Sr No</th>
            <th>Line Nos.</th>
            <th>Client Code(s)</th>
            <th>Item Name / Code</th>
            <th>Exact Specification</th>
            <th class="text-right">Total Qty</th>
            <th>Unit</th>
          </tr>
        </thead>
        <tbody>
          ${consolidatedItems.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td class="font-mono">${item.lineItemNumber || '-'}</td>
              <td class="font-mono">${item.clientCode || '-'}</td>
              <td class="font-bold">${item.itemName || item.productCode || '-'}</td>
              <td>${formatSpecString(item)}</td>
              <td class="text-right font-bold">${item.quantity}</td>
              <td>${item.unit || 'Nos'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

/**
 * Formats item technical parameters into a clean specification string.
 */
function formatSpecString(item: OCLineItem): string {
  const parts: string[] = [];
  if (item.wattage) parts.push(`Wattage: ${item.wattage}`);
  if (item.cct) parts.push(`CCT: ${item.cct}`);
  if (item.beamAngle) parts.push(`Beam: ${item.beamAngle}`);
  if (item.finish) parts.push(`Finish: ${item.finish}`);
  if (item.ipRating) parts.push(`IP: ${item.ipRating}`);
  if (item.driverType) parts.push(`Driver: ${item.driverType}`);
  
  return parts.length > 0 ? parts.join(' | ') : (item.specification || item.description || '-');
}
