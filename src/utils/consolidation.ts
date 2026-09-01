// Updated consolidation engine v2.5.1
import { OCLineItem, ConsolidatedSummaryItem } from '../types';

/**
 * Standard normalizer: trims, lowercases, and collapses multiple whitespace characters.
 */
export const norm = (v: any): string => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Standardizes unit representations for consistent grouping and display.
 */
export function normalizeUnit(unit: string | undefined | null): string {
  const u = norm(unit);
  if (!u) return 'Nos';
  if (u === 'mtr' || u === 'mtrs' || u === 'm' || u === 'meter' || u === 'meters') return 'Mtr';
  if (u === 'no' || u === 'nos' || u === 'pc' || u === 'pcs' || u === 'pieces' || u === 'piece') return 'Nos';
  if (u === 'set' || u === 'sets') return 'Sets';
  if (u === 'pair' || u === 'pairs') return 'Pairs';
  if (u === 'roll' || u === 'rolls') return 'Rolls';
  return String(unit).trim() || 'Nos';
}

/**
 * Strict Spec Key Generation (Ignores IDs, Line Numbers, and Client Codes).
 * Matches items strictly on product specifications.
 */
export function getItemSpecKey(item: OCLineItem): string {
  return [
    norm(item.itemName),
    norm(item.wattage),
    norm(item.cct),
    norm(item.beamAngle),
    norm(item.finish),
    norm(item.ipRating),
    norm(item.driverType),
    norm(item.dimensions),
    norm(normalizeUnit(item.unit))
  ].join('||');
}

/**
 * Collects, deduplicates, and naturally sorts line item numbers numerically (e.g. "8, 11" or "10, 13, 16").
 */
export function mergeLineNumbers(...lineSources: (string | undefined | null)[]): string {
  const set = new Set<string>();

  for (const src of lineSources) {
    if (!src) continue;
    const parts = String(src)
      .split(/[,\s;/]+/)
      .map((s) => s.trim())
      .filter((s) => s && s !== '—' && s !== '-' && s.toLowerCase() !== 'n/a');
    for (const part of parts) {
      set.add(part);
    }
  }

  const sorted = Array.from(set).sort((a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  return sorted.length > 0 ? sorted.join(', ') : '—';
}

/**
 * Collects, deduplicates, and merges client codes in order of appearance (e.g. "CL-2, CL-3").
 */
export function mergeClientCodes(...codeSources: (string | undefined | null)[]): string {
  const codes: string[] = [];

  for (const src of codeSources) {
    if (!src) continue;
    const parts = String(src)
      .split(/[,;/]+/)
      .map((s) => s.trim())
      .filter((s) => s && s !== '—' && s !== '-' && s.toLowerCase() !== 'n/a');

    for (const part of parts) {
      const exists = codes.some((c) => norm(c) === norm(part));
      if (!exists) {
        codes.push(part);
      }
    }
  }

  return codes.length > 0 ? codes.join(', ') : '—';
}

/**
 * Legacy aliases for backwards compatibility with other modules
 */
export const formatSortedLineNumbers = (a?: string | null, b?: string | null) => mergeLineNumbers(a, b);
export const formatUniqueClientCodes = (a?: string | null, b?: string | null) => mergeClientCodes(a, b);

/**
 * Filter out freight and excluded items
 */
export function isFreightOrExcluded(item: OCLineItem): boolean {
  if (item.isExcluded) return true;
  if (item.category === 'Freight & Exclusions') return true;
  const desc = [
    item.itemName,
    item.productCode,
    item.originalDescription,
    item.remarks,
  ]
    .join(' ')
    .toLowerCase();

  return (
    desc.includes('freight') ||
    desc.includes('transport') ||
    desc.includes('loading') ||
    desc.includes('packaging') ||
    desc.includes('delivery charge') ||
    desc.includes('transit insurance')
  );
}

/**
 * Builds a readable comprehensive specification detail string while preserving the full item name.
 */
export function formatSpecificationDetails(item: OCLineItem): string {
  const tokens: string[] = [];

  if (item.wattage && item.wattage !== '—') tokens.push(item.wattage);
  if (item.cct && item.cct !== '—') tokens.push(item.cct);
  if (item.beamAngle && item.beamAngle !== '—') tokens.push(item.beamAngle);
  if (item.finish && item.finish !== '—') tokens.push(item.finish);
  if (item.ipRating && item.ipRating !== '—') tokens.push(item.ipRating);
  if (item.driverType && item.driverType !== '—') tokens.push(item.driverType);
  if (item.dimensions && item.dimensions !== '—') tokens.push(item.dimensions);
  if (item.cri && item.cri !== '—') tokens.push(`CRI ${item.cri}`);
  if (item.dimming && item.dimming !== '—' && item.dimming !== 'Non-Dim') tokens.push(item.dimming);

  if (tokens.length > 0) {
    return tokens.join(' | ');
  }

  return item.originalDescription || item.remarks || item.itemName;
}

/**
 * Consolidates items within a single category table view
 */
export function consolidateCategoryItems(items: OCLineItem[]): OCLineItem[] {
  const map = new Map<string, OCLineItem>();

  for (const item of items) {
    const key = getItemSpecKey(item);
    const itemQty = parseFloat(String(item.quantity || 0)) || 0;

    if (!map.has(key)) {
      map.set(key, {
        ...item,
        quantity: itemQty,
        lineItemNumber: mergeLineNumbers(item.lineItemNumber),
        clientCode: mergeClientCodes(item.clientCode),
        unit: normalizeUnit(item.unit)
      });
    } else {
      const existing = map.get(key)!;
      const existingQty = parseFloat(String(existing.quantity || 0)) || 0;
      existing.quantity = Math.round((existingQty + itemQty) * 10000) / 10000;
      existing.lineItemNumber = mergeLineNumbers(existing.lineItemNumber, item.lineItemNumber);
      existing.clientCode = mergeClientCodes(existing.clientCode, item.clientCode);
    }
  }

  return Array.from(map.values());
}

/**
 * Generates the Consolidated Material Summary (Part 2 Summary)
 * 
 * Strict Consolidation Logic:
 * 1. Strict Spec Key based on product specs (ignoring IDs, line numbers, and client codes).
 * 2. Groups matching items and accumulates quantities.
 * 3. Formats line item numbers as deduplicated, numerically sorted comma-separated strings (e.g. "8, 11" or "10, 13, 16").
 * 4. Merges client codes into deduplicated comma-separated strings (e.g. "CL-2, CL-3").
 * 5. Preserves the full item name and technical specification.
 */
export function generateConsolidatedSummary(items: OCLineItem[]): ConsolidatedSummaryItem[] {
  const map = new Map<string, ConsolidatedSummaryItem>();

  // Filter out freight and exclusions first
  const materialItems = items.filter((item) => !isFreightOrExcluded(item));

  for (const item of materialItems) {
    const key = getItemSpecKey(item);
    const itemQty = parseFloat(String(item.quantity || 0)) || 0;
    const unit = normalizeUnit(item.unit);
    const specDetails = formatSpecificationDetails(item);

    if (!map.has(key)) {
      map.set(key, {
        id: `summary-${item.id}`,
        category: item.category,
        itemName: item.itemName || item.productCode || 'Lighting Material',
        clientCode: mergeClientCodes(item.clientCode),
        productCode: item.productCode || '—',
        specification: specDetails,
        totalQuantity: itemQty,
        unit: unit,
        lineItemNumbers: mergeLineNumbers(item.lineItemNumber),
      });
    } else {
      const existing = map.get(key)!;
      const existingQty = parseFloat(String(existing.totalQuantity || 0)) || 0;

      // Accumulate quantity safely
      existing.totalQuantity = Math.round((existingQty + itemQty) * 10000) / 10000;

      // Accumulate & deduplicate line item numbers (e.g. "8, 11" or "10, 13, 16")
      existing.lineItemNumbers = mergeLineNumbers(
        existing.lineItemNumbers,
        item.lineItemNumber
      );

      // Accumulate & deduplicate client codes (e.g. "CL-2, CL-3")
      existing.clientCode = mergeClientCodes(existing.clientCode, item.clientCode);
    }
  }

  return Array.from(map.values());
}
