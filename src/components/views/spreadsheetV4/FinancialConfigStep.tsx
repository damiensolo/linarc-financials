import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { createDefaultFinancialConfig } from '../../../lib/financialWorkflow';
import { APPROVAL_WORKFLOWS, approvalWorkflowLabel } from '../../../data/approvalWorkflows';

const FinancialConfigStep: React.FC = () => {
  const { financialConfig, setFinancialConfig, setFinancialSetupStep, setPrimeContractSetupPhase } = useProject();
  const defaults = financialConfig ?? createDefaultFinancialConfig();

  const [retainage, setRetainage] = useState(defaults.defaultRetainage);
  const [overhead, setOverhead] = useState(defaults.defaultOverhead);
  const [billingDay, setBillingDay] = useState(defaults.billingCutoffDay);
  const [allowMultiplePayApps, setAllowMultiplePayApps] = useState(defaults.allowMultiplePayApps);
  const [approvalWorkflowId, setApprovalWorkflowId] = useState(defaults.approvalWorkflowId ?? '');

  const saveConfig = () => {
    setFinancialConfig({
      defaultRetainage: retainage,
      defaultOverhead: overhead,
      billingCutoffDay: billingDay,
      allowMultiplePayApps,
      perLineApprovalEnabled: approvalWorkflowId !== '',
      approvalRouting: defaults.approvalRouting,
      approvalWorkflowId: approvalWorkflowId || null,
      costCodeEnforcementConfirmed: true,
    });
    setPrimeContractSetupPhase('choose');
    setFinancialSetupStep(2);
  };

  const isValid = retainage >= 0 && overhead >= 0 && billingDay >= 1 && billingDay <= 28;

  return (
    <div className="max-w-lg w-full">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Preliminary Configuration</h2>
      <p className="text-gray-600 mb-6">Set global financial controls before contract and budget work.</p>

      <form onSubmit={(e) => { e.preventDefault(); saveConfig(); }} className="space-y-4">
        <div>
          <label htmlFor="retainage" className="block text-sm font-medium text-gray-700 mb-1">Default Retainage (%)</label>
          <input id="retainage" type="number" min="0" max="100" step="0.5" value={retainage}
            onChange={(e) => setRetainage(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="overhead" className="block text-sm font-medium text-gray-700 mb-1">Default Overhead (%)</label>
          <input id="overhead" type="number" min="0" max="100" step="0.5" value={overhead}
            onChange={(e) => setOverhead(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="billingDay" className="block text-sm font-medium text-gray-700 mb-1">Billing Cutoff Day</label>
          <input id="billingDay" type="number" min="1" max="28" value={billingDay}
            onChange={(e) => setBillingDay(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
        </div>

        <label className="flex items-center gap-3 cursor-pointer py-1">
          <input type="checkbox" checked={allowMultiplePayApps}
            onChange={(e) => setAllowMultiplePayApps(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 accent-blue-600" />
          <span className="text-sm font-medium text-gray-700">Allow Multiple Pay Applications per Month</span>
        </label>

        <div className="border-t border-gray-200 pt-4">
          <label htmlFor="approvalWorkflow" className="block text-sm font-medium text-gray-700 mb-1">
            Per-Line Approval Workflow
          </label>
          <select
            id="approvalWorkflow"
            value={approvalWorkflowId}
            onChange={(e) => setApprovalWorkflowId(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-md pl-3 pr-9 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1rem',
            }}
          >
            <option value="">No approval required (commits lock immediately)</option>
            {APPROVAL_WORKFLOWS.map((wf) => (
              <option key={wf.id} value={wf.id}>{approvalWorkflowLabel(wf)}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Choose an approval chain from the workflow engine. When set, each budget line commit is routed
            through this workflow before it locks.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 mb-2">Cost Code Enforcement</p>
          <p className="text-xs text-blue-800">
            Cost codes are mandatory on every budget line and schedule activity. This enables budget-to-schedule auto-allocation.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => { setPrimeContractSetupPhase('choose'); setFinancialSetupStep(2); }}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50">
            Skip for Now
          </button>
          <button type="submit" disabled={!isValid}
            className="flex-1 py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2">
            Continue <ChevronRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default FinancialConfigStep;
