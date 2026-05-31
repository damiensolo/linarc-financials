import React, { useEffect, useState } from 'react';
import { useProject } from '../../../context/ProjectContext';
import { FinancialSetupStep } from '../../../types';
import SetupStepper from './SetupStepper';
import ReadinessSection from './ReadinessSection';
import ApprovalQueuePanel from './ApprovalQueuePanel';

const UnifiedSetupRail: React.FC = () => {
  const { financialSetupStep, activationState } = useProject();
  const [selectedStep, setSelectedStep] = useState<FinancialSetupStep>(financialSetupStep);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setSelectedStep(financialSetupStep);
  }, [financialSetupStep]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <SetupStepper selectedStep={selectedStep} onSelectStep={setSelectedStep} />
      <ReadinessSection
        selectedStep={selectedStep}
        onSelectStep={setSelectedStep}
        showAll={showAll}
        onToggleShowAll={setShowAll}
      />
      <ApprovalQueuePanel />
      <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
        <p className="text-[11px] text-gray-600">
          {activationState === 'activated'
            ? 'Project financially activated'
            : `Step ${financialSetupStep} of 5`}
        </p>
      </div>
    </div>
  );
};

export default UnifiedSetupRail;
