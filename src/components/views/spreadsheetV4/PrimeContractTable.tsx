import React from 'react';
import { useProject } from '../../../context/ProjectContext';

const PrimeContractTable: React.FC = () => {
  const { activeView, contractData } = useProject();

  const budgetSheet = activeView?.v3Sheets?.find(s => s.id === 'sheet-budget');

  if (!budgetSheet || !contractData) {
    return null;
  }

  const rows = budgetSheet.rows.filter(r => r.id !== 'empty-row');

  const totalValue = rows.reduce((sum, row) => {
    const value = row.cells.totalBudget || row.cells.value || 0;
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Prime Contract</h2>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="uppercase bg-gray-50 sticky top-0 z-40">
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
                Contract Line
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">
                Contract Value
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 text-sm text-gray-900 border-r border-gray-100">
                  {row.cells.name || `Line Item ${index + 1}`}
                </td>
                <td className="px-6 py-3 text-sm text-gray-900 text-right font-medium">
                  {formatCurrency(Number(row.cells.totalBudget || row.cells.value || 0))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 border-t-2 border-gray-300">
            <tr>
              <td className="px-6 py-3 text-sm font-semibold text-gray-900 border-r border-gray-300">
                Total
              </td>
              <td className="px-6 py-3 text-sm font-semibold text-gray-900 text-right">
                {formatCurrency(totalValue)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default PrimeContractTable;
