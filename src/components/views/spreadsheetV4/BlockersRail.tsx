import React, { useMemo } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { computeSetupMilestoneReadiness } from '../../../lib/financialGating';
import ApprovalQueuePanel from './ApprovalQueuePanel';

const BlockersRail: React.FC = () => {
  const {
    financialSetupStep,
    financialConfig,
    contractData,
    contractLocked,
    primeContractSetupPhase,
    lineCounts,
    committedLineCount,
    canAccessOperations,
    publishReadiness,
    approvalQueue,
    navigateToSetupStep,
    activationState,
  } = useProject();

  const pendingCount = approvalQueue.filter((a) => a.status === 'pending').length;

  const milestones = useMemo(
    () =>
      computeSetupMilestoneReadiness(
        financialSetupStep,
        financialConfig,
        contractData,
        contractLocked,
        primeContractSetupPhase,
        committedLineCount,
        canAccessOperations
      ),
    [
      financialSetupStep,
      financialConfig,
      contractData,
      contractLocked,
      primeContractSetupPhase,
      committedLineCount,
      canAccessOperations,
    ]
  );

  const publishChecks =
    financialSetupStep >= 4 || activationState === 'activated' ? publishReadiness : [];

  const blockers = [
    {
      id: 'config',
      title: 'Financial Configuration',
      description: 'Set retainage, overhead, billing, and approval settings',
      met: milestones.financialConfigMet,
      step: 1 as const,
    },
    {
      id: 'pc-value',
      title: 'Prime Contract Value',
      description: 'Enter contract sum via upload or manual entry',
      met: milestones.primeContractValueMet,
      step: 2 as const,
    },
    {
      id: 'budget-lines',
      title: 'Budget Lines',
      description: `${committedLineCount} of ${lineCounts.total} lines committed`,
      met: milestones.budgetLinesMet,
      step: 3 as const,
    },
    {
      id: 'ops',
      title: 'Continuous Operations',
      description: 'SOV mapping and schedule linking for committed lines',
      met: milestones.continuousOpsMet,
      step: 4 as const,
    },
    ...publishChecks.map((check) => ({
      id: check.id,
      title: check.label,
      description: check.met
        ? 'Complete'
        : check.id === 'wbs-linked'
          ? 'Step 4 → Schedule Linking tab, then Link all or link each line'
          : check.id === 'sov-mapped'
            ? 'Step 4 → SOV Mapping tab, then Map all or map each line'
            : 'Action required',
      met: check.met,
      step: check.actionStep,
      tab: check.actionTab,
    })),
  ];

  const metCount = blockers.filter((b) => b.met).length;
  const progress = blockers.length > 0 ? Math.round((metCount / blockers.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Readiness</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs font-medium text-gray-600">{metCount}/{blockers.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {blockers.map((blocker) => (
          <button
            key={blocker.id}
            type="button"
            disabled={blocker.met}
            onClick={() => {
              if ('step' in blocker && blocker.step) {
                navigateToSetupStep(blocker.step, 'tab' in blocker ? blocker.tab : undefined);
              }
            }}
            className={`w-full text-left p-3 rounded-lg border ${
              blocker.met ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <div className="flex items-start gap-2">
              {blocker.met ? (
                <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className={`text-sm font-medium ${blocker.met ? 'text-green-900' : 'text-amber-900'}`}>
                  {blocker.title}
                </p>
                <p className={`text-xs mt-1 ${blocker.met ? 'text-green-700' : 'text-amber-700'}`}>
                  {blocker.description}
                </p>
              </div>
            </div>
          </button>
        ))}

        {pendingCount > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
            {pendingCount} approval(s) pending — see panel below.
          </div>
        )}

        {financialSetupStep === 3 && lineCounts.open > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
            Subcontract issuance for open lines is blocked. Commit each line to enable downstream activities.
          </div>
        )}
      </div>

      <ApprovalQueuePanel />

      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <p className="text-xs text-gray-600">
          {activationState === 'activated'
            ? 'Project financially activated'
            : `Step ${financialSetupStep} of 5`}
        </p>
      </div>
    </div>
  );
};

export default BlockersRail;
