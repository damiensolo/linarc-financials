const STORAGE_KEY = 'linarc-financial-workflow-v2';

export interface PersistedFinancialState {
  financialConfig: unknown;
  contractData: unknown;
  contractLocked: boolean;
  financialSetupStep: number;
  activationState: string;
  sovPublished: boolean;
  approvalQueue: unknown[];
  sovMappings: unknown[];
  wbsLinks: unknown[];
  hubCollapsed: boolean;
  primeContractSetupPhase: 'choose' | 'review';
  v3Sheets: unknown;
  v3ActiveSheetId: string | null;
}

export function loadFinancialState(): Partial<PersistedFinancialState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<PersistedFinancialState>;
  } catch {
    return null;
  }
}

export function saveFinancialState(state: PersistedFinancialState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors in prototype
  }
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
