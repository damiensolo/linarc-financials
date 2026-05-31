import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { createDefaultFinancialConfig } from '../../../lib/financialWorkflow';
import type { ApprovalRole } from '../../../types';

const ROLES: { id: ApprovalRole; label: string }[] = [
  { id: 'gc', label: 'General Contractor (PM)' },
  { id: 'pe', label: 'Project Executive' },
  { id: 'owner', label: 'Owner' },
];

const FinancialConfigStep: React.FC = () => {
  const { financialConfig, setFinancialConfig, setFinancialSetupStep, setPrimeContractSetupPhase } = useProject();
  const defaults = financialConfig ?? createDefaultFinancialConfig();

  const [retainage, setRetainage] = useState(defaults.defaultRetainage);
  const [overhead, setOverhead] = useState(defaults.defaultOverhead);
  const [billingDay, setBillingDay] = useState(defaults.billingCutoffDay);
  const [allowMultiplePayApps, setAllowMultiplePayApps] = useState(defaults.allowMultiplePayApps);
  const [perLineApproval, setPerLineApproval] = useState(defaults.perLineApprovalEnabled);
  const [requireAllApprovers, setRequireAllApprovers] = useState(defaults.approvalRouting.requireAll);
  const [selectedRoles, setSelectedRoles] = useState<ApprovalRole[]>(defaults.approvalRouting.roles);

  const toggleRole = (role: ApprovalRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const saveConfig = () => {
    setFinancialConfig({
      defaultRetainage: retainage,
      defaultOverhead: overhead,
      billingCutoffDay: billingDay,
      allowMultiplePayApps,
      perLineApprovalEnabled: perLineApproval,
      approvalRouting: { roles: selectedRoles.length ? selectedRoles : ['gc'], requireAll: requireAllApprovers },
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
            className="w-4 h-4 rounded border-gray-300 text-orange-500" />
          <span className="text-sm font-medium text-gray-700">Allow Multiple Pay Applications per Month</span>
        </label>

        <div className="border-t border-gray-200 pt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={perLineApproval}
              onChange={(e) => setPerLineApproval(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Per-Line Approval Workflow</span>
          </label>
          <p className="text-xs text-gray-500 ml-7 mt-1">When enabled, each budget line commit requires approval before locking.</p>
        </div>

        {perLineApproval && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-gray-800">Approval Routing (PC Value changes &amp; per-line commits)</p>
            {ROLES.map((role) => (
              <label key={role.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={selectedRoles.includes(role.id)}
                  onChange={() => toggleRole(role.id)} className="rounded border-gray-300" />
                {role.label}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={requireAllApprovers}
                onChange={(e) => setRequireAllApprovers(e.target.checked)} className="rounded border-gray-300" />
              Require all selected approvers (uncheck = any one suffices)
            </label>
          </div>
        )}

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
