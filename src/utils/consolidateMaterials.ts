export * from './consolidation';
import { generateConsolidatedSummary, consolidateCategoryItems } from './consolidation';

export const consolidateMaterials = generateConsolidatedSummary;
export const consolidate = generateConsolidatedSummary;
export const consolidateCategory = consolidateCategoryItems;
export default generateConsolidatedSummary;
