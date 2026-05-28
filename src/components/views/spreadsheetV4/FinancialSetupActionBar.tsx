import React, { useState } from 'react';
import { ChevronRight, Lock, ArrowLeft } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { hasUploadedContractDocument } from '../../../lib/financialWorkflow';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../common/ui/Tooltip';
import LockPrimeContractModal from './LockPrimeContractModal';

/** Top action bar for the financial setup hub (step-specific primary actions). */
const FinancialSetupActionBar: React.FC = () => {
  const [showLockModal, setShowLockModal] = useState(false);
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
    setIsContractUploadOpen,
  } = useProject();

  const showContractActions =
    financialSetupStep === 2 && primeContractSetupPhase === 'review' && contractData;

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
                        onClick={() => setShowLockModal(true)}
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
                    onClick={() => setFinancialSetupStep(3)}
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
        open={showLockModal}
        hasCommittedBudgetLines={committedLineCount > 0}
        onConfirm={() => {
          setContractLocked(true);
          setShowLockModal(false);
        }}
        onCancel={() => setShowLockModal(false)}
      />
    </>
  );
};

export default FinancialSetupActionBar;
