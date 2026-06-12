import React, { useMemo, useState } from 'react';
import { ChevronRight, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import {
  countOpenRowsMissingCostCode,
  countOpenRowsMissingTrade,
  canCommitBudgetLine,
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
    sovLineCount,
    lineCounts,
    budgetRows,
    bulkLockOpenLines,
    bulkCommitLines,
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

  const openLinesMissingTrade = useMemo(
    () => countOpenRowsMissingTrade(budgetRows),
    [budgetRows]
  );

  const committableCount = useMemo(
    () => budgetRows.filter(canCommitBudgetLine).length,
    [budgetRows]
  );

  const canLockBudget =
    lineCounts.open > 0 && openLinesMissingCostCode === 0 && openLinesMissingTrade === 0;

  const commitAllTooltip =
    committableCount === 0
      ? 'No lines are ready to commit — each needs a cost code, trade, and subcontractor.'
      : `Commit all ${committableCount} line${committableCount === 1 ? '' : 's'} that have a cost code, trade, and subcontractor.`;

  const lockBudgetTooltip = useMemo(() => {
    if (lineCounts.open === 0) {
      return 'All budget lines are already locked into the SOV — there is nothing left to lock.';
    }
    if (openLinesMissingCostCode > 0) {
      const lineWord = lineCounts.open === 1 ? 'line' : 'lines';
      const missingWord = openLinesMissingCostCode === 1 ? 'line is' : 'lines are';
      return `Every open line needs a cost code before you can lock all. ${openLinesMissingCostCode} of ${lineCounts.open} open ${lineWord} ${missingWord} still missing one.`;
    }
    if (openLinesMissingTrade > 0) {
      const lineWord = lineCounts.open === 1 ? 'line' : 'lines';
      const missingWord = openLinesMissingTrade === 1 ? 'line is' : 'lines are';
      return `Every open line needs a trade before you can lock all. ${openLinesMissingTrade} of ${lineCounts.open} open ${lineWord} ${missingWord} still missing one.`;
    }
    return `Lock all ${lineCounts.open} remaining open ${lineCounts.open === 1 ? 'line' : 'lines'} into the SOV & schedule at once.`;
  }, [lineCounts.open, openLinesMissingCostCode, openLinesMissingTrade]);

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
    if (openLinesMissingTrade > 0) {
      setMissingCostCodeContext({
        fieldLabel: 'Trade',
        missingCount: openLinesMissingTrade,
        openLineCount: lineCounts.open,
      });
      setMissingCostCodeOpen(true);
      return;
    }
    setLockBudgetOpen(true);
  };

  if (showBudgetActions) {
    const canContinueToOps = sovLineCount > 0;

    return (
      <>
        <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <p className="text-sm text-gray-600 truncate min-w-0">
            {canContinueToOps ? (
              <>
                <span className="font-medium text-gray-900">
                  {sovLineCount} of {lineCounts.total} lines locked into the SOV
                </span>
                {committedLineCount > 0 && ` (${committedLineCount} committed)`}
                {' — '}
                Review the Schedule of Values next. Lock remaining open lines when ready.
              </>
            ) : (
              'Lock at least one budget line (cost code + trade) to continue to the Schedule of Values.'
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
                      <Lock size={16} /> Lock All
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
                      onClick={bulkCommitLines}
                      disabled={committableCount === 0}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 size={16} /> Commit All
                    </button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">{commitAllTooltip}</TooltipContent>
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
                      Continue to Schedule of Values
                      <ChevronRight size={16} />
                    </button>
                  </span>
                </TooltipTrigger>
                {!canContinueToOps && (
                  <TooltipContent side="bottom">
                    Lock at least one budget line to open continuous operations.
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
          actionVerb="lock"
          onClose={() => setMissingCostCodeOpen(false)}
        />

        <LockBudgetModal
          open={lockBudgetOpen}
          openLineCount={lineCounts.open}
          alreadyLockedCount={lineCounts.locked + lineCounts.committed + lineCounts.pending}
          onConfirm={() => {
            bulkLockOpenLines();
            setLockBudgetOpen(false);
          }}
          onCancel={() => setLockBudgetOpen(false)}
        />
      </>
    );
  }

  if (financialSetupStep === 3 || financialSetupStep === 4) {
    const isSov = financialSetupStep === 3;
    return (
      <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <p className="text-sm text-gray-600 truncate min-w-0">
          <span className="text-base font-semibold text-gray-900">
            {isSov ? 'Schedule of Values' : 'Schedule Linking & Allocation'}
          </span>
          {' — '}
          {isSov
            ? 'Review the draft Schedule of Values — you can publish it any time.'
            : 'Allocate locked lines across the schedule for the cost-loaded forecast.'}
        </p>
        <button
          type="button"
          onClick={() => setFinancialSetupStep(isSov ? 4 : 5)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex-shrink-0"
        >
          {isSov ? 'Continue to Schedule Linking & Allocation' : 'Continue to Publish SOV'}
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
        hasCommittedBudgetLines={sovLineCount > 0}
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
