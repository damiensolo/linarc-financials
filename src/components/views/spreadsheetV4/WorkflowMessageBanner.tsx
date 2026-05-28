import React from 'react';
import { Info } from 'lucide-react';

interface WorkflowMessageBannerProps {
  message: string;
  variant?: 'info' | 'success' | 'warning';
}

const variantStyles = {
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  success: 'bg-green-50 border-green-200 text-green-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
};

const WorkflowMessageBanner: React.FC<WorkflowMessageBannerProps> = ({
  message,
  variant = 'info',
}) => {
  if (!message) return null;

  return (
    <div className={`flex items-start gap-2 p-3 rounded-md border text-sm mb-4 ${variantStyles[variant]}`}>
      <Info size={16} className="mt-0.5 flex-shrink-0" />
      <p>{message}</p>
    </div>
  );
};

export function getWorkflowMessage(context: {
  step: number;
  primeContractState: string;
  hasPcValue: boolean;
  hasCommittedLines: boolean;
  committedCount: number;
  totalLines: number;
  openCount: number;
  perLineApprovalEnabled: boolean;
  canPublish: boolean;
  publishRemaining: number;
}): string {
  const {
    step,
    primeContractState,
    hasPcValue,
    hasCommittedLines,
    committedCount,
    totalLines,
    openCount,
    perLineApprovalEnabled,
    canPublish,
    publishRemaining,
  } = context;

  if (step === 2 && primeContractState === 'open' && !hasPcValue) {
    return 'Enter your Prime Contract details below — at minimum the Contract Sum, project name, owner, and contractor.';
  }
  if (step === 2 && primeContractState === 'open') {
    return 'Prime Contract is in open. Budget setup is now available. You can refine the contract or lock it as your baseline at any time.';
  }
  if (step === 2 && primeContractState === 'locked' && !hasCommittedLines) {
    return 'Prime Contract locked as baseline. Changes can still be made by re-opening for edit.';
  }
  if (step === 2 && primeContractState === 'locked' && hasCommittedLines) {
    return 'Prime Contract locked as baseline. Changes will require a Change Order.';
  }
  if (step === 3 && totalLines === 0) {
    return 'Budget is in open. Add line items manually or import from Excel to get started.';
  }
  if (step === 3 && committedCount > 0 && openCount > 0) {
    return `${committedCount} of ${totalLines} lines committed. Committed lines are now live for subcontracts, SOV, invoicing, and schedule linking. Open lines are still editable.`;
  }
  if (step === 3 && perLineApprovalEnabled) {
    return 'Per-line approval is on for this project. Each commit will be routed to your approval chain before it locks.';
  }
  if (step === 4 && hasCommittedLines) {
    return `Showing ${committedCount} committed lines available for SOV mapping and schedule linking. Open lines will appear here when committed.`;
  }
  if (step === 5 && !canPublish) {
    return `Publish SOV is not yet available. ${publishRemaining} checks remaining — click any item below to resolve.`;
  }
  if (step === 5 && canPublish) {
    return 'All readiness checks passed. Publishing the SOV will finalize the owner-facing billing schedule and activate the project.';
  }
  return '';
}

export default WorkflowMessageBanner;
