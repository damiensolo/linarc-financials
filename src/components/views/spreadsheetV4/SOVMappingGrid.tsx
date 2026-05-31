import React, { useCallback, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { useScrollToRowOnAdd } from '../../../hooks/useScrollToRowOnAdd';
import {
  createManualSovMapping,
  isSovMappingConfirmed,
} from '../../../lib/financialWorkflow';
import { SPREADSHEET_INDEX_COLUMN_WIDTH } from '../../../constants/spreadsheetLayout';
import SpreadsheetIndexCell from './SpreadsheetIndexCell';
import SpreadsheetIndexHeaderCell from './SpreadsheetIndexHeaderCell';
import { SpreadsheetTableAddRowRow } from './SpreadsheetTableFooterBar';
import SpreadsheetTableEmptyState from './SpreadsheetTableEmptyState';
import { formatCurrency } from './spreadsheetTableUtils';

const SOV_STATUS_WIDTH = 100;
const COL = {
  sovLineItem: 240,
  costCode: 110,
  budgetLineItem: 220,
  quantity: 80,
  uom: 100,
  totalBudget: 120,
  location: 100,
} as const;

const COLUMN_COUNT = 9;

interface SOVMappingGridProps {
  /** When the SOV is published, the grid is read-only: no confirm, add, delete, or edit controls. */
  locked?: boolean;
}

const SOVMappingGrid: React.FC<SOVMappingGridProps> = ({ locked = false }) => {
  const {
    sovMappings,
    addSovMapping,
    updateSovMapping,
    confirmSovMapping,
    confirmAllSovDrafts,
    removeSovMapping,
    activeView,
  } = useProject();

  const fontSize = activeView?.fontSize ?? 12;
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [collapsedSovLineIds, setCollapsedSovLineIds] = useState<Set<string>>(new Set());

  const sortedMappings = useMemo(
    () => [...sovMappings].sort((a, b) => a.sovLineNumber - b.sovLineNumber),
    [sovMappings]
  );

  const { scrollContainerRef, requestScrollToRow } = useScrollToRowOnAdd(sortedMappings.length);

  const confirmedCount = sortedMappings.filter(isSovMappingConfirmed).length;
  const draftCount = sortedMappings.length - confirmedCount;
  const totalAmount = sortedMappings.reduce((sum, m) => sum + m.amount, 0);

  const selectableRowIds = useMemo(
    () => sortedMappings.map((m) => m.rowId),
    [sortedMappings]
  );

  const allSelectableSelected =
    selectableRowIds.length > 0 && selectableRowIds.every((id) => selectedRowIds.has(id));
  const someSelectableSelected = selectableRowIds.some((id) => selectedRowIds.has(id));

  const tableMinWidth =
    SPREADSHEET_INDEX_COLUMN_WIDTH +
    SOV_STATUS_WIDTH +
    Object.values(COL).reduce((s, w) => s + w, 0);

  const startEditDescription = (rowId: string, current: string) => {
    setEditingRowId(rowId);
    setEditDescription(current);
  };

  const saveDescription = (rowId: string) => {
    updateSovMapping(rowId, { sovDescription: editDescription });
    setEditingRowId(null);
  };

  const handleToggleRowSelect = useCallback((rowId: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      next.has(rowId) ? next.delete(rowId) : next.add(rowId);
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    if (allSelectableSelected) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(selectableRowIds));
    }
  }, [allSelectableSelected, selectableRowIds]);

  const toggleCollapse = useCallback((rowId: string) => {
    setCollapsedSovLineIds((prev) => {
      const next = new Set(prev);
      next.has(rowId) ? next.delete(rowId) : next.add(rowId);
      return next;
    });
  }, []);

  const addRow = useCallback(() => {
    const nextLineNumber =
      sortedMappings.reduce((max, m) => Math.max(max, m.sovLineNumber), 0) + 1;
    const mapping = createManualSovMapping(nextLineNumber);
    addSovMapping(mapping);
    setCollapsedSovLineIds((prev) => {
      const next = new Set(prev);
      next.delete(mapping.rowId);
      return next;
    });
    requestScrollToRow(`sov-parent-${mapping.rowId}`, {
      onRowReady: () => startEditDescription(mapping.rowId, ''),
    });
  }, [addSovMapping, requestScrollToRow, sortedMappings]);

  const deleteSelected = useCallback(() => {
    selectedRowIds.forEach((rowId) => removeSovMapping(rowId));
    setSelectedRowIds(new Set());
  }, [removeSovMapping, selectedRowIds]);

  let displayIndex = 0;

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50 gap-4 flex-shrink-0">
        <div className="text-sm text-gray-700">
          <span className="font-semibold">
            {locked
              ? `${sortedMappings.length} SOV lines published`
              : `${confirmedCount} of ${sortedMappings.length} SOV lines confirmed`}
          </span>
          {!locked && draftCount > 0 && (
            <span className="text-amber-600 ml-2">· {draftCount} draft awaiting confirmation</span>
          )}
          {locked && (
            <span className="text-gray-500 ml-2">· Locked — owner-facing billing schedule is final</span>
          )}
        </div>
        {!locked && draftCount > 0 && (
          <button
            type="button"
            onClick={confirmAllSovDrafts}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Confirm all drafts ({draftCount})
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div ref={scrollContainerRef} className="h-full overflow-auto relative">
          {sortedMappings.length === 0 && (
            <SpreadsheetTableEmptyState
              title="No SOV lines yet"
              description="Commit budget lines in Step 3 — each committed line will appear here as a draft SOV entry. You can also add manual SOV lines below."
            />
          )}
          <table
            className="border-collapse table-fixed w-full text-sm"
            style={{ fontSize, minWidth: tableMinWidth }}
          >
            <colgroup>
              <col style={{ width: SPREADSHEET_INDEX_COLUMN_WIDTH, minWidth: SPREADSHEET_INDEX_COLUMN_WIDTH, maxWidth: SPREADSHEET_INDEX_COLUMN_WIDTH }} />
              <col style={{ width: COL.sovLineItem }} />
              <col style={{ width: COL.costCode, minWidth: COL.costCode }} />
              <col style={{ width: COL.budgetLineItem }} />
              <col style={{ width: COL.quantity, minWidth: COL.quantity }} />
              <col style={{ width: COL.uom, minWidth: COL.uom }} />
              <col style={{ width: COL.totalBudget, minWidth: COL.totalBudget }} />
              <col style={{ width: COL.location, minWidth: COL.location }} />
              <col style={{ width: SOV_STATUS_WIDTH, minWidth: SOV_STATUS_WIDTH }} />
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
                <th className="px-2 text-left text-xs font-semibold text-gray-700 bg-gray-100 border-r border-gray-300">SOV Line Item</th>
                <th className="px-2 text-left text-xs font-semibold text-gray-700 bg-gray-100 border-r border-gray-300">Cost Code</th>
                <th className="px-2 text-left text-xs font-semibold text-gray-700 bg-gray-100 border-r border-gray-300">Budget Line Item</th>
                <th className="px-2 text-right text-xs font-semibold text-gray-700 bg-gray-100 border-r border-gray-300">Quantity</th>
                <th className="px-2 text-left text-xs font-semibold text-gray-700 bg-gray-100 border-r border-gray-300">UOM</th>
                <th className="px-2 text-right text-xs font-semibold text-gray-700 bg-gray-100 border-r border-gray-300">Total Budget</th>
                <th className="px-2 text-left text-xs font-semibold text-gray-700 bg-gray-100 border-r border-gray-300">Location</th>
                <th className="px-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedMappings.map((mapping) => {
                const isDraft = !isSovMappingConfirmed(mapping);
                const isCollapsed = collapsedSovLineIds.has(mapping.rowId);
                const parentIndex = displayIndex++;
                const childIndex = isCollapsed ? -1 : displayIndex++;

                return (
                  <React.Fragment key={mapping.rowId}>
                    <tr
                      data-row-id={`sov-parent-${mapping.rowId}`}
                      className="border-b border-gray-200 h-8 bg-slate-50/90"
                    >
                      <SpreadsheetIndexCell
                        rowIndex={parentIndex}
                        rowId={mapping.rowId}
                        isSelected={selectedRowIds.has(mapping.rowId)}
                        onToggleSelect={handleToggleRowSelect}
                        disabled={locked}
                        fontSize={fontSize}
                        sticky
                        className="bg-slate-50/90"
                      />
                      <td className="px-2 border-r border-gray-200 bg-slate-50/90">
                        <div className="flex items-center gap-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleCollapse(mapping.rowId)}
                            className="p-0.5 rounded hover:bg-gray-200/80 flex-shrink-0"
                            aria-label={isCollapsed ? 'Expand SOV line' : 'Collapse SOV line'}
                          >
                            {isCollapsed ? (
                              <ChevronRight size={14} className="text-gray-500" />
                            ) : (
                              <ChevronDown size={14} className="text-gray-500" />
                            )}
                          </button>
                          {!locked && isDraft && editingRowId === mapping.rowId ? (
                            <input
                              autoFocus
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              onBlur={() => saveDescription(mapping.rowId)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveDescription(mapping.rowId);
                                if (e.key === 'Escape') setEditingRowId(null);
                              }}
                              className="w-full py-0.5 px-1 border border-blue-400 rounded text-sm focus:outline-none"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => !locked && isDraft && startEditDescription(mapping.rowId, mapping.sovDescription)}
                              className={`text-left truncate text-sm font-medium text-gray-900 ${!locked && isDraft ? 'hover:text-blue-600 cursor-pointer' : 'cursor-default'}`}
                            >
                              {mapping.sovDescription || '—'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="border-r border-gray-200 bg-slate-50/90" />
                      <td className="border-r border-gray-200 bg-slate-50/90" />
                      <td className="border-r border-gray-200 bg-slate-50/90" />
                      <td className="border-r border-gray-200 bg-slate-50/90" />
                      <td className="px-2 text-right border-r border-gray-200 text-sm tabular-nums font-medium text-gray-900 bg-slate-50/90">
                        ${formatCurrency(mapping.amount)}
                      </td>
                      <td className="border-r border-gray-200 bg-slate-50/90" />
                      <td className="px-2 bg-slate-50/90 whitespace-nowrap">
                        {locked ? (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                            Published
                          </span>
                        ) : isDraft ? (
                          <button
                            type="button"
                            onClick={() => confirmSovMapping(mapping.rowId)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800"
                          >
                            Confirm
                          </button>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Confirmed
                          </span>
                        )}
                      </td>
                    </tr>
                    {!isCollapsed && (
                      <tr
                        data-row-id={`sov-child-${mapping.rowId}`}
                        className="border-b border-gray-200 h-7 hover:bg-gray-50"
                      >
                        <SpreadsheetIndexCell
                          rowIndex={childIndex}
                          rowId={mapping.rowId}
                          isSelected={selectedRowIds.has(mapping.rowId)}
                          onToggleSelect={handleToggleRowSelect}
                          disabled
                          fontSize={fontSize}
                          sticky
                        />
                        <td className="border-r border-gray-200" />
                        <td className="px-2 border-r border-gray-200 text-sm text-gray-800 whitespace-nowrap">
                          {mapping.costCode || '—'}
                        </td>
                        <td className="px-2 border-r border-gray-200 text-sm text-gray-800 truncate" title={mapping.budgetLineItem}>
                          {mapping.budgetLineItem || '—'}
                        </td>
                        <td className="px-2 text-right border-r border-gray-200 text-sm tabular-nums text-gray-800">
                          {mapping.quantity != null ? mapping.quantity : '—'}
                        </td>
                        <td className="px-2 border-r border-gray-200 text-sm text-gray-800 whitespace-nowrap">
                          {mapping.uom || '—'}
                        </td>
                        <td className="px-2 text-right border-r border-gray-200 text-sm tabular-nums text-gray-800">
                          ${formatCurrency(mapping.amount)}
                        </td>
                        <td className="px-2 border-r border-gray-200 text-sm text-gray-800 truncate">
                          {mapping.location || '—'}
                        </td>
                        <td className="px-2">
                          {isDraft && (
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              Draft
                            </span>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 z-20">
              {sortedMappings.length > 0 && (
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
                  <td colSpan={5} className="border-r border-gray-300 bg-gray-100" />
                  <td className="px-2 text-right border-r border-gray-300 bg-gray-100 text-sm tabular-nums text-gray-900">
                    ${formatCurrency(totalAmount)}
                  </td>
                  <td colSpan={2} className="bg-gray-100" />
                </tr>
              )}
              {!locked && (
                <SpreadsheetTableAddRowRow
                  colSpan={COLUMN_COUNT}
                  onAddRow={addRow}
                  selectedCount={selectedRowIds.size}
                  onDeleteSelected={deleteSelected}
                />
              )}
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SOVMappingGrid;
