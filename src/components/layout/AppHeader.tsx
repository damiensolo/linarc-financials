import React, { useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import { PlusIcon, DownloadIcon, CalculatorIcon } from '../common/Icons';

const formatValue = (val: number) => 
    Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const AppHeader: React.FC = () => {
    const { activeViewMode, activeView, activeFinancialSection, financialSetupComplete, contractLocked } = useProject();

    const getTitle = () => {
        if (activeViewMode === 'table') return 'RFIs';
        if (activeViewMode === 'spreadsheetV2') return 'Budget';
        if (activeViewMode === 'spreadsheetV4') {
            if (activeFinancialSection === 'sov') return 'Schedule of Values';
            if (activeFinancialSection === 'allocate') return 'Schedule Linking & Allocation';
            if (activeFinancialSection === 'budget') return 'Budget';
            return 'Prime Contract';
        }
        return 'Budget';
    };

    const title = getTitle();

    const budgetTotals = useMemo(() => {
        const data = activeView.spreadsheetData;
        if (!data || data.length === 0) return { total: 0, distributed: 0, unallocated: 0 };

        return data.reduce((acc, curr) => {
            const rowBudget = curr.totalBudget || 0;
            const rowRemaining = curr.remainingContract || 0;
            return {
                distributed: acc.distributed + rowBudget,
                unallocated: acc.unallocated + rowRemaining,
                total: acc.total + (rowBudget + rowRemaining)
            };
        }, { total: 0, distributed: 0, unallocated: 0 });
    }, [activeView.spreadsheetData]);

    const { total, distributed, unallocated } = budgetTotals;

    // Locked prime contract shows a LOCKED pill in line with the title.
    const showContractLocked =
        activeViewMode === 'spreadsheetV4' &&
        activeFinancialSection === 'primeContract' &&
        (financialSetupComplete || contractLocked);

    const isScheduleActiveSheet = activeView.v3ActiveSheetId === 'sheet-schedule';
    const isSpreadsheetView = activeViewMode === 'spreadsheetV2' && !isScheduleActiveSheet;
    const isReadyToLock = isSpreadsheetView && unallocated === 0;
    const showCreateButton = activeViewMode === 'table';

    // Status colors based on unallocated amount - used only for the status pill
    const statusClasses = unallocated === 0 
        ? 'bg-green-50 text-green-700 border-green-200 shadow-[0_1px_2px_rgba(34,197,94,0.1)]' 
        : unallocated < 0
        ? 'bg-red-50 text-red-700 border-red-200 shadow-[0_1px_2px_rgba(239,68,68,0.1)]'
        : 'bg-amber-50 text-amber-700 border-amber-200 shadow-[0_1px_2px_rgba(245,158,11,0.1)]';

    return (
        <header className="h-14 flex-shrink-0 border-b border-gray-200 bg-white relative z-[90]">
            <div className="flex items-center justify-between px-4 h-full">
                <div className="flex items-center gap-6">
                    <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                    
                    {isSpreadsheetView && (
                        <div className="flex items-center gap-5">
                            {/* Standard text strings for secondary metadata */}
                            <div className="flex items-center gap-5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
                                    <span className="font-bold text-gray-900 font-mono text-sm tracking-tight">${formatValue(total)}</span>
                                </div>
                                
                                <span className="w-px h-4 bg-gray-200"></span>
                                
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Distributed</span>
                                    <span className="font-bold text-gray-900 font-mono text-sm tracking-tight">${formatValue(distributed)}</span>
                                </div>
                            </div>

                            {/* Prominent Status Pill for critical metadata */}
                            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold border transition-all duration-300 ${statusClasses}`}>
                                <span className="opacity-70 uppercase tracking-widest">
                                    {unallocated < 0 ? 'Over Allocated' : unallocated === 0 ? 'Balanced' : 'Unallocated'}
                                </span>
                                <span className="font-mono text-sm tracking-tighter">
                                    ${formatValue(unallocated)}
                                    {unallocated < 0 && ' over'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-2">

                    {showContractLocked && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                            LOCKED
                        </span>
                    )}

                    {isSpreadsheetView && (
                        <button 
                            disabled={!isReadyToLock}
                            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold rounded-md shadow-sm transition-all duration-300 transform active:scale-95 ${
                                isReadyToLock 
                                ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer ring-2 ring-green-500 ring-offset-2' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 opacity-60'
                            }`}
                        >
                            <CalculatorIcon className="w-4 h-4" />
                            <span>Lock Budget</span>
                        </button>
                    )}

                    {showCreateButton && (
                        <button className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-zinc-800 border-2 border-[#121212] rounded-md hover:bg-zinc-700 shadow-sm transition-colors">
                            <PlusIcon className="w-4 h-4" />
                            <span>Create</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AppHeader;