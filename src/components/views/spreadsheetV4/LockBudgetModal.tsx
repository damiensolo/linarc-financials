import React from 'react';
import { AlertTriangle, Lock } from 'lucide-react';

interface LockBudgetModalProps {
  open: boolean;
  openLineCount: number;
  committedLineCount: number;
  perLineApprovalEnabled: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const LockBudgetModal: React.FC<LockBudgetModalProps> = ({
  open,
  openLineCount,
  committedLineCount,
  perLineApprovalEnabled,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const lineWord = openLineCount === 1 ? 'line' : 'lines';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="text-amber-500 flex-shrink-0" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Lock Budget?</h3>
            <p className="text-sm text-gray-600 mt-2">
              Locking the budget will commit all remaining open line items at once —{' '}
              <strong>
                {openLineCount} {lineWord}
              </strong>
              {committedLineCount > 0 && (
                <>
                  {' '}
                  ({committedLineCount} already committed will not change)
                </>
              )}
              . After they are committed:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700 list-disc pl-5">
              {perLineApprovalEnabled ? (
                <li>
                  All {openLineCount} open {lineWord} will be routed to your approval chain before
                  they lock. Lines stay editable until approved.
                </li>
              ) : (
                <li>
                  All {openLineCount} open {lineWord} lock immediately — the same result as
                  committing each line individually.
                </li>
              )}
              <li>
                Committed lines can no longer be edited directly.{' '}
                <strong>Changes require a Change Order</strong> on each affected line.
              </li>
              <li>
                Each committed line becomes operationally live: subcontract and PO issuance, SOV
                mapping, subcontractor invoicing, and schedule linking — for that line only.
              </li>
              <li>
                General Contractor pay applications to the Owner remain blocked until the Prime
                Contract is locked, the full budget is committed, and the SOV is published.
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
            Lock Budget
          </button>
        </div>
      </div>
    </div>
  );
};

export default LockBudgetModal;
