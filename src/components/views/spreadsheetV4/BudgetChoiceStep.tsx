import React from 'react';
import { Cloud, Plus, Table2, FileSpreadsheet } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { isBudgetSheetEmpty, hasPrimeContractLineData } from '../../../lib/financialWorkflow';
import { createBudgetRowsFromPrimeContract } from '../../../lib/budgetLineExtraction';

/**
 * Step 2 entry screen — mirrors PrimeContractChoiceStep. The budget is built by
 * uploading a file (Excel/CSV/PDF) or entering lines manually. A third option
 * seeds the budget from Prime Contract line items (testing convenience).
 */
const BudgetChoiceStep: React.FC = () => {
  const {
    setIsBudgetUploadOpen,
    initializeBlankBudget,
    setBudgetSetupPhase,
    updateBudgetRows,
    budgetRows,
    primeContractRows,
  } = useProject();

  const hasExistingBudget = !isBudgetSheetEmpty(budgetRows);
  const canSeedFromPrime = hasPrimeContractLineData(primeContractRows);

  const startManualEntry = () => {
    initializeBlankBudget();
    setBudgetSetupPhase('grid');
  };

  const startFromPrimeContract = () => {
    updateBudgetRows(createBudgetRowsFromPrimeContract(primeContractRows));
    setBudgetSetupPhase('grid');
  };

  return (
    <div className="max-w-2xl w-full">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Budget Setup</h2>
      <p className="text-gray-600 mb-6">
        Choose how you want to build your project budget. You can upload a budget file or enter line
        items by hand.
      </p>

      <div className={`grid grid-cols-1 gap-4 ${canSeedFromPrime ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <button
          type="button"
          onClick={() => setIsBudgetUploadOpen(true)}
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors"
        >
          <Cloud className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900">Upload Budget</h3>
          <p className="text-xs text-gray-600 mt-1">Excel, CSV, or PDF — auto-extracts budget line items</p>
        </button>

        <button
          type="button"
          onClick={startManualEntry}
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 text-left transition-colors"
        >
          <Plus className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900">Enter Manually</h3>
          <p className="text-xs text-gray-600 mt-1">Type budget lines, cost codes, and amounts directly</p>
        </button>

        {canSeedFromPrime && (
          <button
            type="button"
            onClick={startFromPrimeContract}
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 text-left transition-colors"
          >
            <FileSpreadsheet className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900">From Prime Contract</h3>
            <p className="text-xs text-gray-600 mt-1">Seed lines from Prime Contract items; cost codes auto-derived (testing)</p>
          </button>
        )}
      </div>

      {hasExistingBudget && (
        <button
          type="button"
          onClick={() => setBudgetSetupPhase('grid')}
          className="mt-4 w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left text-sm text-gray-700"
        >
          <Table2 className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <span>Continue editing current budget</span>
        </button>
      )}
    </div>
  );
};

export default BudgetChoiceStep;
