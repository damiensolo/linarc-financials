import React from 'react';
import { CheckCircle2, LayoutGrid, FileText, Calendar } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import ContractSummaryHeader from './ContractSummaryHeader';

const FinancialOpsHub: React.FC = () => {
  const {
    contractData,
    committedLineCount,
    lineCounts,
    sovMappings,
    wbsLinks,
    setHubCollapsed,
    navigateToSetupStep,
  } = useProject();

  return (
    <div className="flex flex-col h-full">
      {contractData && <ContractSummaryHeader />}

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
            <div className="p-4 border border-gray-200 rounded-lg">
              <LayoutGrid className="text-blue-600 mb-2" size={24} />
              <p className="font-semibold text-gray-900">Budget</p>
              <p className="text-sm text-gray-600">{committedLineCount} of {lineCounts.total} lines committed</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <FileText className="text-teal-600 mb-2" size={24} />
              <p className="font-semibold text-gray-900">SOV</p>
              <p className="text-sm text-gray-600">{sovMappings.length} lines mapped</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <Calendar className="text-purple-600 mb-2" size={24} />
              <p className="font-semibold text-gray-900">Schedule</p>
              <p className="text-sm text-gray-600">{wbsLinks.length} WBS links</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setHubCollapsed(false); navigateToSetupStep(4); }}
            className="mt-6 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Reopen Setup Tracker
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinancialOpsHub;
