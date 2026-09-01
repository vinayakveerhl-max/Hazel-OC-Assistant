export type LightingCategory =
  | 'Power Supplies'
  | 'Linears'
  | 'Profiles'
  | 'Downlights & Spotlights'
  | 'Downlights / Spotlights'
  | 'Grids'
  | 'Diffusers'
  | 'Connectors'
  | 'Accessories / Other Items'
  | 'Flexum'
  | 'Svelte'
  | 'Freight & Exclusions'
  | 'Other Lighting Products';

export interface OCHeader {
  customerName: string;
  projectName: string;
  ocNumber: string;
  ocDate: string;
  deliveryDate?: string;
  poNumber?: string;
  referenceNumber: string;
  billingAddress?: string;
  shippingAddress?: string;
  totalAmount?: string;
  materialItemsSummary?: string;
  preparedBy?: string;
  currency?: string;
  notes?: string;
}

export interface OCLineItem {
  id: string;
  category: LightingCategory;
  lineItemNumber: string; // e.g. "1", "2" or "5, 12" when consolidated
  clientCode: string;
  itemName: string;
  productCode: string;
  wattage: string;
  cct: string;
  cri: string;
  beamAngle: string;
  finish: string;
  ipRating: string;
  dimensions: string;
  length: string;
  profileType: string;
  powerSupplyType: string;
  driverType: string;
  dimming: string;
  connection?: string; // e.g. "Remote", "Integral"
  quantity: number;
  unit: string;
  remarks: string;
  originalDescription: string;
  isExcluded?: boolean;
  confidence?: 'high' | 'medium' | 'low';
  uncertainFields?: string[];
  isScannedOcr?: boolean;
}

export interface ConsolidatedSummaryItem {
  id: string;
  category: LightingCategory;
  itemName: string;
  clientCode?: string;
  specification: string;
  totalQuantity: number;
  unit: string;
  lineItemNumbers: string;
  productCode: string;
}

export interface ExtractedOCResult {
  header: OCHeader;
  items: OCLineItem[];
  extractionNotes?: string[];
  warnings?: string[];
  isScanned?: boolean;
  totalPages?: number;
}

