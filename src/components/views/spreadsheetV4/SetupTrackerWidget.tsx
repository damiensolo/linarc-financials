import React from 'react';
import { CheckCircle2, Lock, Circle } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { FinancialSetupStep } from '../../../types';

const STEPS: { id: FinancialSetupStep; label: string; description: string }[] = [
  { id: 1, label: 'Preliminary Config', description: 'Set defaults' },
  { id: 2, label: 'Prime Contract', description: 'Upload or manual entry' },
  { id: 3, label: 'Budget Setup', description: 'Progressive commit' },
  { id: 4, label: 'Operations', description: 'SOV & schedule' },
  { id: 5, label: 'Publish SOV', description: 'Activate project' },
];

type StepState = 'complete' | 'active' | 'available' | 'locked';

const SetupTrackerWidget: React.FC = () => {
  const {
    financialSetupStep,
    setFinancialSetupStep,
    hasPcValue,
    committedLineCount,
    lineCounts,
    canAccessOperations,
    activationState,
    contractData,
    setPrimeContractSetupPhase,
  } = useProject();

  const stepStates = STEPS.map((step): StepState => {
    if (activationState === 'activated' && step.id <= 5) return 'complete';
    if (step.id < financialSetupStep) return 'complete';
    if (step.id === financialSetupStep) return 'active';
    if (step.id === 3 && hasPcValue) return 'available';
    if (step.id === 4 && canAccessOperations) return 'available';
    return 'locked';
  });

  const handleStepClick = (stepId: FinancialSetupStep, state: StepState) => {
    if (state === 'complete' || state === 'active' || state === 'available') {
      if (stepId === 2) {
        if (financialSetupStep < 2) {
          setPrimeContractSetupPhase('choose');
        } else if (contractData) {
          setPrimeContractSetupPhase('review');
        }
      }
      setFinancialSetupStep(stepId);
    }
  };

  const subtext = (stepId: FinancialSetupStep) => {
    if (stepId === 3 && lineCounts.total > 0) {
      return `${committedLineCount} of ${lineCounts.total} lines committed`;
    }
    if (stepId === 4 && canAccessOperations) {
      return `Operations available — ${committedLineCount} lines live`;
    }
    return STEPS.find((s) => s.id === stepId)?.description;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {STEPS.map((step, index) => {
          const state = stepStates[index];
          const clickable = state !== 'locked';

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => handleStepClick(step.id, state)}
              disabled={!clickable}
              className="w-full text-left disabled:opacity-50 disabled:cursor-default focus:outline-none"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-1">
                  {state === 'complete' && (
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 size={20} className="text-green-600" strokeWidth={1.5} />
                    </div>
                  )}
                  {state === 'active' && (
                    <div className="w-8 h-8 rounded-full border-2 border-orange-500 bg-orange-50 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                    </div>
                  )}
                  {state === 'available' && (
                    <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                      <Circle size={16} className="text-gray-400" />
                    </div>
                  )}
                  {state === 'locked' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Lock size={16} className="text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${state === 'active' ? 'text-orange-600' : 'text-gray-900'}`}>
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{subtext(step.id)}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SetupTrackerWidget;
