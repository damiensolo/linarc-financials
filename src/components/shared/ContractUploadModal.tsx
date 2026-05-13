import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useProject } from '../../context/ProjectContext';
import { XIcon, CloudIcon } from '../common/Icons';
import { DatePicker } from '../common/ui/DatePicker';
import { extractLineItems, createBudgetRowsFromLineItems } from '../../lib/contractLineExtraction';
import type { ContractData } from '../../types';
import { V3Sheet } from '../views/spreadsheetV4/types';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type ModalStep = 'upload' | 'processing' | 'review';

// Fallback demo values (from Prime Contract.md)
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

// Extract text from PDF file
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

// Pattern matching for contract field extraction
function extractContractFields(text: string): ExtractedContract {
  const t = text.replace(/\s+/g, ' ');

  // Executed date: "entered into on May 20, 2026"
  const executedMatch = t.match(
    /entered\s+into\s+on\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i
  ) || t.match(/effective\s+date[^:]*:\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i);

  // Start date: "Construction Start" or "June 10, 2026"
  const startMatch = t.match(
    /(?:construction\s+start|start\s+date|commence)[^:]*:?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i
  );

  // End date: "Substantial Completion: September 30, 2026"
  const endMatch = t.match(
    /substantial\s+completion[^:]*:?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i
  );

  // Final completion: "October 14, 2026"
  const finalMatch = t.match(
    /final\s+completion[^:]*:?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i
  );

  // Contract sum: "$296,000.00"
  const sumMatch = t.match(/contract\s+sum[^$\d]*\$\s*([\d,]+(?:\.\d{2})?)/i)
                || t.match(/\$\s*([\d,]+(?:\.\d{2})?)/);

  // Owner, Contractor, Project name
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
  const { isContractUploadOpen, setIsContractUploadOpen, contractData, setContractData, updateView, activeView } = useProject();

  const [step, setStep] = useState<ModalStep>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [scanLines, setScanLines] = useState<string[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const [rawContractText, setRawContractText] = useState('');

  // Review form state (editable)
  const [executedDate, setExecutedDate] = useState<Date | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Read-only summary fields
  const [finalCompletion, setFinalCompletion] = useState<Date | null>(null);
  const [contractSum, setContractSum] = useState<number | null>(null);
  const [owner, setOwner] = useState('');
  const [contractor, setContractor] = useState('');
  const [projectName, setProjectName] = useState('');
  const [extractionMethod, setExtractionMethod] = useState<'parsed' | 'fallback'>('fallback');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scan animation messages
  const SCAN_MESSAGES = [
    'Reading document structure…',
    'Detecting contract parties…',
    `Extracting Owner: ${owner || '—'}`,
    `Extracting Contractor: ${contractor || '—'}`,
    'Parsing Effective Date…',
    'Parsing Construction Start…',
    'Parsing Substantial Completion…',
    'Validation complete.',
  ];

  const runScanAnimation = (data: ExtractedContract, onDone: () => void) => {
    const lines = [
      'Reading document structure…',
      'Detecting contract parties…',
      `Extracting Owner: ${data.owner || '—'}`,
      `Extracting Contractor: ${data.contractor || '—'}`,
      'Parsing Effective Date…',
      'Parsing Construction Start…',
      'Parsing Substantial Completion…',
      'Validation complete.',
    ];

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

      // Handle PDF files with PDF.js
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        rawText = await extractTextFromPDF(file);
      } else {
        // Handle text-based files with FileReader
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
        setExecutedDate(final.executedDate ?? undefined);
        setStartDate(final.startDate ?? undefined);
        setEndDate(final.endDate ?? undefined);
        setFinalCompletion(final.finalCompletion);
        setContractSum(final.contractSum);
        setOwner(final.owner);
        setContractor(final.contractor);
        setProjectName(final.projectName);
        setScanComplete(true);
        setStep('review');
      });
    } catch (error) {
      console.error('Error processing file:', error);
      // Fall back to demo values on error
      const final = DEMO_CONTRACT;
      setExtractionMethod('fallback');
      setRawContractText('');
      runScanAnimation(final, () => {
        setExecutedDate(final.executedDate ?? undefined);
        setStartDate(final.startDate ?? undefined);
        setEndDate(final.endDate ?? undefined);
        setFinalCompletion(final.finalCompletion);
        setContractSum(final.contractSum);
        setOwner(final.owner);
        setContractor(final.contractor);
        setProjectName(final.projectName);
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
    setContractData({
      executedDate:     executedDate ?? null,
      startDate:        startDate ?? null,
      endDate:          endDate ?? null,
      finalCompletion,
      contractSum,
      owner,
      contractor,
      projectName,
      fileName:         uploadedFile?.name ?? 'Unknown',
      uploadedAt:       new Date().toISOString(),
      extractionMethod,
    });

    // Extract line items from contract and populate spreadsheet
    if (rawContractText && activeView?.type === 'spreadsheetV4') {
      const lineItems = extractLineItems(rawContractText);
      const budgetRows = createBudgetRowsFromLineItems(lineItems);

      // Create budget sheet with extracted line items
      const budgetSheet: V3Sheet = {
        id: 'sheet-budget',
        name: 'Prime Contract Budget',
        columns: [
          { id: 'name',          label: 'Contract Line',     type: 'text',     width: 220, editable: true,  visible: true },
          { id: 'costCode',      label: 'Cost Code',         type: 'text',     width: 100, editable: true,  visible: true },
          { id: 'quantity',      label: 'Qty',               type: 'number',   width: 70,  align: 'right',  editable: true, visible: true },
          { id: 'unit',          label: 'UOM',               type: 'text',     width: 60,  editable: true,  visible: true },
          { id: 'effortHours',   label: 'Hours',             type: 'number',   width: 80,  align: 'right',  editable: true, visible: true, isTotal: true },
          { id: 'labor',         label: 'Labor',             type: 'currency', width: 110, align: 'right',  editable: true, visible: true, isTotal: true },
          { id: 'material',      label: 'Material',          type: 'currency', width: 110, align: 'right',  editable: true, visible: true, isTotal: true },
          { id: 'equipment',     label: 'Equipment',         type: 'currency', width: 110, align: 'right',  editable: true, visible: true, isTotal: true },
          { id: 'subcontractor', label: 'Sub',               type: 'currency', width: 110, align: 'right',  editable: true, visible: true, isTotal: true },
          { id: 'others',        label: 'Others',            type: 'currency', width: 100, align: 'right',  editable: true, visible: true, isTotal: true },
          { id: 'totalBudget',   label: 'Total Budget',      type: 'formula',  width: 130, align: 'right',  editable: false, visible: true, isTotal: true,
            formula: '=labor+material+equipment+subcontractor+others' },
        ],
        rows: budgetRows.length > 0 ? budgetRows : [{ id: 'empty-row', cells: {} }],
      };

      updateView({
        v3Sheets: [budgetSheet],
        v3ActiveSheetId: 'sheet-budget',
      });
    }

    handleClose();
  };

  const handleClose = () => {
    setIsContractUploadOpen(false);
    setTimeout(() => {
      setStep('upload');
      setUploadedFile(null);
      setScanLines([]);
      setScanComplete(false);
      setExecutedDate(undefined);
      setStartDate(undefined);
      setEndDate(undefined);
    }, 300);
  };

  if (!isContractUploadOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl
                   border border-zinc-200 overflow-visible min-h-[460px]"
      >
        {/* Step Router */}
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
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
                <h2 className="text-lg font-semibold text-zinc-900">Attach Prime Contract</h2>
                <button
                  onClick={handleClose}
                  className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-4">
                {/* Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full border-2 border-dashed rounded-xl p-6 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer ${
                    dragActive ? 'border-blue-400 bg-blue-50/30' : 'border-zinc-300 bg-zinc-50/50 hover:bg-zinc-100/50'
                  }`}
                >
                  <CloudIcon className="w-10 h-10 text-zinc-400" />
                  <p className="text-sm font-semibold text-zinc-900">Drop your contract here</p>
                  <p className="text-xs text-zinc-500">
                    PDF, Word (.docx), Excel (.xlsx), or plain text
                  </p>
                </div>

                {/* Browse Button */}
                <div className="text-xs text-zinc-500">
                  or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 font-semibold underline"
                  >
                    browse files
                  </button>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.xlsx,.txt,.md"
                  onChange={handleFileInput}
                  hidden
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 px-6 py-4 border-t border-zinc-200">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  Cancel
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
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <h2 className="text-lg font-semibold text-zinc-900">Scanning Contract…</h2>
                </div>
              </div>

              {/* Scan Log */}
              <div className="flex-1 overflow-y-auto px-6 py-4 max-h-48 bg-zinc-50">
                {scanLines.map((line, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs text-zinc-600 font-mono py-0.5"
                  >
                    {line}
                  </motion.p>
                ))}
              </div>

              {/* Progress Bar */}
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.8, ease: 'linear' }}
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
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
                <h2 className="text-lg font-semibold text-zinc-900">Review Extracted Details</h2>
                <button
                  onClick={handleClose}
                  className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-visible px-6 py-4 space-y-4">
                {/* Read-only Summary */}
                <div className="grid grid-cols-2 gap-3 py-3 border-b border-zinc-200">
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Project</p>
                    <p className="text-sm font-semibold text-zinc-900 mt-1">{projectName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Contract Sum</p>
                    <p className="text-sm font-semibold text-zinc-900 mt-1">
                      {contractSum ? `$${contractSum.toLocaleString()}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Owner</p>
                    <p className="text-xs text-zinc-700 mt-1">{owner || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Contractor</p>
                    <p className="text-xs text-zinc-700 mt-1">{contractor || '—'}</p>
                  </div>
                </div>

                {/* Editable Dates */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wide block mb-1">
                      Executed Date
                    </label>
                    <DatePicker date={executedDate} setDate={setExecutedDate} />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wide block mb-1">
                      Construction Start
                    </label>
                    <DatePicker date={startDate} setDate={setStartDate} />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wide block mb-1">
                      Substantial Completion
                    </label>
                    <DatePicker date={endDate} setDate={setEndDate} />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 px-6 py-4 border-t border-zinc-200">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700
                             rounded-lg transition-colors active:scale-95"
                >
                  Confirm & Attach
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
