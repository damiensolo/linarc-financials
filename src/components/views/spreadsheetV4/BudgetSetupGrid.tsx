import React, { useState, useCallback, useEffect, useMemo } from 'react';

import { Upload, AlertTriangle, Info, Lock } from 'lucide-react';

import { useProject } from '../../../context/ProjectContext';
import { useScrollToRowOnAdd } from '../../../hooks/useScrollToRowOnAdd';

import { V3Row, V3Column, evaluateFormula } from './types';

import {
  getLineState,
  rowMissingCostCode,
  rowMissingTrade,
  rowMissingSubcontractor,
  canLockBudgetLine,
  canCommitBudgetLine,
  SUBCONTRACTOR_FIELD,
  TRADE_FIELD,
  createBudgetColumns,
  isBudgetSheetEmpty,
  getBudgetLineAmount,
} from '../../../lib/financialWorkflow';

import { getSubcontractorsForTrade } from '../../../data/trades';

import { SPREADSHEET_INDEX_COLUMN_WIDTH, BUDGET_STATUS_COLUMN_WIDTH, BUDGET_ACTIONS_COLUMN_WIDTH } from '../../../constants/spreadsheetLayout';

import SpreadsheetIndexCell from './SpreadsheetIndexCell';
import SpreadsheetIndexHeaderCell from './SpreadsheetIndexHeaderCell';
import { SpreadsheetTableAddRowRow } from './SpreadsheetTableFooterBar';
import SpreadsheetTableEmptyState from './SpreadsheetTableEmptyState';

import CommitLineModal from './CommitLineModal';

import MissingCostCodeModal from './MissingCostCodeModal';

import { colAlignClass, formatCurrency, formatCellCurrency } from './spreadsheetTableUtils';



const STATE_BADGE: Record<string, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-gray-100 text-gray-700' },
  locked: { label: 'Locked', className: 'bg-blue-100 text-blue-800' },
  pending_approval: { label: 'Pending', className: 'bg-amber-100 text-amber-800' },
  committed: { label: 'Committed', className: 'bg-green-100 text-green-800' },
};

// Action links render as micro pill buttons. Lock and Commit share the same shape;
// each dims when its required fields aren't filled (still clickable — the click
// surfaces a modal explaining what's missing).
const PILL_BASE =
  'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors cursor-pointer';
const PILL_ACTIVE = 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300';
const PILL_DIM = 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100';

// Lock-icon tooltip shown next to the status badge once a line is locked into the SOV.
const LOCK_TOOLTIP: Record<string, string> = {
  locked: 'Locked into the SOV & schedule — cost code and trade are fixed. Add a subcontractor to commit.',
  pending_approval: 'Locked into the SOV — commit is awaiting approval.',
  committed: 'Committed & locked — changes require a Change Order.',
};



interface BudgetSetupGridProps {
  workflowMessage?: string;
  /** Post-activation actual-budget view: read-only, no editing, commit, import, add, or delete. */
  locked?: boolean;
}

const BudgetSetupGrid: React.FC<BudgetSetupGridProps> = ({ workflowMessage = '', locked = false }) => {

  const {

    activeView,

    updateBudgetRows,

    budgetRows,

    lineCounts,

    lockLine,

    commitLine,

    financialConfig,

    contractData,

    financialSetupStep,

    initializeBlankBudget,

    setIsBudgetUploadOpen,

  } = useProject();



  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);

  const [editValue, setEditValue] = useState('');

  const [commitTarget, setCommitTarget] = useState<V3Row | null>(null);

  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  const [missingCostCodeOpen, setMissingCostCodeOpen] = useState(false);

  const [missingCostCodeContext, setMissingCostCodeContext] = useState<{
    fieldLabel?: string;
    lineLabel?: string;
    missingCount: number;
    openLineCount?: number;
    actionVerb?: 'lock' | 'commit';
  }>({ missingCount: 1 });



  const columns = useMemo(

    () =>

      activeView?.v3Sheets?.find((s) => s.id === 'sheet-budget')?.columns

        ?? createBudgetColumns(financialConfig),

    [activeView?.v3Sheets, financialConfig]

  );



  const fontSize = activeView?.fontSize ?? 12;

  // The grid only mounts once a budget exists (upload or manual entry via the
  // choice screen). Guard against landing here with zero rows.
  useEffect(() => {
    if (financialSetupStep !== 2) return;
    if (budgetRows.length === 0) initializeBlankBudget();
  }, [financialSetupStep, budgetRows.length, initializeBlankBudget]);

  const generateId = () => `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const { scrollContainerRef, requestScrollToRow } = useScrollToRowOnAdd(budgetRows.length);



  const updateRow = useCallback(

    (rowId: string, colId: string, raw: string) => {

      const col = columns.find((c) => c.id === colId);

      if (!col?.editable) return;



      const newRows = budgetRows.map((r) => {

        if (r.id !== rowId) return r;

        const state = getLineState(r);

        // Committed / pending lines are frozen. Locked lines stay editable EXCEPT for
        // Cost Code + Trade, which define the line's SOV/schedule identity once locked.
        if (state === 'committed' || state === 'pending_approval') return r;
        if (state === 'locked' && (colId === 'costCode' || colId === TRADE_FIELD)) return r;



        const numValue =

          col.type === 'currency' || col.type === 'number'

            ? parseFloat(raw.replace(/[^0-9.-]/g, '')) || null

            : raw;



        const nextCells = { ...r.cells, [colId]: numValue };

        // Changing the Trade re-scopes the subcontractor list — clear a now-invalid pick.
        if (colId === TRADE_FIELD) {
          const allowed = getSubcontractorsForTrade(String(numValue ?? ''));
          const currentSub = String(r.cells[SUBCONTRACTOR_FIELD] ?? '');
          if (currentSub && !allowed.includes(currentSub)) nextCells[SUBCONTRACTOR_FIELD] = '';
        }

        return { ...r, cells: nextCells };

      });

      updateBudgetRows(newRows);

    },

    [budgetRows, columns, updateBudgetRows]

  );



  const addRow = () => {
    const newId = generateId();
    updateBudgetRows([...budgetRows, { id: newId, cells: {}, lineState: 'open' }]);
    requestScrollToRow(newId, {
      onRowReady: (rowId) => {
        setEditingCell({ rowId, colId: 'name' });
        setEditValue('');
      },
    });
  };



  const deleteRows = (ids: Set<string>) => {

    const remaining = budgetRows.filter((r) => !ids.has(r.id));

    updateBudgetRows(remaining.length > 0 ? remaining : [{ id: generateId(), cells: {}, lineState: 'open' }]);

    setSelectedRowIds(new Set());

  };



  const getCellValue = (row: V3Row, col: V3Column) => {

    if (col.formula) {

      return evaluateFormula(col.formula, row.cells, budgetRows, columns);

    }

    return row.cells[col.id];

  };



  const getDisplay = (row: V3Row, colId: string) => {

    const col = columns.find((c) => c.id === colId);

    if (!col) return '';

    const val = getCellValue(row, col);

    if (col.type === 'currency') return formatCellCurrency(val);

    if (col.type === 'number') return Number(val || 0).toLocaleString();

    return val ?? '';

  };



  const handleCellClick = (row: V3Row, colId: string) => {

    if (locked) return;

    const state = getLineState(row);

    if (state === 'committed' || state === 'pending_approval') return;

    // Locked lines: Cost Code + Trade are frozen, everything else stays editable.
    if (state === 'locked' && (colId === 'costCode' || colId === TRADE_FIELD)) return;

    const col = columns.find((c) => c.id === colId);

    if (!col?.editable) return;

    setEditingCell({ rowId: row.id, colId });

    setEditValue(String(row.cells[colId] ?? ''));

  };



  const handleToggleRowSelect = (rowId: string) => {

    setSelectedRowIds((prev) => {

      const next = new Set(prev);

      next.has(rowId) ? next.delete(rowId) : next.add(rowId);

      return next;

    });

  };



  // Only open lines can be selected for deletion — locked/committed lines are in the SOV.
  const selectableRowIds = useMemo(

    () => budgetRows.filter((r) => getLineState(r) === 'open').map((r) => r.id),

    [budgetRows]

  );

  const allSelectableSelected =

    selectableRowIds.length > 0 && selectableRowIds.every((id) => selectedRowIds.has(id));

  const someSelectableSelected = selectableRowIds.some((id) => selectedRowIds.has(id));

  const handleToggleSelectAll = () => {

    if (allSelectableSelected) {

      setSelectedRowIds(new Set());

    } else {

      setSelectedRowIds(new Set(selectableRowIds));

    }

  };



  const totals = useMemo(() => {

    const acc: Record<string, number> = {};

    budgetRows.forEach((row) => {

      columns.forEach((col) => {

        if (!col.isTotal) return;

        const val = getCellValue(row, col);

        acc[col.id] = (acc[col.id] || 0) + (typeof val === 'number' ? val : Number(val) || 0);

      });

    });

    return acc;

  }, [budgetRows, columns]);



  const budgetTotal = totals['budget'] ?? 0;

  const contractSum = contractData?.contractSum ?? 0;

  const budgetVsContractMismatch =

    contractSum > 0 && budgetTotal > 0 && Math.abs(budgetTotal - contractSum) > 0.01;



  const isTableEmpty = useMemo(() => isBudgetSheetEmpty(budgetRows), [budgetRows]);

  // Lock needs Cost Code + Trade. It's the lightweight step (no confirm modal) — locking
  // drops the line into the SOV and Schedule Linking & Allocation as a draft.
  const handleRequestLock = (row: V3Row) => {
    const lineLabel = String(row.cells['name'] ?? '').trim() || undefined;
    if (rowMissingCostCode(row)) {
      setMissingCostCodeContext({ fieldLabel: 'Cost Code', lineLabel, missingCount: 1, actionVerb: 'lock' });
      setMissingCostCodeOpen(true);
      return;
    }
    if (rowMissingTrade(row)) {
      setMissingCostCodeContext({ fieldLabel: 'Trade', lineLabel, missingCount: 1, actionVerb: 'lock' });
      setMissingCostCodeOpen(true);
      return;
    }
    lockLine(row.id);
  };

  // Commit needs Cost Code + Trade + Subcontractor. Confirmed via CommitLineModal.
  const handleRequestCommit = (row: V3Row) => {
    const lineLabel = String(row.cells['name'] ?? '').trim() || undefined;
    if (rowMissingCostCode(row)) {
      setMissingCostCodeContext({ fieldLabel: 'Cost Code', lineLabel, missingCount: 1, actionVerb: 'commit' });
      setMissingCostCodeOpen(true);
      return;
    }
    if (rowMissingTrade(row)) {
      setMissingCostCodeContext({ fieldLabel: 'Trade', lineLabel, missingCount: 1, actionVerb: 'commit' });
      setMissingCostCodeOpen(true);
      return;
    }
    if (rowMissingSubcontractor(row)) {
      setMissingCostCodeContext({ fieldLabel: 'Subcontractor', lineLabel, missingCount: 1, actionVerb: 'commit' });
      setMissingCostCodeOpen(true);
      return;
    }
    setCommitTarget(row);
  };

  const visibleColumns = columns.filter((c) => c.visible !== false);

  const tableMinWidth =
    SPREADSHEET_INDEX_COLUMN_WIDTH +
    BUDGET_STATUS_COLUMN_WIDTH +
    BUDGET_ACTIONS_COLUMN_WIDTH +
    visibleColumns.reduce((sum, col) => sum + col.width, 0);

  const stickyActionsHeader =
    'sticky right-0 z-50 bg-gray-100 border-l border-gray-300 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]';
  // No bg here — the row state supplies a single OPAQUE background in the cell below.
  // (A translucent bg-*/30 tint here let horizontally-scrolled cells bleed through.)
  const stickyActionsCell =
    'sticky right-0 z-20 border-l border-gray-200 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]';
  const stickyActionsFooter =
    'sticky right-0 z-30 bg-gray-100 border-l border-gray-300 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]';

  return (

    <div className="flex flex-col h-full min-h-0 bg-white">

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50 gap-4 flex-shrink-0">

          <div className="flex flex-col gap-0.5 min-w-0">

            <div className="flex items-center gap-2 text-sm text-gray-700">

              {locked ? (
                <>
                  <span className="font-semibold">Actual budget</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-200 text-gray-700">
                    <Lock size={11} />
                    Activated &amp; locked
                  </span>
                  <span className="text-gray-500">· {lineCounts.total} committed lines — read-only</span>
                </>
              ) : (
                <>
                  <span className="font-semibold">{lineCounts.committed} of {lineCounts.total} lines committed</span>

                  {lineCounts.locked > 0 && <span className="text-blue-600">· {lineCounts.locked} locked</span>}

                  {lineCounts.open > 0 && <span className="text-gray-500">· {lineCounts.open} open</span>}

                  {lineCounts.pending > 0 && <span className="text-amber-600">· {lineCounts.pending} pending approval</span>}
                </>
              )}

            </div>

            {contractSum > 0 && (

              <p className="text-xs text-gray-600">

                Prime Contract Value:{' '}

                <span className="font-semibold text-gray-900">${formatCurrency(contractSum)}</span>

                {budgetTotal > 0 && (

                  <span className="text-gray-500 ml-2">

                    · Budget total: ${formatCurrency(budgetTotal)}

                  </span>

                )}

              </p>

            )}

          </div>

          {!locked && (
            <div className="flex gap-2 flex-shrink-0">

              <button

                type="button"

                onClick={() => setIsBudgetUploadOpen(true)}

                title="Upload an Excel, CSV, or PDF budget"

                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-white bg-white"

              >

                <Upload size={14} /> Upload

              </button>

            </div>
          )}

        </div>

        {workflowMessage && (
          <div className="flex items-start gap-2 px-4 py-2 border-b border-blue-200 bg-blue-50 text-sm text-blue-900 flex-shrink-0">
            <Info size={16} className="mt-0.5 flex-shrink-0" />
            <p>{workflowMessage}</p>
          </div>
        )}

        {budgetVsContractMismatch && (

          <div className="flex items-start gap-2 px-4 py-2 border-b border-amber-200 bg-amber-50 text-sm text-amber-900 flex-shrink-0">

            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />

            <span>

              Budget total (${formatCurrency(budgetTotal)}) does not match the Prime Contract Value

              (${formatCurrency(contractSum)}).

            </span>

          </div>

        )}

        <div className="flex-1 min-h-0 overflow-hidden">
          <div ref={scrollContainerRef} className="h-full overflow-auto relative">
          {isTableEmpty && (
            <SpreadsheetTableEmptyState
              title="Add your first budget line"
              description="Enter a description, cost code, trade, and budget amounts in the row above. Lock a line (cost code + trade) to add it to the SOV & schedule; commit it once a subcontractor is assigned. Use Add row below for more lines."
            />
          )}
        <table
          className="text-sm border-collapse"
          style={{ fontSize, minWidth: tableMinWidth }}
        >
          <colgroup>
            <col style={{ width: SPREADSHEET_INDEX_COLUMN_WIDTH, minWidth: SPREADSHEET_INDEX_COLUMN_WIDTH }} />
            <col style={{ width: BUDGET_STATUS_COLUMN_WIDTH, minWidth: BUDGET_STATUS_COLUMN_WIDTH }} />
            {visibleColumns.map((col) => (
              <col key={col.id} style={{ width: col.width, minWidth: col.width }} />
            ))}
            <col style={{ width: BUDGET_ACTIONS_COLUMN_WIDTH, minWidth: BUDGET_ACTIONS_COLUMN_WIDTH }} />
          </colgroup>
          <thead className="sticky top-0 bg-gray-100 z-40">
            <tr className="border-b border-gray-300 h-9">
              <SpreadsheetIndexHeaderCell
                allSelected={allSelectableSelected}
                someSelected={someSelectableSelected}
                onToggleAll={handleToggleSelectAll}
                disabled={locked || selectableRowIds.length === 0}
                sticky
              />
              <th
                className="px-2 text-left text-xs font-semibold text-gray-700 bg-gray-100 border-r border-gray-300 whitespace-nowrap"
                style={{ width: BUDGET_STATUS_COLUMN_WIDTH, minWidth: BUDGET_STATUS_COLUMN_WIDTH }}
              >
                Status
              </th>

              {visibleColumns.map((col) => (

                <th

                  key={col.id}

                  className={`px-2 text-xs font-semibold text-gray-700 bg-gray-100 border-r border-gray-300 whitespace-nowrap ${colAlignClass(col)}`}

                >

                  {col.label}

                  {(col.id === 'costCode' || col.id === TRADE_FIELD) && (
                    <span className="text-red-500 ml-0.5" title="Required to lock">*</span>
                  )}

                  {col.id === SUBCONTRACTOR_FIELD && (
                    <span className="text-amber-500 ml-0.5" title="Required to commit">*</span>
                  )}

                </th>

              ))}

              <th
                className={`px-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap ${stickyActionsHeader}`}
                style={{ width: BUDGET_ACTIONS_COLUMN_WIDTH, minWidth: BUDGET_ACTIONS_COLUMN_WIDTH }}
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody>

            {budgetRows.map((row, idx) => {

              const state = getLineState(row);

              const badge = STATE_BADGE[state];

              const missingCode = state === 'open' && rowMissingCostCode(row);

              const missingTrade = state === 'open' && rowMissingTrade(row);

              // Subcontractor is needed to commit — flag it on open AND locked lines.
              const missingSub = (state === 'open' || state === 'locked') && rowMissingSubcontractor(row);



              return (

                <tr

                  key={row.id}

                  data-row-id={row.id}

                  className={`group border-b border-gray-200 h-7 ${
                    state === 'committed'
                      ? 'bg-green-50/30'
                      : state === 'locked'
                        ? 'bg-blue-50/30'
                        : state === 'pending_approval'
                          ? 'bg-amber-50/20'
                          : 'hover:bg-gray-50'
                  }`}

                >

                  <SpreadsheetIndexCell

                    rowIndex={idx}

                    rowId={row.id}

                    isSelected={selectedRowIds.has(row.id)}

                    onToggleSelect={handleToggleRowSelect}

                    disabled={locked || state !== 'open'}

                    fontSize={fontSize}

                    sticky

                  />

                  <td
                    className="px-2 border-r border-gray-200 whitespace-nowrap"
                    style={{ width: BUDGET_STATUS_COLUMN_WIDTH, minWidth: BUDGET_STATUS_COLUMN_WIDTH }}
                  >
                    <div className="flex items-center gap-1">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${badge.className}`}>
                        {badge.label}
                      </span>
                      {state !== 'open' && (
                        <span title={LOCK_TOOLTIP[state]} className="inline-flex text-gray-400 flex-shrink-0">
                          <Lock size={11} />
                        </span>
                      )}
                    </div>
                  </td>

                  {visibleColumns.map((col) => {

                    const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;

                    const isSelect = col.type === 'select';

                    const isTrade = col.id === TRADE_FIELD;

                    const isSubcontractor = col.id === SUBCONTRACTOR_FIELD;

                    // Trade is editable only while open (frozen once locked); Subcontractor stays
                    // editable through locked so a line can be committed after it's in the SOV.
                    const isSelectEditable =
                      isSelect && !locked &&
                      (isTrade
                        ? state === 'open'
                        : isSubcontractor
                          ? state === 'open' || state === 'locked'
                          : state === 'open');

                    // Subcontractor options are scoped to the line's selected Trade.
                    const rowTrade = String(row.cells[TRADE_FIELD] ?? '');
                    const selectOptions: (string | { label: string })[] = isSubcontractor
                      ? getSubcontractorsForTrade(rowTrade)
                      : (col.options ?? []);
                    const selectPlaceholder = isTrade
                      ? 'Select trade…'
                      : isSubcontractor
                        ? rowTrade
                          ? 'Select subcontractor…'
                          : 'Select a trade first'
                        : 'Select…';

                    return (

                      <td

                        key={col.id}

                        className={`px-2 border-r border-gray-200 ${locked || isSelect ? '' : 'cursor-pointer'} ${colAlignClass(col)} ${

                          missingCode && col.id === 'costCode' ? 'bg-red-50' : ''

                        } ${missingTrade && isTrade ? 'bg-red-50' : ''} ${missingSub && isSubcontractor ? 'bg-amber-50' : ''}`}

                        onClick={() => { if (!isSelect) handleCellClick(row, col.id); }}

                      >

                        {isSelectEditable ? (

                          <select

                            value={String(row.cells[col.id] ?? '')}

                            onChange={(e) => updateRow(row.id, col.id, e.target.value)}

                            disabled={isSubcontractor && !rowTrade}

                            className="w-full bg-transparent text-sm focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:text-gray-400"

                          >

                            <option value="">{selectPlaceholder}</option>

                            {selectOptions.map((opt) => {

                              const label = typeof opt === 'string' ? opt : opt.label;

                              return (

                                <option key={label} value={label}>{label}</option>

                              );

                            })}

                          </select>

                        ) : isEditing ? (

                          <input

                            autoFocus

                            value={editValue}

                            onChange={(e) => setEditValue(e.target.value)}

                            onBlur={() => { updateRow(row.id, col.id, editValue); setEditingCell(null); }}

                            onKeyDown={(e) => {

                              if (e.key === 'Enter') { updateRow(row.id, col.id, editValue); setEditingCell(null); }

                              if (e.key === 'Escape') setEditingCell(null);

                            }}

                            className={`w-full py-0.5 border border-blue-400 rounded text-sm focus:outline-none ${colAlignClass(col)}`}

                          />

                        ) : (

                          <span className={`block w-full text-sm ${colAlignClass(col)}`}>{getDisplay(row, col.id)}</span>

                        )}

                      </td>

                    );

                  })}

                  <td
                    className={`px-2 whitespace-nowrap ${stickyActionsCell} ${
                      state === 'locked'
                        ? 'bg-blue-50'
                        : state === 'pending_approval'
                          ? 'bg-amber-50'
                          : 'bg-white'
                    }`}
                    style={{ width: BUDGET_ACTIONS_COLUMN_WIDTH, minWidth: BUDGET_ACTIONS_COLUMN_WIDTH }}
                  >

                    {!locked && state === 'open' && (

                      <div className="flex items-center gap-1.5">

                        <button

                          type="button"

                          onClick={() => handleRequestLock(row)}

                          title={canLockBudgetLine(row) ? 'Lock this line into the SOV & schedule' : 'Needs a cost code and trade to lock'}

                          className={`${PILL_BASE} ${canLockBudgetLine(row) ? PILL_ACTIVE : PILL_DIM}`}

                        >

                          Lock

                        </button>

                        <button

                          type="button"

                          onClick={() => handleRequestCommit(row)}

                          title={canCommitBudgetLine(row) ? 'Commit this line' : 'Needs cost code, trade, and subcontractor to commit'}

                          className={`${PILL_BASE} ${canCommitBudgetLine(row) ? PILL_ACTIVE : PILL_DIM}`}

                        >

                          Commit

                        </button>

                      </div>

                    )}

                    {!locked && state === 'locked' && (

                      <button

                        type="button"

                        onClick={() => handleRequestCommit(row)}

                        title={canCommitBudgetLine(row) ? 'Commit this line' : 'Needs a subcontractor to commit'}

                        className={`${PILL_BASE} ${canCommitBudgetLine(row) ? PILL_ACTIVE : PILL_DIM}`}

                      >

                        Commit

                      </button>

                    )}

                    {!locked && state === 'pending_approval' && (

                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700">Pending</span>

                    )}

                    {!locked && state === 'committed' && (

                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500">Committed</span>

                    )}

                  </td>

                </tr>

              );

            })}

          </tbody>

          <tfoot className="sticky bottom-0 z-20">
            <tr className="h-9 font-bold bg-gray-100 border-t-2 border-gray-300 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
              <td
                className="sticky left-0 z-30 bg-gray-100 border-r border-gray-300 text-left pl-2 text-xs text-gray-900"
                style={{
                  width: SPREADSHEET_INDEX_COLUMN_WIDTH,
                  minWidth: SPREADSHEET_INDEX_COLUMN_WIDTH,
                  maxWidth: SPREADSHEET_INDEX_COLUMN_WIDTH,
                }}
              >
                Total
              </td>
              <td
                className="bg-gray-100 border-r border-gray-300"
                style={{ width: BUDGET_STATUS_COLUMN_WIDTH, minWidth: BUDGET_STATUS_COLUMN_WIDTH }}
              />
              {visibleColumns.map((col) => (
                <td
                  key={`total-${col.id}`}
                  className={`px-2 text-sm text-gray-900 border-r border-gray-300 bg-gray-100 ${colAlignClass(col)}`}
                >
                  {col.isTotal && totals[col.id] !== undefined
                    ? col.type === 'currency'
                      ? `$${formatCurrency(totals[col.id])}`
                      : totals[col.id].toLocaleString()
                    : ''}
                </td>
              ))}
              <td
                className={stickyActionsFooter}
                style={{ width: BUDGET_ACTIONS_COLUMN_WIDTH, minWidth: BUDGET_ACTIONS_COLUMN_WIDTH }}
              />
            </tr>
            {!locked && (
              <SpreadsheetTableAddRowRow
                colSpan={visibleColumns.length + 3}
                onAddRow={addRow}
                selectedCount={selectedRowIds.size}
                onDeleteSelected={() => deleteRows(selectedRowIds)}
              />
            )}
          </tfoot>
        </table>

        </div>

        </div>

      </div>



      <MissingCostCodeModal
        open={missingCostCodeOpen}
        fieldLabel={missingCostCodeContext.fieldLabel}
        lineLabel={missingCostCodeContext.lineLabel}
        missingCount={missingCostCodeContext.missingCount}
        openLineCount={missingCostCodeContext.openLineCount}
        actionVerb={missingCostCodeContext.actionVerb}
        onClose={() => setMissingCostCodeOpen(false)}
      />



      <CommitLineModal

        open={!!commitTarget}

        lineLabel={String(commitTarget?.cells['name'] ?? 'Line')}

        lineAmount={commitTarget ? getBudgetLineAmount(commitTarget) : 0}

        subcontractor={String(commitTarget?.cells[SUBCONTRACTOR_FIELD] ?? '')}

        onConfirm={() => {

          if (commitTarget) commitLine(commitTarget.id);

          setCommitTarget(null);

        }}

        onCancel={() => setCommitTarget(null)}

      />

    </div>

  );

};



export default BudgetSetupGrid;

