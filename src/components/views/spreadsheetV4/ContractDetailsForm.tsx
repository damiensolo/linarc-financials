import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProject } from '../../../context/ProjectContext';
import { DatePicker } from '../../common/ui/DatePicker';
import { PaperclipIcon, ChevronRightIcon } from '../../common/Icons';

const ContractDetailsForm: React.FC = () => {
  const { contractData, setContractData, contractConfirmed, setContractConfirmed, setIsContractUploadOpen } = useProject();

  const [executedDate, setExecutedDate] = useState(contractData?.executedDate || null);
  const [startDate, setStartDate] = useState(contractData?.startDate || null);
  const [endDate, setEndDate] = useState(contractData?.endDate || null);

  const handleProceed = () => {
    if (contractData) {
      setContractData({
        ...contractData,
        executedDate,
        startDate,
        endDate,
      });
      setContractConfirmed(true);
    }
  };

  const handleChangeContract = () => {
    setContractData(null);
    setContractConfirmed(false);
    setIsContractUploadOpen(true);
  };

  if (!contractData) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col bg-white"
    >
      {/* Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-25 px-8 py-6">
        <div className="flex items-center gap-3 mb-2">
          <PaperclipIcon className="w-5 h-5 text-blue-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Contract Details</h1>
        </div>
        <p className="text-sm text-gray-600">
          Review and confirm your contract information
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-8 py-8">
        <div className="max-w-2xl">
          {/* Contract Summary */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Contract Information
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Project Name
                </label>
                <p className="text-base font-medium text-gray-900">{contractData.projectName}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Contract Sum
                </label>
                <p className="text-base font-medium text-gray-900">
                  ${contractData.contractSum?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Owner
                </label>
                <p className="text-base font-medium text-gray-900">{contractData.owner}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Contractor
                </label>
                <p className="text-base font-medium text-gray-900">{contractData.contractor}</p>
              </div>
            </div>
          </div>

          {/* Extraction Method Badge */}
          {contractData.extractionMethod === 'fallback' && (
            <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <p className="text-sm font-medium text-amber-900">
                ⚠️ Demo values — please verify and edit dates below
              </p>
            </div>
          )}

          {/* Date Fields */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Key Dates
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Executed Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  date={executedDate}
                  setDate={setExecutedDate}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Construction Start <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  date={startDate}
                  setDate={setStartDate}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Substantial Completion <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  date={endDate}
                  setDate={setEndDate}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-8 py-4 flex items-center justify-between gap-3">
        <button
          onClick={handleChangeContract}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Change Contract
        </button>
        <button
          onClick={handleProceed}
          className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          Proceed to Spreadsheet
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default ContractDetailsForm;
