import React from 'react';
import { FileDiff } from 'lucide-react';
import ModalPortal from './ModalPortal';

interface ChangeOrderModalProps {
  open: boolean;
  lineLabel: string;
  onClose: () => void;
  onRequest: () => void;
}

const ChangeOrderModal: React.FC<ChangeOrderModalProps> = ({
  open,
  lineLabel,
  onClose,
  onRequest,
}) => (
  <ModalPortal open={open}>
    <div
      className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-3 mb-4">
        <FileDiff className="text-teal-600 flex-shrink-0" size={24} />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Request Change Order</h3>
          <p className="text-sm text-gray-600 mt-2">
            <strong>{lineLabel}</strong> is committed. Direct edits are blocked. Request a Change
            Order to modify this line. (Prototype: approval is simulated instantly.)
          </p>
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onRequest}
          className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700"
        >
          Request Change Order
        </button>
      </div>
    </div>
  </ModalPortal>
);

export default ChangeOrderModal;
