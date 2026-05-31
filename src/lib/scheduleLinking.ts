import type {
  ScheduleTask,
  ScheduleAllocation,
  BudgetScheduleLink,
} from '../types';
import type { V3Row } from '../components/views/spreadsheetV4/types';
import { getBudgetLineAmount } from './financialWorkflow';

const CENTS_TOLERANCE = 0.01;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function getTaskCostCode(task: ScheduleTask): string {
  return task.costCode.trim();
}

export function getBudgetRowCostCode(row: V3Row): string {
  return String(row.cells['costCode'] ?? '').trim();
}

/** Tasks that carry a cost code and so can be cost-loaded (excludes blanks like Mobilization). */
export function getCostedTasks(tasks: ScheduleTask[]): ScheduleTask[] {
  return tasks.filter((t) => getTaskCostCode(t) !== '');
}

export function groupTasksByCostCode(tasks: ScheduleTask[]): Record<string, ScheduleTask[]> {
  const groups: Record<string, ScheduleTask[]> = {};
  for (const task of getCostedTasks(tasks)) {
    const code = getTaskCostCode(task);
    (groups[code] ??= []).push(task);
  }
  return groups;
}

/**
 * Spread `amount` across `tasks` weighted by `weightFn`, summing exactly to `amount`
 * (rounding remainder onto the last task). Falls back to equal split when weights are zero.
 */
function distribute(
  amount: number,
  tasks: ScheduleTask[],
  weightFn: (t: ScheduleTask) => number
): ScheduleAllocation[] {
  if (tasks.length === 0) return [];
  const totalWeight = tasks.reduce((sum, t) => sum + weightFn(t), 0);
  let allocated = 0;
  return tasks.map((task, i) => {
    const isLast = i === tasks.length - 1;
    const share = totalWeight > 0 ? weightFn(task) / totalWeight : 1 / tasks.length;
    const amt = isLast ? round2(amount - allocated) : round2(amount * share);
    allocated += amt;
    return { taskId: task.id, amount: amt };
  });
}

export function distributeByHours(amount: number, tasks: ScheduleTask[]): ScheduleAllocation[] {
  return distribute(amount, tasks, (t) => t.plannedHours);
}

export function distributeEqual(amount: number, tasks: ScheduleTask[]): ScheduleAllocation[] {
  return distribute(amount, tasks, () => 1);
}

export function allocationsTotal(allocations: ScheduleAllocation[]): number {
  return allocations.reduce((sum, a) => sum + a.amount, 0);
}

/**
 * Auto-match committed budget lines to schedule tasks via cost code.
 *
 * - Unique code with matching task(s)  → draft, hours-weighted allocations (ready to confirm).
 * - Code shared by 2+ budget lines     → needs_review (collision — user splits the tasks).
 * - Code with no matching task         → needs_review, level_of_effort (spread over timeline).
 */
export function autoMatchBudgetToSchedule(
  committedRows: V3Row[],
  tasks: ScheduleTask[]
): BudgetScheduleLink[] {
  const taskGroups = groupTasksByCostCode(tasks);

  const linesPerCode = committedRows.reduce<Record<string, number>>((acc, row) => {
    const code = getBudgetRowCostCode(row);
    if (code) acc[code] = (acc[code] ?? 0) + 1;
    return acc;
  }, {});

  return committedRows.map((row) => {
    const code = getBudgetRowCostCode(row);
    const amount = getBudgetLineAmount(row);
    const group = taskGroups[code] ?? [];

    if (group.length === 0) {
      return {
        budgetRowId: row.id,
        costCode: code,
        status: 'needs_review',
        method: 'level_of_effort',
        allocations: [],
        loeSpread: null,
      };
    }

    if ((linesPerCode[code] ?? 0) > 1) {
      return {
        budgetRowId: row.id,
        costCode: code,
        status: 'needs_review',
        method: 'manual',
        allocations: [],
      };
    }

    return {
      budgetRowId: row.id,
      costCode: code,
      status: 'draft',
      method: 'by_hours',
      allocations: distributeByHours(amount, group),
    };
  });
}

/**
 * Reconcile links with the current committed rows: keep existing links (preserving user
 * confirmations/splits), auto-match any newly committed line, and drop links whose row is
 * no longer committed. Mirrors syncDraftSovMappings.
 */
export function syncScheduleLinks(
  committedRows: V3Row[],
  tasks: ScheduleTask[],
  existing: BudgetScheduleLink[]
): BudgetScheduleLink[] {
  const existingByRow = new Map(existing.map((l) => [l.budgetRowId, l]));
  const autoByRow = new Map(
    autoMatchBudgetToSchedule(committedRows, tasks).map((l) => [l.budgetRowId, l])
  );
  return committedRows.map((row) => existingByRow.get(row.id) ?? autoByRow.get(row.id)!);
}

export function isLinkFullyAllocated(link: BudgetScheduleLink, lineAmount: number): boolean {
  if (link.method === 'level_of_effort') {
    return Boolean(link.loeSpread);
  }
  return Math.abs(allocationsTotal(link.allocations) - lineAmount) <= CENTS_TOLERANCE;
}

export interface ScheduleCoverage {
  totalAmount: number;
  linkedAmount: number;
  confirmedCount: number;
  reviewCount: number;
  loeCount: number;
  unlinkedRowIds: string[];
}

export function computeScheduleCoverage(
  committedRows: V3Row[],
  links: BudgetScheduleLink[]
): ScheduleCoverage {
  const linkByRow = new Map(links.map((l) => [l.budgetRowId, l]));
  let totalAmount = 0;
  let linkedAmount = 0;
  let confirmedCount = 0;
  let reviewCount = 0;
  let loeCount = 0;
  const unlinkedRowIds: string[] = [];

  for (const row of committedRows) {
    const amount = getBudgetLineAmount(row);
    totalAmount += amount;
    const link = linkByRow.get(row.id);

    if (link?.status === 'confirmed' && isLinkFullyAllocated(link, amount)) {
      linkedAmount += amount;
      confirmedCount++;
    } else {
      unlinkedRowIds.push(row.id);
      if (link?.method === 'level_of_effort') loeCount++;
      else if (link?.status === 'needs_review') reviewCount++;
    }
  }

  return { totalAmount, linkedAmount, confirmedCount, reviewCount, loeCount, unlinkedRowIds };
}

export function allScheduleLinksResolved(
  committedRows: V3Row[],
  links: BudgetScheduleLink[]
): boolean {
  return computeScheduleCoverage(committedRows, links).unlinkedRowIds.length === 0;
}
