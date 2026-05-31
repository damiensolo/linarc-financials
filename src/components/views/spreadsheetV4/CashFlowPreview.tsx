import React, { useMemo } from 'react';
import { useProject } from '../../../context/ProjectContext';
import { getLineState } from '../../../lib/financialWorkflow';
import { computeCashFlow, projectedDrawMonth } from '../../../lib/cashFlow';
import { CONTRACT_DRAWS } from '../../../data/drawSchedule';
import { formatCurrency } from './spreadsheetTableUtils';

// Chart geometry (viewBox units)
const W = 720;
const H = 280;
const PAD = { top: 16, right: 120, bottom: 36, left: 64 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

const THRESHOLD_DRAWS = CONTRACT_DRAWS.filter((d) => d.triggerPct === 25 || d.triggerPct === 50 || d.triggerPct === 75 || d.triggerPct === 100);

const CashFlowPreview: React.FC = () => {
  const { budgetRows, budgetScheduleLinks, scheduleTasks } = useProject();

  const committedRows = useMemo(
    () => budgetRows.filter((r) => getLineState(r) === 'locked'),
    [budgetRows]
  );

  const { buckets, total } = useMemo(
    () => computeCashFlow(budgetScheduleLinks, scheduleTasks, committedRows),
    [budgetScheduleLinks, scheduleTasks, committedRows]
  );

  if (total <= 0 || buckets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Allocate and confirm budget lines on the Lines tab to see the cost-loaded cash-flow
          forecast and projected draw dates.
        </p>
      </div>
    );
  }

  const maxY = total;
  const n = buckets.length;
  const step = PLOT_W / n;
  const xFor = (i: number) => PAD.left + step * (i + 1);
  const xOrigin = PAD.left;
  const yFor = (v: number) => PAD.top + PLOT_H * (1 - v / maxY);
  const barWidth = Math.min(step * 0.5, 36);

  // Cumulative S-curve points (origin at zero, then each month-end)
  const linePoints = [
    `${xOrigin},${yFor(0)}`,
    ...buckets.map((b, i) => `${xFor(i)},${yFor(b.cumulative)}`),
  ].join(' ');
  const areaPoints = `${linePoints} ${xFor(n - 1)},${yFor(0)} ${xOrigin},${yFor(0)}`;

  const crossings = THRESHOLD_DRAWS.map((draw) => {
    const target = (draw.triggerPct / 100) * total;
    const idx = buckets.findIndex((b) => b.cumulative >= target - 0.01);
    return { draw, target, idx };
  });

  return (
    <div className="flex-1 min-h-0 overflow-auto p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Cost-loaded cash-flow forecast</h3>
        <p className="text-xs text-gray-500">
          Cumulative cost loaded across the schedule by month. Dashed lines mark draw triggers; dots
          show the projected month each becomes eligible.
        </p>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 320 }}>
        {/* Threshold lines + draw labels */}
        {crossings.map(({ draw, target }) => {
          const y = yFor(target);
          return (
            <g key={draw.id}>
              <line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + PLOT_W}
                y2={y}
                stroke="#cbd5e1"
                strokeWidth={1}
                strokeDasharray="4 3"
              />
              <text x={PAD.left + PLOT_W + 8} y={y + 3} fontSize={11} fill="#64748b">
                {draw.label} · {draw.triggerPct}%
              </text>
            </g>
          );
        })}

        {/* Monthly spend bars */}
        {buckets.map((b, i) => {
          const h = PLOT_H * (b.amount / maxY);
          return (
            <rect
              key={b.key}
              x={xFor(i) - barWidth / 2}
              y={yFor(b.amount)}
              width={barWidth}
              height={h}
              rx={2}
              fill="#bfdbfe"
            />
          );
        })}

        {/* Cumulative area + line */}
        <polygon points={areaPoints} fill="#22c55e" fillOpacity={0.12} />
        <polyline points={linePoints} fill="none" stroke="#16a34a" strokeWidth={2.5} />

        {/* Crossing markers */}
        {crossings.map(({ draw, target, idx }) =>
          idx >= 0 ? (
            <circle key={draw.id} cx={xFor(idx)} cy={yFor(target)} r={4.5} fill="#16a34a" stroke="#fff" strokeWidth={1.5} />
          ) : null
        )}

        {/* X-axis month labels */}
        {buckets.map((b, i) => (
          <text key={b.key} x={xFor(i)} y={H - 14} fontSize={11} fill="#64748b" textAnchor="middle">
            {b.label.split(' ')[0]}
          </text>
        ))}

        {/* Y-axis bounds */}
        <text x={PAD.left - 8} y={yFor(0) + 3} fontSize={11} fill="#94a3b8" textAnchor="end">$0</text>
        <text x={PAD.left - 8} y={yFor(maxY) + 3} fontSize={11} fill="#94a3b8" textAnchor="end">
          ${Math.round(total / 1000)}k
        </text>
      </svg>

      {/* Draw schedule table */}
      <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Draw</th>
              <th className="px-3 py-2 font-medium">Trigger</th>
              <th className="px-3 py-2 font-medium text-right">Gross</th>
              <th className="px-3 py-2 font-medium text-right">Retainage</th>
              <th className="px-3 py-2 font-medium text-right">Net</th>
              <th className="px-3 py-2 font-medium">Projected</th>
            </tr>
          </thead>
          <tbody>
            {CONTRACT_DRAWS.map((draw) => {
              const projected = projectedDrawMonth(buckets, total, draw.triggerPct);
              return (
                <tr key={draw.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium text-gray-900">{draw.label}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{draw.basis}</td>
                  <td className="px-3 py-2 text-right font-mono text-gray-900">${formatCurrency(draw.gross)}</td>
                  <td className="px-3 py-2 text-right font-mono text-gray-500">
                    {draw.retainage < 0 ? `(${formatCurrency(-draw.retainage)})` : `$${formatCurrency(draw.retainage)}`}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-gray-900">${formatCurrency(draw.net)}</td>
                  <td className="px-3 py-2 text-gray-700">{projected ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashFlowPreview;
