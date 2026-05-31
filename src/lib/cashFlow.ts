import type { BudgetScheduleLink, ScheduleTask } from '../types';
import type { V3Row } from '../components/views/spreadsheetV4/types';
import { getBudgetLineAmount } from './financialWorkflow';

export interface CashFlowBucket {
  key: string; // 'YYYY-MM'
  label: string; // 'Jun 2026'
  amount: number; // spend in this month
  cumulative: number; // running total through this month
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysInclusive(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** Spread `amount` evenly across calendar days of [startISO, endISO] into monthly buckets. */
function spreadAcrossMonths(amount: number, startISO: string, endISO: string, into: Map<string, number>) {
  if (!startISO || !endISO || amount === 0) return;
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  if (end < start) return;

  const totalDays = daysInclusive(start, end);
  const daily = amount / totalDays;

  let cursor = new Date(start);
  while (cursor <= end) {
    const lastOfMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const segEnd = lastOfMonth < end ? lastOfMonth : end;
    const segDays = daysInclusive(cursor, segEnd);
    const key = monthKey(cursor);
    into.set(key, (into.get(key) ?? 0) + daily * segDays);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
}

/**
 * Time-phase the cost-loaded schedule into monthly buckets with a cumulative S-curve.
 * Per-task allocations spread across each task's duration; level-of-effort lines spread
 * the whole line amount evenly across their loeSpread window.
 */
export function computeCashFlow(
  links: BudgetScheduleLink[],
  tasks: ScheduleTask[],
  committedRows: V3Row[]
): { buckets: CashFlowBucket[]; total: number } {
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const rowById = new Map(committedRows.map((r) => [r.id, r]));
  const monthly = new Map<string, number>();

  for (const link of links) {
    if (link.method === 'level_of_effort') {
      if (!link.loeSpread) continue;
      const row = rowById.get(link.budgetRowId);
      const amount = row ? getBudgetLineAmount(row) : 0;
      spreadAcrossMonths(amount, link.loeSpread.from, link.loeSpread.to, monthly);
      continue;
    }
    for (const alloc of link.allocations) {
      const task = taskById.get(alloc.taskId);
      if (!task) continue;
      spreadAcrossMonths(alloc.amount, task.planStart, task.planEnd, monthly);
    }
  }

  const keys = [...monthly.keys()].sort();
  let cumulative = 0;
  const buckets = keys.map((key) => {
    const amount = monthly.get(key) ?? 0;
    cumulative += amount;
    return { key, label: monthLabel(key), amount, cumulative };
  });

  const total = cumulative;
  return { buckets, total };
}

/**
 * First monthly bucket at or above `pct`% of total — the projected month the cost-loaded
 * curve reaches a draw's trigger threshold. Returns null when nothing is loaded yet.
 */
export function projectedDrawMonth(
  buckets: CashFlowBucket[],
  total: number,
  pct: number
): string | null {
  if (total <= 0) return null;
  if (pct <= 0) return 'At execution';
  const target = (pct / 100) * total;
  const hit = buckets.find((b) => b.cumulative >= target - 0.01);
  return hit ? hit.label : null;
}
