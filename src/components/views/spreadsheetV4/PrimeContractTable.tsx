import React, { useState } from 'react';
import { useProject } from '../../../context/ProjectContext';
import { V3Row, evaluateFormula } from './types';
import { PlusIcon, TrashIcon } from '../../common/Icons';

const colAlignClass = (col: { align?: string; type?: string }) =>
  col.align === 'right' || col.type === 'currency' || col.type === 'number'
    ? 'text-right tabular-nums'
    : 'text-left';

interface PrimeContractTableProps {
  isLocked?: boolean;
  onLockClick?: () => void;
  showLockButton?: boolean;
}

const PrimeContractTable: React.FC<PrimeContractTableProps> = ({
  isLocked = false,
  onLockClick,
  showLockButton = false
}) => {
  const { activeView, contractData, updateView } = useProject();
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const budgetSheet = activeView?.v3Sheets?.find(s => s.id === 'sheet-budget');

  if (!budgetSheet || !contractData) {
    return null;
  }

  const rows = budgetSheet.rows.filter(r => r.id !== 'empty-row');
  const columns = budgetSheet.columns;

  const formatCurrency = (value: unknown) => {
    const num = typeof value === 'number' ? value : Number(value) || 0;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCurrencyTotal = (value: number) =>
    `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  const formatNumber = (value: unknown) => {
    const num = typeof value === 'number' ? value : Number(value) || 0;
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  const getCellDisplay = (row: V3Row, columnId: string) => {
    const col = columns.find(c => c.id === columnId);
    const value = row.cells[columnId];

    if (col?.formula) {
      const calculated = evaluateFormula(col.formula, row.cells, rows, columns);
      if (col.type === 'currency') return formatCurrency(calculated);
      if (col.type === 'number') return formatNumber(calculated);
      return calculated;
    }

    if (col?.type === 'currency') return formatCurrency(value);
    if (col?.type === 'number') return formatNumber(value);
    return value ?? '';
  };

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleCellChange = (rowId: string, colId: string, newValue: string) => {
    const col = columns.find(c => c.id === colId);
    if (!col || !col.editable || isLocked) return;

    const newRows = rows.map(r => {
      if (r.id === rowId) {
        const numValue = col.type === 'currency' || col.type === 'number'
          ? parseFloat(newValue.replace(/[^0-9.-]/g, '')) || null
          : newValue;
        return {
          ...r,
          cells: { ...r.cells, [colId]: numValue }
        };
      }
      return r;
    });

    if (activeView) {
      const updatedSheets = (activeView.v3Sheets || []).map(s =>
        s.id === 'sheet-budget' ? { ...s, rows: newRows } : s
      );
      updateView({ v3Sheets: updatedSheets });
    }
  };

  const handleAddRow = () => {
    if (isLocked) return;
    const newRow: V3Row = { id: generateId('row'), cells: {} };
    const newRows = [...rows, newRow];

    if (activeView) {
      const updatedSheets = (activeView.v3Sheets || []).map(s =>
        s.id === 'sheet-budget' ? { ...s, rows: newRows } : s
      );
      updateView({ v3Sheets: updatedSheets });
    }
  };

  const handleDeleteRow = (rowId: string) => {
    if (isLocked) return;
    const newRows = rows.filter(r => r.id !== rowId);

    if (activeView) {
      const updatedSheets = (activeView.v3Sheets || []).map(s =>
        s.id === 'sheet-budget' ? { ...s, rows: newRows } : s
      );
      updateView({ v3Sheets: updatedSheets });
    }
  };

  const calculateTotal = (colId: string) => {
    return rows.reduce((sum, row) => {
      const col = columns.find(c => c.id === colId);
      const value = row.cells[colId];

      if (col?.formula) {
        const calculated = evaluateFormula(col.formula, row.cells, rows, columns);
        return sum + (typeof calculated === 'number' ? calculated : 0);
      }

      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header with Lock Badge */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Prime Contract Line Items</h2>
          {isLocked && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
              🔒 LOCKED
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!isLocked && (
            <button
              onClick={handleAddRow}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Add Row
            </button>
          )}
          {showLockButton && !isLocked && onLockClick && (
            <button
              onClick={onLockClick}
              className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              Lock Contract
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm table-fixed">
          <colgroup>
            {columns.filter(c => c.visible !== false).map(col => (
              <col key={col.id} style={{ width: `${col.width}px` }} />
            ))}
            {!isLocked && <col style={{ width: 40 }} />}
          </colgroup>
          <thead className="uppercase bg-gray-50 sticky top-0 z-40">
            <tr className="border-b border-gray-300">
              {columns.filter(c => c.visible !== false).map(col => (
                <th
                  key={col.id}
                  className={`px-4 py-3 text-xs font-semibold text-gray-700 border-r border-gray-200 whitespace-nowrap ${colAlignClass(col)}`}
                >
                  {col.label}
                </th>
              ))}
              {!isLocked && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 border-r border-gray-200 w-10">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className={`border-b border-gray-100 ${isLocked ? '' : 'hover:bg-gray-50'} transition-colors`}>
                {columns.filter(c => c.visible !== false).map(col => {
                  const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;
                  const cellValue = row.cells[col.id];
                  const displayValue = getCellDisplay(row, col.id);
                  const isTotalCol = col.isTotal;

                  return (
                    <td
                      key={col.id}
                      className={`px-4 py-3 border-r border-gray-100 ${colAlignClass(col)} ${isEditing ? 'bg-blue-50' : ''} ${isTotalCol ? 'bg-blue-50 font-semibold text-blue-900' : ''}`}
                      onClick={() => {
                        if (col.editable && !isLocked) {
                          setEditingCell({ rowId: row.id, colId: col.id });
                          setEditValue(String(cellValue ?? ''));
                        }
                      }}
                    >
                      {isEditing ? (
                        <input
                          type={col.type === 'currency' || col.type === 'number' ? 'number' : 'text'}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => {
                            handleCellChange(row.id, col.id, editValue);
                            setEditingCell(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCellChange(row.id, col.id, editValue);
                              setEditingCell(null);
                            } else if (e.key === 'Escape') {
                              setEditingCell(null);
                            }
                          }}
                          className={`w-full py-1 border border-blue-400 rounded outline-none ${colAlignClass(col)}`}
                          autoFocus
                        />
                      ) : (
                        <span className={`block w-full ${col.editable && !isLocked ? 'cursor-pointer hover:underline' : ''} ${colAlignClass(col)}`}>
                          {displayValue}
                        </span>
                      )}
                    </td>
                  );
                })}
                {!isLocked && (
                  <td className="px-4 py-3 text-center border-r border-gray-100 w-10">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="text-red-600 hover:text-red-700 transition-colors p-1"
                      title="Delete row"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 border-t-2 border-gray-300 sticky bottom-0">
            <tr>
              {columns.filter(c => c.visible !== false).map(col => (
                <td
                  key={col.id}
                  className={`px-4 py-3 text-sm font-semibold text-gray-900 border-r border-gray-300 ${colAlignClass(col)}`}
                >
                  {col.isTotal || (col.type === 'currency' || col.type === 'number') ? (
                    col.type === 'currency' ? formatCurrencyTotal(calculateTotal(col.id)) : formatNumber(calculateTotal(col.id))
                  ) : col.label === 'S.No' || col.label === 'Contract Line' ? (
                    <span className="opacity-50">Total</span>
                  ) : null}
                </td>
              ))}
              {!isLocked && <td className="px-4 py-3 w-10 border-r border-gray-300"></td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default PrimeContractTable;
