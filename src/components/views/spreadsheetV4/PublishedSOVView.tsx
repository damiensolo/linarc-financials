import React from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import ContractSummaryHeader from './ContractSummaryHeader';
import SOVMappingGrid from './SOVMappingGrid';
import { isSovMappingConfirmed } from '../../../lib/financialWorkflow';

const PublishedSOVView: React.FC = () => {
  const { contractData, sovMappings, sovPublished } = useProject();

  const confirmedCount = sovMappings.filter(isSovMappingConfirmed).length;
  const totalAmount = sovMappings.reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="flex flex-col h-full bg-white min-h-0">
      {/* Prime Contract details live on their own screen — not shown here once the SOV is published. */}
      {!sovPublished && contractData && <ContractSummaryHeader />}

      <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${sovPublished ? 'bg-gray-200' : 'bg-green-100'}`}>
            {sovPublished ? (
              <Lock size={16} className="text-gray-600" />
            ) : (
              <CheckCircle2 size={18} className="text-green-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">Schedule of Values</h2>
              {sovPublished && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-200 text-gray-700">
                  <Lock size={11} />
                  Published &amp; locked
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600">
              {sovPublished
                ? `${sovMappings.length} lines finalized — read-only`
                : `${confirmedCount} of ${sovMappings.length} lines confirmed`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">SOV Total</p>
          <p className="text-lg font-semibold text-gray-900 font-mono">
            ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <SOVMappingGrid locked={sovPublished} />
      </div>
    </div>
  );
};

export default PublishedSOVView;
