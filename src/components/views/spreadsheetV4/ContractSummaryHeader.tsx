import React from 'react';
import { motion } from 'framer-motion';
import { useProject } from '../../../context/ProjectContext';
import { PaperclipIcon } from '../../common/Icons';

const ContractSummaryHeader: React.FC = () => {
  const { contractData, setIsContractUploadOpen } = useProject();

  if (!contractData) return null;

  const formatDate = (date: Date | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.3 }}
      className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-25"
    >
      {/* Content */}
      <div className="px-4 py-4">
        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <PaperclipIcon className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">{contractData.projectName}</h3>
        </div>

        {/* Key Dates Grid */}
        <div className="grid grid-cols-5 gap-4">
          {/* Executed Date */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Executed Date</p>
            <p className="text-sm font-semibold text-gray-900">{formatDate(contractData.executedDate)}</p>
          </div>

          {/* Construction Start */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Construction Start</p>
            <p className="text-sm font-semibold text-gray-900">{formatDate(contractData.startDate)}</p>
          </div>

          {/* Substantial Completion */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Substantial Completion</p>
            <p className="text-sm font-semibold text-gray-900">{formatDate(contractData.endDate)}</p>
          </div>

          {/* Contract Sum */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Contract Sum</p>
            <p className="text-sm font-semibold text-gray-900">
              ${contractData.contractSum?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Contract File - Clickable */}
          <button
            onClick={() => setIsContractUploadOpen(true)}
            className="text-left hover:bg-blue-100/50 rounded px-2 py-1 transition-colors group"
          >
            <p className="text-xs font-medium text-gray-600 mb-1">Contract File</p>
            <p className="text-sm font-semibold text-blue-600 group-hover:text-blue-700 break-words">
              {contractData.fileName}
            </p>
          </button>
        </div>

      </div>
    </motion.div>
  );
};

export default ContractSummaryHeader;
