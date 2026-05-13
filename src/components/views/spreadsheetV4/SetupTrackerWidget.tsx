import React, { useMemo } from 'react';
import { CheckCircle2, Lock, Circle } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';

const STEPS = [
  { id: 0, label: 'Preliminary Config', description: 'Set defaults' },
  { id: 1, label: 'Prime Contract', description: 'Upload & lock' },
  { id: 2, label: 'Budget Setup', description: 'Lock budget' },
  { id: 3, label: 'SOV & Schedule', description: 'Draft review' },
  { id: 4, label: 'Finalize', description: 'Publish SOV' },
  { id: 5, label: 'Complete', description: 'Activated' },
];

type StepState = 'complete' | 'active' | 'locked';

const SetupTrackerWidget: React.FC = () => {
  const {
    financialSetupStep,
    setFinancialSetupStep,
    contractData,
    budgetLocked,
    financialConfig
  } = useProject();

  // Determine state of each step
  const stepStates = useMemo<StepState[]>(() => {
    return STEPS.map((step) => {
      if (step.id < financialSetupStep) return 'complete';
      if (step.id === financialSetupStep) return 'active';
      return 'locked';
    });
  }, [financialSetupStep]);

  const handleStepClick = (stepId: number) => {
    // Allow clicking on completed or active steps
    if (stepId <= financialSetupStep) {
      setFinancialSetupStep(stepId as any);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Steps */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {STEPS.map((step, index) => {
          const state = stepStates[index];
          const isClickable = step.id <= financialSetupStep;

          return (
            <button
              key={step.id}
              onClick={() => handleStepClick(step.id)}
              disabled={!isClickable}
              className="w-full text-left disabled:opacity-50 disabled:cursor-default focus:outline-none group"
            >
              <div className="flex items-start gap-3">
                {/* Step Icon */}
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
                  {state === 'locked' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Lock size={16} className="text-gray-500" strokeWidth={1.5} />
                    </div>
                  )}
                </div>

                {/* Step Info */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-medium transition-colors ${
                      state === 'active'
                        ? 'text-gray-900'
                        : state === 'complete'
                          ? 'text-green-700'
                          : 'text-gray-500'
                    } ${isClickable ? 'group-hover:text-gray-800' : ''}`}
                  >
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{step.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Linarc Logo / Footer */}
      <div className="border-t border-gray-200 p-4 flex items-center justify-center">
        <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">
          Setup Progress
        </div>
      </div>
    </div>
  );
};

export default SetupTrackerWidget;
