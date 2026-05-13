import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../../common/Icons';
import { useProject } from '../../../context/ProjectContext';
import SetupTrackerWidget from './SetupTrackerWidget';
import StepDetailCard from './StepDetailCard';
import BlockersRail from './BlockersRail';

/**
 * FinancialSetupHub
 *
 * A 3-panel guided workspace that walks users through 6 mandatory financial setup steps:
 * 0. Preliminary Config
 * 1. Upload Prime Contract
 * 2. Review & Edit Prime Contract
 * 3. Budget Setup
 * 4 & 5. Parallel: Draft SOV Review + Schedule Linking
 * 6. Lock & Publish SOV
 *
 * Layout with collapsible panels:
 * ┌──┬──────────────────────────────┬──┐
 * │◄─┤     Active Step Card          ├─►│
 * │  │     (center, flex-1)          │  │
 * └──┴──────────────────────────────┴──┘
 *
 * Left panel (Setup Tracker): 260px when open, 0 when closed
 * Right panel (Blockers Rail): 300px when open, 0 when closed
 */
const FinancialSetupHub: React.FC = () => {
  const [isTrackerOpen, setIsTrackerOpen] = useState(true);
  const [isBlockersOpen, setIsBlockersOpen] = useState(true);

  return (
    <div className="flex h-full bg-white gap-0">
      {/* Left Panel: Setup Tracker - Collapsible */}
      <aside
        className={`flex-shrink-0 bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${
          isTrackerOpen ? 'w-[260px]' : 'w-0 border-r-0'
        }`}
      >
        <SetupTrackerWidget />
      </aside>

      {/* Left Toggle Button */}
      <button
        onClick={() => setIsTrackerOpen(!isTrackerOpen)}
        className="flex-shrink-0 w-8 flex items-center justify-center border-r border-gray-200 hover:bg-gray-100 transition-colors"
        title={isTrackerOpen ? 'Close Setup Tracker' : 'Open Setup Tracker'}
      >
        {isTrackerOpen ? (
          <ChevronLeftIcon className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Center Panel: Active Step Detail Card */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-6">
        <StepDetailCard />
      </div>

      {/* Right Toggle Button */}
      <button
        onClick={() => setIsBlockersOpen(!isBlockersOpen)}
        className="flex-shrink-0 w-8 flex items-center justify-center border-l border-gray-200 hover:bg-gray-100 transition-colors"
        title={isBlockersOpen ? 'Close Blockers' : 'Open Blockers'}
      >
        {isBlockersOpen ? (
          <ChevronRightIcon className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronLeftIcon className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Right Panel: Blockers & Readiness Rail - Collapsible */}
      <aside
        className={`flex-shrink-0 bg-gray-50 border-l border-gray-200 transition-all duration-300 ease-in-out overflow-hidden ${
          isBlockersOpen ? 'w-[300px]' : 'w-0 border-l-0'
        }`}
      >
        <BlockersRail />
      </aside>
    </div>
  );
};

export default FinancialSetupHub;
