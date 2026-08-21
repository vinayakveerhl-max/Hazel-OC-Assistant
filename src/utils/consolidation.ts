import { OCLineItem, ConsolidatedSummaryItem, LightingCategory } from '../types';

/**
 * Normalizes a string for strict matching (trim, standard dashes, lowercase comparison key)
 */
function norm(val: string | undefined | null): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (trimmed === '—' || trimmed === '-' || trimmed === 'N/A' || trimmed === 'NA' || trimmed === 'null' || trimmed === 'undefined') {
    return '';
  }
  return trimmed;
}

/**
 * Generates a unique key for an item's complete specification according to strict rules.
 * Never combine items with different:
 * - Product Code
 * - Item Name
 * - Wattage
 * - CCT
 * - Finish
 * - Beam Angle
 * - Dimensions / Length
 * - Profile Type
 * - Power Supply / Driver Type
 * - Dimming
 * - Unit
 */
export function getItemSpecKey(item: OCLineItem): string {
  const parts = [
    item.category || '',
    norm(item.itemName).toLowerCase(),
    norm(item.productCode).toLowerCase(),
    norm(item.wattage).toLowerCase(),
    norm(item.cct).toLowerCase(),
    norm(item.cri).toLowerCase(),
    norm(item.beamAngle).toLowerCase(),
    norm(item.finish).toLowerCase(),
    norm(item.ipRating).toLowerCase(),
    norm(item.dimensions).toLowerCase(),
    norm(item.length).toLowerCase(),
    norm(item.profileType).toLowerCase(),
    norm(item.powerSupplyType).toLowerCase(),
    norm(item.driverType).toLowerCase(),
    norm(item.dimming).toLowerCase(),
    norm(item.unit).toLowerCase(),
  ];
  return parts.join('|||');
}

/**
 * Consolidates a list of line items within a category or table:
 * If identical specifications exist, combines quantity and merges line item numbers.
 */
export function consolidateCategoryItems(items: OCLineItem[]): OCLineItem[] {
  const map = new Map<string, OCLineItem>();

  for (const item of items) {
    const key = getItemSpecKey(item);
    if (!map.has(key)) {
      map.set(key, { ...item });
    } else {
      const existing = map.get(key)!;
      // Merge quantities
      const existingQty = Number(existing.quantity) || 0;
      const newQty = Number(item.quantity) || 0;
      existing.quantity = existingQty + newQty;

      // Merge line item numbers (unique and sorted/ordered)
      const existingLines = (existing.lineItemNumber || '').split(',').map(s => s.trim()).filter(Boolean);
      const newLines = (item.lineItemNumber || '').split(',').map(s => s.trim()).filter(Boolean);
      const combinedLines = Array.from(new Set([...existingLines, ...newLines]));
      existing.lineItemNumber = combinedLines.join(', ');

      // Merge client codes if different
      if (item.clientCode && item.clientCode !== existing.clientCode && norm(item.clientCode)) {
        const existingCodes = (existing.clientCode || '').split(',').map(s => s.trim()).filter(Boolean);
        if (!existingCodes.includes(item.clientCode.trim())) {
          existingCodes.push(item.clientCode.trim());
          existing.clientCode = existingCodes.join(', ');
        }
      }

      // Merge remarks if different
      if (item.remarks && item.remarks !== existing.remarks && norm(item.remarks)) {
        if (!existing.remarks || existing.remarks === '—') {
          existing.remarks = item.remarks;
        } else if (!existing.remarks.includes(item.remarks)) {
          existing.remarks = `${existing.remarks}; ${item.remarks}`;
        }
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Builds a comprehensive specification string for display and summary
 */
export function formatFullSpecification(item: OCLineItem): string {
  const specs: string[] = [];

  if (norm(item.wattage)) specs.push(`Wattage: ${item.wattage}`);
  if (norm(item.cct)) specs.push(`CCT: ${item.cct}`);
  if (norm(item.cri)) specs.push(`CRI: ${item.cri}`);
  if (norm(item.beamAngle)) specs.push(`Beam: ${item.beamAngle}`);
  if (norm(item.finish)) specs.push(`Finish: ${item.finish}`);
  if (norm(item.ipRating)) specs.push(`IP: ${item.ipRating}`);
  if (norm(item.dimensions)) specs.push(`Dim: ${item.dimensions}`);
  if (norm(item.length)) specs.push(`Length: ${item.length}`);
  if (norm(item.profileType)) specs.push(`Profile: ${item.profileType}`);
  if (norm(item.powerSupplyType)) specs.push(`PSU: ${item.powerSupplyType}`);
  if (norm(item.driverType)) specs.push(`Driver: ${item.driverType}`);
  if (norm(item.dimming)) specs.push(`Dimming: ${item.dimming}`);

  if (specs.length === 0) {
    return norm(item.originalDescription) || 'Standard Specification';
  }

  return specs.join(' | ');
}

/**
 * Generates the Consolidated Material Summary grouped by identical specifications
 */
export function generateConsolidatedSummary(items: OCLineItem[]): ConsolidatedSummaryItem[] {
  const map = new Map<string, ConsolidatedSummaryItem>();

  for (const item of items) {
    const key = getItemSpecKey(item);
    const specString = formatFullSpecification(item);
    const itemDisplayName = item.itemName || item.productCode || item.category;

    if (!map.has(key)) {
      map.set(key, {
        id: `summary-${item.id}`,
        category: item.category,
        itemName: itemDisplayName,
        productCode: item.productCode || '—',
        specification: specString,
        totalQuantity: Number(item.quantity) || 0,
        unit: item.unit || 'Nos',
        lineItemNumbers: item.lineItemNumber || '—',
      });
    } else {
      const existing = map.get(key)!;
      existing.totalQuantity += Number(item.quantity) || 0;

      // Merge line item numbers
      const existingLines = (existing.lineItemNumbers || '').split(',').map(s => s.trim()).filter(Boolean);
      const newLines = (item.lineItemNumber || '').split(',').map(s => s.trim()).filter(Boolean);
      const combinedLines = Array.from(new Set([...existingLines, ...newLines]));
      existing.lineItemNumbers = combinedLines.join(', ');
    }
  }

  return Array.from(map.values());
}
