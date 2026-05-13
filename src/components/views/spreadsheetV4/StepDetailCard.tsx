import React, { useState } from 'react';
import { ChevronRight, Check, AlertCircle } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import FinancialConfigStep from './FinancialConfigStep';
import PrimeContractTable from './PrimeContractTable';

const StepDetailCard: React.FC = () => {
  const {
    financialSetupStep,
    setFinancialSetupStep,
    financialConfig,
    contractData,
    budgetLocked,
    setIsContractUploadOpen,
    setBudgetLocked,
    activeView,
  } = useProject();

  const [activeTab, setActiveTab] = useState<'sov' | 'schedule'>('sov');

  const handleLockBudget = () => {
    setBudgetLocked(true);
    setFinancialSetupStep(3);
  };

  const handlePublishSOV = () => {
    setFinancialSetupStep(5);
  };

  const renderStepContent = () => {
    switch (financialSetupStep) {
      case 0:
        return <FinancialConfigStep />;

      case 1:
        return (
          <div className="max-w-md">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Prime Contract
            </h2>
            <p className="text-gray-600 mb-6">
              Upload and review your prime contract to establish the baseline contract sum and key dates.
            </p>

            {!contractData ? (
              <button
                onClick={() => setIsContractUploadOpen(true)}
                className="w-full py-3 px-4 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                Upload Contract
                <ChevronRight size={18} />
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Check size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-900">Contract Uploaded</p>
                      <p className="text-sm text-green-700 mt-1">
                        {contractData.projectName} • {contractData.fileName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contract Sum:</span>
                    <span className="font-medium text-gray-900">
                      ${contractData.contractSum?.toLocaleString('en-US')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Owner:</span>
                    <span className="font-medium text-gray-900">{contractData.owner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contractor:</span>
                    <span className="font-medium text-gray-900">{contractData.contractor}</span>
                  </div>
                </div>

                <button
                  onClick={() => setFinancialSetupStep(2)}
                  className="w-full py-3 px-4 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  Lock Prime Contract
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        );

      case 2: {
        const budgetSheet = activeView?.v3Sheets?.find(s => s.id === 'sheet-budget');
        const hasRows = budgetSheet && budgetSheet.rows.length > 0 && budgetSheet.rows[0].id !== 'empty-row';

        if (hasRows && contractData) {
          return (
            <div className="w-full h-full flex flex-col">
              <div className="flex-1 overflow-auto">
                <PrimeContractTable />
              </div>
              <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-3">
                {budgetLocked && (
                  <div className="flex items-center gap-2 text-sm font-medium text-green-900 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <Check size={16} />
                    Budget Locked
                  </div>
                )}
                <button
                  onClick={handleLockBudget}
                  disabled={budgetLocked}
                  className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-default"
                >
                  Lock Budget
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="max-w-md">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Budget Setup
            </h2>
            <p className="text-gray-600 mb-6">
              Configure your project budget with cost codes, allocations, and labor/material breakdown.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => setIsContractUploadOpen(true)}
                className="w-full py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Auto-populate from Contract
              </button>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg" />
                <div className="relative p-4 text-center text-gray-500 text-sm">
                  Budget spreadsheet (inline view coming soon)
                </div>
              </div>

              {budgetLocked && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-900 flex items-center gap-2">
                    <Check size={16} />
                    Budget Locked
                  </p>
                </div>
              )}

              <button
                onClick={handleLockBudget}
                disabled={budgetLocked}
                className="w-full py-3 px-4 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-default flex items-center justify-center gap-2"
              >
                Lock Budget
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        );
      }

      case 3:
      case 4:
        return (
          <div className="max-w-2xl w-full">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              SOV & Schedule Linking
            </h2>
            <p className="text-gray-600 mb-6">
              Review your Statement of Values and link budget items to the project schedule.
            </p>

            <div className="mb-6 flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('sov')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'sov'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Draft SOV Review
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'schedule'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Schedule Linking
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500 min-h-[300px] flex items-center justify-center">
              {activeTab === 'sov' ? (
                <div className="text-center">
                  <p className="font-medium mb-2">Draft SOV Review</p>
                  <p className="text-sm">Review and edit your Statement of Values</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-medium mb-2">Schedule Linking</p>
                  <p className="text-sm">Link budget line items to WBS tasks</p>
                </div>
              )}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900 flex items-center gap-2">
                <AlertCircle size={16} />
                4 SOV lines are missing WBS links
              </p>
            </div>

            <button
              onClick={handlePublishSOV}
              className="w-full mt-6 py-3 px-4 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
              Lock & Publish SOV
              <ChevronRight size={18} />
            </button>
          </div>
        );

      case 5:
        return (
          <div className="max-w-md text-center">
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Financially Activated
              </h2>
              <p className="text-gray-600">
                Your project is now ready for financial operations. You can now manage contracts, budgets, and schedules.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-900">
              <p className="font-medium mb-2">Setup Complete</p>
              <p>All 5 mandatory financial setup steps have been completed successfully.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {renderStepContent()}
    </div>
  );
};

export default StepDetailCard;
