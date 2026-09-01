import React, { useState, useEffect } from 'react';
import { OCLineItem, LightingCategory } from '../types';
import { X, Check, Layers, AlertTriangle } from 'lucide-react';

interface ItemEditorModalProps {
  isOpen: boolean;
  item: OCLineItem | null;
  defaultCategory?: LightingCategory;
  onSave: (item: OCLineItem) => void;
  onClose: () => void;
}

const CATEGORIES: LightingCategory[] = [
  'Power Supplies',
  'Linears',
  'Profiles',
  'Downlights & Spotlights',
  'Downlights / Spotlights',
  'Grids',
  'Diffusers',
  'Connectors',
  'Accessories / Other Items',
  'Freight & Exclusions',
  'Flexum',
  'Svelte',
  'Other Lighting Products',
];

export const ItemEditorModal: React.FC<ItemEditorModalProps> = ({
  isOpen,
  item,
  defaultCategory = 'Downlights & Spotlights',
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<OCLineItem>({
    id: `item-${Date.now()}`,
    category: defaultCategory,
    lineItemNumber: '1',
    clientCode: '—',
    itemName: '',
    productCode: '—',
    wattage: '—',
    cct: '—',
    cri: '—',
    beamAngle: '—',
    finish: '—',
    ipRating: '—',
    dimensions: '—',
    length: '—',
    profileType: '—',
    powerSupplyType: '—',
    driverType: '—',
    dimming: '—',
    connection: 'Remote',
    quantity: 1,
    unit: 'Nos',
    remarks: '—',
    originalDescription: '',
    isExcluded: false,
    confidence: 'high',
    uncertainFields: [],
  });

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData({
        id: `item-${Date.now()}`,
        category: defaultCategory,
        lineItemNumber: '1',
        clientCode: '',
        itemName: '',
        productCode: '',
        wattage: '',
        cct: '',
        cri: '',
        beamAngle: '',
        finish: '',
        ipRating: '',
        dimensions: '',
        length: '',
        profileType: '',
        powerSupplyType: '',
        driverType: '',
        dimming: '',
        connection: 'Remote',
        quantity: 1,
        unit: 'Nos',
        remarks: '',
        originalDescription: '',
        isExcluded: defaultCategory === 'Freight & Exclusions',
        confidence: 'high',
        uncertainFields: [],
      });
    }
  }, [item, defaultCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      quantity: Number(formData.quantity) || 1,
      uncertainFields: [],
      confidence: 'high',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#140E22] border border-purple-800/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-950 via-[#1F1535] to-purple-950 px-6 py-4 border-b border-purple-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-purple-900/80 border border-purple-700/60 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-white">
                {item ? 'Edit Lighting Line Item' : 'Add New Lighting Item'}
              </h3>
              <p className="text-xs text-purple-300/70">
                Ensure specifications are accurately recorded without merging distinct parameters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-purple-900/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning if OCR was uncertain */}
        {formData.uncertainFields && formData.uncertainFields.length > 0 && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center space-x-2.5 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>OCR Flag:</strong> The following fields were uncertain in the scanned PDF:{' '}
              {formData.uncertainFields.join(', ')}. Please verify against original OC.
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Row 1: Category & Line Item No & Client Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-purple-300 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const cat = e.target.value as LightingCategory;
                  setFormData({
                    ...formData,
                    category: cat,
                    isExcluded: cat === 'Freight & Exclusions',
                  });
                }}
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-purple-300 mb-1">Line Item No(s). *</label>
              <input
                type="text"
                required
                value={formData.lineItemNumber}
                onChange={(e) => setFormData({ ...formData, lineItemNumber: e.target.value })}
                placeholder="e.g. 1 or 5, 12"
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-medium text-purple-300 mb-1">Client Tag / Code</label>
              <input
                type="text"
                value={formData.clientCode}
                onChange={(e) => setFormData({ ...formData, clientCode: e.target.value })}
                placeholder="e.g. CL-1, DL-01"
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Row 2: Item Name & Product Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-purple-300 mb-1">Item Name / Model *</label>
              <input
                type="text"
                required
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                placeholder="e.g. Svelte 12 Coveline 2045 Linear, 24V-100W Power Supply"
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-medium text-purple-300 mb-1">Manufacturer Product Code</label>
              <input
                type="text"
                value={formData.productCode}
                onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                placeholder="e.g. SV-12-COVE-2045-27K"
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Row 3: Optical & Electrical Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-medium text-purple-300 mb-1">Wattage</label>
              <input
                type="text"
                value={formData.wattage}
                onChange={(e) => setFormData({ ...formData, wattage: e.target.value })}
                placeholder="e.g. 12W, 6W, 100W"
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-medium text-purple-300 mb-1">CCT (Color Temp)</label>
              <input
                type="text"
                value={formData.cct}
                onChange={(e) => setFormData({ ...formData, cct: e.target.value })}
                placeholder="e.g. 2700K, 3000K, 4000K"
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-medium text-purple-300 mb-1">CRI</label>
              <input
                type="text"
                value={formData.cri}
                onChange={(e) => setFormData({ ...formData, cri: e.target.value })}
                placeholder="e.g. Ra > 90"
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-medium text-purple-300 mb-1">Beam Angle</label>
              <input
                type="text"
                value={formData.beamAngle}
                onChange={(e) => setFormData({ ...formData, beamAngle: e.target.value })}
                placeholder="e.g. 120°, 24°, 36°"
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Row 4: Physical & Extrusion Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-medium text-purple-300 mb-1">Finish / Color</label>
              <input
                type="text"
                value={formData.finish}
                onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
                placeholder="e.g. Anodized Aluminum, White"
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-medium text-purple-300 mb-1">IP Rating</label>
              <input
                type="text"
                value={formData.ipRating}
                onChange={(e) => setFormData({ ...formData, ipRating: e.target.value })}
                placeholder="e.g. IP20, IP44, IP65"
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-medium text-purple-300 mb-1">Dimensions</label>
              <input
                type="text"
                value={formData.dimensions}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                placeholder="e.g. W19.2 x H19.2, PCB 8mm"
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-medium text-purple-300 mb-1">Length</label>
              <input
                type="text"
                value={formData.length}
                onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                placeholder="e.g. 220.50 Mtr, 3000mm"
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Row 5: Power Supply & Driver & Dimming & Connection */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-medium text-purple-300 mb-1">Power Supply / Type</label>
              <input
                type="text"
                value={formData.powerSupplyType}
                onChange={(e) => setFormData({ ...formData, powerSupplyType: e.target.value })}
                placeholder="e.g. 24V-100W Non-Dim"
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-medium text-purple-300 mb-1">Driver Make / Type</label>
              <input
                type="text"
                value={formData.driverType}
                onChange={(e) => setFormData({ ...formData, driverType: e.target.value })}
                placeholder="e.g. Constant Voltage 24V"
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-medium text-purple-300 mb-1">Connection</label>
              <select
                value={formData.connection || 'Remote'}
                onChange={(e) => setFormData({ ...formData, connection: e.target.value })}
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
              >
                <option value="Remote">Remote</option>
                <option value="Integral">Integral</option>
                <option value="Plug & Play">Plug &amp; Play</option>
                <option value="Hardwired">Hardwired</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-purple-300 mb-1">Dimming Protocol</label>
              <input
                type="text"
                value={formData.dimming}
                onChange={(e) => setFormData({ ...formData, dimming: e.target.value })}
                placeholder="e.g. Non-Dim, 24V, DALI 2"
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Row 6: Quantity & Unit & Profile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-purple-300 mb-1">Quantity *</label>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white font-bold text-amber-300 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-medium text-purple-300 mb-1">Unit *</label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g. Nos, Mtr, Sets, Pairs"
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-medium text-purple-300 mb-1">Profile / Extrusion Type</label>
              <input
                type="text"
                value={formData.profileType}
                onChange={(e) => setFormData({ ...formData, profileType: e.target.value })}
                placeholder="e.g. ACLAP Triangle 05 Mounting Profile"
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Row 7: Remarks & Freight Exclusion checkbox */}
          <div className="space-y-2">
            <div>
              <label className="block font-medium text-purple-300 mb-1">Remarks / Mounting Notes</label>
              <input
                type="text"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="e.g. 12W, 2700K, 120°, 24V, IP20, PCB 8mm"
                className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="is-excluded-checkbox"
                checked={formData.isExcluded || formData.category === 'Freight & Exclusions'}
                onChange={(e) => setFormData({ ...formData, isExcluded: e.target.checked })}
                className="w-4 h-4 rounded border-purple-800 bg-[#1B142D] text-amber-400 focus:ring-amber-400"
              />
              <label htmlFor="is-excluded-checkbox" className="text-purple-300 font-medium cursor-pointer">
                Exclude from technical consolidation (e.g. Freight, Transit Insurance, Packaging)
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-purple-900/60 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-800/60 text-purple-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-6 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-950/40"
            >
              <Check className="w-4 h-4" />
              <span>{item ? 'Update Line Item' : 'Add Line Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
