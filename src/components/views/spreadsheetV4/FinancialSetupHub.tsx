import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../../common/Icons';
import { useProject } from '../../../context/ProjectContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../common/ui/Tooltip';
import SetupTrackerWidget from './SetupTrackerWidget';
import StepDetailCard from './StepDetailCard';
import BlockersRail from './BlockersRail';

/** PRD v2.1 — 5-step progressive financial setup hub (Steps 1–5). */
const FinancialSetupHub: React.FC = () => {
  const { hubCollapsed, setHubCollapsed, activationState } = useProject();
  const [isTrackerOpen, setIsTrackerOpen] = useState(true);
  const [isBlockersOpen, setIsBlockersOpen] = useState(true);

  if (hubCollapsed && activationState === 'activated') {
    return (
      <button
        type="button"
        onClick={() => setHubCollapsed(false)}
        className="absolute left-2 top-2 z-20 px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
      >
        Open Setup Tracker
      </button>
    );
  }

  return (
    <div className="flex h-full bg-white gap-0 min-h-0">
      <aside
        className={`flex-shrink-0 bg-gray-50 border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col ${
          isTrackerOpen ? 'w-[260px]' : 'w-0 border-r-0'
        }`}
      >
        <SetupTrackerWidget />
      </aside>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setIsTrackerOpen(!isTrackerOpen)}
              className="flex-shrink-0 w-8 flex items-center justify-center border-r border-gray-200 hover:bg-gray-100"
            >
              {isTrackerOpen ? (
                <ChevronLeftIcon className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isTrackerOpen ? 'Close Setup Tracker' : 'Open Setup Tracker'}
          </TooltipContent>
        </Tooltip>

      <div className="flex-1 overflow-hidden flex flex-col min-w-0">
        <StepDetailCard />
      </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setIsBlockersOpen(!isBlockersOpen)}
              className="flex-shrink-0 w-8 flex items-center justify-center border-l border-gray-200 hover:bg-gray-100"
            >
              {isBlockersOpen ? (
                <ChevronRightIcon className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronLeftIcon className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {isBlockersOpen ? 'Close Readiness panel' : 'Open Readiness panel'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <aside
        className={`flex-shrink-0 bg-gray-50 border-l border-gray-200 transition-all duration-300 overflow-hidden ${
          isBlockersOpen ? 'w-[300px]' : 'w-0 border-l-0'
        }`}
      >
        <BlockersRail />
      </aside>
    </div>
  );
};

export default FinancialSetupHub;
