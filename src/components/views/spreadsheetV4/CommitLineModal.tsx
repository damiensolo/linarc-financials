import React from 'react';
import { AlertTriangle } from 'lucide-react';
import ModalPortal from './ModalPortal';

interface CommitLineModalProps {
  open: boolean;
  lineLabel: string;
  lineAmount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const CommitLineModal: React.FC<CommitLineModalProps> = ({
  open,
  lineLabel,
  lineAmount,
  onConfirm,
  onCancel,
}) => (
  <ModalPortal open={open}>
    <div
      className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="text-amber-500 flex-shrink-0" size={24} />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Commit Line Item</h3>
          <p className="text-sm text-gray-600 mt-2">
            Committing <strong>{lineLabel}</strong> (${lineAmount.toLocaleString()}) will lock it for
            direct edits. Changes will require a Change Order. This will also enable subcontract
            issuance, SOV mapping, invoicing, and schedule linking for this line. Continue?
          </p>
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
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Commit Line
        </button>
      </div>
    </div>
  </ModalPortal>
);

export default CommitLineModal;
