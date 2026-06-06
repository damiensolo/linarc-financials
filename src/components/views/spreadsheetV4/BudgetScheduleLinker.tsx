import React, { useMemo, useState } from 'react';
import {
  ChevronDown, ChevronRight, Link2, AlertTriangle, Clock, CheckCircle2,
  ListChecks, TrendingUp, SlidersHorizontal, Users,
} from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { getLineState, getBudgetLineAmount, SUBCONTRACTOR_FIELD } from '../../../lib/financialWorkflow';
import {
  computeScheduleCoverage,
  isLinkFullyAllocated,
  allocationsTotal,
  distributeByHours,
  distributeEqual,
} from '../../../lib/scheduleLinking';
import type { BudgetScheduleLink, ScheduleTask, ScheduleAllocation } from '../../../types';
import type { V3Row } from './types';
import { formatCurrency } from './spreadsheetTableUtils';
import CashFlowPreview from './CashFlowPreview';

const fmtDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const round2 = (n: number) => Math.round(n * 100) / 100;
const isUnitTask = (t: ScheduleTask) => /^unit\b/i.test(t.name);

function taskGroupFor(link: BudgetScheduleLink, tasks: ScheduleTask[]): ScheduleTask[] {
  if (!link.costCode) return [];
  return tasks.filter((t) => t.costCode.trim() === link.costCode);
}

function dateRange(tasks: ScheduleTask[]): string {
  if (tasks.length === 0) return '—';
  const starts = tasks.map((t) => t.planStart).sort();
  const ends = tasks.map((t) => t.planEnd).sort();
  return `${fmtDate(starts[0])} – ${fmtDate(ends[ends.length - 1])}`;
}

// ── Mini-gantt (Concept A: inline task bars) ───────────────────────────────
const DAY = 86_400_000;
const toTime = (iso: string) => new Date(iso + 'T00:00:00').getTime();

// Card-local time domain spanning the group's earliest start to latest end.
function timelineDomain(tasks: ScheduleTask[]): { start: number; end: number } | null {
  if (tasks.length === 0) return null;
  let start = Infinity;
  let end = -Infinity;
  for (const t of tasks) {
    start = Math.min(start, toTime(t.planStart));
    end = Math.max(end, toTime(t.planEnd));
  }
  if (!isFinite(start) || !isFinite(end)) return null;
  if (end <= start) end = start + 7 * DAY; // pad zero/negative spans so bars render
  return { start, end };
}

// Month-boundary tick marks strictly inside (start, end), as % offsets.
function monthTicks(start: number, end: number): { pct: number; label: string }[] {
  const span = end - start;
  const ticks: { pct: number; label: string }[] = [];
  const d = new Date(start);
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  while (d.getTime() < end) {
    ticks.push({
      pct: ((d.getTime() - start) / span) * 100,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
    });
    d.setMonth(d.getMonth() + 1);
  }
  return ticks;
}

// Shared bar track: faint month gridlines + one duration bar.
// Allocated → blue (saturation scales with the $ share); unallocated → grey.
const GanttTrack: React.FC<{
  start: number;
  span: number;
  ticks: { pct: number; label: string }[];
  task: ScheduleTask;
  allocated: number;
  intensity: number;
}> = ({ start, span, ticks, task, allocated, intensity }) => {
  const left = ((toTime(task.planStart) - start) / span) * 100;
  const width = Math.max(((toTime(task.planEnd) - toTime(task.planStart)) / span) * 100, 1.5);
  return (
    <div className="flex-[2] relative self-stretch min-h-[20px]" title={`${fmtDate(task.planStart)} – ${fmtDate(task.planEnd)}`}>
      {ticks.map((t) => (
        <div key={t.pct} className="absolute inset-y-0 w-px bg-gray-100" style={{ left: `${t.pct}%` }} />
      ))}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-3 rounded-sm transition-colors"
        style={{
          left: `${left}%`,
          width: `${width}%`,
          backgroundColor:
            allocated > 0 ? `rgba(96, 165, 250, ${0.3 + 0.4 * intensity})` : 'rgba(148, 163, 184, 0.25)',
        }}
      />
    </div>
  );
};

// Month-label header that lines up over a GanttTrack column.
const TimelineMonths: React.FC<{ ticks: { pct: number; label: string }[] }> = ({ ticks }) => (
  <div className="flex-[2] relative h-3">
    {ticks.map((t) => (
      <span
        key={`${t.label}-${t.pct}`}
        className="absolute top-0 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wide text-gray-600"
        style={{ left: `${t.pct}%` }}
      >
        {t.label}
      </span>
    ))}
  </div>
);

const AllocationTimeline: React.FC<{
  tasks: ScheduleTask[];
  allocByTask: Map<string, number>;
}> = ({ tasks, allocByTask }) => {
  const domain = timelineDomain(tasks);
  if (!domain) return null;
  const { start, end } = domain;
  const span = end - start;
  const ticks = monthTicks(start, end);
  const maxAlloc = tasks.reduce((m, t) => Math.max(m, allocByTask.get(t.id) ?? 0), 0);

  return (
    <div className="border-t border-gray-100">
      <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 border-b border-gray-100">
        <span className="flex-1 min-w-0 text-[10px] font-semibold uppercase tracking-wide text-gray-600">Task</span>
        <TimelineMonths ticks={ticks} />
        <span className="w-24 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-600">Allocated</span>
      </div>

      {tasks.map((task) => {
        const alloc = allocByTask.get(task.id) ?? 0;
        return (
          <div key={task.id} className="flex items-stretch gap-3 px-3 py-1.5 border-b border-gray-100 last:border-b-0 text-sm">
            <span className="flex-1 min-w-0 self-center truncate text-gray-700">{task.name}</span>
            <GanttTrack
              start={start}
              span={span}
              ticks={ticks}
              task={task}
              allocated={alloc}
              intensity={maxAlloc > 0 ? alloc / maxAlloc : 0}
            />
            <span className="font-mono text-gray-900 w-24 text-right self-center flex-shrink-0">
              ${formatCurrency(alloc)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

interface RowProps {
  row: V3Row;
  link: BudgetScheduleLink | undefined;
  tasks: ScheduleTask[];
  siblings: string[];
}

const LinkRow: React.FC<RowProps> = ({ row, link, tasks, siblings }) => {
  const { confirmScheduleLink, setScheduleLinkMethod, updateScheduleLink, setScheduleAllocations, contractData } =
    useProject();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [included, setIncluded] = useState<Set<string>>(new Set());
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const name = String(row.cells['name'] ?? 'Line');
  const code = String(row.cells['costCode'] ?? '');
  const subcontractor = String(row.cells[SUBCONTRACTOR_FIELD] ?? '');
  const amount = getBudgetLineAmount(row);
  const group = link ? taskGroupFor(link, tasks) : [];
  const allocByTask = new Map<string, number>(
    (link?.allocations ?? []).map((a) => [a.taskId, a.amount])
  );
  const allocated = allocationsTotal(link?.allocations ?? []);
  const fullyAllocated = link ? isLinkFullyAllocated(link, amount) : false;

  const isConfirmed = link?.status === 'confirmed';
  const isLoe = link?.method === 'level_of_effort';
  const isReview = link?.status === 'needs_review';

  // ── Manual split editor ──────────────────────────────────────────────────
  const startEditing = () => {
    const seedIncluded = new Set(
      (link?.allocations ?? []).length > 0 ? (link?.allocations ?? []).map((a) => a.taskId) : group.map((t) => t.id)
    );
    const seedAmounts: Record<string, string> = {};
    group.forEach((t) => {
      const a = allocByTask.get(t.id);
      seedAmounts[t.id] = a != null ? String(a) : '';
    });
    setIncluded(seedIncluded);
    setAmounts(seedAmounts);
    setEditing(true);
    setExpanded(true);
  };

  const editingTotal = round2(
    group.reduce((sum, t) => (included.has(t.id) ? sum + (parseFloat(amounts[t.id]) || 0) : sum), 0)
  );
  const editingRemaining = round2(amount - editingTotal);
  const canSave = Math.abs(editingRemaining) <= 0.01 && included.size > 0;

  // Timeline for the split editor — domain over the whole group so the axis is
  // stable as tasks toggle; bar colour tracks the live input value.
  const editDomain = timelineDomain(group);
  const editTicks = editDomain ? monthTicks(editDomain.start, editDomain.end) : [];
  const editAmt = (t: ScheduleTask) => (included.has(t.id) ? parseFloat(amounts[t.id]) || 0 : 0);
  const maxEditAmt = group.reduce((m, t) => Math.max(m, editAmt(t)), 0);

  const applyAmounts = (allocs: ScheduleAllocation[]) => {
    const next: Record<string, string> = { ...amounts };
    group.forEach((t) => (next[t.id] = '0'));
    allocs.forEach((a) => (next[a.taskId] = String(a.amount)));
    setAmounts(next);
  };

  const redistribute = (subset: ScheduleTask[], method: 'by_hours' | 'equal') => {
    setIncluded(new Set(subset.map((t) => t.id)));
    applyAmounts(method === 'equal' ? distributeEqual(amount, subset) : distributeByHours(amount, subset));
  };

  const toggleInclude = (taskId: string) => {
    setIncluded((prev) => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });
  };

  const distributeRemaining = () => {
    const targets = group.filter((t) => included.has(t.id) && !(parseFloat(amounts[t.id]) > 0));
    if (targets.length === 0) return;
    const each = round2(editingRemaining / targets.length);
    const next = { ...amounts };
    targets.forEach((t, i) => {
      next[t.id] = String(i === targets.length - 1 ? round2(editingRemaining - each * (targets.length - 1)) : each);
    });
    setAmounts(next);
  };

  const saveSplit = () => {
    const allocs: ScheduleAllocation[] = group
      .filter((t) => included.has(t.id) && parseFloat(amounts[t.id]) > 0)
      .map((t) => ({ taskId: t.id, amount: round2(parseFloat(amounts[t.id])) }));
    setScheduleAllocations(row.id, allocs);
    setEditing(false);
  };

  const hasUnitSplit = group.some(isUnitTask) && group.some((t) => !isUnitTask(t));

  const statusChip = isConfirmed ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
      <Link2 size={11} /> Linked
    </span>
  ) : isLoe ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
      <Clock size={11} /> Level of effort
    </span>
  ) : isReview ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
      <AlertTriangle size={11} /> Needs review
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
      Draft
    </span>
  );

  const loeSpread = () => {
    const from = contractData?.startDate
      ? new Date(contractData.startDate).toISOString().slice(0, 10)
      : tasks.map((t) => t.planStart).sort()[0];
    const to = contractData?.endDate
      ? new Date(contractData.endDate).toISOString().slice(0, 10)
      : tasks.map((t) => t.planEnd).sort().slice(-1)[0];
    updateScheduleLink(row.id, { loeSpread: { from, to } });
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="p-0.5 rounded hover:bg-gray-100 flex-shrink-0"
          aria-label={expanded ? 'Collapse' : 'Expand'}
          disabled={isLoe}
        >
          {isLoe ? (
            <span className="inline-block w-3.5" />
          ) : expanded ? (
            <ChevronDown size={16} className="text-gray-500" />
          ) : (
            <ChevronRight size={16} className="text-gray-500" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 truncate">{name}</p>
            <span className="text-xs font-mono text-gray-500 flex-shrink-0">{code || '—'}</span>
            {subcontractor && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-[11px] text-gray-600 flex-shrink-0">
                <Users size={11} /> {subcontractor}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {isLoe ? (
              link?.loeSpread
                ? `Spread evenly · ${fmtDate(link.loeSpread.from)} – ${fmtDate(link.loeSpread.to)}`
                : 'No matching schedule task — spread across the project timeline'
            ) : group.length > 0 ? (
              `${code} · ${group.length} task${group.length === 1 ? '' : 's'} · ${dateRange(group)}`
            ) : (
              'No matching schedule task at this cost code'
            )}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="font-mono text-sm font-semibold text-gray-900">${formatCurrency(amount)}</p>
          {!isConfirmed && !isLoe && group.length > 0 && (
            <p className={`text-[11px] font-mono ${fullyAllocated ? 'text-green-600' : 'text-amber-600'}`}>
              ${formatCurrency(allocated)} allocated
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">{statusChip}</div>
      </div>

      {/* Action row */}
      {!isConfirmed && !editing && (
        <div className="flex items-center justify-between gap-3 px-3 py-2 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 min-w-0">
            {isReview && !isLoe && siblings.length > 0 && (
              <span className="text-xs text-amber-700 truncate">
                Cost code shared with {siblings.join(', ')} — split the tasks.
              </span>
            )}
            {!isLoe && group.length > 0 && (
              <>
                <select
                  value={link?.method === 'equal' ? 'equal' : 'by_hours'}
                  onChange={(e) => setScheduleLinkMethod(row.id, e.target.value as 'by_hours' | 'equal')}
                  className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="by_hours">Split by planned hours</option>
                  <option value="equal">Split equally</option>
                </select>
                <button
                  type="button"
                  onClick={startEditing}
                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  <SlidersHorizontal size={12} /> Edit split
                </button>
              </>
            )}
          </div>

          {isLoe ? (
            <button
              type="button"
              onClick={() => {
                if (!link?.loeSpread) loeSpread();
                confirmScheduleLink(row.id);
              }}
              className="px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 flex-shrink-0"
            >
              {link?.loeSpread ? 'Confirm spread' : 'Spread & confirm'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => confirmScheduleLink(row.id)}
              disabled={!fullyAllocated}
              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0"
            >
              Confirm link
            </button>
          )}
        </div>
      )}

      {/* Manual split editor */}
      {editing && (
        <div className="border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-600 mr-1">Quick split:</span>
            <button type="button" onClick={() => redistribute(group, 'by_hours')} className="text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50">By hours</button>
            <button type="button" onClick={() => redistribute(group, 'equal')} className="text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50">Equally</button>
            {hasUnitSplit && (
              <>
                <button type="button" onClick={() => redistribute(group.filter(isUnitTask), 'by_hours')} className="text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50">Unit tasks only</button>
                <button type="button" onClick={() => redistribute(group.filter((t) => !isUnitTask(t)), 'by_hours')} className="text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50">Common areas only</button>
              </>
            )}
            <button type="button" onClick={distributeRemaining} className="text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50">Distribute remaining</button>
          </div>

          {editDomain && (
            <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 border-b border-gray-100">
              <span className="w-3.5 flex-shrink-0" />
              <span className="flex-1 min-w-0 text-[10px] font-semibold uppercase tracking-wide text-gray-600">Task</span>
              <TimelineMonths ticks={editTicks} />
              <span className="w-24 text-[10px] font-semibold uppercase tracking-wide text-gray-600 flex-shrink-0">Dates</span>
              <span className="w-28 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-600 flex-shrink-0">Amount</span>
            </div>
          )}

          <div className="max-h-72 overflow-auto">
            {group.map((task) => {
              const inc = included.has(task.id);
              const amt = editAmt(task);
              return (
                <div key={task.id} className={`flex items-stretch gap-3 px-3 py-1.5 border-b border-gray-100 last:border-b-0 text-sm ${inc ? '' : 'opacity-40'}`}>
                  <input type="checkbox" checked={inc} onChange={() => toggleInclude(task.id)} className="w-3.5 self-center flex-shrink-0 accent-blue-600" />
                  <span className="flex-1 min-w-0 self-center truncate text-gray-700">{task.name}</span>
                  {editDomain ? (
                    <GanttTrack
                      start={editDomain.start}
                      span={editDomain.end - editDomain.start}
                      ticks={editTicks}
                      task={task}
                      allocated={amt}
                      intensity={maxEditAmt > 0 ? amt / maxEditAmt : 0}
                    />
                  ) : (
                    <span className="flex-[2]" />
                  )}
                  <span className="w-24 self-center text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">{fmtDate(task.planStart)} – {fmtDate(task.planEnd)}</span>
                  <div className="flex items-center gap-1 self-center flex-shrink-0 w-28 justify-end">
                    <span className="text-gray-400 text-xs">$</span>
                    <input
                      type="number"
                      value={amounts[task.id] ?? ''}
                      disabled={!inc}
                      onChange={(e) => setAmounts((prev) => ({ ...prev, [task.id]: e.target.value }))}
                      className="w-24 text-right font-mono text-sm border border-gray-300 rounded px-1.5 py-0.5 disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 px-3 py-2 bg-gray-50 border-t border-gray-100">
            <div className="text-xs font-mono">
              <span className="text-gray-600">${formatCurrency(editingTotal)} / ${formatCurrency(amount)}</span>
              <span className={`ml-2 ${Math.abs(editingRemaining) <= 0.01 ? 'text-green-600' : 'text-amber-600'}`}>
                {editingRemaining === 0 ? 'balanced' : editingRemaining > 0 ? `$${formatCurrency(editingRemaining)} left` : `$${formatCurrency(-editingRemaining)} over`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setEditing(false)} className="text-xs px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={saveSplit} disabled={!canSave} className="text-xs px-3 py-1 rounded text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed">Save split</button>
            </div>
          </div>
        </div>
      )}

      {/* Read-only allocations — inline mini-gantt */}
      {expanded && !editing && !isLoe && group.length > 0 && (
        <AllocationTimeline tasks={group} allocByTask={allocByTask} />
      )}
    </div>
  );
};

const BudgetScheduleLinker: React.FC = () => {
  const { budgetRows, budgetScheduleLinks, scheduleTasks, confirmAllScheduleDrafts } = useProject();

  const [view, setView] = useState<'lines' | 'forecast'>('lines');

  const committedRows = useMemo(
    () => budgetRows.filter((r) => getLineState(r) === 'locked'),
    [budgetRows]
  );

  const linkByRow = useMemo(
    () => new Map(budgetScheduleLinks.map((l) => [l.budgetRowId, l])),
    [budgetScheduleLinks]
  );

  // Other committed lines sharing each line's cost code (collision context).
  const siblingsByRow = useMemo(() => {
    const byCode = new Map<string, string[]>();
    committedRows.forEach((r) => {
      const code = String(r.cells['costCode'] ?? '').trim();
      if (!code) return;
      (byCode.get(code) ?? byCode.set(code, []).get(code)!).push(String(r.cells['name'] ?? 'Line'));
    });
    const result = new Map<string, string[]>();
    committedRows.forEach((r) => {
      const code = String(r.cells['costCode'] ?? '').trim();
      const self = String(r.cells['name'] ?? 'Line');
      result.set(r.id, (byCode.get(code) ?? []).filter((n) => n !== self));
    });
    return result;
  }, [committedRows]);

  const coverage = useMemo(
    () => computeScheduleCoverage(committedRows, budgetScheduleLinks),
    [committedRows, budgetScheduleLinks]
  );

  const confirmableDrafts = useMemo(
    () =>
      committedRows.filter((row) => {
        const link = linkByRow.get(row.id);
        return link?.status === 'draft' && isLinkFullyAllocated(link, getBudgetLineAmount(row));
      }).length,
    [committedRows, linkByRow]
  );

  const pct = coverage.totalAmount > 0 ? (coverage.linkedAmount / coverage.totalAmount) * 100 : 0;

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      {/* Coverage header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="text-sm text-gray-700">
            <span className="font-semibold">
              ${formatCurrency(coverage.linkedAmount)} of ${formatCurrency(coverage.totalAmount)} linked
            </span>
            <span className="text-gray-500 ml-2">
              · {coverage.confirmedCount} confirmed
              {coverage.reviewCount > 0 && ` · ${coverage.reviewCount} need review`}
              {coverage.loeCount > 0 && ` · ${coverage.loeCount} level-of-effort`}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {view === 'lines' && confirmableDrafts > 0 && (
              <button
                type="button"
                onClick={confirmAllScheduleDrafts}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <CheckCircle2 size={14} /> Confirm all matches ({confirmableDrafts})
              </button>
            )}
            <div className="inline-flex rounded-md border border-gray-300 overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setView('lines')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium ${
                  view === 'lines' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <ListChecks size={14} /> Lines
              </button>
              <button
                type="button"
                onClick={() => setView('forecast')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border-l border-gray-300 ${
                  view === 'forecast' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <TrendingUp size={14} /> Forecast
              </button>
            </div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
          <div className="h-full bg-emerald-400 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Body */}
      {view === 'forecast' ? (
        <CashFlowPreview />
      ) : (
        <div className="flex-1 min-h-0 overflow-auto p-4 space-y-2">
          {committedRows.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Commit budget lines first — each committed line will be matched to the schedule by cost code.
            </p>
          ) : (
            committedRows.map((row) => (
              <LinkRow
                key={row.id}
                row={row}
                link={linkByRow.get(row.id)}
                tasks={scheduleTasks}
                siblings={siblingsByRow.get(row.id) ?? []}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default BudgetScheduleLinker;
