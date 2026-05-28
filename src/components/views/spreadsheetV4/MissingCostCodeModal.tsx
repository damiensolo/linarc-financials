import React from 'react';
import { AlertTriangle } from 'lucide-react';
import ModalPortal from './ModalPortal';

interface MissingCostCodeModalProps {
  open: boolean;
  lineLabel?: string;
  missingCount?: number;
  openLineCount?: number;
  onClose: () => void;
}

const MissingCostCodeModal: React.FC<MissingCostCodeModalProps> = ({
  open,
  lineLabel,
  missingCount = 1,
  openLineCount,
  onClose,
}) => {
  const isBulk = missingCount > 1 || (openLineCount != null && openLineCount > 1);

  return (
    <ModalPortal open={open}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="text-amber-500 flex-shrink-0" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Cost Code Required</h3>
            {isBulk ? (
              <p className="text-sm text-gray-600 mt-2">
                You cannot lock the budget until every open line has a Cost Code.
                {openLineCount != null && (
                  <>
                    {' '}
                    <strong>
                      {missingCount} of {openLineCount} open line{openLineCount === 1 ? '' : 's'}
                    </strong>{' '}
                    {missingCount === 1 ? 'is' : 'are'} missing a cost code.
                  </>
                )}
                {openLineCount == null && (
                  <>
                    {' '}
                    <strong>{missingCount} open lines</strong> are missing a cost code.
                  </>
                )}{' '}
                Add a cost code to each line in the Cost Code column, then try again.
              </p>
            ) : (
              <p className="text-sm text-gray-600 mt-2">
                You cannot commit{' '}
                {lineLabel ? (
                  <>
                    <strong>{lineLabel}</strong>
                  </>
                ) : (
                  'this budget line'
                )}{' '}
                until a Cost Code is associated with it. Enter a cost code in the Cost Code column,
                then try again.
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            OK
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};

export default MissingCostCodeModal;
