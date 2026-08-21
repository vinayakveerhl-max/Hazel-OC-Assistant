import React from 'react';
import { Sparkles, FileText, CheckCircle, ShieldCheck, Download } from 'lucide-react';

interface HeaderProps {
  hasData: boolean;
  onGeneratePDF: () => void;
  onReset: () => void;
  isGenerating?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  hasData,
  onGeneratePDF,
  onReset,
  isGenerating = false,
}) => {
  return (
    <header id="app-header" className="border-b border-purple-900/40 bg-[#0F0B18]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-700 via-purple-900 to-amber-600/60 p-0.5 shadow-lg shadow-purple-950/50 flex items-center justify-center">
            <div className="w-full h-full bg-[#130E20] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white font-serif">
                Hazel <span className="text-amber-400 font-sans">OC Assistant</span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-950/80 text-purple-300 border border-purple-800/60">
                v2.5 Production
              </span>
            </div>
            <p className="text-xs text-purple-300/70 font-medium tracking-wide">
              Lighting Order Confirmation Tool • AI Specification Engine
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-900/40 text-xs text-purple-300/80">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Strict Lighting Spec Integrity</span>
          </div>

          {hasData && (
            <>
              <button
                id="reset-oc-btn"
                onClick={onReset}
                className="px-3.5 py-2 text-xs font-medium text-purple-300 hover:text-white bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/40 rounded-lg transition-colors"
              >
                Upload New OC
              </button>

              <button
                id="header-generate-pdf-btn"
                onClick={onGeneratePDF}
                disabled={isGenerating}
                className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-md shadow-amber-950/40 transition-all transform active:scale-98 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isGenerating ? 'Building PDF...' : 'Generate PDF'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
