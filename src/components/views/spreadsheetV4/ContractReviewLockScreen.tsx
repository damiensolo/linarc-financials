import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useProject } from '../../../context/ProjectContext';
import ContractMetadataBar from './ContractMetadataBar';
import { ChevronRightIcon, PlusIcon } from '../../common/Icons';
import { SPREADSHEET_INDEX_COLUMN_WIDTH } from '../../../constants/spreadsheetLayout';
import { V3Row } from './types';

const ContractReviewLockScreen: React.FC = () => {
  const { contractData, contractLocked, setContractLocked, activeView, updateView, setFinancialSetupStep } = useProject();

  if (!contractData) return null;

  const sheet = activeView?.v3Sheets?.[0];
  if (!sheet) return null;

  const columns = sheet.columns || [];
  const rows = sheet.rows || [];
  const fontSize = activeView?.fontSize ?? 12;

  // Flatten rows for rendering (no nesting for simplicity)
  const flatRows = useMemo(() => {
    return rows.filter(r => r.id !== 'empty-row');
  }, [rows]);

  // Calculate totals
  const totals = useMemo(() => {
    const acc: Record<string, number> = {};
    flatRows.forEach(row => {
      columns.forEach(col => {
        if (col.isTotal) {
          const val = Number(row.cells[col.id] || 0);
          acc[col.id] = (acc[col.id] || 0) + val;
        }
      });
    });
    return acc;
  }, [flatRows, columns]);

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

  const handleCellChange = (rowId: string, colId: string, value: any) => {
    const newRows = rows.map(row =>
      row.id === rowId ? { ...row, cells: { ...row.cells, [colId]: value } } : row
    );
    updateView({
      v3Sheets: [{ ...sheet, rows: newRows }],
    });
  };

  const handleDeleteRow = (rowId: string) => {
    const newRows = rows.filter(r => r.id !== rowId);
    updateView({
      v3Sheets: [{ ...sheet, rows: newRows }],
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

      {/* Table Section */}
      <div className="flex-1 overflow-hidden flex flex-col px-4 py-3">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          {/* Table */}
          <div className="overflow-auto flex-1 relative">
            <table className="border-collapse min-w-max table-fixed relative" style={{ fontSize }}>
              {/* Header */}
              <thead className="bg-gray-100 sticky top-0 z-20">
                <tr className="h-9">
                  <th
                    className="border-r border-gray-300 text-left font-semibold text-gray-900 px-3 bg-gray-100"
                    style={{ width: SPREADSHEET_INDEX_COLUMN_WIDTH, minWidth: SPREADSHEET_INDEX_COLUMN_WIDTH, maxWidth: SPREADSHEET_INDEX_COLUMN_WIDTH }}
                  >
                    #
                  </th>
                  {columns.map(col => (
                    <th
                      key={col.id}
                      className="border-r border-gray-300 text-left font-semibold text-gray-900 px-3 bg-gray-100 whitespace-nowrap"
                      style={{ width: col.width, minWidth: col.width, maxWidth: col.width }}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="border-r border-gray-300 bg-gray-100" style={{ width: 44 }} />
                  <th className="bg-gray-100" style={{ width: 40 }} />
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {flatRows.map((row, idx) => (
                  <tr key={row.id} className="h-7 hover:bg-blue-50 border-b border-gray-200">
                    <td
                      className="border-r border-gray-300 text-center text-xs text-gray-500 px-3 bg-gray-50"
                      style={{ width: SPREADSHEET_INDEX_COLUMN_WIDTH, minWidth: SPREADSHEET_INDEX_COLUMN_WIDTH, maxWidth: SPREADSHEET_INDEX_COLUMN_WIDTH }}
                    >
                      {idx + 1}
                    </td>
                    {columns.map(col => (
                      <td
                        key={`${row.id}-${col.id}`}
                        className="border-r border-gray-300 px-3 relative"
                        style={{ width: col.width, minWidth: col.width, maxWidth: col.width }}
                      >
                        {contractLocked ? (
                          <span className="text-gray-900">{row.cells[col.id] ?? '—'}</span>
                        ) : (
                          <input
                            type={col.type === 'currency' ? 'number' : col.type === 'number' ? 'number' : 'text'}
                            value={row.cells[col.id] ?? ''}
                            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                            disabled={contractLocked || col.editable === false}
                            placeholder="—"
                            className="w-full px-2 py-1 border border-transparent hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded text-gray-900 text-sm focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        )}
                      </td>
                    ))}
                    <td className="border-r border-gray-300" style={{ width: 44 }} />
                    <td
                      className="px-2 text-center"
                      style={{ width: 40 }}
                    >
                      {!contractLocked && (
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="text-gray-400 hover:text-red-600 text-xs font-medium transition-colors"
                          title="Delete row"
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Totals Footer */}
              {Object.keys(totals).length > 0 && (
                <tfoot className="bg-gray-100 border-t-2 border-gray-300 sticky bottom-0 z-20 font-bold">
                  <tr className="h-9">
                    <td
                      className="border-r border-gray-300 text-center text-gray-900 px-3 bg-gray-100"
                      style={{ width: SPREADSHEET_INDEX_COLUMN_WIDTH, minWidth: SPREADSHEET_INDEX_COLUMN_WIDTH, maxWidth: SPREADSHEET_INDEX_COLUMN_WIDTH }}
                    >
                      Total
                    </td>
                    {columns.map(col => (
                      <td
                        key={`total-${col.id}`}
                        className="border-r border-gray-300 px-3 text-gray-900 bg-gray-100 whitespace-nowrap"
                        style={{ width: col.width, minWidth: col.width, maxWidth: col.width }}
                      >
                        {col.isTotal && totals[col.id] !== undefined
                          ? col.type === 'currency'
                            ? `$${formatCurrency(totals[col.id])}`
                            : totals[col.id].toLocaleString()
                          : ''}
                      </td>
                    ))}
                    <td className="border-r border-gray-300 bg-gray-100" style={{ width: 44 }} />
                    <td className="bg-gray-100" style={{ width: 40 }} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Add Row Button */}
          <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 flex items-center gap-3">
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
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          {contractLocked ? (
            <span className="text-green-700 font-medium">✓ Contract locked and ready for budget setup</span>
          ) : (
            <span>Add line items, then lock the contract to proceed</span>
          )}
        </div>
        <div className="flex items-center gap-3">
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
      </div>
    </motion.div>
  );
};

export default ContractReviewLockScreen;
