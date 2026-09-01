// Updated consolidation engine v2.5.1
import { OCLineItem, ConsolidatedSummaryItem } from '../types';

/**
 * Normalizes a string for clean display (trim, ignore empty/placeholder values)
 */
export function norm(val: string | undefined | null): string {
  if (!val) return '';
  const trimmed = String(val).trim();
  if (
    trimmed === '—' ||
    trimmed === '-' ||
    trimmed === 'N/A' ||
    trimmed === 'NA' ||
    trimmed === 'null' ||
    trimmed === 'undefined'
  ) {
    return '';
  }
  return trimmed;
}

/**
 * Normalizes a spec string for comparison:
 * Strips spaces, dashes, hyphens, en-dashes, em-dashes, and underscores so terms
 * like "24V-100W", "24V 100W", and "24V100W" match automatically,
 * and "IP20", "IP 20", "IP-20" match.
 */
export function normSpec(val: string | undefined | null): string {
  if (!val) return '';
  const trimmed = String(val).trim();
  if (
    trimmed === '—' ||
    trimmed === '-' ||
    trimmed === 'N/A' ||
    trimmed === 'NA' ||
    trimmed === 'null' ||
    trimmed === 'undefined'
  ) {
    return '';
  }
  return trimmed.toLowerCase().replace(/[\s\-_—–/]+/g, '');
}

/**
 * Standardizes unit representations for consistent grouping and clean display
 */
export function normalizeUnit(unit: string | undefined | null): string {
  const u = norm(unit).toLowerCase();
  if (!u) return 'Nos';
  if (u === 'mtr' || u === 'mtrs' || u === 'm' || u === 'meter' || u === 'meters') return 'Mtr';
  if (u === 'no' || u === 'nos' || u === 'pc' || u === 'pcs' || u === 'pieces' || u === 'piece') return 'Nos';
  if (u === 'set' || u === 'sets') return 'Sets';
  if (u === 'pair' || u === 'pairs') return 'Pairs';
  if (u === 'roll' || u === 'rolls') return 'Rolls';
  return norm(unit) || 'Nos';
}

/**
 * Helper to merge and format unique client codes without duplicates in order of appearance (e.g. "CL-2, CL-3")
 */
export function formatUniqueClientCodes(
  existingCodes: string | undefined | null,
  newCode: string | undefined | null
): string {
  const list: string[] = [];

  const add = (raw: string | undefined | null) => {
    if (!raw) return;
    const parts = raw.split(/[,;/]+/).map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (norm(part) && !list.includes(part)) {
        list.push(part);
      }
    }
  };

  add(existingCodes);
  add(newCode);

  return list.length > 0 ? list.join(', ') : '—';
}

/**
 * Helper to sort line item numbers in natural ascending numerical order (e.g. "8, 11" or "6, 12, 15")
 */
export function formatSortedLineNumbers(
  existingLines: string | undefined | null,
  newLines: string | undefined | null
): string {
  const allNums: string[] = [];

  const add = (raw: string | undefined | null) => {
    if (!raw) return;
    const parts = raw.split(/[,;/]+/).map((s) => s.trim()).filter(Boolean);
    for (const p of parts) {
      if (p && p !== '—' && !allNums.includes(p)) {
        allNums.push(p);
      }
    }
  };

  add(existingLines);
  add(newLines);

  allNums.sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (!isNaN(numA) && !isNaN(numB) && a === String(numA) && b === String(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  return allNums.length > 0 ? allNums.join(', ') : '—';
}

/**
 * Generates a unique key for an item's complete technical/material specification.
 * 
 * STRICT CONSOLIDATION RULES:
 * 1. Client Code is NEVER part of this key (items with matching specs merge even if client codes differ).
 * 2. OC Line Item Number is NEVER part of this key.
 * 3. Spaces and dashes are stripped so "24V-100W" and "24V 100W" match automatically.
 * 4. Any difference in technical parameters (Model, Wattage, CCT, Beam Angle, Voltage, IP Rating, Dimensions) produces a separate row.
 */
export function getItemSpecKey(item: OCLineItem): string {
  // Normalize category grouping: Treat Linears / Flexum / Svelte in linear family
  let catGroup = normSpec(item.category);
  if (catGroup === 'flexum' || catGroup === 'svelte') {
    catGroup = 'linears';
  } else if (catGroup === 'downlightsspotlights' || catGroup === 'downlights') {
    catGroup = 'downlightsspotlights';
  }

  const parts = [
    catGroup,
    normSpec(item.itemName),
    normSpec(item.productCode),
    normSpec(item.wattage),
    normSpec(item.cct),
    normSpec(item.cri),
    normSpec(item.beamAngle),
    normSpec(item.finish),
    normSpec(item.ipRating),
    normSpec(item.dimensions),
    normSpec(item.length),
    normSpec(item.profileType),
    normSpec(item.powerSupplyType),
    normSpec(item.driverType),
    normSpec(item.dimming),
    normSpec(item.connection),
    normalizeUnit(item.unit).toLowerCase(),
  ];

  // If all structured fields are empty, fall back to cleaned original description
  const hasDetails = parts.slice(2, 16).some((p) => p.length > 0);
  if (!hasDetails && item.originalDescription) {
    parts.push(normSpec(item.originalDescription));
  }

  return parts.join('|||');
}

/**
 * Builds the exact display specification string for Part 2 Consolidated Summary
 */
export function formatConsolidatedSpecDisplay(item: OCLineItem): string {
  // If item is a Power Supply
  if (
    item.category === 'Power Supplies' ||
    item.powerSupplyType ||
    item.driverType?.includes('Power Supply')
  ) {
    const psuType = item.powerSupplyType || item.driverType || item.itemName;
    return norm(psuType) || '24V Power Supply, IP20';
  }

  // If item is a Profile
  if (item.category === 'Profiles' || item.profileType) {
    const prof = item.profileType || item.itemName;
    const dim = norm(item.dimensions);
    if (dim && !prof.includes(dim)) {
      return `${prof} - ${dim}`;
    }
    return prof;
  }

  // If item is a Linear
  if (
    item.category === 'Linears' ||
    item.category === 'Flexum' ||
    item.category === 'Svelte' ||
    item.itemName?.toLowerCase().includes('linear') ||
    item.itemName?.toLowerCase().includes('coveline')
  ) {
    const name = item.itemName || 'Linear Fixture';
    const specTokens: string[] = [];
    if (norm(item.wattage)) specTokens.push(item.wattage);
    if (norm(item.cct)) specTokens.push(item.cct);
    if (norm(item.beamAngle)) specTokens.push(item.beamAngle);
    if (norm(item.dimming) && item.dimming !== 'Non-Dim') specTokens.push(item.dimming);
    if (norm(item.ipRating)) specTokens.push(item.ipRating);
    if (norm(item.dimensions)) specTokens.push(item.dimensions);

    if (specTokens.length > 0) {
      // e.g. "Svelte 12 Coveline 2045 Linear - 12W/2700K/120°/24V/IP20/PCB 8mm"
      const joined = specTokens.join('/');
      if (name.includes(joined)) return name;
      return `${name} - ${joined}`;
    }
    return name;
  }

  // Downlights & Spotlights / Others
  const name = item.itemName || item.productCode || item.category;
  const specs: string[] = [];
  if (norm(item.wattage)) specs.push(item.wattage);
  if (norm(item.cct)) specs.push(item.cct);
  if (norm(item.cri)) specs.push(item.cri);
  if (norm(item.beamAngle)) specs.push(item.beamAngle);
  if (norm(item.finish)) specs.push(item.finish);
  if (norm(item.ipRating)) specs.push(item.ipRating);
  if (norm(item.dimensions)) specs.push(item.dimensions);

  if (specs.length > 0) {
    return `${name} - ${specs.join('/')}`;
  }

  return norm(item.originalDescription) || name;
}

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
 * Consolidates items within a single category table view
 */
export function consolidateCategoryItems(items: OCLineItem[]): OCLineItem[] {
  const map = new Map<string, OCLineItem>();

  for (const item of items) {
    const key = getItemSpecKey(item);
    if (!map.has(key)) {
      map.set(key, { ...item });
    } else {
      const existing = map.get(key)!;
      existing.quantity = Math.round(((Number(existing.quantity) || 0) + (Number(item.quantity) || 0)) * 10000) / 10000;
      existing.lineItemNumber = formatSortedLineNumbers(existing.lineItemNumber, item.lineItemNumber);
      existing.clientCode = formatUniqueClientCodes(existing.clientCode, item.clientCode);
    }
  }

  return Array.from(map.values());
}

/**
 * Generates the Consolidated Material Summary (Part 2 Summary)
 * 
 * Rules:
 * - Excludes Freight & Exclusions.
 * - Same complete specifications are consolidated; different technical specs remain separate.
 * - Merges and naturally sorts line item numbers (e.g. "8, 11", "6, 12, 15", "10, 13, 16").
 * - Merges multi-client codes without duplicates (e.g. "CL-2, CL-3").
 * - Sums quantities.
 */
export function generateConsolidatedSummary(items: OCLineItem[]): ConsolidatedSummaryItem[] {
  const map = new Map<string, ConsolidatedSummaryItem>();

  // Filter out freight and exclusions first
  const materialItems = items.filter((item) => !isFreightOrExcluded(item));

  for (const item of materialItems) {
    const key = getItemSpecKey(item);
    const specDisplayName = formatConsolidatedSpecDisplay(item);
    const unit = normalizeUnit(item.unit);
    const qty = Number(item.quantity) || 0;

    if (!map.has(key)) {
      map.set(key, {
        id: `summary-${item.id}`,
        category: item.category,
        itemName: specDisplayName,
        clientCode: formatUniqueClientCodes(item.clientCode, null),
        productCode: item.productCode || '—',
        specification: specDisplayName,
        totalQuantity: qty,
        unit: unit,
        lineItemNumbers: formatSortedLineNumbers(item.lineItemNumber, null),
      });
    } else {
      const existing = map.get(key)!;
      // Merge quantities with floating-point safety
      existing.totalQuantity = Math.round((existing.totalQuantity + qty) * 10000) / 10000;

      // Merge and naturally sort line item numbers (e.g., "8, 11")
      existing.lineItemNumbers = formatSortedLineNumbers(
        existing.lineItemNumbers,
        item.lineItemNumber
      );

      // Merge client codes (e.g., "CL-2, CL-3")
      existing.clientCode = formatUniqueClientCodes(existing.clientCode, item.clientCode);
    }
  }

  return Array.from(map.values());
}
