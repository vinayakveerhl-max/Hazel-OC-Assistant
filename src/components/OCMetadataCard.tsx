import React, { useState } from 'react';
import { OCHeader } from '../types';
import { Building2, Calendar, FileCheck, Hash, User, Edit3, Check, MapPin, DollarSign, Package } from 'lucide-react';

interface OCMetadataCardProps {
  header: OCHeader;
  onChangeHeader: (updated: OCHeader) => void;
  isScanned?: boolean;
  totalItemsCount: number;
}

export const OCMetadataCard: React.FC<OCMetadataCardProps> = ({
  header,
  onChangeHeader,
  isScanned = false,
  totalItemsCount,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<OCHeader>({ ...header });

  const handleSave = () => {
    onChangeHeader(formState);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormState({ ...header });
    setIsEditing(false);
  };

  return (
    <div id="oc-metadata-card" className="bg-[#130E20] border border-purple-900/60 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Decorative gold top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-700 via-amber-400 to-purple-700" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-purple-900/40">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-800/80 flex items-center justify-center text-amber-400">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-serif text-white tracking-wide flex items-center space-x-2">
              <span>ORDER CONFIRMATION HEADER</span>
              {isScanned && (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-950/70 border border-amber-500/40 text-amber-300 rounded">
                  OCR Scanned Document
                </span>
              )}
            </h3>
            <p className="text-xs text-purple-300/70">
              Header specifications mapped for Purchase, QC &amp; Production
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-purple-950 border border-purple-800/60 text-purple-200 text-xs font-semibold rounded-lg">
            {totalItemsCount} Extracted Items
          </span>

          {!isEditing ? (
            <button
              id="edit-header-btn"
              onClick={() => {
                setFormState({ ...header });
                setIsEditing(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800/60 border border-purple-700/50 text-xs font-medium text-purple-200 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit Details</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                id="cancel-header-btn"
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-800/60 text-xs text-purple-300"
              >
                Cancel
              </button>
              <button
                id="save-header-btn"
                onClick={handleSave}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Form Content / View Content */}
      {isEditing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <label className="block text-purple-300 font-medium mb-1">Customer / Client</label>
            <input
              type="text"
              value={formState.customerName}
              onChange={(e) => setFormState({ ...formState, customerName: e.target.value })}
              className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-purple-300 font-medium mb-1">Project Name</label>
            <input
              type="text"
              value={formState.projectName}
              onChange={(e) => setFormState({ ...formState, projectName: e.target.value })}
              className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-purple-300 font-medium mb-1">OC Reference / Number</label>
            <input
              type="text"
              value={formState.ocNumber}
              onChange={(e) => setFormState({ ...formState, ocNumber: e.target.value })}
              className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-purple-300 font-medium mb-1">PO Number</label>
            <input
              type="text"
              value={formState.poNumber || ''}
              onChange={(e) => setFormState({ ...formState, poNumber: e.target.value })}
              className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-purple-300 font-medium mb-1">OC Date</label>
            <input
              type="text"
              value={formState.ocDate}
              onChange={(e) => setFormState({ ...formState, ocDate: e.target.value })}
              className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-purple-300 font-medium mb-1">Delivery Date</label>
            <input
              type="text"
              value={formState.deliveryDate || ''}
              onChange={(e) => setFormState({ ...formState, deliveryDate: e.target.value })}
              className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-purple-300 font-medium mb-1">OC Total Amount</label>
            <input
              type="text"
              value={formState.totalAmount || ''}
              onChange={(e) => setFormState({ ...formState, totalAmount: e.target.value })}
              className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-purple-300 font-medium mb-1">Material Items Summary</label>
            <input
              type="text"
              value={formState.materialItemsSummary || ''}
              placeholder="e.g. 16 + freight"
              onChange={(e) => setFormState({ ...formState, materialItemsSummary: e.target.value })}
              className="w-full px-3 py-2 bg-[#1B142D] border border-purple-800/80 rounded-lg text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="p-2.5 bg-[#181126] rounded-xl border border-purple-900/40">
            <span className="text-[10px] font-medium text-purple-400/80 uppercase tracking-wider block mb-0.5">
              Project
            </span>
            <div className="flex items-center space-x-1.5 text-white font-semibold">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{header.projectName || '—'}</span>
            </div>
          </div>

          <div className="p-2.5 bg-[#181126] rounded-xl border border-purple-900/40">
            <span className="text-[10px] font-medium text-purple-400/80 uppercase tracking-wider block mb-0.5">
              Client
            </span>
            <div className="flex items-center space-x-1.5 text-white font-semibold">
              <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{header.customerName || '—'}</span>
            </div>
          </div>

          <div className="p-2.5 bg-[#181126] rounded-xl border border-purple-900/40">
            <span className="text-[10px] font-medium text-purple-400/80 uppercase tracking-wider block mb-0.5">
              OC Reference
            </span>
            <div className="flex items-center space-x-1.5 text-white font-semibold font-mono">
              <Hash className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{header.ocNumber || header.referenceNumber || '—'}</span>
            </div>
          </div>

          <div className="p-2.5 bg-[#181126] rounded-xl border border-purple-900/40">
            <span className="text-[10px] font-medium text-purple-400/80 uppercase tracking-wider block mb-0.5">
              PO Number
            </span>
            <div className="flex items-center space-x-1.5 text-white font-semibold font-mono">
              <FileCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{header.poNumber || '—'}</span>
            </div>
          </div>

          <div className="p-2.5 bg-[#181126] rounded-xl border border-purple-900/40">
            <span className="text-[10px] font-medium text-purple-400/80 uppercase tracking-wider block mb-0.5">
              OC Date
            </span>
            <div className="flex items-center space-x-1.5 text-white font-semibold">
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{header.ocDate || '—'}</span>
            </div>
          </div>

          <div className="p-2.5 bg-[#181126] rounded-xl border border-purple-900/40">
            <span className="text-[10px] font-medium text-purple-400/80 uppercase tracking-wider block mb-0.5">
              Delivery Date
            </span>
            <div className="flex items-center space-x-1.5 text-white font-semibold">
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{header.deliveryDate || '—'}</span>
            </div>
          </div>

          <div className="p-2.5 bg-[#181126] rounded-xl border border-purple-900/40">
            <span className="text-[10px] font-medium text-purple-400/80 uppercase tracking-wider block mb-0.5">
              OC Amount
            </span>
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold font-mono">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{header.totalAmount || '—'}</span>
            </div>
          </div>

          <div className="p-2.5 bg-[#181126] rounded-xl border border-purple-900/40">
            <span className="text-[10px] font-medium text-purple-400/80 uppercase tracking-wider block mb-0.5">
              Material Items
            </span>
            <div className="flex items-center space-x-1.5 text-amber-300 font-semibold">
              <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{header.materialItemsSummary || `${totalItemsCount} items`}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
