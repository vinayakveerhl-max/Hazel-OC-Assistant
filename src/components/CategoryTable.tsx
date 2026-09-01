import React from 'react';
import { OCLineItem, LightingCategory } from '../types';
import { consolidateCategoryItems } from '../utils/consolidation';
import { Edit2, Trash2, Plus, AlertTriangle, CheckCircle, Layers } from 'lucide-react';

interface CategoryTableProps {
  categoryTitle: string;
  categoryKey: LightingCategory | 'Downlights / Spotlights' | 'Power Supplies' | 'Linears';
  items: OCLineItem[];
  isConsolidated: boolean;
  onEditItem: (item: OCLineItem) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: (category: LightingCategory) => void;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({
  categoryTitle,
  categoryKey,
  items,
  isConsolidated,
  onEditItem,
  onDeleteItem,
  onAddItem,
}) => {
  if (items.length === 0) return null;

  const displayItems = isConsolidated ? consolidateCategoryItems(items) : items;

  // Determine which column set to use based on the category
  const renderTableHead = () => {
    switch (categoryKey) {
      case 'Power Supplies':
        return (
          <tr>
            <th className="py-2.5 px-3 text-center w-12">Sr.</th>
            <th className="py-2.5 px-3 text-center w-24">Line Item No.</th>
            <th className="py-2.5 px-3 text-left w-28">Client Code</th>
            <th className="py-2.5 px-3 text-left">Power Supply / Driver Type</th>
            <th className="py-2.5 px-3 text-center w-24">Wattage</th>
            <th className="py-2.5 px-3 text-right w-20">Qty</th>
            <th className="py-2.5 px-3 text-center w-20">Unit</th>
            <th className="py-2.5 px-3 text-left">Remarks</th>
            <th className="py-2.5 px-3 text-center w-20">Actions</th>
          </tr>
        );

      case 'Linears':
      case 'Flexum':
      case 'Svelte':
        return (
          <tr>
            <th className="py-2.5 px-3 text-center w-12">Sr.</th>
            <th className="py-2.5 px-3 text-center w-24">Line Item No.</th>
            <th className="py-2.5 px-3 text-left w-28">Client Code</th>
            <th className="py-2.5 px-3 text-left">Item Name</th>
            <th className="py-2.5 px-3 text-center w-20">Wattage</th>
            <th className="py-2.5 px-3 text-center w-20">CCT</th>
            <th className="py-2.5 px-3 text-center w-24">Length</th>
            <th className="py-2.5 px-3 text-left w-28">Finish</th>
            <th className="py-2.5 px-3 text-right w-20">Qty</th>
            <th className="py-2.5 px-3 text-center w-16">Unit</th>
            <th className="py-2.5 px-3 text-left">Remarks</th>
            <th className="py-2.5 px-3 text-center w-20">Actions</th>
          </tr>
        );

      case 'Downlights / Spotlights':
        return (
          <tr>
            <th className="py-2.5 px-3 text-center w-12">Sr.</th>
            <th className="py-2.5 px-3 text-center w-24">Line Item No.</th>
            <th className="py-2.5 px-3 text-left w-24">Client Code</th>
            <th className="py-2.5 px-3 text-left">Item Name</th>
            <th className="py-2.5 px-3 text-center w-18">Wattage</th>
            <th className="py-2.5 px-3 text-center w-20">CCT</th>
            <th className="py-2.5 px-3 text-center w-16">CRI</th>
            <th className="py-2.5 px-3 text-center w-20">Beam Angle</th>
            <th className="py-2.5 px-3 text-left w-24">Finish</th>
            <th className="py-2.5 px-3 text-center w-16">IP Rating</th>
            <th className="py-2.5 px-3 text-right w-18">Qty</th>
            <th className="py-2.5 px-3 text-center w-16">Unit</th>
            <th className="py-2.5 px-3 text-left">Remarks</th>
            <th className="py-2.5 px-3 text-center w-20">Actions</th>
          </tr>
        );

      case 'Profiles':
        return (
          <tr>
            <th className="py-2.5 px-3 text-center w-12">Sr.</th>
            <th className="py-2.5 px-3 text-center w-24">Line Item No.</th>
            <th className="py-2.5 px-3 text-left w-28">Client Code</th>
            <th className="py-2.5 px-3 text-left">Profile Type</th>
            <th className="py-2.5 px-3 text-center w-28">Dimension</th>
            <th className="py-2.5 px-3 text-center w-24">Length</th>
            <th className="py-2.5 px-3 text-left w-28">Finish</th>
            <th className="py-2.5 px-3 text-right w-20">Qty</th>
            <th className="py-2.5 px-3 text-center w-16">Unit</th>
            <th className="py-2.5 px-3 text-left">Remarks</th>
            <th className="py-2.5 px-3 text-center w-20">Actions</th>
          </tr>
        );

      case 'Grids':
        return (
          <tr>
            <th className="py-2.5 px-3 text-center w-12">Sr.</th>
            <th className="py-2.5 px-3 text-center w-24">Line Item No.</th>
            <th className="py-2.5 px-3 text-left w-28">Client Code</th>
            <th className="py-2.5 px-3 text-left">Grid Type</th>
            <th className="py-2.5 px-3 text-center w-28">Dimension</th>
            <th className="py-2.5 px-3 text-left w-28">Finish</th>
            <th className="py-2.5 px-3 text-right w-20">Qty</th>
            <th className="py-2.5 px-3 text-center w-16">Unit</th>
            <th className="py-2.5 px-3 text-left">Remarks</th>
            <th className="py-2.5 px-3 text-center w-20">Actions</th>
          </tr>
        );

      case 'Diffusers':
        return (
          <tr>
            <th className="py-2.5 px-3 text-center w-12">Sr.</th>
            <th className="py-2.5 px-3 text-center w-24">Line Item No.</th>
            <th className="py-2.5 px-3 text-left w-28">Client Code</th>
            <th className="py-2.5 px-3 text-left">Diffuser Type</th>
            <th className="py-2.5 px-3 text-center w-28">Dimension</th>
            <th className="py-2.5 px-3 text-center w-24">Length</th>
            <th className="py-2.5 px-3 text-right w-20">Qty</th>
            <th className="py-2.5 px-3 text-center w-16">Unit</th>
            <th className="py-2.5 px-3 text-left">Remarks</th>
            <th className="py-2.5 px-3 text-center w-20">Actions</th>
          </tr>
        );

      case 'Connectors':
        return (
          <tr>
            <th className="py-2.5 px-3 text-center w-12">Sr.</th>
            <th className="py-2.5 px-3 text-center w-24">Line Item No.</th>
            <th className="py-2.5 px-3 text-left w-28">Client Code</th>
            <th className="py-2.5 px-3 text-left">Connector Type</th>
            <th className="py-2.5 px-3 text-right w-20">Qty</th>
            <th className="py-2.5 px-3 text-center w-16">Unit</th>
            <th className="py-2.5 px-3 text-left">Remarks</th>
            <th className="py-2.5 px-3 text-center w-20">Actions</th>
          </tr>
        );

      case 'Accessories / Other Items':
      default:
        return (
          <tr>
            <th className="py-2.5 px-3 text-center w-12">Sr.</th>
            <th className="py-2.5 px-3 text-center w-24">Line Item No.</th>
            <th className="py-2.5 px-3 text-left w-28">Client Code</th>
            <th className="py-2.5 px-3 text-left">Item Name</th>
            <th className="py-2.5 px-3 text-left">Specification</th>
            <th className="py-2.5 px-3 text-right w-20">Qty</th>
            <th className="py-2.5 px-3 text-center w-16">Unit</th>
            <th className="py-2.5 px-3 text-left">Remarks</th>
            <th className="py-2.5 px-3 text-center w-20">Actions</th>
          </tr>
        );
    }
  };

  const renderRowCells = (item: OCLineItem, index: number) => {
    const srNo = index + 1;
    const hasWarning = item.confidence === 'low' || (item.uncertainFields && item.uncertainFields.length > 0);

    const baseActions = (
      <td className="py-2.5 px-3 text-center">
        <div className="flex items-center justify-center space-x-1.5">
          <button
            onClick={() => onEditItem(item)}
            title="Edit item specification"
            className="p-1 hover:bg-purple-800/60 rounded text-purple-300 hover:text-amber-300 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteItem(item.id)}
            title="Delete item"
            className="p-1 hover:bg-rose-950/80 rounded text-purple-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    );

    switch (categoryKey) {
      case 'Power Supplies':
        return (
          <>
            <td className="py-2.5 px-3 text-center text-purple-400/80">{srNo}</td>
            <td className="py-2.5 px-3 text-center font-mono font-semibold text-amber-300">
              {item.lineItemNumber || '—'}
            </td>
            <td className="py-2.5 px-3 text-left text-purple-200">{item.clientCode || '—'}</td>
            <td className="py-2.5 px-3 text-left font-medium text-white">
              <div className="flex items-center space-x-1.5">
                {hasWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                <span>{item.powerSupplyType || item.driverType || item.itemName || '—'}</span>
              </div>
              {item.productCode && item.productCode !== '—' && (
                <span className="block text-[11px] font-mono text-purple-400/70">{item.productCode}</span>
              )}
            </td>
            <td className="py-2.5 px-3 text-center text-purple-200">{item.wattage || '—'}</td>
            <td className="py-2.5 px-3 text-right font-bold text-amber-300">{item.quantity}</td>
            <td className="py-2.5 px-3 text-center text-purple-300">{item.unit || 'Nos'}</td>
            <td className="py-2.5 px-3 text-left text-purple-300/80 text-[11px]">{item.remarks || '—'}</td>
            {baseActions}
          </>
        );

      case 'Linears':
      case 'Flexum':
      case 'Svelte':
        return (
          <>
            <td className="py-2.5 px-3 text-center text-purple-400/80">{srNo}</td>
            <td className="py-2.5 px-3 text-center font-mono font-semibold text-amber-300">
              {item.lineItemNumber || '—'}
            </td>
            <td className="py-2.5 px-3 text-left text-purple-200">{item.clientCode || '—'}</td>
            <td className="py-2.5 px-3 text-left font-medium text-white">
              <div className="flex items-center space-x-1.5">
                {hasWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                <span>{item.itemName || item.productCode || '—'}</span>
              </div>
              {item.productCode && item.productCode !== '—' && (
                <span className="block text-[11px] font-mono text-purple-400/70">{item.productCode}</span>
              )}
            </td>
            <td className="py-2.5 px-3 text-center text-purple-200">{item.wattage || '—'}</td>
            <td className="py-2.5 px-3 text-center text-purple-200">{item.cct || '—'}</td>
            <td className="py-2.5 px-3 text-center text-purple-200">{item.length || item.dimensions || '—'}</td>
            <td className="py-2.5 px-3 text-left text-purple-200">{item.finish || '—'}</td>
            <td className="py-2.5 px-3 text-right font-bold text-amber-300">{item.quantity}</td>
            <td className="py-2.5 px-3 text-center text-purple-300">{item.unit || 'Mtrs'}</td>
            <td className="py-2.5 px-3 text-left text-purple-300/80 text-[11px]">{item.remarks || '—'}</td>
            {baseActions}
          </>
        );

      case 'Downlights / Spotlights':
        return (
          <>
            <td className="py-2.5 px-3 text-center text-purple-400/80">{srNo}</td>
            <td className="py-2.5 px-3 text-center font-mono font-semibold text-amber-300">
              {item.lineItemNumber || '—'}
            </td>
            <td className="py-2.5 px-3 text-left text-purple-200">{item.clientCode || '—'}</td>
            <td className="py-2.5 px-3 text-left font-medium text-white">
              <div className="flex items-center space-x-1.5">
                {hasWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                <span>{item.itemName || item.productCode || '—'}</span>
              </div>
              {item.productCode && item.productCode !== '—' && (
                <span className="block text-[11px] font-mono text-purple-400/70">{item.productCode}</span>
              )}
            </td>
            <td className="py-2.5 px-3 text-center text-purple-200">{item.wattage || '—'}</td>
            <td className="py-2.5 px-3 text-center text-purple-200">{item.cct || '—'}</td>
            <td className="py-2.5 px-3 text-center text-purple-200">{item.cri || '—'}</td>
            <td className="py-2.5 px-3 text-center text-purple-200">{item.beamAngle || '—'}</td>
            <td className="py-2.5 px-3 text-left text-purple-200">{item.finish || '—'}</td>
            <td className="py-2.5 px-3 text-center text-purple-200">{item.ipRating || '—'}</td>
            <td className="py-2.5 px-3 text-right font-bold text-amber-300">{item.quantity}</td>
            <td className="py-2.5 px-3 text-center text-purple-300">{item.unit || 'Nos'}</td>
            <td className="py-2.5 px-3 text-left text-purple-300/80 text-[11px]">{item.remarks || '—'}</td>
            {baseActions}
          </>
        );

      case 'Profiles':
        return (
          <>
            <td className="py-2.5 px-3 text-center text-purple-400/80">{srNo}</td>
            <td className="py-2.5 px-3 text-center font-mono font-semibold text-amber-300">
              {item.lineItemNumber || '—'}
            </td>
            <td className="py-2.5 px-3 text-left text-purple-200">{item.clientCode || '—'}</td>
            <td className="py-2.5 px-3 text-left font-medium text-white">
              <div className="flex items-center space-x-1.5">
                {hasWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                <span>{item.profileType || item.itemName || '—'}</span>
              </div>
              {item.productCode && item.productCode !== '—' && (
                <span className="block text-[11px] font-mono text-purple-400/70">{item.productCode}</span>
              )}
            </td>
            <td className="py-2.5 px-3 text-center text-purple-200">{item.dimensions || '—'}</td>
            <td className="py-2.5 px-3 text-center text-purple-200">{item.length || '—'}</td>
            <td className="py-2.5 px-3 text-left text-purple-200">{item.finish || '—'}</td>
            <td className="py-2.5 px-3 text-right font-bold text-amber-300">{item.quantity}</td>
            <td className="py-2.5 px-3 text-center text-purple-300">{item.unit || 'Mtrs'}</td>
            <td className="py-2.5 px-3 text-left text-purple-300/80 text-[11px]">{item.remarks || '—'}</td>
            {baseActions}
          </>
        );

      case 'Grids':
        return (
          <>
            <td className="py-2.5 px-3 text-center text-purple-400/80">{srNo}</td>
            <td className="py-2.5 px-3 text-center font-mono font-semibold text-amber-300">
              {item.lineItemNumber || '—'}
            </td>
            <td className="py-2.5 px-3 text-left text-purple-200">{item.clientCode || '—'}</td>
            <td className="py-2.5 px-3 text-left font-medium text-white">
              <span>{item.itemName || item.productCode || '—'}</span>
            </td>
            <td className="py-2.5 px-3 text-center text-purple-200">{item.dimensions || item.length || '—'}</td>
            <td className="py-2.5 px-3 text-left text-purple-200">{item.finish || '—'}</td>
            <td className="py-2.5 px-3 text-right font-bold text-amber-300">{item.quantity}</td>
            <td className="py-2.5 px-3 text-center text-purple-300">{item.unit || 'Nos'}</td>
            <td className="py-2.5 px-3 text-left text-purple-300/80 text-[11px]">{item.remarks || '—'}</td>
            {baseActions}
          </>
        );

      case 'Diffusers':
        return (
          <>
            <td className="py-2.5 px-3 text-center text-purple-400/80">{srNo}</td>
            <td className="py-2.5 px-3 text-center font-mono font-semibold text-amber-300">
              {item.lineItemNumber || '—'}
            </td>
            <td className="py-2.5 px-3 text-left text-purple-200">{item.clientCode || '—'}</td>
            <td className="py-2.5 px-3 text-left font-medium text-white">
              <span>{item.itemName || item.productCode || '—'}</span>
            </td>
            <td className="py-2.5 px-3 text-center text-purple-200">{item.dimensions || '—'}</td>
            <td className="py-2.5 px-3 text-center text-purple-200">{item.length || '—'}</td>
            <td className="py-2.5 px-3 text-right font-bold text-amber-300">{item.quantity}</td>
            <td className="py-2.5 px-3 text-center text-purple-300">{item.unit || 'Mtrs'}</td>
            <td className="py-2.5 px-3 text-left text-purple-300/80 text-[11px]">{item.remarks || '—'}</td>
            {baseActions}
          </>
        );

      case 'Connectors':
        return (
          <>
            <td className="py-2.5 px-3 text-center text-purple-400/80">{srNo}</td>
            <td className="py-2.5 px-3 text-center font-mono font-semibold text-amber-300">
              {item.lineItemNumber || '—'}
            </td>
            <td className="py-2.5 px-3 text-left text-purple-200">{item.clientCode || '—'}</td>
            <td className="py-2.5 px-3 text-left font-medium text-white">
              <span>{item.itemName || item.productCode || '—'}</span>
            </td>
            <td className="py-2.5 px-3 text-right font-bold text-amber-300">{item.quantity}</td>
            <td className="py-2.5 px-3 text-center text-purple-300">{item.unit || 'Nos'}</td>
            <td className="py-2.5 px-3 text-left text-purple-300/80 text-[11px]">{item.remarks || '—'}</td>
            {baseActions}
          </>
        );

      case 'Accessories / Other Items':
      default:
        return (
          <>
            <td className="py-2.5 px-3 text-center text-purple-400/80">{srNo}</td>
            <td className="py-2.5 px-3 text-center font-mono font-semibold text-amber-300">
              {item.lineItemNumber || '—'}
            </td>
            <td className="py-2.5 px-3 text-left text-purple-200">{item.clientCode || '—'}</td>
            <td className="py-2.5 px-3 text-left font-medium text-white">
              <span>{item.itemName || item.productCode || '—'}</span>
            </td>
            <td className="py-2.5 px-3 text-left text-purple-200 text-xs">
              {item.originalDescription || item.remarks || '—'}
            </td>
            <td className="py-2.5 px-3 text-right font-bold text-amber-300">{item.quantity}</td>
            <td className="py-2.5 px-3 text-center text-purple-300">{item.unit || 'Nos'}</td>
            <td className="py-2.5 px-3 text-left text-purple-300/80 text-[11px]">{item.remarks || '—'}</td>
            {baseActions}
          </>
        );
    }
  };

  const totalQuantity = displayItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return (
    <div className="bg-[#130E20] border border-purple-900/60 rounded-2xl overflow-hidden shadow-xl mb-6">
      {/* Category Card Header */}
      <div className="bg-gradient-to-r from-purple-950 via-[#1A122C] to-purple-950 px-5 py-3.5 border-b border-purple-900/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-lg bg-purple-900/80 border border-purple-700/60 flex items-center justify-center text-amber-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold font-serif text-white tracking-wide uppercase">
              {categoryTitle}
            </h4>
            <span className="text-xs text-purple-300/70">
              {displayItems.length} {displayItems.length === 1 ? 'line entry' : 'line entries'} • Total:{' '}
              <strong className="text-amber-300 font-sans">{totalQuantity}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isConsolidated && (
            <span className="px-2.5 py-1 text-[11px] font-medium bg-amber-950/70 border border-amber-500/30 text-amber-300 rounded-md">
              Consolidated by Exact Spec
            </span>
          )}

          <button
            onClick={() => onAddItem(categoryKey as LightingCategory)}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-purple-900/70 hover:bg-purple-800 text-xs font-medium text-purple-200 hover:text-white border border-purple-700/50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[850px]">
          <thead className="bg-[#1C142E] text-purple-300/90 font-semibold border-b border-purple-900/60 uppercase tracking-wider text-[10.5px]">
            {renderTableHead()}
          </thead>
          <tbody className="divide-y divide-purple-950/60">
            {displayItems.map((item, index) => (
              <tr
                key={item.id || index}
                className="hover:bg-[#1C1430]/70 transition-colors group"
              >
                {renderRowCells(item, index)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
