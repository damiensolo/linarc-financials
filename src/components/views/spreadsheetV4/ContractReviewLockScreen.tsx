import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useProject } from '../../../context/ProjectContext';
import ContractMetadataBar from './ContractMetadataBar';
import V3Header, { ROW_NUM_WIDTH, ACTIONS_WIDTH } from './components/V3Header';
import V3RowComponent from './components/V3Row';
import { ChevronRightIcon, PlusIcon } from '../../common/Icons';
import { SPREADSHEET_INDEX_COLUMN_WIDTH } from '../../../constants/spreadsheetLayout';
import { V3Sheet, V3Row, V3Column } from './types';

const ContractReviewLockScreen: React.FC = () => {
  const { contractData, contractLocked, setContractLocked, activeView, updateView, setFinancialSetupStep } = useProject();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [focusedCell, setFocusedCell] = useState<{ rowId: string; colId: string } | null>(null);

  if (!contractData) return null;

  const sheet = activeView?.v3Sheets?.[0];
  if (!sheet) return null;

  const columns = sheet.columns || [];
  const rows = sheet.rows || [];
  const fontSize = activeView?.fontSize ?? 12;

  const flatRows = useMemo(() => {
    const result: { row: V3Row; level: number }[] = [];
    const flatten = (rows: V3Row[], level = 0) => {
      rows.forEach(row => {
        result.push({ row, level });
        if (row.children?.length && expandedIds.has(row.id)) {
          flatten(row.children, level + 1);
        }
      });
    };
    flatten(rows);
    return result;
  }, [rows, expandedIds]);

  const totals = useMemo(() => {
    const acc: Record<string, number> = {};
    const addTotals = (rows: V3Row[]) => {
      rows.forEach(row => {
        columns.forEach(col => {
          if (col.isTotal) {
            const val = Number(row.cells[col.id] || 0);
            acc[col.id] = (acc[col.id] || 0) + (row.children?.length ? 0 : val);
          }
        });
        if (row.children?.length) addTotals(row.children);
      });
    };
    addTotals(rows);
    return acc;
  }, [rows, columns]);

  const handleLockContract = () => {
    setContractLocked(true);
  };

  const handleProceed = () => {
    setFinancialSetupStep(3);
  };

  const handleAddRow = () => {
    const newRow: V3Row = {
      id: `row-${Date.now()}`,
      cells: {},
      isDraft: true,
    };
    updateView({
      v3Sheets: [{ ...sheet, rows: [...rows, newRow] }],
    });
  };

  const handleRowClick = (rowId: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedRowIds(prev => {
        const next = new Set(prev);
        next.has(rowId) ? next.delete(rowId) : next.add(rowId);
        return next;
      });
    } else {
      setSelectedRowIds(new Set([rowId]));
    }
  };

  const handleToggleExpand = (rowId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(rowId) ? next.delete(rowId) : next.add(rowId);
      return next;
    });
  };

  const handleCellClick = (rowId: string, colId: string) => {
    setFocusedCell({ rowId, colId });
  };

  const handleCellChange = (rowId: string, colId: string, value: any) => {
    const newRows = rows.map(row =>
      row.id === rowId ? { ...row, cells: { ...row.cells, [colId]: value } } : row
    );
    updateView({
      v3Sheets: [{ ...sheet, rows: newRows }],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col bg-white"
    >
      {/* Metadata Bar (Sticky Header) */}
      <ContractMetadataBar isLocked={contractLocked} isEditable={!contractLocked} />

      {/* Spreadsheet Table */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white px-4 py-2">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative flex flex-col flex-1 min-h-0">
          <div className="overflow-auto relative select-none flex-1 min-h-0">
            <table className="border-collapse min-w-max table-fixed relative" style={{ fontSize }}>
              <V3Header
                columns={columns}
                focusedColId={focusedCell?.colId ?? null}
                selectedColId={null}
                resizingColumnId={null}
                sort={null}
                isScrolled={false}
                isAtEnd={false}
                isVerticalScrolled={false}
                fontSize={fontSize}
                displayDensity="compact"
                onColumnHeaderClick={() => {}}
                onRenameColumn={() => {}}
                onResize={() => {}}
                onColumnMove={() => {}}
                onAddColumn={() => {}}
                onContextMenu={() => {}}
                cutColId={null}
                isAllSelected={false}
                onToggleAll={() => {}}
                checkboxRef={null}
              />

              <tbody>
                {flatRows.map(({ row, level }) => (
                  <V3RowComponent
                    key={row.id}
                    row={row}
                    columns={columns}
                    level={level}
                    isSelected={selectedRowIds.has(row.id)}
                    isExpanded={expandedIds.has(row.id)}
                    onToggleExpand={() => handleToggleExpand(row.id)}
                    onRowClick={(e) => handleRowClick(row.id, e)}
                    onCellClick={(colId) => handleCellClick(row.id, colId)}
                    onCellChange={(colId, val) => handleCellChange(row.id, colId, val)}
                    focusedColId={focusedCell?.rowId === row.id ? focusedCell.colId : null}
                    fontSize={fontSize}
                    displayDensity="compact"
                    isEditable={!contractLocked}
                  />
                ))}
              </tbody>

              {/* Totals Footer */}
              {Object.keys(totals).length > 0 && (
                <tfoot className="bg-gray-100 text-gray-900 border-t-2 border-gray-300 sticky bottom-0 z-30 font-bold">
                  <tr className="h-9">
                    <td
                      className="sticky left-0 z-40 border-r border-gray-300 text-center bg-gray-100"
                      style={{ width: SPREADSHEET_INDEX_COLUMN_WIDTH, minWidth: SPREADSHEET_INDEX_COLUMN_WIDTH, maxWidth: SPREADSHEET_INDEX_COLUMN_WIDTH, fontSize }}
                    >
                      Total
                    </td>
                    {columns.map(col => (
                      <td
                        key={col.id}
                        className="border-r border-gray-300 px-2 bg-gray-100 whitespace-nowrap"
                        style={{ width: col.width, fontSize }}
                      >
                        {col.isTotal && totals[col.id] !== undefined
                          ? Number(totals[col.id]).toLocaleString()
                          : ''}
                      </td>
                    ))}
                    <td className="bg-gray-100 border-r border-gray-300" style={{ width: 44 }} />
                    <td className="sticky right-0 z-40 border-l border-gray-200 bg-gray-100 w-20" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Add Row Button */}
        <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 flex items-center gap-4">
          <button
            onClick={handleAddRow}
            disabled={contractLocked}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <div className="w-4 h-4 rounded-full border border-blue-600 flex items-center justify-center disabled:border-gray-400">
              <PlusIcon className="w-2.5 h-2.5" />
            </div>
            Add row
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          {contractLocked ? (
            <span className="text-green-700 font-medium">✓ Contract locked and ready for budget setup</span>
          ) : (
            <span>Review and lock the contract to proceed to Step 3: Budget Setup</span>
          )}
        </div>
        <button
          onClick={handleLockContract}
          disabled={contractLocked}
          className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Lock Contract
        </button>
        {contractLocked && (
          <button
            onClick={handleProceed}
            className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Proceed to Budget Setup
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ContractReviewLockScreen;
