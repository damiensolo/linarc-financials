import React from 'react';
import { AlertTriangle, Lock } from 'lucide-react';

interface LockPrimeContractModalProps {
  open: boolean;
  hasCommittedBudgetLines: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const LockPrimeContractModal: React.FC<LockPrimeContractModalProps> = ({
  open,
  hasCommittedBudgetLines,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="text-amber-500 flex-shrink-0" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Lock Prime Contract?</h3>
            <p className="text-sm text-gray-600 mt-2">
              Locking establishes this Prime Contract as the authoritative project baseline. After
              you lock:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700 list-disc pl-5">
              <li>Contract metadata, dates, and line items can no longer be edited directly.</li>
              <li>
                <strong>This cannot be undone.</strong> The Prime Contract cannot be unlocked or
                re-opened for editing.
              </li>
              <li>
                Further changes to contract value or scope must go through a formal Change Order
                {hasCommittedBudgetLines ? ' (and may require approval when budget lines are committed)' : ''}.
              </li>
              <li>
                Budget setup and downstream work can continue — locking hardens the contract baseline,
                it does not block progress.
              </li>
              <li>
                Owner pay applications remain gated until the Prime Contract, full budget, and SOV
                publish requirements are satisfied.
              </li>
            </ul>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Lock size={16} />
            Lock Prime Contract
          </button>
        </div>
      </div>
    </div>
  );
};

export default LockPrimeContractModal;
