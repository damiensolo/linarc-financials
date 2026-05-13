import React from 'react';
import { useProject } from '../../../context/ProjectContext';
import SetupTrackerWidget from './SetupTrackerWidget';
import StepDetailCard from './StepDetailCard';
import BlockersRail from './BlockersRail';

/**
 * FinancialSetupHub
 *
 * A 3-panel guided workspace that walks users through 5 mandatory financial setup steps:
 * 0. Preliminary Config (retainage, overhead, billing dates, pay apps toggle)
 * 1. Prime Contract Setup & Lock
 * 2. Budget Setup & Lock
 * 3 & 4. Parallel: Draft SOV Review + Schedule Linking
 * 5. Lock & Publish SOV
 *
 * Layout:
 * ┌─────────────────┬──────────────────────────────┬─────────────────┐
 * │  Setup Tracker  │     Active Step Card           │  Blockers Rail  │
 * │  (left, 260px)  │     (center, flex-1)           │  (right, 300px) │
 * └─────────────────┴──────────────────────────────┴─────────────────┘
 */
const FinancialSetupHub: React.FC = () => {
  return (
    <div className="flex h-full bg-white">
      {/* Left Panel: Setup Tracker */}
      <div className="w-[260px] border-r border-gray-200 bg-gray-50 flex flex-col">
        <SetupTrackerWidget />
      </div>

      {/* Center Panel: Active Step Detail Card */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-6">
        <StepDetailCard />
      </div>

      {/* Right Panel: Blockers & Readiness Rail */}
      <div className="w-[300px] border-l border-gray-200 bg-gray-50 overflow-auto">
        <BlockersRail />
      </div>
    </div>
  );
};

export default FinancialSetupHub;
