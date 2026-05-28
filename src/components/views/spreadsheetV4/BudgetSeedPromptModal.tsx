import React from 'react';
import { FileText, Plus } from 'lucide-react';

interface BudgetSeedPromptModalProps {
  open: boolean;
  lineCount: number;
  onUsePrimeContract: () => void;
  onStartBlank: () => void;
}

const BudgetSeedPromptModal: React.FC<BudgetSeedPromptModalProps> = ({
  open,
  lineCount,
  onUsePrimeContract,
  onStartBlank,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Create budget from Prime Contract?</h2>
        <p className="text-sm text-gray-600 mb-6">
          Your budget table is empty. Would you like to use {lineCount} Prime Contract line
          {lineCount === 1 ? '' : 's'} as the starting point? Cost codes, descriptions, and budget
          amounts will be carried over.
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onUsePrimeContract}
            className="flex items-center gap-3 w-full px-4 py-3 text-left border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-900">Yes — use Prime Contract data</span>
          </button>
          <button
            type="button"
            onClick={onStartBlank}
            className="flex items-center gap-3 w-full px-4 py-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-900">No — start with a blank row</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetSeedPromptModal;
