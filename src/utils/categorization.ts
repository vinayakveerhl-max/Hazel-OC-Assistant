import { OCLineItem, LightingCategory } from '../types';

/**
 * Keyword sets for automatic categorization & validation
 */
export const CATEGORY_KEYWORDS = {
  powerSupplies: [
    'power supply',
    'driver',
    'cvlz',
    'transformer',
    'psu',
    'constant voltage',
    'constant current',
    'hlg',
    'pwm',
    'lca',
    'oti',
    'dali driver',
    'electronic ballast',
  ],
  linears: [
    'linear',
    'tape light',
    'coveline',
    'strip',
    'svelte',
    'flexum',
    'neon flex',
    'batten',
    'continuous',
    'ribbon',
  ],
  profiles: [
    'profile',
    'mounting profile',
    'channel',
    'extrusion',
    'aclap',
    'plaster-in profile',
    'flanged profile',
    'aluminum profile',
  ],
  downlights: [
    'downlight',
    'spotlight',
    'recessed',
    'niche',
    'fixed',
    'adjustable',
    'cob',
    'gimbal',
    'pin-hole',
    'pinhole',
    'wall washer',
    'accent light',
  ],
  exclusions: [
    'freight',
    'transport',
    'loading',
    'packaging',
    'shipping',
    'transit insurance',
    'delivery charge',
    'packing & forwarding',
    'courier',
  ],
};

/**
 * Categorizes an item based on description and specifications
 */
export function determineLightingCategory(
  item: Partial<OCLineItem>,
  rawText?: string
): LightingCategory {
  const combined = [
    item.itemName || '',
    item.productCode || '',
    item.originalDescription || '',
    item.profileType || '',
    item.powerSupplyType || '',
    item.driverType || '',
    item.remarks || '',
    rawText || '',
  ]
    .join(' ')
    .toLowerCase();

  // 1. Exclusions & Freight
  if (CATEGORY_KEYWORDS.exclusions.some((kw) => combined.includes(kw))) {
    return 'Freight & Exclusions';
  }

  // 2. Power Supplies
  if (CATEGORY_KEYWORDS.powerSupplies.some((kw) => combined.includes(kw))) {
    return 'Power Supplies';
  }

  // 3. Profiles & Extrusions
  if (CATEGORY_KEYWORDS.profiles.some((kw) => combined.includes(kw))) {
    return 'Profiles';
  }

  // 4. Linears (includes Svelte, Flexum, Coveline, Strip)
  if (CATEGORY_KEYWORDS.linears.some((kw) => combined.includes(kw))) {
    return 'Linears';
  }

  // 5. Downlights & Spotlights
  if (CATEGORY_KEYWORDS.downlights.some((kw) => combined.includes(kw))) {
    return 'Downlights & Spotlights';
  }

  return (item.category as LightingCategory) || 'Other Lighting Products';
}

/**
 * Normalizes item unit based on category defaults
 */
export function getDefaultUnitForCategory(category: LightingCategory, existingUnit?: string): string {
  if (existingUnit && existingUnit.trim() && existingUnit !== '—') {
    return existingUnit.trim();
  }
  switch (category) {
    case 'Linears':
    case 'Flexum':
    case 'Profiles':
    case 'Diffusers':
      return 'Mtr';
    case 'Power Supplies':
    case 'Downlights & Spotlights':
    case 'Downlights / Spotlights':
    case 'Svelte':
    case 'Grids':
    case 'Other Lighting Products':
    default:
      return 'Nos';
  }
}
