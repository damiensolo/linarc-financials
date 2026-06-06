import React from 'react';
import { useProject } from '../../../context/ProjectContext';
import FinancialConfigStep from './FinancialConfigStep';
import ContractReviewLockScreen from './ContractReviewLockScreen';
import PrimeContractChoiceStep from './PrimeContractChoiceStep';
import BudgetChoiceStep from './BudgetChoiceStep';
import BudgetSetupGrid from './BudgetSetupGrid';
import { isBudgetSheetEmpty } from '../../../lib/financialWorkflow';
import SOVMappingGrid from './SOVMappingGrid';
import BudgetScheduleLinker from './BudgetScheduleLinker';
import PublishSOVStep from './PublishSOVStep';
import FinancialOpsHub from './FinancialOpsHub';
import WorkflowMessageBanner, { getWorkflowMessage } from './WorkflowMessageBanner';

const StepDetailCard: React.FC = () => {
  const {
    financialSetupStep,
    contractData,
    hasPcValue,
    canAccessBudget,
    canAccessOperations,
    activationState,
    primeContractState,
    primeContractSetupPhase,
    budgetSetupPhase,
    budgetRows,
    committedLineCount,
    lineCounts,
    financialConfig,
    canPublishSOV,
    publishReadiness,
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

  // Step 3 shows a choice screen (Upload | Manual) until a budget exists, then
  // the full-height grid. Mirrors the Prime Contract choose → review phasing.
  const budgetShowsGrid =
    canAccessBudget && (budgetSetupPhase === 'grid' || !isBudgetSheetEmpty(budgetRows));

  if (activationState === 'activated' && financialSetupStep === 6) {
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
        if (!budgetShowsGrid) {
          return <BudgetChoiceStep />;
        }
        return (
          <div className="w-full h-full flex flex-col min-h-0">
            <BudgetSetupGrid workflowMessage={message} />
          </div>
        );

      case 4:
        if (!canAccessOperations) {
          return (
            <div className="max-w-md text-center text-gray-600">
              Commit at least one budget line in Step 3 to link and allocate the schedule.
            </div>
          );
        }
        return (
          <div className="w-full h-full flex flex-col min-h-0">
            <div className="flex-1 min-h-0">
              <BudgetScheduleLinker />
            </div>
          </div>
        );

      case 5:
        if (!canAccessOperations) {
          return (
            <div className="max-w-md text-center text-gray-600">
              Commit at least one budget line in Step 3 to build the Schedule of Values.
            </div>
          );
        }
        return (
          <div className="w-full h-full flex flex-col min-h-0">
            <div className="flex-1 min-h-0">
              <SOVMappingGrid />
            </div>
          </div>
        );

      case 6:
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

  // Full-height table steps (Prime Contract review, Budget grid, SOV, Schedule
  // linking) render inside the same bordered/padded card as the core tables.
  const fillHeightStep =
    (financialSetupStep === 3 && budgetShowsGrid) ||
    financialSetupStep === 4 ||
    financialSetupStep === 5 ||
    (financialSetupStep === 2 && primeContractSetupPhase === 'review');

  return (
    <div className="w-full h-full min-h-0 flex flex-col">
      <div
        className={`flex-1 min-h-0 flex flex-col overflow-hidden p-4 ${
          fillHeightStep ? 'items-stretch' : 'items-center justify-center'
        }`}
      >
        {fillHeightStep ? (
          <div className="flex flex-col flex-1 min-h-0 w-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {renderStepContent()}
          </div>
        ) : (
          renderStepContent()
        )}
      </div>
    </div>
  );
};

export default StepDetailCard;
