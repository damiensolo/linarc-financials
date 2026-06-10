import React from 'react';
import { Check, ChevronRight, AlertCircle } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import WorkflowMessageBanner, { getWorkflowMessage } from './WorkflowMessageBanner';

const PublishSOVStep: React.FC = () => {
  const {
    publishReadiness,
    canPublishSOV,
    publishSOV,
    navigateToSetupStep,
    financialSetupStep,
    primeContractState,
    hasPcValue,
    canAccessOperations,
    committedLineCount,
    lineCounts,
    financialConfig,
    setPrimeContractSetupPhase,
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

  return (
    <div className="max-w-lg w-full">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Publish SOV</h2>
      <p className="text-gray-600 mb-4">
        Finalize the owner-facing Schedule of Values and activate financial operations.
      </p>

      <WorkflowMessageBanner message={message} variant={canPublishSOV ? 'success' : 'warning'} />

      <div className="space-y-2 mb-6">
        {publishReadiness.map((check) => (
          <button
            key={check.id}
            type="button"
            disabled={check.met}
            onClick={() => {
              if (!check.actionStep) return;
              if (check.id === 'prime-contract-locked') {
                setPrimeContractSetupPhase('review');
              }
              navigateToSetupStep(check.actionStep, check.actionTab);
            }}
            className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
              check.met
                ? 'bg-green-50 border-green-200'
                : 'bg-amber-50 border-amber-200 hover:bg-amber-100 cursor-pointer'
            }`}
          >
            {check.met ? (
              <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            )}
            <span className={`text-sm ${check.met ? 'text-green-900' : 'text-amber-900'}`}>
              {check.label}
            </span>
            {!check.met && check.actionStep === 1 && (
              <span className="block text-xs text-amber-700 mt-1">
                Opens Step 1 — lock Prime Contract as baseline
              </span>
            )}
            {!check.met && check.actionStep === 2 && (
              <span className="block text-xs text-amber-700 mt-1">
                Opens Step 2 — commit or lock all budget lines
              </span>
            )}
            {!check.met && check.actionStep === 3 && (
              <span className="block text-xs text-amber-700 mt-1">
                Opens Step 3 — Schedule Linking & Allocation
              </span>
            )}
            {!check.met && check.actionStep === 4 && (
              <span className="block text-xs text-amber-700 mt-1">
                Opens Step 4 — Schedule of Values
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => publishSOV()}
        disabled={!canPublishSOV}
        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        Publish SOV
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default PublishSOVStep;
