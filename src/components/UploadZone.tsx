import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles, Layers, Cpu, ShieldCheck } from 'lucide-react';
import { SAMPLE_LIGHTING_OC } from '../data/sampleOC';
import { ExtractedOCResult } from '../types';

interface UploadZoneProps {
  onExtractSuccess: (data: ExtractedOCResult) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onExtractSuccess,
  isLoading,
  setIsLoading,
  errorMessage,
  setErrorMessage,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractionStage, setExtractionStage] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractionSteps = [
    { title: 'Reading Document Structure', desc: 'Parsing multi-page PDF & embedded text' },
    { title: 'OCR & Visual Layout Engine', desc: 'Scanning raster tables & drawing tags if needed' },
    { title: 'AI Lighting Specification Extraction', desc: 'Categorizing Linears, Spotlights, PSUs, Profiles' },
    { title: 'Building Specification Matrix', desc: 'Applying strict consolidation & non-merging rules' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMessage('Please select a valid PDF file (.pdf).');
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMessage('Please drop a valid PDF file (.pdf).');
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const processUpload = async (fileToUpload?: File) => {
    const file = fileToUpload || selectedFile;
    if (!file) {
      setErrorMessage('Please select an Order Confirmation PDF file first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setExtractionStage(0);

    // Simulate animated step progression while network request is active
    const stepInterval = setInterval(() => {
      setExtractionStage((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1800);

    try {
      // Convert File to Base64 to ensure seamless binary transfer across all proxy environments
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          const base64Data = res.split(',')[1] || res;
          resolve(base64Data);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/extract-oc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          pdfBase64: fileBase64,
          filename: file.name,
        }),
      });

      clearInterval(stepInterval);
      setExtractionStage(3);

      const contentType = response.headers.get('content-type') || '';
      const rawText = await response.text();

      let result: any = null;
      if (contentType.includes('application/json') || rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
        try {
          result = JSON.parse(rawText);
        } catch (jsonErr) {
          console.error('Failed to parse server response as JSON:', rawText.slice(0, 400));
          throw new Error(`Server returned invalid JSON response: ${rawText.slice(0, 150)}`);
        }
      } else {
        console.error('Non-JSON server response received:', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          snippet: rawText.slice(0, 300),
        });
        throw new Error(
          `Server returned unexpected ${response.status} ${response.statusText} (${contentType || 'non-JSON'}). Please verify API server status.`
        );
      }

      if (!response.ok || result.success === false) {
        let errMessage = 'Extraction failed.';
        if (typeof result.error === 'string' && result.error.trim()) {
          errMessage = result.error;
        } else if (result.error && typeof result.error === 'object') {
          errMessage = result.error.message || JSON.stringify(result.error);
        } else if (typeof result.details === 'string' && result.details.trim()) {
          errMessage = result.details;
        } else {
          errMessage = `HTTP error ${response.status}: ${response.statusText}`;
        }

        if (
          result.details &&
          typeof result.details === 'string' &&
          result.details !== errMessage &&
          !result.details.includes('<html') &&
          !result.details.includes('<!DOCTYPE') &&
          !result.details.includes('Error:')
        ) {
          errMessage += ` (${result.details})`;
        }
        throw new Error(errMessage);
      }

      if (!result.items || result.items.length === 0) {
        throw new Error(
          'The document was processed, but no lighting items or specifications were identified. Please verify that this is a valid Order Confirmation PDF.'
        );
      }

      onExtractSuccess(result as ExtractedOCResult);
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error('Extraction failure:', err);
      
      let rawMsg: string = '';
      if (typeof err === 'string') {
        rawMsg = err;
      } else if (err?.message && err.message !== '[object Object]' && !err.message.includes('[object Object]')) {
        rawMsg = err.message;
      } else if (typeof err === 'object') {
        try {
          rawMsg = JSON.stringify(err);
        } catch {
          rawMsg = 'An unexpected error occurred while processing the PDF.';
        }
      } else {
        rawMsg = String(err || 'An unexpected error occurred.');
      }
      
      // Clean raw HTML, JSON, or stack traces
      if (rawMsg.includes('<!DOCTYPE') || rawMsg.includes('<html') || rawMsg.includes('502 Bad Gateway') || rawMsg.includes('504 Gateway')) {
        rawMsg = 'The extraction server temporarily timed out. Your PDF is ready—please click "Start Extraction" to retry.';
      } else if (rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE') || rawMsg.includes('high demand') || rawMsg.includes('resource exhausted') || rawMsg.includes('429')) {
        rawMsg = 'The AI document engine is currently experiencing high demand. Please click "Start Extraction" to retry in a moment.';
      } else if (rawMsg.startsWith('{') && rawMsg.includes('"error"')) {
        try {
          const parsed = JSON.parse(rawMsg);
          rawMsg = parsed.error?.message || parsed.error || 'The document engine reported an error processing this PDF.';
        } catch {
          rawMsg = 'An error occurred while parsing the document response. Please try again.';
        }
      }

      if (rawMsg === '[object Object]' || rawMsg.includes('[object Object]') || !rawMsg.trim()) {
        rawMsg = 'The document extraction service encountered an issue. Please verify your PDF and try uploading again.';
      }
      
      setErrorMessage(rawMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = (sampleData: ExtractedOCResult = SAMPLE_LIGHTING_OC) => {
    setIsLoading(true);
    setErrorMessage(null);
    setExtractionStage(0);

    const stepInterval = setInterval(() => {
      setExtractionStage((prev) => (prev < 3 ? prev + 1 : prev));
    }, 400);

    setTimeout(() => {
      clearInterval(stepInterval);
      setExtractionStage(3);
      onExtractSuccess(sampleData);
      setIsLoading(false);
    }, 1400);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Introduction Card */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800/60 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Automated Lighting Document Intelligence</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
          Process Lighting Order Confirmation
        </h2>
        <p className="mt-2.5 text-sm sm:text-base text-purple-200/70 max-w-2xl mx-auto leading-relaxed">
          Upload any vendor or factory Order Confirmation (scanned or digital text). Our AI OCR engine extracts every luminaire, power supply, extrusion, and accessory with strict specification integrity.
        </p>
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        id="pdf-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 transition-all cursor-pointer text-center ${
          isDragOver
            ? 'border-amber-400 bg-purple-950/60 scale-[1.01] shadow-2xl shadow-purple-900/40'
            : 'border-purple-800/60 bg-[#120D1D]/90 hover:border-purple-600 hover:bg-[#161024]/90'
        } ${isLoading ? 'pointer-events-none opacity-90' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />

        {/* Dynamic Loading State / Idle State */}
        {isLoading ? (
          <div className="py-4">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-tr from-purple-700 to-amber-500 p-0.5 animate-spin">
              <div className="w-full h-full bg-[#120D1D] rounded-[14px] flex items-center justify-center">
                <Cpu className="w-7 h-7 text-amber-400 animate-pulse" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-white font-serif mb-1">
              Processing Order Confirmation...
            </h3>
            <p className="text-xs text-purple-300/80 mb-6">
              Gemini Multimodal Document Engine is extracting lighting fixtures & electrical parameters
            </p>

            {/* Stepper Progress */}
            <div className="max-w-md mx-auto space-y-2.5 text-left bg-[#191228] p-4 rounded-xl border border-purple-900/50">
              {extractionSteps.map((step, idx) => (
                <div key={idx} className="flex items-center space-x-3 text-xs">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      extractionStage > idx
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : extractionStage === idx
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        : 'bg-purple-950 text-purple-500 border border-purple-900'
                    }`}
                  >
                    {extractionStage > idx ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <div>
                    <span
                      className={`font-semibold ${
                        extractionStage === idx
                          ? 'text-amber-300'
                          : extractionStage > idx
                          ? 'text-purple-200'
                          : 'text-purple-400/60'
                      }`}
                    >
                      {step.title}
                    </span>
                    <span className="block text-[11px] text-purple-300/60">{step.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-950/80 border border-purple-800/80 flex items-center justify-center shadow-lg shadow-purple-950/50 text-amber-400 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>

            {selectedFile ? (
              <div className="mb-4 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-950/90 border border-amber-500/40 text-amber-200">
                <FileText className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-semibold truncate max-w-xs">{selectedFile.name}</span>
                <span className="text-xs text-purple-300">
                  ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
            ) : (
              <>
                <p className="text-base font-semibold text-white mb-1">
                  Drag and drop your Lighting OC PDF here, or <span className="text-amber-400 underline underline-offset-2">browse files</span>
                </p>
                <p className="text-xs text-purple-300/70 mb-5">
                  Supports Scanned PDFs, Multi-page Factory Invoices, Order Acknowledgements up to 35MB
                </p>
              </>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              {selectedFile ? (
                <button
                  id="extract-selected-pdf-btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    processUpload();
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-semibold text-sm rounded-xl shadow-lg shadow-amber-950/40 transition-all transform active:scale-98"
                >
                  Start Extraction
                </button>
              ) : (
                <button
                  id="select-file-btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 bg-purple-900/60 hover:bg-purple-800/80 text-purple-100 font-medium text-xs rounded-xl border border-purple-700/60 transition-colors"
                >
                  Select PDF Document
                </button>
              )}

              <button
                id="load-sample-oc-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSample(SAMPLE_LIGHTING_OC);
                }}
                className="px-3.5 py-2 bg-purple-950/80 hover:bg-purple-900/80 text-amber-300/90 hover:text-amber-200 font-medium text-xs rounded-xl border border-amber-500/30 transition-colors flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Try Sample OC</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div id="extraction-error-alert" className="mt-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start space-x-3 text-rose-200 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-300">{errorMessage}</p>
            <p className="text-xs text-rose-300/70">
              {errorMessage.toLowerCase().includes('demand') ||
              errorMessage.toLowerCase().includes('busy') ||
              errorMessage.toLowerCase().includes('rate limit') ||
              errorMessage.toLowerCase().includes('503') ||
              errorMessage.toLowerCase().includes('429')
                ? 'High-demand spikes are temporary. Your PDF remains ready—simply click "Start Extraction" again to retry.'
                : 'Please verify that the document contains lighting line items, or try uploading again.'}
            </p>
          </div>
        </div>
      )}

      {/* Lighting Rules & Capabilities Summary Cards */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div className="p-4 rounded-xl bg-[#120D1D] border border-purple-900/40">
          <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs mb-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Strict Non-Merging Rules</span>
          </div>
          <p className="text-xs text-purple-200/70 leading-relaxed">
            Wattages (e.g. 12W vs 24W), CCTs (3000K vs 4000K), finishes, beam angles and driver specs are never merged together.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#120D1D] border border-purple-900/40">
          <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs mb-1.5">
            <Layers className="w-4 h-4" />
            <span>Comprehensive Categories</span>
          </div>
          <p className="text-xs text-purple-200/70 leading-relaxed">
            Extracts Linears, Svelte, Flexum, Downlights, Spotlights, Extrusions, Grids, Opal Diffusers, Drivers, and Connectors.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#120D1D] border border-purple-900/40">
          <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs mb-1.5">
            <FileText className="w-4 h-4" />
            <span>A4 PDF Output</span>
          </div>
          <p className="text-xs text-purple-200/70 leading-relaxed">
            Generates standardized corporate summaries with repeated headers for Purchase, Production, QC, and Management.
          </p>
        </div>
      </div>
    </div>
  );
};
