import React, { useState } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { OCMetadataCard } from './components/OCMetadataCard';
import { CategoryTable } from './components/CategoryTable';
import { ConsolidatedSummaryTable } from './components/ConsolidatedSummaryTable';
import { ItemEditorModal } from './components/ItemEditorModal';
import { ExtractedOCResult, OCHeader, OCLineItem, LightingCategory } from './types';
import { generateLightingSummaryPDF } from './utils/pdfGenerator';
import {
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  Filter,
  Plus,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  const [ocData, setOcData] = useState<ExtractedOCResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConsolidatedView, setIsConsolidatedView] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Item Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OCLineItem | null>(null);
  const [defaultAddCategory, setDefaultAddCategory] = useState<LightingCategory>('Downlights / Spotlights');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Header update handler
  const handleUpdateHeader = (updatedHeader: OCHeader) => {
    if (!ocData) return;
    setOcData({
      ...ocData,
      header: updatedHeader,
    });
  };

  // Item update or add handler
  const handleSaveItem = (savedItem: OCLineItem) => {
    if (!ocData) return;
    const existingIndex = ocData.items.findIndex((i) => i.id === savedItem.id);

    let updatedItems: OCLineItem[];
    if (existingIndex >= 0) {
      updatedItems = [...ocData.items];
      updatedItems[existingIndex] = savedItem;
    } else {
      updatedItems = [...ocData.items, savedItem];
    }

    setOcData({
      ...ocData,
      items: updatedItems,
    });
  };

  // Item delete handler
  const handleDeleteItem = (id: string) => {
    if (!ocData) return;
    setOcData({
      ...ocData,
      items: ocData.items.filter((i) => i.id !== id),
    });
  };

  // Add Item trigger
  const handleOpenAddModal = (category?: LightingCategory) => {
    setEditingItem(null);
    if (category) setDefaultAddCategory(category);
    setIsEditorOpen(true);
  };

  // Edit Item trigger
  const handleOpenEditModal = (item: OCLineItem) => {
    setEditingItem(item);
    setIsEditorOpen(true);
  };

  // Generate and Download PDF
  const handleGeneratePDF = () => {
    if (!ocData || ocData.items.length === 0) return;
    setIsGeneratingPDF(true);
    try {
      generateLightingSummaryPDF(ocData.header, ocData.items);
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      alert('Error generating PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Reset all data for new upload
  const handleReset = () => {
    setOcData(null);
    setErrorMessage(null);
    setSearchQuery('');
  };

  // Filter items based on search query and category filter
  const getFilteredItems = () => {
    if (!ocData) return [];
    let items = ocData.items;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          (i.itemName && i.itemName.toLowerCase().includes(q)) ||
          (i.productCode && i.productCode.toLowerCase().includes(q)) ||
          (i.clientCode && i.clientCode.toLowerCase().includes(q)) ||
          (i.category && i.category.toLowerCase().includes(q)) ||
          (i.wattage && i.wattage.toLowerCase().includes(q)) ||
          (i.cct && i.cct.toLowerCase().includes(q)) ||
          (i.remarks && i.remarks.toLowerCase().includes(q)) ||
          (i.lineItemNumber && i.lineItemNumber.includes(q))
      );
    }

    if (selectedCategoryFilter !== 'ALL') {
      items = items.filter((i) => i.category === selectedCategoryFilter);
    }

    return items;
  };

  const filteredItems = getFilteredItems();

  // Defined Category sections according to requirements
  const categorySections = [
    { title: 'Power Supplies & Drivers', key: 'Power Supplies' as LightingCategory },
    { title: 'Linear Lighting', key: 'Linears' as LightingCategory },
    { title: 'Downlights & Spotlights', key: 'Downlights / Spotlights' as LightingCategory },
    { title: 'Flexum Strips', key: 'Flexum' as LightingCategory },
    { title: 'Svelte Fixtures', key: 'Svelte' as LightingCategory },
    { title: 'Aluminum Profiles & Extrusions', key: 'Profiles' as LightingCategory },
    { title: 'Grids & Louvers', key: 'Grids' as LightingCategory },
    { title: 'Diffusers', key: 'Diffusers' as LightingCategory },
    { title: 'Connectors & Joiners', key: 'Connectors' as LightingCategory },
    { title: 'Accessories & Mounting Hardware', key: 'Accessories / Other Items' as LightingCategory },
    { title: 'Other Lighting Products', key: 'Other Lighting Products' as LightingCategory },
  ];

  return (
    <div className="min-h-screen bg-[#0A0711] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Application Header */}
      <Header
        hasData={Boolean(ocData)}
        onGeneratePDF={handleGeneratePDF}
        onReset={handleReset}
        isGenerating={isGeneratingPDF}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!ocData ? (
          /* Upload / OCR Phase */
          <UploadZone
            onExtractSuccess={(data) => setOcData(data)}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
          />
        ) : (
          /* Review & Generate Phase */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Action & Status Toolbar */}
            <div className="bg-[#120D1D] border border-purple-900/60 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950/90 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-serif text-white tracking-wide">
                    Review Extracted Lighting Specifications
                  </h2>
                  <p className="text-xs text-purple-300/70">
                    Verify line items, edit quantities or remarks, and generate the executive PDF report
                  </p>
                </div>
              </div>

              {/* View Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Consolidation Toggle */}
                <button
                  id="toggle-consolidation-btn"
                  onClick={() => setIsConsolidatedView(!isConsolidatedView)}
                  className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isConsolidatedView
                      ? 'bg-amber-400/10 border-amber-400/50 text-amber-300 shadow-inner'
                      : 'bg-purple-950/60 border-purple-800/60 text-purple-300 hover:text-white'
                  }`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>
                    {isConsolidatedView ? 'Consolidated View (Active)' : 'Raw Line Items View'}
                  </span>
                </button>

                {/* Add Item Button */}
                <button
                  id="add-custom-item-btn"
                  onClick={() => handleOpenAddModal()}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-900/70 hover:bg-purple-800 border border-purple-700/60 text-xs font-semibold text-purple-200 hover:text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Add Line Item</span>
                </button>

                {/* Generate PDF Main Button */}
                <button
                  id="generate-pdf-btn"
                  onClick={handleGeneratePDF}
                  disabled={isGeneratingPDF}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/50 transition-all transform active:scale-98 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isGeneratingPDF ? 'Compiling PDF...' : 'Generate PDF Summary'}</span>
                </button>
              </div>
            </div>

            {/* OC Metadata Card */}
            <OCMetadataCard
              header={ocData.header}
              onChangeHeader={handleUpdateHeader}
              isScanned={ocData.isScanned}
              totalItemsCount={ocData.items.length}
            />

            {/* Warnings or Notes Banner if any */}
            {ocData.warnings && ocData.warnings.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200/90 space-y-1">
                <div className="flex items-center space-x-2 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Extraction Notice & Specification Flags</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-amber-200/80">
                  {ocData.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search item, wattage, CCT, line #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#130E20] border border-purple-900/80 rounded-xl text-xs text-white placeholder-purple-400/60 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
                <button
                  onClick={() => setSelectedCategoryFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedCategoryFilter === 'ALL'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'bg-purple-950/60 text-purple-300 hover:text-white border border-purple-900/60'
                  }`}
                >
                  All Categories ({ocData.items.length})
                </button>
              </div>
            </div>

            {/* Category Tables */}
            <div className="space-y-6">
              {categorySections.map((section) => {
                const catItems = filteredItems.filter((item) => {
                  if (section.key === 'Linears') {
                    return item.category === 'Linears';
                  }
                  if (section.key === 'Downlights / Spotlights') {
                    return (
                      item.category === 'Downlights / Spotlights' ||
                      item.category === ('Downlights' as any) ||
                      item.category === ('Spotlights' as any)
                    );
                  }
                  if (section.key === 'Power Supplies') {
                    return (
                      item.category === 'Power Supplies' ||
                      item.category === ('LED Drivers' as any)
                    );
                  }
                  return item.category === section.key;
                });

                return (
                  <CategoryTable
                    key={section.key}
                    categoryTitle={section.title}
                    categoryKey={section.key}
                    items={catItems}
                    isConsolidated={isConsolidatedView}
                    onEditItem={handleOpenEditModal}
                    onDeleteItem={handleDeleteItem}
                    onAddItem={handleOpenAddModal}
                  />
                );
              })}
            </div>

            {/* Consolidated Material Summary Section */}
            <ConsolidatedSummaryTable items={ocData.items} />

            {/* Bottom Generate PDF Action Banner */}
            <div className="p-6 bg-gradient-to-r from-purple-950 via-[#1C122E] to-purple-950 border border-purple-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div>
                <h3 className="text-base font-bold font-serif text-white">
                  Ready to Export Production Order Summary?
                </h3>
                <p className="text-xs text-purple-300/80">
                  Generates an A4 PDF with dark purple headers, gold trims, and separated category tables.
                </p>
              </div>

              <button
                id="footer-generate-pdf-btn"
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-950/60 transition-all transform active:scale-98 disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                <span>{isGeneratingPDF ? 'Generating Document...' : 'Generate & Download PDF'}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Item Editor Modal */}
      <ItemEditorModal
        isOpen={isEditorOpen}
        item={editingItem}
        defaultCategory={defaultAddCategory}
        onSave={handleSaveItem}
        onClose={() => setIsEditorOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-purple-900/40 bg-[#09060F] py-6 mt-12 text-center text-xs text-purple-400/60">
        <p>Hazel OC Assistant • Professional Lighting Order Confirmation Processing System</p>
        <p className="mt-1 text-[11px] text-purple-500/50">
          Enforcing strict specification isolation for Purchase, Production & Quality Control
        </p>
      </footer>
    </div>
  );
}
