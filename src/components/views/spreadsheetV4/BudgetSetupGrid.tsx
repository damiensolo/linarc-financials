import React, { useState, useCallback, useEffect, useMemo } from 'react';

import { Lock, Upload, AlertTriangle, Info } from 'lucide-react';

import { useProject } from '../../../context/ProjectContext';
import { useScrollToRowOnAdd } from '../../../hooks/useScrollToRowOnAdd';

import { V3Row, V3Column, evaluateFormula } from './types';

import {

  getLineState,

  rowMissingCostCode,

  createBudgetColumns,

  countOpenRowsMissingCostCode,

  isBudgetSheetEmpty,

  hasPrimeContractLineData,

  countSeedablePrimeContractLines,

  getBudgetLineAmount,

} from '../../../lib/financialWorkflow';

import { SPREADSHEET_INDEX_COLUMN_WIDTH, BUDGET_STATUS_COLUMN_WIDTH, BUDGET_ACTIONS_COLUMN_WIDTH } from '../../../constants/spreadsheetLayout';

import SpreadsheetIndexCell from './SpreadsheetIndexCell';
import SpreadsheetIndexHeaderCell from './SpreadsheetIndexHeaderCell';
import { SpreadsheetTableAddRowRow } from './SpreadsheetTableFooterBar';
import SpreadsheetTableEmptyState from './SpreadsheetTableEmptyState';

import BudgetSeedPromptModal from './BudgetSeedPromptModal';

import CommitLineModal from './CommitLineModal';

import ChangeOrderModal from './ChangeOrderModal';

import LockBudgetModal from './LockBudgetModal';

import MissingCostCodeModal from './MissingCostCodeModal';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../common/ui/Tooltip';

import { colAlignClass, formatCurrency, formatCellCurrency } from './spreadsheetTableUtils';



const STATE_BADGE: Record<string, { label: string; className: string }> = {

  open: { label: 'Open', className: 'bg-gray-100 text-gray-700' },

  pending_approval: { label: 'Pending', className: 'bg-amber-100 text-amber-800' },

  locked: { label: 'Committed', className: 'bg-green-100 text-green-800' },

};



interface BudgetSetupGridProps {
  workflowMessage?: string;
}

const BudgetSetupGrid: React.FC<BudgetSetupGridProps> = ({ workflowMessage = '' }) => {

  const {

    activeView,

    updateBudgetRows,

    budgetRows,

    primeContractRows,

    lineCounts,

    commitLine,

    bulkCommitOpenLines,

    financialConfig,

    contractData,

    financialSetupStep,

    seedBudgetFromPrimeContract,

    initializeBlankBudget,

  } = useProject();



  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);

  const [editValue, setEditValue] = useState('');

  const [commitTarget, setCommitTarget] = useState<V3Row | null>(null);

  const [coTarget, setCoTarget] = useState<V3Row | null>(null);

  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  const [seedPromptOpen, setSeedPromptOpen] = useState(false);

  const [seedPromptHandled, setSeedPromptHandled] = useState(false);

  const [lockBudgetOpen, setLockBudgetOpen] = useState(false);

  const [missingCostCodeOpen, setMissingCostCodeOpen] = useState(false);

  const [missingCostCodeContext, setMissingCostCodeContext] = useState<{
    lineLabel?: string;
    missingCount: number;
    openLineCount?: number;
  }>({ missingCount: 1 });



  const columns = useMemo(

    () =>

      activeView?.v3Sheets?.find((s) => s.id === 'sheet-budget')?.columns

        ?? createBudgetColumns(financialConfig),

    [activeView?.v3Sheets, financialConfig]

  );



  const fontSize = activeView?.fontSize ?? 12;

  const seedableLineCount = countSeedablePrimeContractLines(primeContractRows);

  const canOfferSeed = hasPrimeContractLineData(primeContractRows);



  useEffect(() => {

    if (financialSetupStep !== 3) {

      setSeedPromptHandled(false);

      setSeedPromptOpen(false);

      return;

    }

    if (seedPromptHandled) return;

    if (isBudgetSheetEmpty(budgetRows) && canOfferSeed) {

      setSeedPromptOpen(true);

    }

  }, [financialSetupStep, budgetRows, canOfferSeed, seedPromptHandled]);

  useEffect(() => {
    if (financialSetupStep !== 3) return;
    if (budgetRows.length > 0) return;
    if (canOfferSeed && !seedPromptHandled) return;
    initializeBlankBudget();
  }, [financialSetupStep, budgetRows.length, canOfferSeed, seedPromptHandled, initializeBlankBudget]);

  const generateId = () => `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const { scrollContainerRef, requestScrollToRow } = useScrollToRowOnAdd(budgetRows.length);



  const updateRow = useCallback(

    (rowId: string, colId: string, raw: string) => {

      const col = columns.find((c) => c.id === colId);

      if (!col?.editable) return;



      const newRows = budgetRows.map((r) => {

        if (r.id !== rowId) return r;

        const state = getLineState(r);

        if (state === 'locked' || state === 'pending_approval') return r;



        const numValue =

          col.type === 'currency' || col.type === 'number'

            ? parseFloat(raw.replace(/[^0-9.-]/g, '')) || null

            : raw;



        return { ...r, cells: { ...r.cells, [colId]: numValue } };

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

    const state = getLineState(row);

    if (state === 'locked') {

      setCoTarget(row);

      return;

    }

    if (state === 'pending_approval') return;

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



  const selectableRowIds = useMemo(

    () => budgetRows.filter((r) => getLineState(r) !== 'locked').map((r) => r.id),

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



  const handleSeedPromptClose = (usePrime: boolean) => {

    setSeedPromptOpen(false);

    setSeedPromptHandled(true);

    if (usePrime) {

      seedBudgetFromPrimeContract();

    } else {

      initializeBlankBudget();

    }

  };



  const handleImportStub = () => {

    const imported: V3Row[] = [

      { id: generateId(), cells: { name: 'Imported — Sitework', costCode: '02-100', budget: 65000, revisedBudget: 65000, labor: 12000, material: 8000, subcontractor: 45000 }, lineState: 'open' },

      { id: generateId(), cells: { name: 'Imported — Concrete', costCode: '03-300', budget: 45000, revisedBudget: 45000, labor: 25000, material: 15000, equipment: 5000 }, lineState: 'open' },

    ];

    updateBudgetRows([...budgetRows, ...imported]);

  };



  const openLinesMissingCostCode = useMemo(
    () => countOpenRowsMissingCostCode(budgetRows),
    [budgetRows]
  );

  const isTableEmpty = useMemo(() => isBudgetSheetEmpty(budgetRows), [budgetRows]);

  const canLockBudget = lineCounts.open > 0 && openLinesMissingCostCode === 0;

  const lockBudgetTooltip = useMemo(() => {
    if (lineCounts.open === 0) {
      return 'All budget lines are already committed — there is nothing left to lock.';
    }
    if (openLinesMissingCostCode > 0) {
      const lineWord = lineCounts.open === 1 ? 'line' : 'lines';
      const missingWord = openLinesMissingCostCode === 1 ? 'line is' : 'lines are';
      return `Every open line needs a cost code before you can lock the budget. ${openLinesMissingCostCode} of ${lineCounts.open} open ${lineWord} ${missingWord} still missing one — add cost codes in the highlighted cells, then try again.`;
    }
    return `Commit all ${lineCounts.open} remaining open ${lineCounts.open === 1 ? 'line' : 'lines'} at once.`;
  }, [lineCounts.open, openLinesMissingCostCode]);

  const handleRequestCommit = (row: V3Row) => {
    if (rowMissingCostCode(row)) {
      setMissingCostCodeContext({
        lineLabel: String(row.cells['name'] ?? '').trim() || undefined,
        missingCount: 1,
      });
      setMissingCostCodeOpen(true);
      return;
    }
    setCommitTarget(row);
  };

  const handleRequestLockBudget = () => {
    if (openLinesMissingCostCode > 0) {
      setMissingCostCodeContext({
        missingCount: openLinesMissingCostCode,
        openLineCount: lineCounts.open,
      });
      setMissingCostCodeOpen(true);
      return;
    }
    setLockBudgetOpen(true);
  };

  const visibleColumns = columns.filter((c) => c.visible !== false);

  const tableMinWidth =
    SPREADSHEET_INDEX_COLUMN_WIDTH +
    BUDGET_STATUS_COLUMN_WIDTH +
    BUDGET_ACTIONS_COLUMN_WIDTH +
    visibleColumns.reduce((sum, col) => sum + col.width, 0);

  const stickyActionsHeader =
    'sticky right-0 z-50 bg-gray-100 border-l border-gray-300 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]';
  const stickyActionsCell =
    'sticky right-0 z-20 bg-white border-l border-gray-200 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]';
  const stickyActionsFooter =
    'sticky right-0 z-30 bg-gray-100 border-l border-gray-300 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]';

  return (

    <div className="flex flex-col h-full min-h-0 bg-white">

      <BudgetSeedPromptModal

        open={seedPromptOpen}

        lineCount={seedableLineCount}

        onUsePrimeContract={() => handleSeedPromptClose(true)}

        onStartBlank={() => handleSeedPromptClose(false)}

      />

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50 gap-4 flex-shrink-0">

          <div className="flex flex-col gap-0.5 min-w-0">

            <div className="text-sm text-gray-700">

              <span className="font-semibold">{lineCounts.locked} of {lineCounts.total} lines committed</span>

              {lineCounts.open > 0 && <span className="text-gray-500 ml-2">· {lineCounts.open} open</span>}

              {lineCounts.pending > 0 && <span className="text-amber-600 ml-2">· {lineCounts.pending} pending approval</span>}

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

          <div className="flex gap-2 flex-shrink-0">

            <button

              type="button"

              onClick={handleImportStub}

              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-white bg-white"

            >

              <Upload size={14} /> Import Excel

            </button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <button
                      type="button"
                      onClick={handleRequestLockBudget}
                      disabled={!canLockBudget}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <Lock size={14} /> Lock Budget
                    </button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {lockBudgetTooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

          </div>

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
              description="Enter a description, cost code, and budget amounts in the row above. Use Add row below for more lines — commit each line when it is ready."
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
                disabled={selectableRowIds.length === 0}
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

                  {col.id === 'costCode' && (
                    <span className="text-red-500 ml-0.5">*</span>
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



              return (

                <tr

                  key={row.id}

                  data-row-id={row.id}

                  className={`group border-b border-gray-200 h-7 ${state === 'locked' ? 'bg-green-50/30' : 'hover:bg-gray-50'}`}

                >

                  <SpreadsheetIndexCell

                    rowIndex={idx}

                    rowId={row.id}

                    isSelected={selectedRowIds.has(row.id)}

                    onToggleSelect={handleToggleRowSelect}

                    disabled={state === 'locked'}

                    fontSize={fontSize}

                    sticky

                  />

                  <td
                    className="px-2 border-r border-gray-200 whitespace-nowrap"
                    style={{ width: BUDGET_STATUS_COLUMN_WIDTH, minWidth: BUDGET_STATUS_COLUMN_WIDTH }}
                  >
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>

                  {visibleColumns.map((col) => {

                    const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;

                    return (

                      <td

                        key={col.id}

                        className={`px-2 border-r border-gray-200 cursor-pointer ${colAlignClass(col)} ${

                          missingCode && col.id === 'costCode' ? 'bg-red-50' : ''

                        }`}

                        onClick={() => handleCellClick(row, col.id)}

                      >

                        {isEditing ? (

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
                    className={`px-2 whitespace-nowrap ${stickyActionsCell} ${state === 'locked' ? 'bg-green-50/30' : ''}`}
                    style={{ width: BUDGET_ACTIONS_COLUMN_WIDTH, minWidth: BUDGET_ACTIONS_COLUMN_WIDTH }}
                  >

                    {state === 'open' && (

                      <button

                        type="button"

                        onClick={() => handleRequestCommit(row)}

                        className="text-xs font-medium text-blue-600 hover:text-blue-800"

                      >

                        Commit

                      </button>

                    )}

                    {state === 'locked' && (

                      <button

                        type="button"

                        onClick={() => setCoTarget(row)}

                        className="text-xs font-medium text-teal-600 hover:text-teal-800"

                      >

                        Change Order

                      </button>

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
            <SpreadsheetTableAddRowRow
              colSpan={visibleColumns.length + 3}
              onAddRow={addRow}
              selectedCount={selectedRowIds.size}
              onDeleteSelected={() => deleteRows(selectedRowIds)}
            />
          </tfoot>
        </table>

        </div>

        </div>

      </div>



      <MissingCostCodeModal
        open={missingCostCodeOpen}
        lineLabel={missingCostCodeContext.lineLabel}
        missingCount={missingCostCodeContext.missingCount}
        openLineCount={missingCostCodeContext.openLineCount}
        onClose={() => setMissingCostCodeOpen(false)}
      />



      <LockBudgetModal
        open={lockBudgetOpen}
        openLineCount={lineCounts.open}
        committedLineCount={lineCounts.locked}
        perLineApprovalEnabled={financialConfig?.perLineApprovalEnabled ?? false}
        onConfirm={() => {
          bulkCommitOpenLines();
          setLockBudgetOpen(false);
        }}
        onCancel={() => setLockBudgetOpen(false)}
      />



      <CommitLineModal

        open={!!commitTarget}

        lineLabel={String(commitTarget?.cells['name'] ?? 'Line')}

        lineAmount={commitTarget ? getBudgetLineAmount(commitTarget) : 0}

        onConfirm={() => {

          if (commitTarget) commitLine(commitTarget.id);

          setCommitTarget(null);

        }}

        onCancel={() => setCommitTarget(null)}

      />



      <ChangeOrderModal

        open={!!coTarget}

        lineLabel={String(coTarget?.cells['name'] ?? 'Line')}

        onClose={() => setCoTarget(null)}

        onRequest={() => {

          if (coTarget) {

            updateBudgetRows(

              budgetRows.map((r) =>

                r.id === coTarget.id ? { ...r, changeOrderId: `co-${Date.now()}` } : r

              )

            );

          }

          setCoTarget(null);

        }}

      />

    </div>

  );

};



export default BudgetSetupGrid;

