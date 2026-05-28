import { useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  isHeaderCategoryLocked,
  getHeaderCategoryTooltip,
  isSidebarItemLocked,
  getSidebarItemTooltip,
} from '../lib/financialGating';
import { FinancialSetupStep } from '../types';

export function useFinancialGating() {
  const ctx = useProject();

  const gatingArgs = useMemo(
    () =>
      [
        ctx.financialSetupStep,
        ctx.contractData,
        ctx.contractLocked,
        ctx.activeView.v3Sheets,
        ctx.sovPublished,
        ctx.activationState,
        ctx.approvalQueue,
        ctx.financialConfig,
      ] as const,
    [
      ctx.financialSetupStep,
      ctx.contractData,
      ctx.contractLocked,
      ctx.activeView.v3Sheets,
      ctx.sovPublished,
      ctx.activationState,
      ctx.approvalQueue,
      ctx.financialConfig,
    ]
  );

  return {
    isHeaderLocked: (categoryKey: string) =>
      isHeaderCategoryLocked(categoryKey, ...gatingArgs),
    headerTooltip: (categoryKey: string) =>
      getHeaderCategoryTooltip(categoryKey, ...gatingArgs),
    isSidebarLocked: (categoryKey: string, itemKey: string) =>
      isSidebarItemLocked(categoryKey, itemKey, ...gatingArgs),
    sidebarTooltip: (categoryKey: string, itemKey: string) =>
      getSidebarItemTooltip(categoryKey, itemKey, ...gatingArgs),
    navigateSidebarItem: (categoryKey: string, itemKey: string) => {
      if (categoryKey !== 'contract') return;
      const stepMap: Record<string, FinancialSetupStep> = {
        primeContract: 2,
        budget: 3,
        sov: 4,
        commitment: 4,
        allocate: 4,
      };
      const step = stepMap[itemKey];
      if (step) {
        const tab =
          itemKey === 'sov'
            ? 'sov'
            : itemKey === 'allocate'
              ? 'schedule'
              : undefined;
        ctx.navigateToSetupStep(step, tab);
      }
    },
  };
}
