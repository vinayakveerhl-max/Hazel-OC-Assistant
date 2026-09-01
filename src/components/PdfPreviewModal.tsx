import React, { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { OCHeader, OCLineItem } from '../types';
import { generateLightingSummaryPDFBlobUrl, generateLightingSummaryPDF } from '../utils/pdfGenerator';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  header: OCHeader;
  items: OCLineItem[];
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  header,
  items,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    if (isOpen && items.length > 0) {
      setIsGenerating(true);
      try {
        const url = generateLightingSummaryPDFBlobUrl(header, items);
        setPdfUrl(url);
      } catch (err) {
        console.error('Failed to generate PDF preview:', err);
      } finally {
        setIsGenerating(false);
      }
    }

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, header, items]);

  if (!isOpen) return null;

  return (
    <div
      id="pdf-preview-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div
        id="pdf-preview-modal-container"
        className="relative w-full max-w-6xl h-[90vh] bg-[#120D1D] border border-purple-800/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-purple-900/60 bg-[#160F24]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>PDF Summary Preview</span>
                <span className="text-[11px] font-normal text-amber-400/90 bg-purple-950 px-2 py-0.5 rounded border border-purple-800/50">
                  {header.ocNumber || 'OC Summary'}
                </span>
              </h3>
              <p className="text-xs text-purple-300/70">
                A4 Landscape Executive Format • Non-overlapping Tables & Headers
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              id="download-from-preview-btn"
              onClick={() => generateLightingSummaryPDF(header, items)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-md transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              id="close-preview-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Frame */}
        <div className="flex-1 bg-[#09060E] relative flex items-center justify-center overflow-hidden">
          {isGenerating ? (
            <div className="flex flex-col items-center space-y-3 text-purple-300">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Building PDF pages with strict layout precision...</p>
            </div>
          ) : pdfUrl ? (
            <iframe
              id="pdf-preview-iframe"
              src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              className="w-full h-full border-0 rounded-b-2xl"
              title="Lighting Summary PDF Preview"
            />
          ) : (
            <p className="text-xs text-rose-400">Failed to render PDF preview.</p>
          )}
        </div>
      </div>
    </div>
  );
};
