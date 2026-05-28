import {
  ContractData,
  FinancialSetupStep,
  FinancialConfig,
  SOVMapping,
  WBSLink,
  ApprovalRequest,
} from '../types';
import { V3Row } from '../components/views/spreadsheetV4/types';
import {
  hasPcValue,
  hasCommittedLines,
  isBudgetFullyLocked,
  getBudgetRows,
  committedLineCount,
  countLinesByState,
} from './financialWorkflow';

export interface GatingContext {
  financialSetupStep: FinancialSetupStep;
  contractData: ContractData | null;
  contractLocked: boolean;
  budgetRows: V3Row[];
  sovPublished: boolean;
  activationState: 'setup' | 'operating' | 'activated';
  approvalQueue: ApprovalRequest[];
  financialConfig: FinancialConfig | null;
}

/** Maps setup step (and ops tab) to the contract sidebar item key for active-state sync. */
export function getSidebarItemKeyForSetupStep(
  step: FinancialSetupStep,
  opsActiveTab: 'sov' | 'schedule' = 'sov'
): string {
  switch (step) {
    case 1:
    case 2:
      return 'primeContract';
    case 3:
      return 'budget';
    case 4:
      return opsActiveTab === 'schedule' ? 'allocate' : 'sov';
    case 5:
      return 'sov';
    default:
      return 'primeContract';
  }
}

export const HEADER_CATEGORY_GATING: Record<
  string,
  { check: (ctx: GatingContext) => boolean; tooltip: string }
> = {
  contract: { check: () => false, tooltip: '' },
  configure: { check: () => false, tooltip: '' },
  ownerBilling: {
    check: (ctx) =>
      !ctx.sovPublished ||
      !ctx.contractLocked ||
      !isBudgetFullyLocked(ctx.budgetRows),
    tooltip:
      'Owner billing requires a locked Prime Contract, fully committed budget, and published SOV.',
  },
  subsBilling: {
    check: (ctx) => !hasCommittedLines(ctx.budgetRows),
    tooltip: 'Commit at least one budget line to access Subs Billing.',
  },
  changeOrder: {
    check: (ctx) => !hasCommittedLines(ctx.budgetRows),
    tooltip: 'Commit at least one budget line to access Change Orders.',
  },
  recurringCost: {
    check: (ctx) => !hasCommittedLines(ctx.budgetRows),
    tooltip: 'Commit at least one budget line to access Recurring Costs.',
  },
  costs: {
    check: (ctx) => !hasCommittedLines(ctx.budgetRows),
    tooltip: 'Commit at least one budget line to access Costs tracking.',
  },
  tm: {
    check: (ctx) => !hasCommittedLines(ctx.budgetRows),
    tooltip: 'Commit at least one budget line to access T&M tracking.',
  },
  analytics: {
    check: (ctx) => ctx.activationState !== 'activated',
    tooltip: 'Publish SOV to activate analytics.',
  },
};

export const CONTRACT_SIDEBAR_GATING: Record<
  string,
  { check: (ctx: GatingContext) => boolean; tooltip: string }
> = {
  primeContract: { check: () => false, tooltip: '' },
  budget: {
    check: (ctx) => !hasPcValue(ctx.contractData),
    tooltip: 'Enter a Prime Contract Value to access Budget Setup.',
  },
  sov: {
    check: (ctx) => !hasCommittedLines(ctx.budgetRows),
    tooltip: 'Commit budget lines to access SOV mapping.',
  },
  commitment: {
    check: (ctx) => !hasCommittedLines(ctx.budgetRows),
    tooltip: 'Commit budget lines to issue subcontracts and POs.',
  },
  adjustment: {
    check: (ctx) => !hasCommittedLines(ctx.budgetRows),
    tooltip: 'Commit budget lines to access Adjustment History.',
  },
  allocate: {
    check: (ctx) => !hasCommittedLines(ctx.budgetRows),
    tooltip: 'Commit budget lines to access Budget Allocation.',
  },
  cls: {
    check: (ctx) => !hasCommittedLines(ctx.budgetRows),
    tooltip: 'Commit budget lines to access CLS.',
  },
  billing: {
    check: (ctx) => !hasCommittedLines(ctx.budgetRows),
    tooltip: 'Commit budget lines to access Billing.',
  },
};

function buildGatingContext(
  step: FinancialSetupStep,
  contractData: ContractData | null,
  contractLocked: boolean,
  budgetRows: V3Row[],
  sovPublished: boolean,
  activationState: 'setup' | 'operating' | 'activated',
  approvalQueue: ApprovalRequest[],
  financialConfig: FinancialConfig | null
): GatingContext {
  return {
    financialSetupStep: step,
    contractData,
    contractLocked,
    budgetRows,
    sovPublished,
    activationState,
    approvalQueue,
    financialConfig,
  };
}

export function isHeaderCategoryLocked(
  categoryKey: string,
  step: FinancialSetupStep,
  contractData: ContractData | null,
  contractLocked: boolean,
  sheets: import('../components/views/spreadsheetV4/types').V3Sheet[] | null | undefined,
  sovPublished: boolean,
  activationState: 'setup' | 'operating' | 'activated',
  approvalQueue: ApprovalRequest[],
  financialConfig: FinancialConfig | null
): boolean {
  const gating = HEADER_CATEGORY_GATING[categoryKey];
  if (!gating) return false;
  const ctx = buildGatingContext(
    step,
    contractData,
    contractLocked,
    getBudgetRows(sheets),
    sovPublished,
    activationState,
    approvalQueue,
    financialConfig
  );
  return gating.check(ctx);
}

export function getHeaderCategoryTooltip(
  categoryKey: string,
  step: FinancialSetupStep,
  contractData: ContractData | null,
  contractLocked: boolean,
  sheets: import('../components/views/spreadsheetV4/types').V3Sheet[] | null | undefined,
  sovPublished: boolean,
  activationState: 'setup' | 'operating' | 'activated',
  approvalQueue: ApprovalRequest[],
  financialConfig: FinancialConfig | null
): string {
  const gating = HEADER_CATEGORY_GATING[categoryKey];
  if (!gating) return '';
  const ctx = buildGatingContext(
    step,
    contractData,
    contractLocked,
    getBudgetRows(sheets),
    sovPublished,
    activationState,
    approvalQueue,
    financialConfig
  );
  return gating.check(ctx) ? gating.tooltip : '';
}

export function isSidebarItemLocked(
  categoryKey: string,
  itemKey: string,
  step: FinancialSetupStep,
  contractData: ContractData | null,
  contractLocked: boolean,
  sheets: import('../components/views/spreadsheetV4/types').V3Sheet[] | null | undefined,
  sovPublished: boolean,
  activationState: 'setup' | 'operating' | 'activated',
  approvalQueue: ApprovalRequest[],
  financialConfig: FinancialConfig | null
): boolean {
  const ctx = buildGatingContext(
    step,
    contractData,
    contractLocked,
    getBudgetRows(sheets),
    sovPublished,
    activationState,
    approvalQueue,
    financialConfig
  );

  if (categoryKey === 'contract') {
    const gating = CONTRACT_SIDEBAR_GATING[itemKey];
    if (!gating) return false;
    return gating.check(ctx);
  }

  const headerGating = HEADER_CATEGORY_GATING[categoryKey];
  if (!headerGating) return false;
  return headerGating.check(ctx);
}

export function getSidebarItemTooltip(
  categoryKey: string,
  itemKey: string,
  step: FinancialSetupStep,
  contractData: ContractData | null,
  contractLocked: boolean,
  sheets: import('../components/views/spreadsheetV4/types').V3Sheet[] | null | undefined,
  sovPublished: boolean,
  activationState: 'setup' | 'operating' | 'activated',
  approvalQueue: ApprovalRequest[],
  financialConfig: FinancialConfig | null
): string {
  if (
    !isSidebarItemLocked(
      categoryKey,
      itemKey,
      step,
      contractData,
      contractLocked,
      sheets,
      sovPublished,
      activationState,
      approvalQueue,
      financialConfig
    )
  ) {
    return '';
  }

  if (categoryKey === 'contract') {
    const gating = CONTRACT_SIDEBAR_GATING[itemKey];
    return gating?.tooltip ?? '';
  }

  const headerGating = HEADER_CATEGORY_GATING[categoryKey];
  return headerGating?.tooltip ?? '';
}

export function computePublishReadiness(
  budgetRows: V3Row[],
  sovMappings: SOVMapping[],
  wbsLinks: WBSLink[],
  approvalQueue: ApprovalRequest[],
  commitThresholdPercent = 100
): import('../types').PublishReadinessCheck[] {
  const counts = countLinesByState(budgetRows);
  const committed = committedLineCount(budgetRows);
  const thresholdMet =
    counts.total === 0
      ? false
      : (committed / counts.total) * 100 >= commitThresholdPercent;

  const committedIds = budgetRows
    .filter((r) => (r.lineState ?? 'open') === 'locked')
    .map((r) => r.id);

  const unmappedSov = committedIds.filter(
    (id) => !sovMappings.some((m) => m.rowId === id)
  ).length;

  const unlinkedWbs = committedIds.filter(
    (id) => !wbsLinks.some((l) => l.rowId === id)
  ).length;

  const pendingApprovals = approvalQueue.filter((a) => a.status === 'pending').length;
  const pendingPcChanges = approvalQueue.filter(
    (a) => a.type === 'pc_value_change' && a.status === 'pending'
  ).length;

  return [
    {
      id: 'commit-threshold',
      label: `${committed} of ${counts.total} budget lines committed (${commitThresholdPercent}% required)`,
      met: thresholdMet,
      actionStep: 3,
    },
    {
      id: 'sov-mapped',
      label:
        unmappedSov === 0
          ? 'All committed lines mapped to SOV'
          : `${unmappedSov} committed line(s) not mapped to SOV — click to open SOV Mapping`,
      met: unmappedSov === 0 && committed > 0,
      actionStep: 4,
      actionTab: 'sov',
    },
    {
      id: 'wbs-linked',
      label:
        unlinkedWbs === 0
          ? 'All committed lines linked to WBS'
          : `${unlinkedWbs} committed line(s) missing WBS links — click to open Schedule Linking`,
      met: unlinkedWbs === 0 && committed > 0,
      actionStep: 4,
      actionTab: 'schedule',
    },
    {
      id: 'no-pending-approvals',
      label:
        pendingApprovals === 0
          ? 'No outstanding approvals'
          : `${pendingApprovals} approval(s) pending`,
      met: pendingApprovals === 0,
    },
    {
      id: 'no-pc-change-pending',
      label:
        pendingPcChanges === 0
          ? 'No pending PC Value change approvals'
          : `${pendingPcChanges} PC Value change(s) pending approval`,
      met: pendingPcChanges === 0,
    },
  ];
}

export function allPublishChecksMet(checks: import('../types').PublishReadinessCheck[]): boolean {
  return checks.length > 0 && checks.every((c) => c.met);
}
