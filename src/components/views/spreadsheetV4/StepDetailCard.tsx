import React from 'react';
import { useProject } from '../../../context/ProjectContext';
import FinancialConfigStep from './FinancialConfigStep';
import ContractReviewLockScreen from './ContractReviewLockScreen';
import PrimeContractChoiceStep from './PrimeContractChoiceStep';
import BudgetSetupGrid from './BudgetSetupGrid';
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

  if (activationState === 'activated' && financialSetupStep === 6) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6">
        <FinancialOpsHub />
      </div>
    );
  }

  const ScreenHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <div className="px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
    </div>
  );

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
          <div className="w-full h-full flex flex-col min-h-0">
            <BudgetSetupGrid workflowMessage={message} />
          </div>
        );

      case 4:
        if (!canAccessOperations) {
          return (
            <div className="max-w-md text-center text-gray-600">
              Commit at least one budget line in Step 3 to build the Schedule of Values.
            </div>
          );
        }
        return (
          <div className="w-full h-full flex flex-col min-h-0">
            <ScreenHeader
              title="Schedule of Values (SOV)"
              subtitle="Draft SOV lines are created from each committed budget line. They stay in draft until you publish."
            />
            <div className="flex-1 min-h-0">
              <SOVMappingGrid />
            </div>
          </div>
        );

      case 5:
        if (!canAccessOperations) {
          return (
            <div className="max-w-md text-center text-gray-600">
              Commit at least one budget line in Step 3 to link and allocate the schedule.
            </div>
          );
        }
        return (
          <div className="w-full h-full flex flex-col min-h-0">
            <ScreenHeader
              title="Schedule Linking & Allocation"
              subtitle="Allocate each committed budget line across schedule tasks by cost code, then review the cost-loaded forecast."
            />
            <div className="flex-1 min-h-0">
              <BudgetScheduleLinker />
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

  const fillHeightStep =
    financialSetupStep === 3 ||
    financialSetupStep === 4 ||
    financialSetupStep === 5 ||
    (financialSetupStep === 2 && primeContractSetupPhase === 'review');

  const stepNoPadding =
    (financialSetupStep === 2 && primeContractSetupPhase === 'review') ||
    financialSetupStep === 3 ||
    financialSetupStep === 4 ||
    financialSetupStep === 5;

  return (
    <div className="w-full h-full min-h-0 flex flex-col">
      <div
        className={`flex-1 min-h-0 flex flex-col overflow-hidden ${
          stepNoPadding ? '' : 'p-4'
        } ${fillHeightStep ? 'items-stretch' : 'items-center justify-center'}`}
      >
        {renderStepContent()}
      </div>
    </div>
  );
};

export default StepDetailCard;
