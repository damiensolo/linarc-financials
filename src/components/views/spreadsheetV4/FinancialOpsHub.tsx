import React from 'react';
import { CheckCircle2, LayoutGrid, FileText, Calendar } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';

const FinancialOpsHub: React.FC = () => {
  const {
    committedLineCount,
    lineCounts,
    sovMappings,
    budgetScheduleLinks,
    setHubCollapsed,
    setActiveFinancialSection,
  } = useProject();

  const scheduleLinkedCount = budgetScheduleLinks.filter((l) => l.status === 'confirmed').length;

  // Cards are waypoints into the live financial tools.
  const openTool = (section: string) => {
    setActiveFinancialSection(section);
    setHubCollapsed(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Financial Operations Hub</h2>
          <p className="text-gray-600 mb-8">
            Project is financially activated. Manage ongoing billing, commitments, and schedule links below.
          </p>

          <div className="grid grid-cols-3 gap-4 text-left">
            <button
              type="button"
              onClick={() => openTool('budget')}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-colors text-left"
            >
              <LayoutGrid className="text-blue-600 mb-2" size={24} />
              <p className="font-semibold text-gray-900">Budget</p>
              <p className="text-sm text-gray-600">{committedLineCount} of {lineCounts.total} lines committed</p>
            </button>
            <button
              type="button"
              onClick={() => openTool('sov')}
              className="p-4 border border-gray-200 rounded-lg hover:border-teal-400 hover:bg-teal-50/50 transition-colors text-left"
            >
              <FileText className="text-teal-600 mb-2" size={24} />
              <p className="font-semibold text-gray-900">SOV</p>
              <p className="text-sm text-gray-600">{sovMappings.length} lines mapped</p>
            </button>
            <button
              type="button"
              onClick={() => openTool('allocate')}
              className="p-4 border border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50/50 transition-colors text-left"
            >
              <Calendar className="text-purple-600 mb-2" size={24} />
              <p className="font-semibold text-gray-900">Schedule</p>
              <p className="text-sm text-gray-600">{scheduleLinkedCount} lines linked</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialOpsHub;
