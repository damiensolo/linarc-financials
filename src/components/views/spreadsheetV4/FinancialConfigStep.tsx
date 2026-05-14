import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';

const FinancialConfigStep: React.FC = () => {
  const { financialConfig, setFinancialConfig, setFinancialSetupStep } = useProject();

  const [retainage, setRetainage] = useState(financialConfig?.defaultRetainage ?? 10);
  const [overhead, setOverhead] = useState(financialConfig?.defaultOverhead ?? 5);
  const [billingDay, setBillingDay] = useState(financialConfig?.billingCutoffDay ?? 1);
  const [allowMultiplePayApps, setAllowMultiplePayApps] = useState(
    financialConfig?.allowMultiplePayApps ?? true
  );

  const handleSave = () => {
    setFinancialConfig({
      defaultRetainage: retainage,
      defaultOverhead: overhead,
      billingCutoffDay: billingDay,
      allowMultiplePayApps,
    });
    setFinancialSetupStep(1);
  };

  const handleSkip = () => {
    setFinancialSetupStep(1);
  };

  const isValid = retainage >= 0 && overhead >= 0 && billingDay >= 1 && billingDay <= 28;

  return (
    <div className="max-w-md w-full">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Preliminary Configuration
      </h2>
      <p className="text-gray-600 mb-6">
        Set your default financial parameters for this project.
      </p>

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
        {/* Default Retainage */}
        <div>
          <label htmlFor="retainage" className="block text-sm font-medium text-gray-700 mb-2">
            Default Retainage (%)
          </label>
          <input
            id="retainage"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={retainage}
            onChange={(e) => setRetainage(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Amount withheld from each payment (typically 5-10%)
          </p>
        </div>

        {/* Default Overhead */}
        <div>
          <label htmlFor="overhead" className="block text-sm font-medium text-gray-700 mb-2">
            Default Overhead (%)
          </label>
          <input
            id="overhead"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={overhead}
            onChange={(e) => setOverhead(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Standard overhead markup for all line items
          </p>
        </div>

        {/* Billing Cutoff Day */}
        <div>
          <label htmlFor="billingDay" className="block text-sm font-medium text-gray-700 mb-2">
            Billing Cutoff Day of Month
          </label>
          <input
            id="billingDay"
            type="number"
            min="1"
            max="28"
            value={billingDay}
            onChange={(e) => setBillingDay(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Day of the month when invoicing periods end (1-28)
          </p>
        </div>

        {/* Allow Multiple Pay Apps */}
        <div className="py-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowMultiplePayApps}
              onChange={(e) => setAllowMultiplePayApps(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Allow Multiple Pay Applications per Month
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-2 ml-7">
            If checked, contractors can submit multiple invoices for the same month
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleSkip}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            Skip for Now
          </button>
          <button
            type="submit"
            disabled={!isValid}
            className="flex-1 py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-default flex items-center justify-center gap-2"
          >
            Continue
            <ChevronRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default FinancialConfigStep;
