// src/components/ConsolidatedSummaryTable.tsx

import React from 'react';
import { getConsolidatedItems, OCLineItem } from '../utils/consolidate';

interface ConsolidatedSummaryTableProps {
  items: OCLineItem[];
}

export const ConsolidatedSummaryTable: React.FC<ConsolidatedSummaryTableProps> = ({ items }) => {
  // Consolidate identical items and sum up quantities
  const consolidatedList = getConsolidatedItems(items);

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm my-4">
      <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-800">
          Consolidated Material Summary (Grouped by Exact Specification)
        </h3>
      </div>
      <table className="min-w-full divide-y divide-gray-200 text-left text-xs text-gray-700">
        <thead className="bg-gray-50 uppercase text-gray-500 font-medium">
          <tr>
            <th scope="col" className="px-3 py-2 border-r">Line No(s)</th>
            <th scope="col" className="px-3 py-2 border-r">Client Code(s)</th>
            <th scope="col" className="px-3 py-2 border-r">Product / Item Name</th>
            <th scope="col" className="px-3 py-2 border-r">Wattage</th>
            <th scope="col" className="px-3 py-2 border-r">CCT</th>
            <th scope="col" className="px-3 py-2 border-r">Beam Angle</th>
            <th scope="col" className="px-3 py-2 border-r">Finish</th>
            <th scope="col" className="px-3 py-2 border-r">IP Rating</th>
            <th scope="col" className="px-3 py-2 text-right">Total Qty</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {consolidatedList.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-4 text-center text-gray-500 italic">
                No items available for consolidation.
              </td>
            </tr>
          ) : (
            consolidatedList.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2 font-mono text-gray-600 border-r">{item.lineItemNumber || '-'}</td>
                <td className="px-3 py-2 font-mono text-gray-600 border-r">{item.clientCode || '-'}</td>
                <td className="px-3 py-2 font-medium text-gray-900 border-r">{item.itemName || item.productCode || '-'}</td>
                <td className="px-3 py-2 border-r">{item.wattage || '-'}</td>
                <td className="px-3 py-2 border-r">{item.cct || '-'}</td>
                <td className="px-3 py-2 border-r">{item.beamAngle || '-'}</td>
                <td className="px-3 py-2 border-r">{item.finish || '-'}</td>
                <td className="px-3 py-2 border-r">{item.ipRating || '-'}</td>
                <td className="px-3 py-2 text-right font-bold text-gray-900">{item.quantity} Nos</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ConsolidatedSummaryTable;
