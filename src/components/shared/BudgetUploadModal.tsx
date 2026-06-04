import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useProject } from '../../context/ProjectContext';
import { XIcon, CloudIcon } from '../common/Icons';
import {
  extractBudgetLines,
  createBudgetRowsFromExtractedLines,
  sumExtractedBudgetLines,
  type ExtractedBudgetLine,
  type BudgetExtractionMethod,
} from '../../lib/budgetLineExtraction';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type ModalStep = 'upload' | 'processing' | 'review';

const SCAN_MESSAGES = [
  'Reading file structure…',
  'Detecting budget columns…',
  'Extracting cost codes…',
  'Extracting line descriptions…',
  'Parsing budget amounts…',
  'Validation complete.',
];

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);
    const textContent = await page.getTextContent();
    text += textContent.items.map((item: { str?: string }) => item.str ?? '').join(' ') + '\n';
  }
  return text;
}

const formatCurrency = (value: number) =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const BudgetUploadModal: React.FC = () => {
  const {
    setIsBudgetUploadOpen,
    updateBudgetRows,
    budgetRows,
    setBudgetSetupPhase,
    setFinancialSetupStep,
    initializeBlankBudget,
  } = useProject();

  const [step, setStep] = useState<ModalStep>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [scanLines, setScanLines] = useState<string[]>([]);
  const [reviewLines, setReviewLines] = useState<ExtractedBudgetLine[]>([]);
  const [extractionMethod, setExtractionMethod] = useState<BudgetExtractionMethod>('fallback');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setIsBudgetUploadOpen(false);
    setStep('upload');
    setDragActive(false);
    setUploadedFile(null);
    setScanLines([]);
    setReviewLines([]);
  };

  const runScanAnimation = (onDone: () => void) => {
    let i = 0;
    const interval = 1500 / SCAN_MESSAGES.length;
    const tick = () => {
      if (i >= SCAN_MESSAGES.length) {
        onDone();
        return;
      }
      setScanLines((prev) => [...prev, SCAN_MESSAGES[i]]);
      i++;
      setTimeout(tick, interval);
    };
    setTimeout(tick, 200);
  };

  const processFile = async (file: File) => {
    setUploadedFile(file);
    setStep('processing');
    setScanLines([]);

    let rawText = '';
    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        rawText = await extractTextFromPDF(file);
      } else {
        rawText = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(typeof e.target?.result === 'string' ? e.target.result : '');
          reader.onerror = () => resolve('');
          reader.readAsText(file);
        });
      }
    } catch (error) {
      console.error('Error reading budget file:', error);
      rawText = '';
    }

    const { lines, method } = extractBudgetLines(rawText, file.name);
    runScanAnimation(() => {
      setReviewLines(lines);
      setExtractionMethod(method);
      setStep('review');
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file).catch(console.error);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file).catch(console.error);
  };

  const handleConfirm = () => {
    // Append to any real budget lines (preserving committed rows), dropping the
    // blank placeholder rows so an initial upload starts clean and a re-upload
    // from the grid toolbar adds to the existing budget.
    const existing = budgetRows.filter((r) => {
      const name = r.cells['name'];
      const budget = r.cells['budget'];
      return (typeof name === 'string' && name.trim() !== '') || (typeof budget === 'number' && budget !== 0);
    });
    updateBudgetRows([...existing, ...createBudgetRowsFromExtractedLines(reviewLines)]);
    setBudgetSetupPhase('grid');
    setFinancialSetupStep(3);
    handleClose();
  };

  const handleEnterManually = () => {
    initializeBlankBudget();
    setBudgetSetupPhase('grid');
    setFinancialSetupStep(3);
    handleClose();
  };

  const reviewTotal = sumExtractedBudgetLines(reviewLines);

  return createPortal(
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto"
      >
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Upload Budget</h2>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                  }}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <CloudIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900 mb-1">Drag and drop your budget file here</p>
                  <p className="text-xs text-gray-600 mb-4">or</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 font-semibold underline"
                  >
                    browse files
                  </button>
                  <p className="text-xs text-gray-600 mt-4">Excel (.xlsx), CSV, or PDF</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.csv,.pdf"
                    onChange={handleFileInput}
                    hidden
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500 font-medium">Or</span>
                  </div>
                </div>

                <button
                  onClick={handleEnterManually}
                  className="w-full px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Enter Budget Lines Manually
                </button>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <h2 className="text-lg font-semibold text-gray-900">Reading Budget…</h2>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4 max-h-48 bg-gray-50">
                {scanLines.map((line, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs text-gray-600 font-mono py-0.5"
                  >
                    {line}
                  </motion.p>
                ))}
              </div>
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, ease: 'linear' }}
                className="h-1 bg-blue-500"
              />
            </motion.div>
          )}

          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Review Budget Lines</h2>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                <p className="text-xs text-gray-600">
                  {reviewLines.length} line{reviewLines.length === 1 ? '' : 's'} from{' '}
                  <span className="font-medium text-gray-900">{uploadedFile?.name ?? 'upload'}</span>. You can edit
                  every value in the grid after importing.
                </p>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                        <th className="px-3 py-2">Cost Code</th>
                        <th className="px-3 py-2">Description</th>
                        <th className="px-3 py-2 text-right">Budget</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewLines.map((line, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-1.5 text-gray-700 tabular-nums">{line.costCode}</td>
                          <td className="px-3 py-1.5 text-gray-900">{line.name}</td>
                          <td className="px-3 py-1.5 text-right text-gray-900 tabular-nums">
                            {formatCurrency(line.budget)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr className="font-semibold text-gray-900">
                        <td className="px-3 py-2" colSpan={2}>
                          Total
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(reviewTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {extractionMethod === 'fallback' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <p className="text-sm text-amber-900">
                      We couldn't read structured budget lines from this file, so a sample budget is shown. Adjust
                      the lines after importing, or cancel and upload a CSV/Excel with a header row.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors active:scale-95"
                >
                  Import {reviewLines.length} Line{reviewLines.length === 1 ? '' : 's'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>,
    document.body
  );
};

export default BudgetUploadModal;
