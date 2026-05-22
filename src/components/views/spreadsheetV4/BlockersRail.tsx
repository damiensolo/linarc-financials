import React from 'react';
import { Check, AlertCircle, Lock } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';

interface Blocker {
  id: string;
  title: string;
  description: string;
  met: boolean;
}

const BlockersRail: React.FC = () => {
  const {
    financialSetupStep,
    financialConfig,
    contractData,
    budgetLocked,
  } = useProject();

  const getBlockers = (): Blocker[] => {
    const blockers: Blocker[] = [];

    if (financialSetupStep >= 0) {
      blockers.push({
        id: 'financial-config',
        title: 'Financial Configuration',
        description: 'Set default retainage, overhead, and billing parameters',
        met: !!financialConfig,
      });
    }

    if (financialSetupStep >= 1) {
      blockers.push({
        id: 'prime-contract',
        title: 'Prime Contract',
        description: 'Upload and lock your prime contract with terms and dates',
        met: !!contractData,
      });
    }

    if (financialSetupStep >= 2) {
      blockers.push({
        id: 'budget-setup',
        title: 'Budget Setup',
        description: 'Configure cost codes, allocations, and lock the budget',
        met: budgetLocked,
      });
    }

    if (financialSetupStep >= 3) {
      blockers.push({
        id: 'sov-review',
        title: 'Draft SOV Review',
        description: 'Review and validate Schedule of Values entries',
        met: false, // Placeholder for now
      });

      blockers.push({
        id: 'schedule-linking',
        title: 'Schedule Linking',
        description: 'Link budget items to WBS tasks in the schedule',
        met: false, // Placeholder for now
      });
    }

    if (financialSetupStep >= 5) {
      blockers.push({
        id: 'sov-publish',
        title: 'SOV Published',
        description: 'Schedule of Values locked and published',
        met: true,
      });
    }

    return blockers;
  };

  const blockers = getBlockers();
  const metCount = blockers.filter((b) => b.met).length;
  const totalCount = blockers.length;
  const progress = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Readiness</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-600">
            {metCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Blockers List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {blockers.length === 0 ? (
          <p className="text-sm text-gray-500">No requirements yet</p>
        ) : (
          blockers.map((blocker) => (
            <div
              key={blocker.id}
              className={`p-3 rounded-lg border ${
                blocker.met
                  ? 'bg-green-50 border-green-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {blocker.met ? (
                  <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      blocker.met ? 'text-green-900' : 'text-amber-900'
                    }`}
                  >
                    {blocker.title}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      blocker.met ? 'text-green-700' : 'text-amber-700'
                    }`}
                  >
                    {blocker.description}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <p className="text-xs text-gray-600">
          {financialSetupStep === 5
            ? '✨ Setup complete!'
            : `Step ${financialSetupStep} of 5`}
        </p>
      </div>
    </div>
  );
};

export default BlockersRail;
