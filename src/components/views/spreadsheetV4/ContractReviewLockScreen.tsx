import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { useScrollToRowOnAdd } from '../../../hooks/useScrollToRowOnAdd';
import ContractMetadataBar from './ContractMetadataBar';
import SpreadsheetIndexCell from './SpreadsheetIndexCell';
import SpreadsheetIndexHeaderCell from './SpreadsheetIndexHeaderCell';
import SpreadsheetTableFooterBar from './SpreadsheetTableFooterBar';
import { SPREADSHEET_INDEX_COLUMN_WIDTH } from '../../../constants/spreadsheetLayout';
import {
  DEFAULT_PRIME_CONTRACT_COLUMNS,
  contractSumMismatch,
  getPrimeContractLineValue,
} from '../../../lib/financialWorkflow';
import { colAlignClass, formatCurrency, formatCurrencyWhole } from './spreadsheetTableUtils';

const ContractReviewLockScreen: React.FC = () => {
  const { contractData, contractLocked, activeView, primeContractRows, updatePrimeContractRows } = useProject();
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  if (!contractData) return null;

  const columns = activeView?.v3Sheets?.find((s) => s.id === 'sheet-prime-contract')?.columns
    ?? DEFAULT_PRIME_CONTRACT_COLUMNS;
  const fontSize = activeView?.fontSize ?? 12;

  const flatRows = useMemo(() => {
    if (primeContractRows.length === 0) {
      return [{ id: `pc-row-${Date.now()}`, cells: {}, isDraft: true }];
    }
    return primeContractRows;
  }, [primeContractRows]);

  const totals = useMemo(() => {
    const acc: Record<string, number> = {};
    flatRows.forEach((row) => {
      columns.forEach((col) => {
        if (col.isTotal) {
          const val = col.id === 'contractValue' || col.id === 'totalBudget'
            ? getPrimeContractLineValue(row)
            : Number(row.cells[col.id] || 0);
          acc[col.id] = (acc[col.id] || 0) + val;
        }
      });
    });
    return acc;
  }, [flatRows, columns]);

  const sumWarning = useMemo(
    () => contractSumMismatch(contractData, flatRows),
    [contractData, flatRows]
  );

  const generateId = () => `pc-row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const { scrollContainerRef, requestScrollToRow } = useScrollToRowOnAdd(flatRows.length);

  const handleAddRow = () => {
    const newId = generateId();
    updatePrimeContractRows([...flatRows, { id: newId, cells: {}, isDraft: true }]);
    requestScrollToRow(newId);
  };

  const handleCellChange = (rowId: string, colId: string, value: string) => {
    const col = columns.find((c) => c.id === colId);
    const parsed =
      col?.type === 'currency' || col?.type === 'number'
        ? parseFloat(value.replace(/[^0-9.-]/g, '')) || null
        : value;
    updatePrimeContractRows(
      flatRows.map((row) =>
        row.id === rowId ? { ...row, cells: { ...row.cells, [colId]: parsed } } : row
      )
    );
  };

  const handleToggleRowSelect = (rowId: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      next.has(rowId) ? next.delete(rowId) : next.add(rowId);
      return next;
    });
  };

  const handleDeleteRows = (ids: Set<string>) => {
    const remaining = flatRows.filter((r) => !ids.has(r.id));
    updatePrimeContractRows(
      remaining.length > 0 ? remaining : [{ id: generateId(), cells: {}, isDraft: true }]
    );
    setSelectedRowIds(new Set());
  };

  const selectableRowIds = contractLocked ? [] : flatRows.map((r) => r.id);
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

  const colgroup = (
    <colgroup>
      <col style={{ width: SPREADSHEET_INDEX_COLUMN_WIDTH }} />
      {columns.map((col) => (
        <col key={col.id} style={{ width: col.width }} />
      ))}
    </colgroup>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col bg-white min-h-0"
    >
      <ContractMetadataBar isLocked={contractLocked} isEditable={!contractLocked} />

      {sumWarning.mismatched && (
        <div className="mx-6 mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex-shrink-0">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Line item total (${formatCurrencyWhole(sumWarning.lineSum)}) does not match the Contract Sum
            (${formatCurrencyWhole(sumWarning.contractSum)}). Adjust line values or update the contract sum.
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Scrollable body */}
        <div ref={scrollContainerRef} className="flex-1 overflow-auto min-h-0">
          <table className="border-collapse w-full table-fixed" style={{ fontSize }}>
            {colgroup}
            <thead className="bg-gray-100 sticky top-0 z-20">
              <tr className="h-9">
                <SpreadsheetIndexHeaderCell
                  allSelected={allSelectableSelected}
                  someSelected={someSelectableSelected}
                  onToggleAll={handleToggleSelectAll}
                  disabled={contractLocked}
                  sticky
                />
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className={`font-semibold text-gray-900 px-3 bg-gray-100 whitespace-nowrap ${colAlignClass(col)}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flatRows.map((row, idx) => (
                <tr
                  key={row.id}
                  data-row-id={row.id}
                  className={`group h-7 border-b border-gray-200 ${
                    selectedRowIds.has(row.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <SpreadsheetIndexCell
                    rowIndex={idx}
                    rowId={row.id}
                    isSelected={selectedRowIds.has(row.id)}
                    onToggleSelect={handleToggleRowSelect}
                    disabled={contractLocked}
                    fontSize={fontSize}
                    sticky
                    className="bg-white"
                  />
                  {columns.map((col) => (
                    <td key={`${row.id}-${col.id}`} className={`px-3 relative ${colAlignClass(col)}`}>
                      {contractLocked ? (
                        <span className={`block w-full text-gray-900 text-sm ${colAlignClass(col)}`}>
                          {(col.type === 'currency' && (row.cells[col.id] ?? row.cells['totalBudget']))
                            ? `$${formatCurrency(Number(row.cells[col.id] ?? row.cells['totalBudget']))}`
                            : row.cells[col.id] ?? '—'}
                        </span>
                      ) : (
                        <input
                          type={col.type === 'currency' || col.type === 'number' ? 'number' : 'text'}
                          value={row.cells[col.id] ?? row.cells[col.id === 'contractValue' ? 'totalBudget' : col.id] ?? ''}
                          onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                          disabled={col.editable === false}
                          placeholder="—"
                          className={`w-full py-0.5 border border-transparent hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded text-gray-900 text-sm focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 ${colAlignClass(col)}`}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pinned footer: totals + add row — always visible */}
        <div className="flex-shrink-0 border-t-2 border-gray-300 bg-white z-20 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
          <table className="border-collapse w-full table-fixed bg-gray-100" style={{ fontSize }}>
            {colgroup}
            <tbody>
              <tr className="h-9 font-bold">
                <td style={{ width: SPREADSHEET_INDEX_COLUMN_WIDTH }} className="bg-gray-100" />
                {columns.map((col) => (
                  <td
                    key={`total-${col.id}`}
                    className={`px-3 text-gray-900 bg-gray-100 whitespace-nowrap ${colAlignClass(col)}`}
                  >
                    {col.isTotal && totals[col.id] !== undefined
                      ? col.type === 'currency'
                        ? `$${formatCurrencyWhole(totals[col.id])}`
                        : totals[col.id].toLocaleString()
                      : col.id === columns[0]?.id
                        ? 'Total'
                        : ''}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <SpreadsheetTableFooterBar
            onAddRow={handleAddRow}
            addDisabled={contractLocked}
            selectedCount={selectedRowIds.size}
            onDeleteSelected={() => handleDeleteRows(selectedRowIds)}
            deleteDisabled={contractLocked}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ContractReviewLockScreen;
