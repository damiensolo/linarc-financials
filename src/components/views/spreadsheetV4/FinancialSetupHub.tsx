import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../../common/Icons';
import { useProject } from '../../../context/ProjectContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../common/ui/Tooltip';
import UnifiedSetupRail from './UnifiedSetupRail';
import FinancialSetupActionBar from './FinancialSetupActionBar';
import StepDetailCard from './StepDetailCard';

/** PRD v2.1 — 5-step progressive financial setup hub (Steps 1–5). */
const FinancialSetupHub: React.FC = () => {
  const { hubCollapsed, setHubCollapsed, activationState } = useProject();
  const [isRailOpen, setIsRailOpen] = useState(true);

  if (hubCollapsed && activationState === 'activated') {
    return (
      <button
        type="button"
        onClick={() => setHubCollapsed(false)}
        className="absolute left-2 top-2 z-20 px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
      >
        Open Setup
      </button>
    );
  }

  return (
    <div className="flex h-full min-h-0 bg-white">
      <aside
        className={`flex-shrink-0 bg-gray-50 border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col h-full ${
          isRailOpen ? 'w-[280px]' : 'w-0 border-r-0'
        }`}
      >
        <UnifiedSetupRail />
      </aside>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setIsRailOpen(!isRailOpen)}
              className="flex-shrink-0 w-8 h-full flex items-center justify-center border-r border-gray-200 hover:bg-gray-100 self-stretch"
            >
              {isRailOpen ? (
                <ChevronLeftIcon className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isRailOpen ? 'Close Setup' : 'Open Setup'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <FinancialSetupActionBar />
        <div className="flex-1 min-h-0 overflow-hidden">
          <StepDetailCard />
        </div>
      </div>
    </div>
  );
};

export default FinancialSetupHub;
