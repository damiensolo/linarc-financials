import React, { useState } from 'react';
import { useProject } from '../../../context/ProjectContext';
import { DatePicker } from '../../common/ui/DatePicker';
import { PaperclipIcon, ChevronDownIcon } from '../../common/Icons';

interface ContractMetadataBarProps {
  isLocked?: boolean;
  isEditable?: boolean;
}

const ContractMetadataBar: React.FC<ContractMetadataBarProps> = ({ isLocked = false, isEditable = false }) => {
  const { contractData, setContractData, setIsContractUploadOpen, setContractLocked, setFinancialSetupStep } = useProject();

  const [executedDate, setExecutedDate] = useState(contractData?.executedDate || null);
  const [startDate, setStartDate] = useState(contractData?.startDate || null);
  const [endDate, setEndDate] = useState(contractData?.endDate || null);
  const [contractSum, setContractSum] = useState<string | number>(contractData?.contractSum || '');
  const [owner, setOwner] = useState(contractData?.owner || '');
  const [contractor, setContractor] = useState(contractData?.contractor || '');

  const handleDateChange = (field: 'executedDate' | 'startDate' | 'endDate', date: Date | null) => {
    if (!isEditable || isLocked || !contractData) return;

    if (field === 'executedDate') setExecutedDate(date);
    if (field === 'startDate') setStartDate(date);
    if (field === 'endDate') setEndDate(date);

    setContractData({
      ...contractData,
      [field]: date,
    });
  };

  const handleContractSumChange = (value: string) => {
    if (!isEditable || isLocked || !contractData) return;

    setContractSum(value);

    const numValue = value === '' ? 0 : Number(value);
    if (!isNaN(numValue)) {
      setContractData({
        ...contractData,
        contractSum: numValue,
      });
    }
  };

  const handleOwnerChange = (value: string) => {
    if (!isEditable || isLocked || !contractData) return;

    setOwner(value);
    setContractData({
      ...contractData,
      owner: value,
    });
  };

  const handleContractorChange = (value: string) => {
    if (!isEditable || isLocked || !contractData) return;

    setContractor(value);
    setContractData({
      ...contractData,
      contractor: value,
    });
  };

  const handleReplaceContract = () => {
    setContractLocked(false);
    setFinancialSetupStep(1);
    setIsContractUploadOpen(true);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '—';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '—';
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (!contractData) return null;

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="px-6 py-4 space-y-4">
        {/* Top Row: Project Name & Lock Badge */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <PaperclipIcon className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">{contractData.projectName}</h2>
          </div>
          {isLocked && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
              🔒 LOCKED
            </span>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-6 gap-4 text-sm">
          {/* Column 1: Executed Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Executed Date
            </label>
            {isEditable && !isLocked ? (
              <div className="relative">
                <DatePicker
                  date={executedDate}
                  setDate={(date) => handleDateChange('executedDate', date)}
                />
              </div>
            ) : (
              <p className="text-gray-900 font-medium px-3 py-2 bg-gray-50 rounded border border-gray-200">
                {formatDate(executedDate)}
              </p>
            )}
          </div>

          {/* Column 2: Construction Start */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Construction Start
            </label>
            {isEditable && !isLocked ? (
              <div className="relative">
                <DatePicker
                  date={startDate}
                  setDate={(date) => handleDateChange('startDate', date)}
                />
              </div>
            ) : (
              <p className="text-gray-900 font-medium px-3 py-2 bg-gray-50 rounded border border-gray-200">
                {formatDate(startDate)}
              </p>
            )}
          </div>

          {/* Column 3: Substantial Completion */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Substantial Completion
            </label>
            {isEditable && !isLocked ? (
              <div className="relative">
                <DatePicker
                  date={endDate}
                  setDate={(date) => handleDateChange('endDate', date)}
                />
              </div>
            ) : (
              <p className="text-gray-900 font-medium px-3 py-2 bg-gray-50 rounded border border-gray-200">
                {formatDate(endDate)}
              </p>
            )}
          </div>

          {/* Column 4: Contract Sum */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Contract Sum
            </label>
            {isEditable && !isLocked ? (
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 font-medium">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={contractSum}
                  onChange={(e) => handleContractSumChange(e.target.value)}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded text-gray-900 font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ) : (
              <p className="text-gray-900 font-semibold px-3 py-2 bg-gray-50 rounded border border-gray-200">
                {formatCurrency(typeof contractSum === 'string' ? Number(contractSum) || 0 : contractSum)}
              </p>
            )}
          </div>

          {/* Column 5: Owner */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Owner
            </label>
            {isEditable && !isLocked ? (
              <input
                type="text"
                value={owner}
                onChange={(e) => handleOwnerChange(e.target.value)}
                placeholder="Enter owner name"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900 text-sm px-3 py-2 bg-gray-50 rounded border border-gray-200">
                {owner || contractData.owner || '—'}
              </p>
            )}
          </div>

          {/* Column 6: Contractor */}
          <div>
            {!isLocked && (
              <button
                onClick={handleReplaceContract}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 block mb-2"
              >
                Replace Contract
              </button>
            )}
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Contractor
            </label>
            {isEditable && !isLocked ? (
              <input
                type="text"
                value={contractor}
                onChange={(e) => handleContractorChange(e.target.value)}
                placeholder="Enter contractor name"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900 text-sm px-3 py-2 bg-gray-50 rounded border border-gray-200">
                {contractor || contractData.contractor || '—'}
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ContractMetadataBar;
