import React from 'react';
import { Cloud, Plus, FileText } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { createEmptyPrimeContractSheet } from '../../../lib/financialWorkflow';

const PrimeContractChoiceStep: React.FC = () => {
  const {
    contractData,
    setContractData,
    setIsContractUploadOpen,
    setContractLocked,
    setPrimeContractSetupPhase,
    updateView,
  } = useProject();

  const startManualEntry = () => {
    setContractData({
      executedDate: null,
      startDate: null,
      endDate: null,
      finalCompletion: null,
      contractSum: 0,
      owner: '',
      contractor: '',
      projectName: '',
      fileName: 'Manual Entry',
      uploadedAt: new Date().toISOString(),
      extractionMethod: 'manual',
    });
    updateView({
      v3Sheets: [createEmptyPrimeContractSheet()],
      v3ActiveSheetId: 'sheet-prime-contract',
    });
    setContractLocked(false);
    setPrimeContractSetupPhase('review');
  };

  return (
    <div className="max-w-lg w-full">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Prime Contract Setup</h2>
      <p className="text-gray-600 mb-6">
        Choose how you want to establish your Prime Contract Value and baseline metadata.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setIsContractUploadOpen(true)}
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors"
        >
          <Cloud className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900">Upload Document</h3>
          <p className="text-xs text-gray-600 mt-1">PDF, DOCX, TXT, or MD — auto-extracts value and line items</p>
        </button>

        <button
          type="button"
          onClick={startManualEntry}
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 text-left transition-colors"
        >
          <Plus className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900">Enter Manually</h3>
          <p className="text-xs text-gray-600 mt-1">Type in PC value, dates, and line items directly</p>
        </button>
      </div>

      {contractData && (
        <button
          type="button"
          onClick={() => setPrimeContractSetupPhase('review')}
          className="mt-4 w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left text-sm text-gray-700"
        >
          <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <span>
            Continue editing saved contract
            {contractData.projectName ? ` — ${contractData.projectName}` : ''}
          </span>
        </button>
      )}
    </div>
  );
};

export default PrimeContractChoiceStep;
