import { FinancialSetupStep } from '../types';

export const HEADER_CATEGORY_GATING: Record<string, { minStep: number; tooltip: string }> = {
  contract: { minStep: 0, tooltip: '' },
  configure: { minStep: 0, tooltip: '' },
  ownerBilling: { minStep: 5, tooltip: 'Complete financial setup to access Owner Billing.' },
  subsBilling: { minStep: 5, tooltip: 'Complete financial setup to access Subs Billing.' },
  changeOrder: { minStep: 5, tooltip: 'Complete financial setup to access Change Orders.' },
  recurringCost: { minStep: 5, tooltip: 'Complete financial setup to access Recurring Costs.' },
  costs: { minStep: 5, tooltip: 'Complete financial setup to access Costs tracking.' },
  tm: { minStep: 5, tooltip: 'Complete financial setup to access T&M tracking.' },
  analytics: { minStep: 5, tooltip: 'Complete financial setup to access Analytics.' },
};

export const CONTRACT_SIDEBAR_GATING: Record<string, { minStep: number; tooltip: string }> = {
  primeContract: { minStep: 0, tooltip: '' },
  budget: { minStep: 2, tooltip: 'Lock the Prime Contract first to access Budget Setup.' },
  sov: { minStep: 3, tooltip: 'Lock the Budget first to access the SOV.' },
  commitment: { minStep: 5, tooltip: 'Complete financial setup to access Commitment Release.' },
  adjustment: { minStep: 5, tooltip: 'Complete financial setup to access Adjustment History.' },
  allocate: { minStep: 5, tooltip: 'Complete financial setup to access Budget Allocation.' },
  cls: { minStep: 5, tooltip: 'Complete financial setup to access CLS.' },
  billing: { minStep: 5, tooltip: 'Complete financial setup to access Billing.' },
};

export function isHeaderCategoryLocked(categoryKey: string, step: FinancialSetupStep): boolean {
  const gating = HEADER_CATEGORY_GATING[categoryKey];
  if (!gating) return false;
  return step < gating.minStep;
}

export function getHeaderCategoryTooltip(categoryKey: string, step: FinancialSetupStep): string {
  const gating = HEADER_CATEGORY_GATING[categoryKey];
  if (!gating || !isHeaderCategoryLocked(categoryKey, step)) return '';
  return gating.tooltip;
}

export function isSidebarItemLocked(
  categoryKey: string,
  itemKey: string,
  step: FinancialSetupStep
): boolean {
  if (categoryKey === 'contract') {
    const gating = CONTRACT_SIDEBAR_GATING[itemKey];
    if (!gating) return false;
    return step < gating.minStep;
  }
  const headerGating = HEADER_CATEGORY_GATING[categoryKey];
  if (!headerGating) return false;
  return step < headerGating.minStep;
}

export function getSidebarItemTooltip(
  categoryKey: string,
  itemKey: string,
  step: FinancialSetupStep
): string {
  if (!isSidebarItemLocked(categoryKey, itemKey, step)) return '';

  if (categoryKey === 'contract') {
    const gating = CONTRACT_SIDEBAR_GATING[itemKey];
    return gating?.tooltip ?? '';
  }

  const headerGating = HEADER_CATEGORY_GATING[categoryKey];
  return headerGating?.tooltip ?? '';
}
