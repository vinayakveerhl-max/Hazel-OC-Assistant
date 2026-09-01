import React from 'react';
import { OCHeader, OCLineItem, LightingCategory } from '../types';
import {
  generateConsolidatedSummary,
  consolidateCategoryItems,
  isFreightOrExcluded,
} from '../utils/consolidation';
import { Edit2, Trash2, Plus, Info } from 'lucide-react';

interface OCMaterialSummaryDocumentProps {
  header: OCHeader;
  items: OCLineItem[];
  onEditItem?: (item: OCLineItem) => void;
  onDeleteItem?: (id: string) => void;
  onAddItem?: (category: LightingCategory) => void;
  isEditable?: boolean;
}

export const OCMaterialSummaryDocument: React.FC<OCMaterialSummaryDocumentProps> = ({
  header,
  items,
  onEditItem,
  onDeleteItem,
  onAddItem,
  isEditable = true,
}) => {
  // 1. Separate material items vs excluded/freight items
  const materialItems = items.filter((i) => !isFreightOrExcluded(i));
  const excludedItems = items.filter((i) => isFreightOrExcluded(i));

  // 2. Filter & consolidate categorized material items
  const rawPowerSupplyItems = materialItems.filter(
    (i) => i.category === 'Power Supplies' || i.category === ('LED Drivers' as any)
  );
  const powerSupplyItems = consolidateCategoryItems(rawPowerSupplyItems);

  const rawLinearItems = materialItems.filter(
    (i) =>
      i.category === 'Linears' ||
      i.category === 'Flexum' ||
      i.category === 'Svelte' ||
      i.itemName?.toLowerCase().includes('linear') ||
      i.itemName?.toLowerCase().includes('coveline')
  );
  const linearItems = consolidateCategoryItems(rawLinearItems);

  const rawProfileItems = materialItems.filter(
    (i) => i.category === 'Profiles' || i.profileType?.length > 1
  );
  const profileItems = consolidateCategoryItems(rawProfileItems);

  const rawDownlightItems = materialItems.filter(
    (i) =>
      i.category === 'Downlights & Spotlights' ||
      i.category === 'Downlights / Spotlights' ||
      i.category === ('Downlights' as any) ||
      i.category === ('Spotlights' as any)
  );
  const downlightItems = consolidateCategoryItems(rawDownlightItems);

  const rawOtherItems = materialItems.filter(
    (i) =>
      !rawPowerSupplyItems.includes(i) &&
      !rawLinearItems.includes(i) &&
      !rawProfileItems.includes(i) &&
      !rawDownlightItems.includes(i)
  );
  const otherItems = consolidateCategoryItems(rawOtherItems);

  // 3. Generate Part 4 Consolidated Material Summary
  const consolidatedSummary = generateConsolidatedSummary(items);

  // Build sequential section numbers
  const activeSections: { title: string; count: number; key: string }[] = [];
  if (powerSupplyItems.length > 0) activeSections.push({ title: 'Power Supplies', count: powerSupplyItems.length, key: 'psu' });
  if (linearItems.length > 0) activeSections.push({ title: 'Linears', count: linearItems.length, key: 'linears' });
  if (profileItems.length > 0) activeSections.push({ title: 'Profiles', count: profileItems.length, key: 'profiles' });
  if (downlightItems.length > 0) activeSections.push({ title: 'Downlights & Spotlights', count: downlightItems.length, key: 'downlights' });
  if (otherItems.length > 0) activeSections.push({ title: 'Accessories & Other Items', count: otherItems.length, key: 'other' });

  const consolidatedSectionNumber = activeSections.length + 1;

  // Build footer excluded note
  const excludedLines = excludedItems
    .map((i) => i.lineItemNumber)
    .filter((l) => l && l !== '—')
    .join(', ');

  const footerExcludedText =
    excludedLines.length > 0
      ? `Freight line item ${excludedLines} is excluded from material extraction/consolidation.`
      : 'Freight and transport line items are excluded from material extraction/consolidation.';

  return (
    <div className="oc-container shadow-md border border-slate-200" id="printable-oc-summary">
      {/* Document Header */}
      <div className="doc-title">
        <h1>Hazel OC Assistant</h1>
        <h2>Order Confirmation Material Summary</h2>
      </div>

      {/* Header Grid */}
      <div className="header-grid">
        <div className="header-item">
          <span className="label">Project:</span>
          <span className="value font-semibold text-slate-900">{header.projectName || '—'}</span>
        </div>
        <div className="header-item">
          <span className="label">Client:</span>
          <span className="value font-semibold text-slate-900">{header.customerName || '—'}</span>
        </div>
        <div className="header-item">
          <span className="label">OC Date:</span>
          <span className="value">{header.ocDate || '—'}</span>
        </div>
        <div className="header-item">
          <span className="label">Delivery Date:</span>
          <span className="value">{header.deliveryDate || '—'}</span>
        </div>
        <div className="header-item">
          <span className="label">OC Reference:</span>
          <span className="value font-mono font-medium">{header.ocNumber || header.referenceNumber || '—'}</span>
        </div>
        <div className="header-item">
          <span className="label">PO Number:</span>
          <span className="value font-mono">{header.poNumber || '—'}</span>
        </div>
        <div className="header-item">
          <span className="label">OC Amount:</span>
          <span className="value font-semibold text-emerald-800">{header.totalAmount || '—'}</span>
        </div>
        <div className="header-item">
          <span className="label">Material Items:</span>
          <span className="value font-medium text-slate-800">
            {header.materialItemsSummary || `${materialItems.length} + freight`}
          </span>
        </div>
      </div>

      {/* 1. POWER SUPPLIES */}
      {powerSupplyItems.length > 0 && (
        <div className="mb-6">
          <div className="section-title">
            <span>
              {activeSections.findIndex((s) => s.key === 'psu') + 1}. Power Supplies
            </span>
            {isEditable && onAddItem && (
              <button
                onClick={() => onAddItem('Power Supplies')}
                className="text-xs font-normal text-slate-600 hover:text-slate-900 flex items-center space-x-1"
                title="Add Power Supply item"
              >
                <Plus className="w-3 h-3" />
                <span>Add Row</span>
              </button>
            )}
          </div>
          <table className="oc-table">
            <thead>
              <tr>
                <th className="text-center" style={{ width: '8%' }}>Sr. No.</th>
                <th className="text-center" style={{ width: '15%' }}>OC Line Item</th>
                <th className="text-center" style={{ width: '15%' }}>Client Code</th>
                <th>Power Supply Type</th>
                <th className="text-center" style={{ width: '12%' }}>Qty</th>
                <th className="text-center" style={{ width: '15%' }}>Connection</th>
                {isEditable && <th className="text-center" style={{ width: '8%' }}>Edit</th>}
              </tr>
            </thead>
            <tbody>
              {powerSupplyItems.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="text-center text-slate-500">{idx + 1}</td>
                  <td className="text-center font-mono font-medium text-slate-800">
                    {item.lineItemNumber || '—'}
                  </td>
                  <td className="text-center font-mono text-slate-700">{item.clientCode || '—'}</td>
                  <td>
                    <span className="font-medium text-slate-900">
                      {item.powerSupplyType || item.driverType || item.itemName || '—'}
                    </span>
                    {item.remarks && item.remarks !== '—' && (
                      <span className="block text-[11px] text-slate-500 mt-0.5">{item.remarks}</span>
                    )}
                  </td>
                  <td className="text-center font-semibold text-slate-900">
                    {item.quantity} {item.unit || 'Nos'}
                  </td>
                  <td className="text-center text-slate-700">{item.connection || 'Remote'}</td>
                  {isEditable && (
                    <td className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onEditItem?.(item)}
                          className="p-1 text-slate-500 hover:text-slate-900"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteItem?.(item.id)}
                          className="p-1 text-rose-400 hover:text-rose-700"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. LINEARS (Svelte, Flexum, Coveline) */}
      {linearItems.length > 0 && (
        <div className="mb-6">
          <div className="section-title">
            <span>
              {activeSections.findIndex((s) => s.key === 'linears') + 1}. Linears
            </span>
            {isEditable && onAddItem && (
              <button
                onClick={() => onAddItem('Linears')}
                className="text-xs font-normal text-slate-600 hover:text-slate-900 flex items-center space-x-1"
                title="Add Linear item"
              >
                <Plus className="w-3 h-3" />
                <span>Add Row</span>
              </button>
            )}
          </div>
          <table className="oc-table">
            <thead>
              <tr>
                <th className="text-center" style={{ width: '8%' }}>Sr. No.</th>
                <th className="text-center" style={{ width: '15%' }}>OC Line Item</th>
                <th className="text-center" style={{ width: '15%' }}>Client Code</th>
                <th>Item Name</th>
                <th className="text-center" style={{ width: '15%' }}>Qty Required</th>
                {isEditable && <th className="text-center" style={{ width: '8%' }}>Edit</th>}
              </tr>
            </thead>
            <tbody>
              {linearItems.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="text-center text-slate-500">{idx + 1}</td>
                  <td className="text-center font-mono font-medium text-slate-800">
                    {item.lineItemNumber || '—'}
                  </td>
                  <td className="text-center font-mono text-slate-700">{item.clientCode || '—'}</td>
                  <td>
                    <div className="font-medium text-slate-900">
                      {item.itemName || item.productCode || 'Linear Light'}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      {[
                        item.wattage && item.wattage !== '—' ? item.wattage : null,
                        item.cct && item.cct !== '—' ? item.cct : null,
                        item.beamAngle && item.beamAngle !== '—' ? item.beamAngle : null,
                        item.dimming && item.dimming !== '—' ? item.dimming : null,
                        item.ipRating && item.ipRating !== '—' ? item.ipRating : null,
                        item.dimensions && item.dimensions !== '—' ? item.dimensions : null,
                        item.length && item.length !== '—' ? item.length : null,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </td>
                  <td className="text-center font-semibold text-slate-900">
                    {item.quantity} {item.unit || 'Mtr'}
                  </td>
                  {isEditable && (
                    <td className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onEditItem?.(item)}
                          className="p-1 text-slate-500 hover:text-slate-900"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteItem?.(item.id)}
                          className="p-1 text-rose-400 hover:text-rose-700"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. PROFILES & EXTRUSIONS */}
      {profileItems.length > 0 && (
        <div className="mb-6">
          <div className="section-title">
            <span>
              {activeSections.findIndex((s) => s.key === 'profiles') + 1}. Profiles
            </span>
            {isEditable && onAddItem && (
              <button
                onClick={() => onAddItem('Profiles')}
                className="text-xs font-normal text-slate-600 hover:text-slate-900 flex items-center space-x-1"
                title="Add Profile item"
              >
                <Plus className="w-3 h-3" />
                <span>Add Row</span>
              </button>
            )}
          </div>
          <table className="oc-table">
            <thead>
              <tr>
                <th className="text-center" style={{ width: '8%' }}>Sr. No.</th>
                <th className="text-center" style={{ width: '15%' }}>OC Line Item</th>
                <th className="text-center" style={{ width: '15%' }}>Client Code</th>
                <th>Profile Type</th>
                <th className="text-center" style={{ width: '15%' }}>Qty Required</th>
                {isEditable && <th className="text-center" style={{ width: '8%' }}>Edit</th>}
              </tr>
            </thead>
            <tbody>
              {profileItems.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="text-center text-slate-500">{idx + 1}</td>
                  <td className="text-center font-mono font-medium text-slate-800">
                    {item.lineItemNumber || '—'}
                  </td>
                  <td className="text-center font-mono text-slate-700">{item.clientCode || '—'}</td>
                  <td>
                    <div className="font-medium text-slate-900">
                      {item.profileType || item.itemName || 'Aluminum Profile'}
                      {item.dimensions && item.dimensions !== '—' && !item.profileType?.includes(item.dimensions) && (
                        <span> - {item.dimensions}</span>
                      )}
                    </div>
                    {item.remarks && item.remarks !== '—' && (
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.remarks}</div>
                    )}
                  </td>
                  <td className="text-center font-semibold text-slate-900">
                    {item.quantity} {item.unit || 'Mtr'}
                  </td>
                  {isEditable && (
                    <td className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onEditItem?.(item)}
                          className="p-1 text-slate-500 hover:text-slate-900"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteItem?.(item.id)}
                          className="p-1 text-rose-400 hover:text-rose-700"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. DOWNLIGHTS & SPOTLIGHTS */}
      {downlightItems.length > 0 && (
        <div className="mb-6">
          <div className="section-title">
            <span>
              {activeSections.findIndex((s) => s.key === 'downlights') + 1}. Downlights &amp; Spotlights
            </span>
            {isEditable && onAddItem && (
              <button
                onClick={() => onAddItem('Downlights & Spotlights')}
                className="text-xs font-normal text-slate-600 hover:text-slate-900 flex items-center space-x-1"
                title="Add Downlight item"
              >
                <Plus className="w-3 h-3" />
                <span>Add Row</span>
              </button>
            )}
          </div>
          <table className="oc-table">
            <thead>
              <tr>
                <th className="text-center" style={{ width: '6%' }}>Sr.</th>
                <th className="text-center" style={{ width: '10%' }}>Line No.</th>
                <th className="text-center" style={{ width: '10%' }}>Client Code</th>
                <th>Item Name</th>
                <th className="text-center" style={{ width: '8%' }}>Wattage</th>
                <th className="text-center" style={{ width: '8%' }}>CCT</th>
                <th className="text-center" style={{ width: '8%' }}>Beam</th>
                <th className="text-center" style={{ width: '8%' }}>Finish</th>
                <th className="text-center" style={{ width: '6%' }}>IP</th>
                <th className="text-center" style={{ width: '10%' }}>Qty</th>
                <th>Driver / Louver Remarks</th>
                {isEditable && <th className="text-center" style={{ width: '6%' }}>Edit</th>}
              </tr>
            </thead>
            <tbody>
              {downlightItems.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="text-center text-slate-500">{idx + 1}</td>
                  <td className="text-center font-mono font-medium text-slate-800">
                    {item.lineItemNumber || '—'}
                  </td>
                  <td className="text-center font-mono text-slate-700">{item.clientCode || '—'}</td>
                  <td className="font-medium text-slate-900">
                    {item.itemName || item.productCode || 'Downlight'}
                  </td>
                  <td className="text-center text-slate-700">{item.wattage || '—'}</td>
                  <td className="text-center text-slate-700">{item.cct || '—'}</td>
                  <td className="text-center text-slate-700">{item.beamAngle || '—'}</td>
                  <td className="text-center text-slate-700">{item.finish || '—'}</td>
                  <td className="text-center text-slate-700">{item.ipRating || '—'}</td>
                  <td className="text-center font-semibold text-slate-900">
                    {item.quantity} {item.unit || 'Nos'}
                  </td>
                  <td className="text-slate-600 text-[11px]">{item.remarks || item.driverType || '—'}</td>
                  {isEditable && (
                    <td className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onEditItem?.(item)}
                          className="p-1 text-slate-500 hover:text-slate-900"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteItem?.(item.id)}
                          className="p-1 text-rose-400 hover:text-rose-700"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. ACCESSORIES & OTHER ITEMS (if any) */}
      {otherItems.length > 0 && (
        <div className="mb-6">
          <div className="section-title">
            <span>
              {activeSections.findIndex((s) => s.key === 'other') + 1}. Accessories &amp; Other Items
            </span>
            {isEditable && onAddItem && (
              <button
                onClick={() => onAddItem('Accessories / Other Items')}
                className="text-xs font-normal text-slate-600 hover:text-slate-900 flex items-center space-x-1"
                title="Add Accessory item"
              >
                <Plus className="w-3 h-3" />
                <span>Add Row</span>
              </button>
            )}
          </div>
          <table className="oc-table">
            <thead>
              <tr>
                <th className="text-center" style={{ width: '8%' }}>Sr. No.</th>
                <th className="text-center" style={{ width: '15%' }}>OC Line Item</th>
                <th className="text-center" style={{ width: '15%' }}>Client Code</th>
                <th>Item Name &amp; Specification</th>
                <th className="text-center" style={{ width: '15%' }}>Qty Required</th>
                {isEditable && <th className="text-center" style={{ width: '8%' }}>Edit</th>}
              </tr>
            </thead>
            <tbody>
              {otherItems.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="text-center text-slate-500">{idx + 1}</td>
                  <td className="text-center font-mono font-medium text-slate-800">
                    {item.lineItemNumber || '—'}
                  </td>
                  <td className="text-center font-mono text-slate-700">{item.clientCode || '—'}</td>
                  <td>
                    <div className="font-medium text-slate-900">{item.itemName || item.productCode}</div>
                    <div className="text-[11px] text-slate-500">
                      {item.originalDescription || item.remarks || '—'}
                    </div>
                  </td>
                  <td className="text-center font-semibold text-slate-900">
                    {item.quantity} {item.unit || 'Nos'}
                  </td>
                  {isEditable && (
                    <td className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onEditItem?.(item)}
                          className="p-1 text-slate-500 hover:text-slate-900"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteItem?.(item.id)}
                          className="p-1 text-rose-400 hover:text-rose-700"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PART 4 (OR SEQUENTIAL NUMBER). CONSOLIDATED MATERIAL SUMMARY */}
      <div className="mt-8 mb-4">
        <div className="section-title">
          <span>{consolidatedSectionNumber}. Consolidated Material Summary</span>
        </div>
        <div className="section-note">
          Same complete specifications are consolidated; different technical specifications remain separate.
        </div>
        <table className="oc-table" id="consolidated-material-summary-table">
          <thead>
            <tr>
              <th className="text-center" style={{ width: '8%' }}>Sr. No.</th>
              <th className="text-center" style={{ width: '15%' }}>Line Item</th>
              <th>Item Name / Exact Specification</th>
              <th className="text-center" style={{ width: '18%' }}>Client Code</th>
              <th className="text-center" style={{ width: '15%' }}>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {consolidatedSummary.map((item, index) => (
              <tr key={item.id || index}>
                <td className="text-center text-slate-600 font-medium">{index + 1}</td>
                <td className="text-center font-mono font-semibold text-slate-900 bg-slate-50">
                  {item.lineItemNumbers || '—'}
                </td>
                <td className="font-medium text-slate-900">{item.itemName}</td>
                <td className="text-center font-mono text-slate-700">{item.clientCode || '—'}</td>
                <td className="text-center font-bold text-slate-900">
                  {item.totalQuantity} {item.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER EXCLUDED NOTE */}
      <div className="footer-note">
        <strong>Note:</strong> {footerExcludedText}
      </div>
    </div>
  );
};
