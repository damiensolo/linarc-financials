import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import ModalPortal from './ModalPortal';

interface PcValueChangeModalProps {
  open: boolean;
  newValue: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const PcValueChangeModal: React.FC<PcValueChangeModalProps> = ({
  open,
  newValue,
  onConfirm,
  onCancel,
}) => {
  const { financialConfig, contractData } = useProject();

  const roles = financialConfig?.approvalRouting.roles ?? ['gc', 'pe', 'owner'];
  const chain = roles.map((r) => r.toUpperCase()).join(' → ');

  return (
    <ModalPortal open={open}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="text-amber-500 flex-shrink-0" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">PC Value Change Requires Approval</h3>
            <p className="text-sm text-gray-600 mt-2">
              Changing the Prime Contract Value from ${contractData?.contractSum?.toLocaleString()} to $
              {newValue.toLocaleString()} will require approval from {chain}. The current value remains
              in effect until approved. Continue?
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
            Submit for Approval
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};

export default PcValueChangeModal;
