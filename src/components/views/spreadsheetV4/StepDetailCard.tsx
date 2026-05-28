import React, { useState } from 'react';
import { ChevronRight, Lock, ArrowLeft } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import FinancialConfigStep from './FinancialConfigStep';
import ContractReviewLockScreen from './ContractReviewLockScreen';
import PrimeContractChoiceStep from './PrimeContractChoiceStep';
import BudgetSetupGrid from './BudgetSetupGrid';
import ContinuousOpsWorkspace from './ContinuousOpsWorkspace';
import PublishSOVStep from './PublishSOVStep';
import FinancialOpsHub from './FinancialOpsHub';
import WorkflowMessageBanner, { getWorkflowMessage } from './WorkflowMessageBanner';
import LockPrimeContractModal from './LockPrimeContractModal';

const StepDetailCard: React.FC = () => {
  const [showLockModal, setShowLockModal] = useState(false);
  const {
    financialSetupStep,
    setFinancialSetupStep,
    contractData,
    setContractLocked,
    contractLocked,
    hasPcValue,
    canAccessBudget,
    canAccessOperations,
    activationState,
    primeContractState,
    primeContractSetupPhase,
    setPrimeContractSetupPhase,
    committedLineCount,
    lineCounts,
    financialConfig,
    canPublishSOV,
    publishReadiness,
    setIsContractUploadOpen,
  } = useProject();

  const message = getWorkflowMessage({
    step: financialSetupStep,
    primeContractState,
    hasPcValue,
    hasCommittedLines: canAccessOperations,
    committedCount: committedLineCount,
    totalLines: lineCounts.total,
    openCount: lineCounts.open,
    perLineApprovalEnabled: financialConfig?.perLineApprovalEnabled ?? false,
    canPublish: canPublishSOV,
    publishRemaining: publishReadiness.filter((c) => !c.met).length,
  });

  if (activationState === 'activated' && financialSetupStep === 5) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6">
        <FinancialOpsHub />
      </div>
    );
  }

  const renderStepContent = () => {
    switch (financialSetupStep) {
      case 1:
        return <FinancialConfigStep />;

      case 2:
        if (primeContractSetupPhase === 'review' && contractData) {
          return (
            <div className="w-full h-full flex flex-col min-h-0">
              <ContractReviewLockScreen />
            </div>
          );
        }
        return <PrimeContractChoiceStep />;

      case 3:
        if (!canAccessBudget) {
          return (
            <div className="max-w-md text-center text-gray-600">
              Enter a Prime Contract Value in Step 2 to unlock budget setup.
            </div>
          );
        }
        return (
          <div className="w-full flex-1 min-h-0 flex flex-col">
            <div className="px-4 pt-4 flex-shrink-0">
              <WorkflowMessageBanner message={message} />
            </div>
            <div className="flex-1 min-h-0">
              <BudgetSetupGrid />
            </div>
          </div>
        );

      case 4:
        if (!canAccessOperations) {
          return (
            <div className="max-w-md text-center text-gray-600">
              Commit at least one budget line in Step 3 to access continuous operations.
            </div>
          );
        }
        return (
          <div className="w-full flex-1 min-h-0 flex flex-col">
            <div className="px-4 pt-4 flex-shrink-0">
              <WorkflowMessageBanner message={message} />
            </div>
            <div className="flex-1 min-h-0">
              <ContinuousOpsWorkspace />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-6">
            <WorkflowMessageBanner message={message} />
            <PublishSOVStep />
          </div>
        );

      default:
        return null;
    }
  };

  const showContractActions =
    financialSetupStep === 2 && primeContractSetupPhase === 'review' && contractData;

  const handleReplaceContract = () => {
    setContractLocked(false);
    setIsContractUploadOpen(true);
  };

  const fillHeightStep =
    financialSetupStep === 3 ||
    financialSetupStep === 4 ||
    (financialSetupStep === 2 && primeContractSetupPhase === 'review');

  const step2NoPadding = financialSetupStep === 2 && primeContractSetupPhase === 'review';

  return (
    <div className="w-full h-full min-h-0 flex flex-col">
      {showContractActions && (
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
            <p className="text-sm text-gray-600 truncate hidden md:block">
              {contractLocked ? (
                <span className="text-green-700 font-medium">Contract locked as baseline. Budget setup is available.</span>
              ) : (
                'Prime Contract is open. Refine line items or lock as baseline — budget setup is already available.'
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {!contractLocked && (
              <>
                <button
                  type="button"
                  onClick={handleReplaceContract}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-white"
                >
                  Replace Contract
                </button>
                <button
                  type="button"
                  onClick={() => setShowLockModal(true)}
                  disabled={!hasPcValue}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock size={16} /> Lock Prime Contract
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setFinancialSetupStep(3)}
              disabled={!hasPcValue}
              title={hasPcValue ? undefined : 'Enter a Contract Sum to continue to budget setup'}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Continue to Budget Setup
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
      <div
        className={`flex-1 min-h-0 flex flex-col overflow-hidden ${
          step2NoPadding ? '' : 'p-4'
        } ${fillHeightStep ? 'items-stretch' : 'items-center justify-center'}`}
      >
        {renderStepContent()}
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
    </div>
  );
};

export default StepDetailCard;
