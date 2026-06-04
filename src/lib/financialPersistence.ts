const STORAGE_KEY = 'linarc-financial-workflow-v2';

try {
  localStorage.removeItem(STORAGE_KEY);
} catch {
  // ignore — non-browser env or storage blocked
}

export interface PersistedFinancialState {
  financialConfig: unknown;
  contractData: unknown;
  contractLocked: boolean;
  financialSetupStep: number;
  activationState: string;
  sovPublished: boolean;
  approvalQueue: unknown[];
  sovMappings: unknown[];
  budgetScheduleLinks: unknown[];
  hubCollapsed: boolean;
  primeContractSetupPhase: 'choose' | 'review';
  budgetSetupPhase: 'choose' | 'grid';
  v3Sheets: unknown;
  v3ActiveSheetId: string | null;
}

// Persistence intentionally disabled — every reload starts from a clean slate.
// Re-enable by restoring the localStorage read/write below.
export function loadFinancialState(): Partial<PersistedFinancialState> | null {
  return null;
}

export function saveFinancialState(_state: PersistedFinancialState): void {
  // no-op
}

export function reviveContractDates(data: Record<string, unknown> | null) {
  if (!data) return null;
  const dateFields = ['executedDate', 'startDate', 'endDate', 'finalCompletion'] as const;
  const revived = { ...data } as Record<string, unknown>;
  for (const field of dateFields) {
    if (revived[field] && typeof revived[field] === 'string') {
      revived[field] = new Date(revived[field] as string);
    }
  }
  return revived;
}
