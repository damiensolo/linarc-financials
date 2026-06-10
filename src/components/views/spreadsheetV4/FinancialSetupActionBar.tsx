import React, { useMemo, useState } from 'react';
import { ChevronRight, Lock, ArrowLeft } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import {
  countOpenRowsMissingCostCode,
  countOpenRowsMissingSubcontractor,
  hasUploadedContractDocument,
} from '../../../lib/financialWorkflow';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../common/ui/Tooltip';
import LockPrimeContractModal from './LockPrimeContractModal';
import LockBudgetModal from './LockBudgetModal';
import MissingCostCodeModal from './MissingCostCodeModal';

/** Top action bar for the financial setup hub (step-specific primary actions). */
const FinancialSetupActionBar: React.FC = () => {
  const [showLockPrimeModal, setShowLockPrimeModal] = useState(false);
  const [lockBudgetOpen, setLockBudgetOpen] = useState(false);
  const [missingCostCodeOpen, setMissingCostCodeOpen] = useState(false);
  const [missingCostCodeContext, setMissingCostCodeContext] = useState<{
    fieldLabel?: string;
    missingCount: number;
    openLineCount?: number;
  }>({ missingCount: 1 });

  const {
    financialSetupStep,
    setFinancialSetupStep,
    contractData,
    setContractLocked,
    contractLocked,
    hasPcValue,
    primeContractSetupPhase,
    setPrimeContractSetupPhase,
    committedLineCount,
    lineCounts,
    budgetRows,
    bulkCommitOpenLines,
    financialConfig,
    navigateToSetupStep,
    setIsContractUploadOpen,
  } = useProject();

  const showContractActions =
    financialSetupStep === 1 && primeContractSetupPhase === 'review' && contractData;
  const showBudgetActions = financialSetupStep === 2;

  const openLinesMissingCostCode = useMemo(
    () => countOpenRowsMissingCostCode(budgetRows),
    [budgetRows]
  );

  const openLinesMissingSubcontractor = useMemo(
    () => countOpenRowsMissingSubcontractor(budgetRows),
    [budgetRows]
  );

  const canLockBudget =
    lineCounts.open > 0 && openLinesMissingCostCode === 0 && openLinesMissingSubcontractor === 0;

  const lockBudgetTooltip = useMemo(() => {
    if (lineCounts.open === 0) {
      return 'All budget lines are already committed — there is nothing left to lock.';
    }
    if (openLinesMissingCostCode > 0) {
      const lineWord = lineCounts.open === 1 ? 'line' : 'lines';
      const missingWord = openLinesMissingCostCode === 1 ? 'line is' : 'lines are';
      return `Every open line needs a cost code before you can lock the budget. ${openLinesMissingCostCode} of ${lineCounts.open} open ${lineWord} ${missingWord} still missing one.`;
    }
    if (openLinesMissingSubcontractor > 0) {
      const lineWord = lineCounts.open === 1 ? 'line' : 'lines';
      const missingWord = openLinesMissingSubcontractor === 1 ? 'line is' : 'lines are';
      return `Every open line needs a subcontractor before you can lock the budget. ${openLinesMissingSubcontractor} of ${lineCounts.open} open ${lineWord} ${missingWord} still missing one.`;
    }
    return `Commit all ${lineCounts.open} remaining open ${lineCounts.open === 1 ? 'line' : 'lines'} at once.`;
  }, [lineCounts.open, openLinesMissingCostCode, openLinesMissingSubcontractor]);

  const handleRequestLockBudget = () => {
    if (openLinesMissingCostCode > 0) {
      setMissingCostCodeContext({
        fieldLabel: 'Cost Code',
        missingCount: openLinesMissingCostCode,
        openLineCount: lineCounts.open,
      });
      setMissingCostCodeOpen(true);
      return;
    }
    if (openLinesMissingSubcontractor > 0) {
      setMissingCostCodeContext({
        fieldLabel: 'Subcontractor',
        missingCount: openLinesMissingSubcontractor,
        openLineCount: lineCounts.open,
      });
      setMissingCostCodeOpen(true);
      return;
    }
    setLockBudgetOpen(true);
  };

  if (showBudgetActions) {
    const canContinueToOps = committedLineCount > 0;

    return (
      <>
        <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <p className="text-sm text-gray-600 truncate min-w-0">
            {canContinueToOps ? (
              <>
                <span className="font-medium text-gray-900">
                  {committedLineCount} of {lineCounts.total} lines committed
                </span>
                {' — '}
                Link and allocate the schedule next. Lock remaining open lines when ready.
              </>
            ) : (
              'Commit at least one budget line to continue to Schedule Linking & Allocation.'
            )}
          </p>
          <div className="flex items-center gap-3 flex-shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <button
                      type="button"
                      onClick={handleRequestLockBudget}
                      disabled={!canLockBudget}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Lock size={16} /> Lock Budget
                    </button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">{lockBudgetTooltip}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <button
                      type="button"
                      onClick={() => navigateToSetupStep(3)}
                      disabled={!canContinueToOps}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Continue to Schedule Linking & Allocation
                      <ChevronRight size={16} />
                    </button>
                  </span>
                </TooltipTrigger>
                {!canContinueToOps && (
                  <TooltipContent side="bottom">
                    Commit at least one budget line to open continuous operations.
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <MissingCostCodeModal
          open={missingCostCodeOpen}
          fieldLabel={missingCostCodeContext.fieldLabel}
          missingCount={missingCostCodeContext.missingCount}
          openLineCount={missingCostCodeContext.openLineCount}
          onClose={() => setMissingCostCodeOpen(false)}
        />

        <LockBudgetModal
          open={lockBudgetOpen}
          openLineCount={lineCounts.open}
          committedLineCount={lineCounts.locked}
          perLineApprovalEnabled={financialConfig?.perLineApprovalEnabled ?? false}
          onConfirm={() => {
            bulkCommitOpenLines();
            setLockBudgetOpen(false);
          }}
          onCancel={() => setLockBudgetOpen(false)}
        />
      </>
    );
  }

  if (financialSetupStep === 3 || financialSetupStep === 4) {
    const isSov = financialSetupStep === 4;
    return (
      <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <p className="text-sm text-gray-600 truncate min-w-0">
          <span className="text-base font-semibold text-gray-900">
            {isSov ? 'Schedule of Values' : 'Schedule Linking & Allocation'}
          </span>
          {' — '}
          {isSov
            ? 'Review the draft Schedule of Values, then publish.'
            : 'Allocate committed lines across the schedule, then review the SOV.'}
        </p>
        <button
          type="button"
          onClick={() => setFinancialSetupStep(isSov ? 5 : 4)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex-shrink-0"
        >
          {isSov ? 'Continue to Publish SOV' : 'Continue to Schedule of Values'}
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  if (!showContractActions) return null;

  const hasUploadedDocument = hasUploadedContractDocument(contractData);

  const handleContractFileAction = () => {
    setContractLocked(false);
    setIsContractUploadOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={() => setPrimeContractSetupPhase('choose')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 flex-shrink-0"
          >
            <ArrowLeft size={16} />
            Back to entry options
          </button>
          {contractLocked && (
            <p className="text-sm text-green-700 font-medium truncate hidden md:block">
              Contract locked as baseline. Budget setup is available.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <TooltipProvider>
            {!contractLocked && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleContractFileAction}
                      className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-white"
                    >
                      {hasUploadedDocument ? 'Replace Contract' : 'Upload Contract'}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {hasUploadedDocument
                      ? 'Upload a new file to replace the attached contract and refresh extracted details.'
                      : 'Upload a contract file (.pdf, .docx, .xlsx, .txt) to extract and pre-fill contract details.'}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <button
                        type="button"
                        onClick={() => setShowLockPrimeModal(true)}
                        disabled={!hasPcValue}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Lock size={16} /> Lock Prime Contract
                      </button>
                    </span>
                  </TooltipTrigger>
                  {!hasPcValue && (
                    <TooltipContent side="bottom">
                      Enter a Contract Sum before you can lock the Prime Contract as your baseline.
                    </TooltipContent>
                  )}
                </Tooltip>
              </>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <button
                    type="button"
                    onClick={() => setFinancialSetupStep(2)}
                    disabled={!hasPcValue}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Continue to Budget Setup
                    <ChevronRight size={16} />
                  </button>
                </span>
              </TooltipTrigger>
              {!hasPcValue && (
                <TooltipContent side="bottom">
                  Enter a contract sum to continue to budget setup.
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <LockPrimeContractModal
        open={showLockPrimeModal}
        hasCommittedBudgetLines={committedLineCount > 0}
        onConfirm={() => {
          setContractLocked(true);
          setShowLockPrimeModal(false);
        }}
        onCancel={() => setShowLockPrimeModal(false)}
      />
    </>
  );
};

export default FinancialSetupActionBar;
