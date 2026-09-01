import React from 'react';
import { OCLineItem } from '../types';
import { generateConsolidatedSummary } from '../utils/consolidation';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface ConsolidatedSummaryTableProps {
  items: OCLineItem[];
}

export const ConsolidatedSummaryTable: React.FC<ConsolidatedSummaryTableProps> = ({ items }) => {
  const summaryItems = generateConsolidatedSummary(items);
  const totalSumQuantity = summaryItems.reduce((acc, curr) => acc + curr.totalQuantity, 0);

  if (summaryItems.length === 0) return null;

  return (
    <div id="consolidated-material-summary-card" className="bg-[#130E20] border-2 border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl my-8 transition-all">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-purple-950 via-[#221438] to-purple-950 px-5 sm:px-6 py-4 border-b border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-950/40 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold font-serif text-white tracking-wide">
                PART 2: CONSOLIDATED MATERIAL SUMMARY
              </h3>
              <span className="px-2.5 py-0.5 text-[10px] font-sans font-bold bg-amber-400 text-slate-950 rounded uppercase tracking-wider">
                Purchasing & Production
              </span>
            </div>
            <p className="text-xs text-amber-200/70 mt-0.5">
              Grouped strictly by complete technical specifications • Multi-client codes merged seamlessly
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-purple-900/40 border border-purple-800/60 text-purple-200">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{summaryItems.length} Distinct Specifications</span>
          </div>
          <div className="px-3.5 py-1 rounded-lg bg-amber-400/15 border border-amber-400/40 text-amber-300 font-semibold shadow-inner">
            Total Qty: {totalSumQuantity} Units
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="bg-purple-950/50 px-5 sm:px-6 py-2 border-b border-purple-900/40 flex flex-wrap items-center justify-between gap-2 text-[11px] text-purple-300/80">
        <span>
          <strong className="text-amber-300/90 font-semibold">Strict Spec Rule:</strong> Identical materials merge into 1 row with combined Client Codes. Differing wattages, CCTs, finishes, optics or drivers remain strictly separate.
        </span>
        <span className="font-mono text-amber-300/80 text-[10.5px]">
          OC Line Item Numbers preserved &amp; sorted for audit
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[760px]">
          <thead className="bg-[#1C1330] text-amber-300 font-semibold border-b border-purple-900/60 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-3 text-center w-14">Sr. No.</th>
              <th className="py-3 px-3 text-center w-36">OC Line Item No(s).</th>
              <th className="py-3 px-4 text-left">Item Name / Exact Specification</th>
              <th className="py-3 px-3 text-left w-36">Client Code</th>
              <th className="py-3 px-4 text-right w-28">Total Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-950/60">
            {summaryItems.map((item, index) => (
              <tr
                key={item.id || index}
                className="hover:bg-[#1E1535] transition-colors"
              >
                <td className="py-3.5 px-3 text-center text-purple-400 font-medium">
                  {index + 1}
                </td>
                <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-300 bg-purple-950/30">
                  <span className="inline-block px-2.5 py-1 rounded bg-purple-900/60 border border-purple-700/60 text-xs tracking-wide break-words max-w-[130px]">
                    {item.lineItemNumbers || '—'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-left">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="font-bold text-white text-xs">{item.itemName}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-800/60 text-[10px] text-purple-300 font-medium">
                      {item.category}
                    </span>
                    {item.productCode && item.productCode !== '—' && (
                      <span className="text-[11px] font-mono text-purple-400">
                        ({item.productCode})
                      </span>
                    )}
                  </div>
                  {item.specification && item.specification !== item.itemName && (
                    <p className="text-purple-200/90 leading-relaxed text-[11.5px] break-words">
                      {item.specification}
                    </p>
                  )}
                </td>
                <td className="py-3.5 px-3 text-left font-mono font-semibold text-purple-200">
                  <span className="break-words inline-block max-w-[130px]">
                    {item.clientCode || '—'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <span className="font-bold text-amber-300 text-sm">{item.totalQuantity}</span>{' '}
                  <span className="text-xs text-purple-300 font-medium">{item.unit}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
