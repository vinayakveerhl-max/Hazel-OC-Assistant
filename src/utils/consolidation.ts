// src/utils/consolidate.ts

export interface OCLineItem {
  lineItemNumber?: string;
  clientCode?: string;
  productCode?: string;
  itemName?: string;
  wattage?: string;
  cct?: string;
  beamAngle?: string;
  finish?: string;
  ipRating?: string;
  driverType?: string;
  quantity: number | string;
  [key: string]: any;
}

export interface ConsolidatedGroup {
  baseItem: OCLineItem;
  lineItemNumbers: string[];
  clientCodes: string[];
  totalQuantity: number;
}

/**
 * Groups line items by identical specification parameters and combines quantities,
 * line numbers, and client codes.
 *
 * @param items Raw line items array from order confirmation
 * @returns Array of grouped items with merged quantities and code lists
 */
export function getConsolidatedItems(items: OCLineItem[]): OCLineItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const map = new Map<string, ConsolidatedGroup>();

  for (const item of items) {
    // Construct unique key using product specification attributes
    const specKeyParts = [
      item.productCode,
      item.itemName,
      item.wattage,
      item.cct,
      item.beamAngle,
      item.finish,
      item.ipRating,
      item.driverType,
    ];

    const specKey = specKeyParts
      .map((val) => (val !== undefined && val !== null ? String(val).trim().toLowerCase() : ''))
      .filter((val) => val.length > 0)
      .join('|');

    // Unique fallback key if item has no valid spec fields
    const key = specKey.length > 0 ? specKey : (item.lineItemNumber ? String(item.lineItemNumber) : Math.random().toString());
    const itemQty = Number(item.quantity) || 0;

    if (!map.has(key)) {
      map.set(key, {
        baseItem: { ...item },
        lineItemNumbers: item.lineItemNumber ? [String(item.lineItemNumber).trim()] : [],
        clientCodes: item.clientCode ? [String(item.clientCode).trim()] : [],
        totalQuantity: itemQty,
      });
    } else {
      const existing = map.get(key)!;
      existing.totalQuantity += itemQty;

      if (item.lineItemNumber) {
        const lineNo = String(item.lineItemNumber).trim();
        if (lineNo && !existing.lineItemNumbers.includes(lineNo)) {
          existing.lineItemNumbers.push(lineNo);
        }
      }

      if (item.clientCode) {
        const cCode = String(item.clientCode).trim();
        if (cCode && !existing.clientCodes.includes(cCode)) {
          existing.clientCodes.push(cCode);
        }
      }
    }
  }

  // Convert map entries back into standard OCLineItem standard objects
  return Array.from(map.values()).map(({ baseItem, lineItemNumbers, clientCodes, totalQuantity }) => ({
    ...baseItem,
    quantity: totalQuantity,
    lineItemNumber: lineItemNumbers.join(', '),
    clientCode: clientCodes.join(', '),
  }));
}
