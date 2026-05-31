import React from 'react';
import { CheckCircle2, Lock, Circle } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { FinancialSetupStep } from '../../../types';

const STEPS: { id: FinancialSetupStep; label: string }[] = [
  { id: 1, label: 'Preliminary Config' },
  { id: 2, label: 'Prime Contract' },
  { id: 3, label: 'Budget Setup' },
  { id: 4, label: 'Operations' },
  { id: 5, label: 'Publish SOV' },
];

type StepState = 'complete' | 'active' | 'available' | 'locked';

interface SetupStepperProps {
  selectedStep: FinancialSetupStep;
  onSelectStep: (step: FinancialSetupStep) => void;
}

const SetupStepper: React.FC<SetupStepperProps> = ({ selectedStep, onSelectStep }) => {
  const {
    financialSetupStep,
    setFinancialSetupStep,
    hasPcValue,
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
    if (state === 'locked') return;
    if (stepId === 2) {
      if (financialSetupStep < 2) {
        setPrimeContractSetupPhase('choose');
      } else if (contractData) {
        setPrimeContractSetupPhase('review');
      }
    }
    setFinancialSetupStep(stepId);
    onSelectStep(stepId);
  };

  return (
    <div className="p-2 space-y-1 border-b border-gray-200">
      {STEPS.map((step, index) => {
        const state = stepStates[index];
        const clickable = state !== 'locked';
        const isSelected = selectedStep === step.id;

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => handleStepClick(step.id, state)}
            disabled={!clickable}
            className={`w-full text-left rounded-md px-2 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-default focus:outline-none ${
              isSelected && clickable ? 'bg-gray-200' : clickable ? 'hover:bg-gray-100' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0">
                {state === 'complete' && (
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 size={14} className="text-green-600" strokeWidth={1.5} />
                  </div>
                )}
                {state === 'active' && (
                  <div className="w-6 h-6 rounded-full border-2 border-orange-500 bg-orange-50 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  </div>
                )}
                {state === 'available' && (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                    <Circle size={12} className="text-gray-400" />
                  </div>
                )}
                {state === 'locked' && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                    <Lock size={12} className="text-gray-500" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-xs font-medium leading-snug ${
                    state === 'active' ? 'text-orange-600' : 'text-gray-900'
                  }`}
                >
                  <span className="text-gray-400 mr-1">{step.id}.</span>
                  {step.label}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SetupStepper;
