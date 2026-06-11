import {
  ContractData,
  FinancialSetupStep,
  PrimeContractSetupPhase,
  FinancialConfig,
  SOVMapping,
  BudgetScheduleLink,
  ApprovalRequest,
} from '../types';
import { V3Row } from '../components/views/spreadsheetV4/types';
import {
  hasPcValue,
  hasCommittedLines,
  hasSovLines,
  isBudgetFullyLocked,
  getBudgetRows,
  isLineInSov,
  sovLineCount,
  getBudgetLineAmount,
} from './financialWorkflow';
import { isLinkFullyAllocated } from './scheduleLinking';

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
export function getSidebarItemKeyForSetupStep(step: FinancialSetupStep): string {
  switch (step) {
    case 1:
      return 'primeContract';
    case 2:
      return 'budget';
    case 3:
      return 'allocate';
    case 4:
      return 'sov';
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
    check: (ctx) => !hasSovLines(ctx.budgetRows),
    tooltip: 'Lock at least one budget line (Cost Code + Trade) to access SOV mapping.',
  },
  commitment: {
    check: (ctx) => !hasCommittedLines(ctx.budgetRows),
    tooltip: 'Commit a budget line (assign a Subcontractor) to issue subcontracts and POs.',
  },
  adjustment: {
    check: (ctx) => !hasSovLines(ctx.budgetRows),
    tooltip: 'Lock at least one budget line to access Adjustment History.',
  },
  allocate: {
    check: (ctx) => !hasSovLines(ctx.budgetRows),
    tooltip: 'Lock at least one budget line (Cost Code + Trade) to access Budget Allocation.',
  },
  cls: {
    check: (ctx) => !hasSovLines(ctx.budgetRows),
    tooltip: 'Lock at least one budget line to access CLS.',
  },
  billing: {
    check: (ctx) => !hasCommittedLines(ctx.budgetRows),
    tooltip: 'Commit a budget line (assign a Subcontractor) to access Billing.',
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

export interface SetupMilestoneReadiness {
  primeContractValueMet: boolean;
  budgetLinesMet: boolean;
  continuousOpsMet: boolean;
}

/** Setup milestones are complete only after the user advances past that step (or locks PC on step 1). */
export function isPrimeContractReadinessComplete(
  financialSetupStep: FinancialSetupStep,
  contractData: ContractData | null,
  contractLocked: boolean,
  primeContractSetupPhase: PrimeContractSetupPhase
): boolean {
  if (!hasPcValue(contractData)) return false;
  if (financialSetupStep > 1) return true;
  if (financialSetupStep === 1 && contractLocked) return true;
  if (financialSetupStep === 1 && primeContractSetupPhase === 'review') return true;
  return false;
}

export function computeSetupMilestoneReadiness(
  financialSetupStep: FinancialSetupStep,
  contractData: ContractData | null,
  contractLocked: boolean,
  primeContractSetupPhase: PrimeContractSetupPhase,
  lockedLineCount: number,
  canAccessOperations: boolean
): SetupMilestoneReadiness {
  return {
    primeContractValueMet: isPrimeContractReadinessComplete(
      financialSetupStep,
      contractData,
      contractLocked,
      primeContractSetupPhase
    ),
    budgetLinesMet: financialSetupStep >= 2 && lockedLineCount > 0,
    continuousOpsMet: financialSetupStep >= 3 && canAccessOperations,
  };
}

export function computePublishReadiness(
  budgetRows: V3Row[],
  sovMappings: SOVMapping[],
  scheduleLinks: BudgetScheduleLink[],
  approvalQueue: ApprovalRequest[],
  options: { contractLocked?: boolean } = {}
): import('../types').PublishReadinessCheck[] {
  const { contractLocked = false } = options;
  const budgetFullyLocked = isBudgetFullyLocked(budgetRows);
  const sovLines = sovLineCount(budgetRows);

  // The SOV is built from every line locked into it (locked, pending, or committed).
  const sovRowIds = budgetRows.filter(isLineInSov).map((r) => r.id);

  // SOV lines stay draft until publish, so readiness only requires a line per locked budget line.
  const unmappedSov = sovRowIds.filter((id) => !sovMappings.some((m) => m.rowId === id)).length;

  const unlinkedSchedule = budgetRows
    .filter(isLineInSov)
    .filter((row) => {
      const link = scheduleLinks.find((l) => l.budgetRowId === row.id);
      return !link || link.status !== 'confirmed' || !isLinkFullyAllocated(link, getBudgetLineAmount(row));
    }).length;

  const pendingApprovals = approvalQueue.filter((a) => a.status === 'pending').length;
  const pendingPcChanges = approvalQueue.filter(
    (a) => a.type === 'pc_value_change' && a.status === 'pending'
  ).length;

  return [
    {
      id: 'prime-contract-locked',
      label: contractLocked
        ? 'Prime Contract locked as baseline'
        : 'Lock Prime Contract before publishing SOV',
      met: contractLocked,
      actionStep: 1,
    },
    {
      id: 'budget-locked',
      label: budgetFullyLocked
        ? 'All budget lines locked into the SOV'
        : 'Lock every open budget line (Cost Code + Trade) before publishing SOV',
      met: budgetFullyLocked,
      actionStep: 2,
    },
    {
      id: 'sov-mapped',
      label:
        unmappedSov === 0
          ? 'Every locked line has a Schedule of Values entry'
          : `${unmappedSov} locked line(s) missing an SOV entry — click to open Schedule of Values`,
      met: unmappedSov === 0 && sovLines > 0,
      actionStep: 4,
      actionTab: 'sov',
    },
    {
      id: 'wbs-linked',
      label:
        unlinkedSchedule === 0
          ? 'All locked lines allocated to the schedule'
          : `${unlinkedSchedule} locked line(s) not yet allocated to the schedule — click to open Schedule Linking & Allocation`,
      met: unlinkedSchedule === 0 && sovLines > 0,
      actionStep: 3,
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
