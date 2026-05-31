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

      // Post-publish: sidebar selection drives which financial section is shown,
      // not the setup-step flow.
      if (ctx.financialSetupComplete) {
        ctx.setActiveFinancialSection(itemKey);
        ctx.setHubCollapsed(false);
        if (itemKey === 'sov' || itemKey === 'allocate') {
          ctx.setOpsActiveTab(itemKey === 'allocate' ? 'schedule' : 'sov');
        }
        return;
      }

      const stepMap: Record<string, FinancialSetupStep> = {
        primeContract: 2,
        budget: 3,
        sov: 4,
        commitment: 5,
        allocate: 5,
      };
      const step = stepMap[itemKey];
      if (step) {
        ctx.navigateToSetupStep(step);
      }
    },
  };
}
