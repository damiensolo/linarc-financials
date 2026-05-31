import React from 'react';
import { Check, AlertCircle, ChevronRight } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { FinancialSetupStep } from '../../../types';

const STEP_LABELS: Record<FinancialSetupStep, string> = {
  1: 'Preliminary Config',
  2: 'Prime Contract',
  3: 'Budget Setup',
  4: 'Schedule of Values',
  5: 'Schedule Linking & Allocation',
  6: 'Publish SOV',
};

const ALL_STEPS: FinancialSetupStep[] = [1, 2, 3, 4, 5, 6];

interface Blocker {
  id: string;
  title: string;
  description: string;
  met: boolean;
  step: FinancialSetupStep;
  tab?: 'sov' | 'schedule';
}

interface ReadinessSectionProps {
  selectedStep: FinancialSetupStep;
  onSelectStep: (step: FinancialSetupStep) => void;
  showAll: boolean;
  onToggleShowAll: (next: boolean) => void;
}

const ReadinessSection: React.FC<ReadinessSectionProps> = ({
  selectedStep,
  onSelectStep,
  showAll,
  onToggleShowAll,
}) => {
  const {
    financialSetupStep,
    financialConfig,
    hasPcValue,
    lineCounts,
    committedLineCount,
    publishReadiness,
    navigateToSetupStep,
  } = useProject();

  const blockers: Blocker[] = [
    {
      id: 'config',
      title: 'Financial Configuration',
      description: 'Set retainage, overhead, billing, and approval settings',
      met: !!financialConfig,
      step: 1,
    },
    {
      id: 'pc-value',
      title: 'Prime Contract Value',
      description: 'Enter contract sum via upload or manual entry',
      met: hasPcValue,
      step: 2,
    },
    {
      id: 'budget-lines',
      title: 'Budget Lines',
      description: `${committedLineCount} of ${lineCounts.total} lines committed`,
      met: committedLineCount > 0,
      step: 3,
    },
    ...publishReadiness.map<Blocker>((check) => ({
      id: check.id,
      title: check.label,
      description: check.met
        ? 'Complete'
        : check.id === 'wbs-linked'
          ? 'Step 5 → allocate each committed line to schedule tasks'
          : check.id === 'sov-mapped'
            ? 'Step 4 → review the Schedule of Values draft lines'
            : 'Action required',
      met: check.met,
      step: check.actionStep ?? 6,
      tab: check.actionTab,
    })),
  ];

  const overallMet = blockers.filter((b) => b.met).length;
  const overallTotal = blockers.length;
  const overallProgress = overallTotal > 0 ? Math.round((overallMet / overallTotal) * 100) : 0;

  const stepBlockers = blockers.filter((b) => b.step === selectedStep);
  const stepMet = stepBlockers.filter((b) => b.met).length;
  const stepTotal = stepBlockers.length;
  const stepProgress = stepTotal > 0 ? Math.round((stepMet / stepTotal) * 100) : 0;

  const nextUnmetStep = ALL_STEPS.find(
    (s) => s > selectedStep && blockers.some((b) => b.step === s && !b.met)
  );
  const nextUnmetCount = nextUnmetStep
    ? blockers.filter((b) => b.step === nextUnmetStep && !b.met).length
    : 0;

  const handleBlockerClick = (blocker: Blocker) => {
    if (blocker.met) return;
    navigateToSetupStep(blocker.step, blocker.tab);
    onSelectStep(blocker.step);
  };

  const renderBlockerCard = (blocker: Blocker) => (
    <button
      key={blocker.id}
      type="button"
      disabled={blocker.met}
      onClick={() => handleBlockerClick(blocker)}
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
        <div className="min-w-0">
          <p
            className={`text-sm font-medium ${blocker.met ? 'text-green-900' : 'text-amber-900'}`}
          >
            {blocker.title}
          </p>
          <p className={`text-xs mt-1 ${blocker.met ? 'text-green-700' : 'text-amber-700'}`}>
            {blocker.description}
          </p>
        </div>
      </div>
    </button>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">
            {showAll ? 'Readiness' : `Readiness — Step ${selectedStep}`}
          </h3>
        </div>
        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between text-[11px] text-gray-600 mb-1">
              <span>Overall</span>
              <span className="font-medium">
                {overallMet}/{overallTotal}
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
          {!showAll && stepTotal > 0 && (
            <div>
              <div className="flex items-center justify-between text-[11px] text-gray-600 mb-1">
                <span>This step</span>
                <span className="font-medium">
                  {stepMet}/{stepTotal}
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${stepProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => onToggleShowAll(e.target.checked)}
            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 h-3.5 w-3.5"
          />
          <span className="text-xs text-gray-700">Show all blockers</span>
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {showAll ? (
          ALL_STEPS.map((step) => {
            const items = blockers.filter((b) => b.step === step);
            if (items.length === 0) return null;
            return (
              <div key={step} className="space-y-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Step {step} — {STEP_LABELS[step]}
                </h4>
                <div className="space-y-2">{items.map(renderBlockerCard)}</div>
              </div>
            );
          })
        ) : stepBlockers.length === 0 ? (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
            No readiness checks for Step {selectedStep}.
          </div>
        ) : stepMet === stepTotal ? (
          <>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-900 flex items-center gap-2">
              <Check size={16} className="text-green-600" />
              Step {selectedStep} complete
            </div>
            {stepBlockers.map(renderBlockerCard)}
          </>
        ) : (
          stepBlockers.map(renderBlockerCard)
        )}

        {!showAll && selectedStep === 3 && financialSetupStep === 3 && lineCounts.open > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
            Subcontract issuance for open lines is blocked. Commit each line to enable downstream
            activities.
          </div>
        )}

        {!showAll && nextUnmetStep && (
          <button
            type="button"
            onClick={() => onSelectStep(nextUnmetStep)}
            className="w-full text-left p-2 rounded-md border border-dashed border-gray-300 text-xs text-gray-600 hover:bg-gray-50 flex items-center justify-between"
          >
            <span>
              Next up in Step {nextUnmetStep}: {nextUnmetCount}{' '}
              {nextUnmetCount === 1 ? 'check' : 'checks'}
            </span>
            <ChevronRight size={14} className="text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ReadinessSection;
