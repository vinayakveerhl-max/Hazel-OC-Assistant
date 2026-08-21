import React from 'react';
import { OCLineItem } from '../types';
import { generateConsolidatedSummary } from '../utils/consolidation';
import { Layers, ShieldCheck, Sparkles } from 'lucide-react';

interface ConsolidatedSummaryTableProps {
  items: OCLineItem[];
}

export const ConsolidatedSummaryTable: React.FC<ConsolidatedSummaryTableProps> = ({ items }) => {
  const summaryItems = generateConsolidatedSummary(items);
  const totalSumQuantity = summaryItems.reduce((acc, curr) => acc + curr.totalQuantity, 0);

  if (summaryItems.length === 0) return null;

  return (
    <div id="consolidated-material-summary-card" className="bg-[#140E24] border-2 border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl my-8">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-purple-950 via-[#23153C] to-purple-950 px-6 py-4 border-b border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-950/40">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold font-serif text-white tracking-wide flex items-center space-x-2">
              <span>CONSOLIDATED MATERIAL SUMMARY</span>
              <span className="px-2.5 py-0.5 text-[10px] font-sans font-bold bg-amber-400 text-slate-950 rounded uppercase tracking-wider">
                Production Ready
              </span>
            </h3>
            <p className="text-xs text-amber-200/70">
              Grouped strictly by identical specifications • Zero cross-spec merging
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5 text-purple-300">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>{summaryItems.length} Distinct Specifications</span>
          </div>
          <div className="px-3 py-1 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300 font-semibold">
            Total Qty: {totalSumQuantity} Units
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="bg-purple-950/40 px-6 py-2 border-b border-purple-900/40 flex items-center justify-between text-[11px] text-purple-300/80">
        <span>
          <strong>Rule Enforced:</strong> Different wattages, CCTs, finishes, beam angles and driver types remain strictly separated rows.
        </span>
        <span className="font-mono text-amber-300/90">Line numbers mapped for audit trail</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#1D1432] text-amber-300 font-semibold border-b border-purple-900/60 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4 text-center w-14">Sr.</th>
              <th className="py-3 px-4 text-center w-28">Source Line Nos.</th>
              <th className="py-3 px-4 text-left w-40">Category</th>
              <th className="py-3 px-4 text-left w-56">Item / Product Code</th>
              <th className="py-3 px-4 text-left">Consolidated Specification</th>
              <th className="py-3 px-4 text-right w-28">Total Qty</th>
              <th className="py-3 px-4 text-center w-20">Unit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-950/60">
            {summaryItems.map((item, index) => (
              <tr
                key={item.id || index}
                className="hover:bg-[#1F1636] transition-colors"
              >
                <td className="py-3 px-4 text-center text-purple-400/80 font-medium">
                  {index + 1}
                </td>
                <td className="py-3 px-4 text-center font-mono font-semibold text-amber-300 bg-purple-950/30">
                  {item.lineItemNumbers || '—'}
                </td>
                <td className="py-3 px-4 text-left font-medium text-purple-200">
                  <span className="inline-block px-2 py-0.5 rounded bg-purple-950 border border-purple-800/60 text-[11px]">
                    {item.category}
                  </span>
                </td>
                <td className="py-3 px-4 text-left">
                  <span className="font-semibold text-white block">{item.itemName}</span>
                  {item.productCode && item.productCode !== '—' && (
                    <span className="text-[11px] font-mono text-purple-400/80 block mt-0.5">
                      {item.productCode}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-left text-purple-100/90 leading-relaxed font-mono text-[11.5px]">
                  {item.specification}
                </td>
                <td className="py-3 px-4 text-right font-bold text-amber-300 text-sm">
                  {item.totalQuantity}
                </td>
                <td className="py-3 px-4 text-center text-purple-300 font-medium">
                  {item.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
