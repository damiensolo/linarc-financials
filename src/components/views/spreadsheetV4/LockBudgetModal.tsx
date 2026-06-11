import React from 'react';
import { Lock } from 'lucide-react';
import ModalPortal from './ModalPortal';

interface LockBudgetModalProps {
  open: boolean;
  openLineCount: number;
  /** Lines already locked into the SOV (locked, pending, or committed). */
  alreadyLockedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const LockBudgetModal: React.FC<LockBudgetModalProps> = ({
  open,
  openLineCount,
  alreadyLockedCount,
  onConfirm,
  onCancel,
}) => {
  const lineWord = openLineCount === 1 ? 'line' : 'lines';

  return (
    <ModalPortal open={open}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <Lock className="text-blue-600 flex-shrink-0" size={22} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Lock all open lines?</h3>
            <p className="text-sm text-gray-600 mt-2">
              This locks all remaining open line items at once —{' '}
              <strong>
                {openLineCount} {lineWord}
              </strong>
              {alreadyLockedCount > 0 && (
                <> ({alreadyLockedCount} already locked will not change)</>
              )}
              . Each open line needs a Cost Code and Trade. After they are locked:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700 list-disc pl-5">
              <li>
                Every locked line is added to the <strong>Schedule of Values</strong> as a draft
                line and to <strong>Schedule Linking &amp; Allocation</strong> as an item.
              </li>
              <li>
                Cost Code and Trade become fixed on locked lines. Amounts and the subcontractor stay
                editable until the line is committed.
              </li>
              <li>
                Locking does <strong>not</strong> require a subcontractor. Assign one and{' '}
                <strong>Commit</strong> each line individually when it's ready — that's what makes a
                line fully live for subcontract issuance and invoicing.
              </li>
              <li>
                General Contractor pay applications to the Owner remain blocked until the Prime
                Contract is locked, every line is locked into the SOV, and the SOV is published.
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
            Lock All
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};

export default LockBudgetModal;
