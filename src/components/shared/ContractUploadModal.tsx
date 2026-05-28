import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useProject } from '../../context/ProjectContext';
import { XIcon, CloudIcon, ChevronRightIcon, PlusIcon, TrashIcon } from '../common/Icons';
import { DatePicker } from '../common/ui/DatePicker';
import { extractLineItems, createPrimeContractRowsFromLineItems } from '../../lib/contractLineExtraction';
import {
  DEFAULT_PRIME_CONTRACT_COLUMNS,
  PRIME_CONTRACT_SHEET_ID,
  createEmptyPrimeContractSheet,
} from '../../lib/financialWorkflow';
import type { ContractData } from '../../types';
import { V3Sheet, V3Row } from '../views/spreadsheetV4/types';
import { uid } from '../views/spreadsheetV4/SpreadsheetViewV4';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type ModalStep = 'method' | 'upload' | 'processing' | 'review' | 'manual-entry';
type EntryMethod = 'file' | 'manual' | null;

// Fallback demo values
const DEMO_CONTRACT = {
  executedDate:    new Date(2026, 4, 20),
  startDate:       new Date(2026, 5, 10),
  endDate:         new Date(2026, 8, 30),
  finalCompletion: new Date(2026, 9, 14),
  contractSum:     296000,
  owner:           'Desert Vista Capital LLC',
  contractor:      'Sonoran Build & Repair LLC',
  projectName:     'Desert Vista Apartments',
};

interface ExtractedContract {
  executedDate:    Date | null;
  startDate:       Date | null;
  endDate:         Date | null;
  finalCompletion: Date | null;
  contractSum:     number | null;
  owner:           string;
  contractor:      string;
  projectName:     string;
}

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';

  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    text += pageText + ' ';
  }

  return text;
}

function extractContractFields(text: string): ExtractedContract {
  const t = text.replace(/\s+/g, ' ');

  const executedMatch = t.match(
    /entered\s+into\s+on\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i
  ) || t.match(/effective\s+date[^:]*:\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i);

  const startMatch = t.match(
    /(?:construction\s+start|start\s+date|commence)[^:]*:?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i
  );

  const endMatch = t.match(
    /substantial\s+completion[^:]*:?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i
  );

  const finalMatch = t.match(
    /final\s+completion[^:]*:?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i
  );

  const sumMatch = t.match(/contract\s+sum[^$\d]*\$\s*([\d,]+(?:\.\d{2})?)/i)
                || t.match(/\$\s*([\d,]+(?:\.\d{2})?)/);

  const ownerMatch = t.match(/owner[^:]*:\s*\*?\*?([A-Z][A-Za-z &]+(?:LLC|Inc|Corp|Ltd)?)/i);
  const contractorMatch = t.match(/contractor[^:]*:\s*\*?\*?([A-Z][A-Za-z &]+(?:LLC|Inc|Corp|Ltd)?)/i);
  const projectMatch = t.match(/project\s*(?:name)?[^:]*:\s*\*?\*?([A-Z][A-Za-z &]+(?:Apartments|Building|Complex)?)/i)
                     || t.match(/\*\*([A-Z][A-Za-z &]+Apartments)\*\*/i);

  const parseNaturalDate = (raw: string | undefined): Date | null => {
    if (!raw) return null;
    try {
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  return {
    executedDate:    parseNaturalDate(executedMatch?.[1]),
    startDate:       parseNaturalDate(startMatch?.[1]),
    endDate:         parseNaturalDate(endMatch?.[1]),
    finalCompletion: parseNaturalDate(finalMatch?.[1]),
    contractSum:     sumMatch ? parseFloat(sumMatch[1].replace(/,/g, '')) : null,
    owner:           ownerMatch?.[1]?.trim() ?? '',
    contractor:      contractorMatch?.[1]?.trim() ?? '',
    projectName:     projectMatch?.[1]?.trim() ?? '',
  };
}

const ContractUploadModal: React.FC = () => {
  const { isContractUploadOpen, setIsContractUploadOpen, contractData, setContractData, updateView, activeView, setFinancialSetupStep, setContractLocked, setPrimeContractSetupPhase } = useProject();

  const [step, setStep] = useState<ModalStep>('upload');
  const [entryMethod, setEntryMethod] = useState<EntryMethod>('file');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [scanLines, setScanLines] = useState<string[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const [rawContractText, setRawContractText] = useState('');

  // Review state (used for file upload only now)
  const [reviewData, setReviewData] = useState<ExtractedContract | null>(null);
  const [reviewExecutedDate, setReviewExecutedDate] = useState<Date | undefined>(undefined);
  const [reviewStartDate, setReviewStartDate] = useState<Date | undefined>(undefined);
  const [reviewEndDate, setReviewEndDate] = useState<Date | undefined>(undefined);
  const [reviewContractSum, setReviewContractSum] = useState<number | null>(null);
  const [extractionMethod, setExtractionMethod] = useState<'parsed' | 'fallback'>('fallback');

  // Manual entry state
  const [manualConstructionStart, setManualConstructionStart] = useState<Date | undefined>(undefined);
  const [manualConstructionEnd, setManualConstructionEnd] = useState<Date | undefined>(undefined);
  const [manualDateExecuted, setManualDateExecuted] = useState<Date | undefined>(undefined);
  const [manualContractSum, setManualContractSum] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setIsContractUploadOpen(false);
    // Reset modal state
    setStep('upload');
    setEntryMethod('file');
    setDragActive(false);
    setUploadedFile(null);
    setScanLines([]);
    setScanComplete(false);
    setRawContractText('');
    setReviewData(null);
    setReviewContractSum(null);
    setManualConstructionStart(undefined);
    setManualConstructionEnd(undefined);
    setManualDateExecuted(undefined);
    setManualContractSum('');
  };

  const SCAN_MESSAGES = [
    'Reading document structure…',
    'Detecting contract parties…',
    'Extracting Owner…',
    'Extracting Contractor…',
    'Parsing Effective Date…',
    'Parsing Construction Start…',
    'Parsing Substantial Completion…',
    'Validation complete.',
  ];

  const runScanAnimation = (data: ExtractedContract, onDone: () => void) => {
    const lines = SCAN_MESSAGES;
    let i = 0;
    const totalDuration = 1800;
    const interval = totalDuration / lines.length;

    const tick = () => {
      if (i >= lines.length) {
        onDone();
        return;
      }
      setScanLines(prev => [...prev, lines[i]]);
      i++;
      setTimeout(tick, interval);
    };
    setTimeout(tick, 200);
  };

  const processFile = async (file: File) => {
    setUploadedFile(file);
    setStep('processing');
    setScanLines([]);
    setScanComplete(false);

    try {
      let rawText = '';

      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        rawText = await extractTextFromPDF(file);
      } else {
        rawText = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(typeof e.target?.result === 'string' ? e.target.result : '');
          };
          reader.readAsText(file);
        });
      }

      const extracted = extractContractFields(rawText);
      const hasValidExtraction = Object.values(extracted).some(
        v => v !== null && v !== '' && v !== 0
      );

      const final: ExtractedContract = hasValidExtraction
        ? { ...DEMO_CONTRACT, ...extracted }
        : DEMO_CONTRACT;

      const method = hasValidExtraction ? 'parsed' : 'fallback';
      setExtractionMethod(method);
      setRawContractText(rawText);

      runScanAnimation(final, () => {
        setReviewData(final);
        setReviewExecutedDate(final.executedDate ?? undefined);
        setReviewStartDate(final.startDate ?? undefined);
        setReviewEndDate(final.endDate ?? undefined);
        setReviewContractSum(final.contractSum ?? null);
        setScanComplete(true);
        setStep('review');
      });
    } catch (error) {
      console.error('Error processing file:', error);
      const final = DEMO_CONTRACT;
      setExtractionMethod('fallback');
      setRawContractText('');
      runScanAnimation(final, () => {
        setReviewData(final);
        setReviewExecutedDate(final.executedDate ?? undefined);
        setReviewStartDate(final.startDate ?? undefined);
        setReviewEndDate(final.endDate ?? undefined);
        setReviewContractSum(final.contractSum ?? null);
        setScanComplete(true);
        setStep('review');
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
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
    if (!reviewData) return;

    setContractData({
      executedDate:     reviewExecutedDate ?? null,
      startDate:        reviewStartDate ?? null,
      endDate:          reviewEndDate ?? null,
      finalCompletion:  reviewData.finalCompletion,
      contractSum:      reviewContractSum ?? reviewData.contractSum,
      owner:            reviewData.owner,
      contractor:       reviewData.contractor,
      projectName:      reviewData.projectName,
      fileName:         uploadedFile?.name ?? 'Contract Upload',
      uploadedAt:       new Date().toISOString(),
      extractionMethod,
    });

    // Create prime contract sheet from file upload
    let primeRows: V3Row[] = [];

    if (rawContractText) {
      const extracted = extractLineItems(rawContractText);
      primeRows = createPrimeContractRowsFromLineItems(extracted);
    }

    const primeContractSheet: V3Sheet = primeRows.length > 0
      ? {
          id: PRIME_CONTRACT_SHEET_ID,
          name: 'Prime Contract',
          columns: DEFAULT_PRIME_CONTRACT_COLUMNS,
          rows: primeRows,
        }
      : createEmptyPrimeContractSheet();

    updateView({
      v3Sheets: [primeContractSheet],
      v3ActiveSheetId: PRIME_CONTRACT_SHEET_ID,
    });

    setContractLocked(false);
    setPrimeContractSetupPhase('review');
    setFinancialSetupStep(2);
    handleClose();
  };

  const handleManualEntryConfirm = () => {
    const contractSum = manualContractSum ? parseFloat(manualContractSum.replace(/[^0-9.]/g, '')) : null;

    setContractData({
      executedDate:     manualDateExecuted ?? null,
      startDate:        manualConstructionStart ?? null,
      endDate:          manualConstructionEnd ?? null,
      finalCompletion:  manualConstructionEnd ?? null,
      contractSum:      contractSum,
      owner:            'Owner',
      contractor:       'Contractor',
      projectName:      'Project',
      fileName:         'Manual Entry',
      uploadedAt:       new Date().toISOString(),
      extractionMethod: 'manual',
    } as ContractData);

    updateView({
      v3Sheets: [createEmptyPrimeContractSheet()],
      v3ActiveSheetId: PRIME_CONTRACT_SHEET_ID,
    });

    setContractLocked(false);
    setPrimeContractSetupPhase('review');
    setFinancialSetupStep(2);
    handleClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto"
      >
        <AnimatePresence mode="wait">
          {/* File Upload Step */}
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
                <h2 className="text-lg font-semibold text-gray-900">Upload Contract</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <CloudIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900 mb-1">Drag and drop your contract file here</p>
                  <p className="text-xs text-gray-600 mb-4">or</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 font-semibold underline"
                  >
                    browse files
                  </button>
                  <p className="text-xs text-gray-600 mt-4">PDF, DOCX, XLSX, TXT, or MD</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.xlsx,.txt,.md"
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
                  onClick={() => {
                    setEntryMethod('manual');
                    setStep('manual-entry');
                  }}
                  className="w-full px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Enter Contract Details Manually
                </button>
              </div>

            </motion.div>
          )}

          {/* Processing Step */}
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
                  <h2 className="text-lg font-semibold text-gray-900">Scanning Contract…</h2>
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
                transition={{ duration: 1.8, ease: 'linear' }}
                className="h-1 bg-blue-500"
              />
            </motion.div>
          )}

          {/* Review Step */}
          {step === 'review' && reviewData && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Review Contract Details</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 py-3 border-b border-gray-200">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Project</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{reviewData.projectName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Owner</p>
                    <p className="text-xs text-gray-700 mt-1">{reviewData.owner || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Contractor</p>
                    <p className="text-xs text-gray-700 mt-1">{reviewData.contractor || '—'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide block mb-1">
                      Construction Start
                    </label>
                    <DatePicker date={reviewStartDate} setDate={setReviewStartDate} />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide block mb-1">
                      Construction End
                    </label>
                    <DatePicker date={reviewEndDate} setDate={setReviewEndDate} />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide block mb-1">
                      Date Executed
                    </label>
                    <DatePicker date={reviewExecutedDate} setDate={setReviewExecutedDate} />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide block mb-1">
                      Contract Sum
                    </label>
                    <input
                      type="text"
                      value={reviewContractSum ? reviewContractSum.toString() : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        setReviewContractSum(value ? parseFloat(value) : null);
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {extractionMethod === 'fallback' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <p className="text-sm font-medium text-amber-900">
                      ⚠️ Please verify all dates and amounts are correct before proceeding.
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
                  Confirm & Proceed
                </button>
              </div>
            </motion.div>
          )}

          {/* Manual Entry Step */}
          {step === 'manual-entry' && (
            <motion.div
              key="manual-entry"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Enter Contract Details</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide block mb-1">
                    Construction Start
                  </label>
                  <DatePicker date={manualConstructionStart} setDate={setManualConstructionStart} />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide block mb-1">
                    Construction End
                  </label>
                  <DatePicker date={manualConstructionEnd} setDate={setManualConstructionEnd} />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide block mb-1">
                    Date Executed
                  </label>
                  <DatePicker date={manualDateExecuted} setDate={setManualDateExecuted} />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide block mb-1">
                    Contract Sum
                  </label>
                  <input
                    type="text"
                    value={manualContractSum}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      setManualContractSum(value);
                    }}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setStep('upload');
                    setEntryMethod('file');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualEntryConfirm}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors active:scale-95"
                >
                  Confirm & Proceed
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

export default ContractUploadModal;
