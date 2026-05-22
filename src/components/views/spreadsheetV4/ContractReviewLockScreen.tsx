import React from 'react';
import { motion } from 'framer-motion';
import { useProject } from '../../../context/ProjectContext';
import ContractMetadataBar from './ContractMetadataBar';
import { ChevronRightIcon } from '../../common/Icons';

const ContractReviewLockScreen: React.FC = () => {
  const { contractData, contractLocked, setContractLocked, setFinancialSetupStep } = useProject();

  if (!contractData) return null;

  const handleLockContract = () => {
    setContractLocked(true);
  };

  const handleProceed = () => {
    setFinancialSetupStep(3);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col bg-white"
    >
      {/* Metadata Bar (Sticky Header) */}
      <ContractMetadataBar isLocked={contractLocked} isEditable={!contractLocked} />

      {/* Info Section */}
      <div className="flex-1 flex items-center justify-center px-6 py-4">
        <div className="max-w-md text-center space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Contract Details Reviewed</h3>
          <p className="text-sm text-gray-600">
            Review your contract metadata above. Once you're satisfied with the contract sum, dates, owner, and contractor information, lock the contract to proceed to budget setup.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-900">
              💡 Contract data can be edited until locked. Budget line items will be configured in the next step.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          {contractLocked ? (
            <span className="text-green-700 font-medium">✓ Contract locked and ready for budget setup</span>
          ) : (
            <span>Lock the contract to proceed to Step 3: Budget Setup</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLockContract}
            disabled={contractLocked}
            className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Lock Contract
          </button>
          {contractLocked && (
            <button
              onClick={handleProceed}
              className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Proceed to Budget Setup
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ContractReviewLockScreen;
