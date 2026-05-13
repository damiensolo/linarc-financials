import React, { useState } from 'react';
import { Search, Sliders, ArrowUpDown, HelpCircle, Eye, Grid3X3, Plus, Pin } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';

interface PrimeContractTableProps {
  isLocked?: boolean;
}

const PrimeContractTable: React.FC<PrimeContractTableProps> = ({ isLocked = false }) => {
  const { activeView, contractData } = useProject();
  const [searchTerm, setSearchTerm] = useState('');

  const budgetSheet = activeView?.v3Sheets?.find(s => s.id === 'sheet-budget');

  if (!budgetSheet || !contractData) {
    return null;
  }

  const rows = budgetSheet.rows.filter(r => r.id !== 'empty-row');

  const calculateTotals = () => {
    return {
      labor: rows.reduce((sum, row) => sum + (Number(row.cells.labor) || 0), 0),
      material: rows.reduce((sum, row) => sum + (Number(row.cells.material) || 0), 0),
      equipment: rows.reduce((sum, row) => sum + (Number(row.cells.equipment) || 0), 0),
      subcontractor: rows.reduce((sum, row) => sum + (Number(row.cells.subcontractor) || 0), 0),
      others: rows.reduce((sum, row) => sum + (Number(row.cells.others) || 0), 0),
      totalBudget: rows.reduce((sum, row) => sum + (Number(row.cells.totalBudget) || 0), 0),
    };
  };

  const totals = calculateTotals();

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header with title and lock badge */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Prime Contract</h2>
          {isLocked && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
              ✓ LOCKED
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">All amount values are in USD ($)</p>
      </div>

      {/* Contract metadata bar */}
      <div className="px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-8 mb-3">
          <div className="flex items-center gap-2">
            <Pin size={16} className="text-orange-500 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-900">{contractData.projectName}</span>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-8 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">Executed Date</p>
            <p className="font-medium text-gray-900">{formatDate(contractData.executedDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Construction Start</p>
            <p className="font-medium text-gray-900">{formatDate(contractData.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Substantial Completion</p>
            <p className="font-medium text-gray-900">{formatDate(contractData.endDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Contract Sum</p>
            <p className="font-medium text-gray-900">{formatCurrency(contractData.contractSum || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Contract File</p>
            <p className="font-medium text-blue-600 text-sm cursor-pointer hover:underline">{contractData.fileName}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>
          <button className="p-1.5 text-gray-600 hover:bg-white rounded-lg transition-colors" title="Filter">
            <Sliders size={16} />
          </button>
          <button className="p-1.5 text-gray-600 hover:bg-white rounded-lg transition-colors" title="Sort">
            <ArrowUpDown size={16} />
          </button>
          <button className="p-1.5 text-gray-600 hover:bg-white rounded-lg transition-colors" title="Help">
            <HelpCircle size={16} />
          </button>
          <button className="p-1.5 text-gray-600 hover:bg-white rounded-lg transition-colors" title="Visibility">
            <Eye size={16} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-gray-600 hover:bg-white rounded-lg transition-colors" title="Grid view">
            <Grid3X3 size={16} />
          </button>
          <button className="p-1.5 text-gray-600 hover:bg-white rounded-lg transition-colors" title="Add row">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="uppercase bg-gray-50 sticky top-0 z-40">
            <tr className="border-b border-gray-200">
              <th className="px-3 py-3 text-left font-semibold text-gray-700 text-xs w-8">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="px-3 py-3 text-center font-semibold text-gray-700 text-xs w-12">S.No</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700 text-xs min-w-[200px] border-r border-gray-200">Contract Line</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700 text-xs w-20">Cost Code</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-700 text-xs w-16">QTY</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700 text-xs w-16">UOM</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-700 text-xs w-20">Hours</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-700 text-xs w-24">Labor</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-700 text-xs w-24">Material</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-700 text-xs w-24">Equipment</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-700 text-xs w-24">Sub</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-700 text-xs w-24">Others</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-700 text-xs w-28 bg-blue-50">Total Budget</th>
              <th className="px-3 py-3 text-center font-semibold text-gray-700 text-xs w-16">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2 text-center">
                  <input type="checkbox" className="rounded" disabled={isLocked} />
                </td>
                <td className="px-3 py-2 text-center text-gray-500 text-xs font-medium">{index + 1}</td>
                <td className="px-3 py-2 text-gray-900 border-r border-gray-100">
                  <span title={row.cells.name as string} className="block truncate">
                    {row.cells.name || `Line Item ${index + 1}`}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-900">{row.cells.costCode || '—'}</td>
                <td className="px-3 py-2 text-gray-900 text-right">{row.cells.quantity || '—'}</td>
                <td className="px-3 py-2 text-gray-900">{row.cells.unit || '—'}</td>
                <td className="px-3 py-2 text-gray-900 text-right">{row.cells.effortHours ? formatCurrency(Number(row.cells.effortHours)) : '—'}</td>
                <td className="px-3 py-2 text-gray-900 text-right">{formatCurrency(Number(row.cells.labor) || 0)}</td>
                <td className="px-3 py-2 text-gray-900 text-right">{formatCurrency(Number(row.cells.material) || 0)}</td>
                <td className="px-3 py-2 text-gray-900 text-right">{formatCurrency(Number(row.cells.equipment) || 0)}</td>
                <td className="px-3 py-2 text-gray-900 text-right">{formatCurrency(Number(row.cells.subcontractor) || 0)}</td>
                <td className="px-3 py-2 text-gray-900 text-right">{formatCurrency(Number(row.cells.others) || 0)}</td>
                <td className="px-3 py-2 text-blue-600 text-right font-medium bg-blue-50">
                  {formatCurrency(Number(row.cells.totalBudget) || 0)}
                </td>
                <td className="px-3 py-2 text-center text-gray-500">
                  <button className="text-gray-400 hover:text-gray-600" disabled={isLocked}>•••</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-800 text-white sticky bottom-0">
            <tr>
              <td colSpan={2} className="px-3 py-3"></td>
              <td className="px-3 py-3 font-semibold border-r border-gray-700">Total</td>
              <td className="px-3 py-3"></td>
              <td className="px-3 py-3 text-right">0</td>
              <td className="px-3 py-3"></td>
              <td className="px-3 py-3 text-right">0</td>
              <td className="px-3 py-3 text-right font-semibold">{formatCurrency(totals.labor)}</td>
              <td className="px-3 py-3 text-right font-semibold">{formatCurrency(totals.material)}</td>
              <td className="px-3 py-3 text-right font-semibold">{formatCurrency(totals.equipment)}</td>
              <td className="px-3 py-3 text-right font-semibold">{formatCurrency(totals.subcontractor)}</td>
              <td className="px-3 py-3 text-right font-semibold">{formatCurrency(totals.others)}</td>
              <td className="px-3 py-3 text-right font-semibold bg-blue-900">{formatCurrency(totals.totalBudget)}</td>
              <td className="px-3 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default PrimeContractTable;
