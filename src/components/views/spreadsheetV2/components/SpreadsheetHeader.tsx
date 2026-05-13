import React, { useState } from 'react';
import { SpreadsheetColumn, DisplayDensity, ColumnId } from '../../../../types';
import { Resizer } from '../../../common/ui/Resizer';
import { SortIcon, ArrowUpIcon, ArrowDownIcon, ChevronDownIcon, ChevronUpIcon, ChevronsDownIcon } from '../../../common/Icons';
import { SPREADSHEET_INDEX_COLUMN_WIDTH } from '../../../../constants/spreadsheetLayout';
import { useProject } from '../../../../context/ProjectContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../common/ui/Tooltip';

interface SpreadsheetHeaderProps {
    columns: SpreadsheetColumn[];
    focusedCell: { rowId: string; colId: string } | null;
    resizingColumnId: string | null;
    isScrolled: boolean;
    isAtEnd?: boolean;
    isVerticalScrolled?: boolean;
    fontSize: number;
    displayDensity: DisplayDensity;
    sort: { columnId: ColumnId; direction: 'asc' | 'desc' } | null;
    onSort: (columnId: string) => void;
    onColumnMove: (fromId: string, toId: string, position: 'left' | 'right') => void;
    onMouseDown: (columnId: string) => (e: React.MouseEvent) => void;
    onContextMenu: (e: React.MouseEvent, columnId: string) => void;
    isAllSelected: boolean;
    onToggleAll: () => void;
    toolbarCheckboxRef: React.RefObject<HTMLInputElement>;
}

const getHeaderHeightClass = (density: DisplayDensity) => {
  switch (density) {
    case 'compact': return 'h-8';
    case 'standard': return 'h-10';
    case 'comfortable': return 'h-12';
    default: return 'h-8';
  }
};

const SpreadsheetHeader: React.FC<SpreadsheetHeaderProps> = ({
    columns,
    focusedCell,
    resizingColumnId,
    isScrolled,
    isAtEnd,
    isVerticalScrolled,
    fontSize,
    displayDensity,
    sort,
    onSort,
    onColumnMove,
    onMouseDown,
    onContextMenu,
    isAllSelected,
    onToggleAll,
    toolbarCheckboxRef,
}) => {
    const { expansionCycle, handleCycleExpansion } = useProject();
    const heightClass = getHeaderHeightClass(displayDensity);
    const [dropIndicator, setDropIndicator] = useState<{ id: string; position: 'left' | 'right' } | null>(null);

    const handleDragStart = (e: React.DragEvent, columnId: string) => {
        e.dataTransfer.setData('text/plain', columnId);
        e.dataTransfer.effectAllowed = 'move';
        const target = e.currentTarget as HTMLElement;
        const ghost = target.cloneNode(true) as HTMLElement;
        ghost.style.position = 'absolute';
        ghost.style.top = '-9999px';
        ghost.style.width = `${target.offsetWidth}px`;
        ghost.style.height = `${target.offsetHeight}px`;
        ghost.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        ghost.style.border = '1px solid #ccc';
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setTimeout(() => document.body.removeChild(ghost), 0);
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        if (!e.dataTransfer.types.includes('text/plain')) return;
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const isRightHalf = e.clientX > rect.left + rect.width / 2;
        setDropIndicator({ id: columnId, position: isRightHalf ? 'right' : 'left' });
    };

    const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
        e.preventDefault();
        const sourceColumnId = e.dataTransfer.getData('text/plain');
        const currentDropIndicator = dropIndicator;
        setDropIndicator(null);
        if (sourceColumnId && sourceColumnId !== targetColumnId && currentDropIndicator) {
            onColumnMove(sourceColumnId, targetColumnId, currentDropIndicator.position);
        }
    };

    return (
        <thead className={`bg-gray-50 text-gray-700 font-semibold sticky top-0 z-40 transition-shadow duration-200 
            ${isVerticalScrolled ? 'shadow-[0_4px_6px_-2px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)]' : ''}
        `}>
            <tr className={heightClass}>
                {/* Sticky Left Header - fixed width index column */}
                <th className={`sticky left-0 z-[51] w-14 border-r border-gray-200 px-1 text-center bg-gray-50 transition-all
                    ${isScrolled ? 'after:content-[""] after:absolute after:top-0 after:bottom-0 after:-right-[6px] after:w-[6px] after:bg-gradient-to-r after:from-black/[0.12] after:to-transparent after:pointer-events-none' : ''}
                `}
                style={{ 
                    width: SPREADSHEET_INDEX_COLUMN_WIDTH,
                    minWidth: SPREADSHEET_INDEX_COLUMN_WIDTH,
                    maxWidth: SPREADSHEET_INDEX_COLUMN_WIDTH,
                    fontSize,
                    boxShadow: 'inset 0 -1px 0 #e5e7eb' // Ensures border remains visible when sticky
                }}>
                    <div className="flex items-center justify-center h-full w-full">
                        <input 
                            type="checkbox" 
                            checked={isAllSelected} 
                            onChange={onToggleAll} 
                            ref={toolbarCheckboxRef}
                            aria-label="Select all visible rows"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                    </div>
                </th>
                {columns.map((col, idx) => (
                    <th 
                        key={col.id} 
                        className={`border-r border-gray-200 px-2 whitespace-nowrap uppercase font-semibold relative group cursor-pointer ${col.align === 'right' ? 'text-right' : 'text-left'} 
                            ${focusedCell?.colId === col.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-50 text-gray-700'}`}
                        style={{ 
                            width: col.width, 
                            fontSize,
                            boxShadow: 'inset 0 -1px 0 #e5e7eb' // Consistent sticky border bottom
                        }}
                        onClick={() => onSort(col.id)}
                        onContextMenu={(e) => onContextMenu(e, col.id)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, col.id)}
                        onDragOver={(e) => handleDragOver(e, col.id)}
                        onDrop={(e) => handleDrop(e, col.id)}
                        onDragLeave={() => setDropIndicator(null)}
                    >
                        {dropIndicator?.id === col.id && (
                            <div className={`absolute top-0 h-full w-1 bg-blue-500 rounded-full ${dropIndicator.position === 'left' ? 'left-0' : 'right-0'}`} style={{ zIndex: 20 }} />
                        )}
                        <div className={`flex items-center h-full w-full overflow-hidden ${col.align === 'right' ? 'justify-end' : 'justify-start'} gap-1`}>
                            {idx === 0 && (
                                <div className="mr-2 flex items-center">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCycleExpansion();
                                                    }}
                                                    className="p-1 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-blue-500"
                                                    aria-label="Cycle expansion"
                                                >
                                                    {expansionCycle === 0 && <ChevronUpIcon className="w-4 h-4" />}
                                                    {expansionCycle === 1 && <ChevronDownIcon className="w-4 h-4" />}
                                                    {expansionCycle === 2 && <ChevronsDownIcon className="w-4 h-4" />}
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {expansionCycle === 0 && "Expand First Tier"}
                                                {expansionCycle === 1 && "Expand All"}
                                                {expansionCycle === 2 && "Collapse All"}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            )}
                            <span className="truncate">{col.label}</span>
                            {sort?.columnId === col.id ? (
                                sort.direction === 'asc' ? 
                                <ArrowUpIcon className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" /> : 
                                <ArrowDownIcon className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                            ) : (
                                <SortIcon className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            )}
                        </div>
                        <Resizer onMouseDown={onMouseDown(col.id)} isActive={resizingColumnId === col.id} />
                    </th>
                ))}
                {/* Sticky Right Header */}
                <th className={`sticky right-0 z-[51] w-20 border-l border-gray-200 px-2 text-center bg-gray-50 uppercase font-semibold transition-all
                    ${!isAtEnd ? 'before:content-[""] before:absolute before:top-0 before:bottom-0 before:-left-[6px] before:w-[6px] before:bg-gradient-to-l before:from-black/[0.12] before:to-transparent before:pointer-events-none' : ''}
                `}
                style={{ 
                    fontSize,
                    boxShadow: 'inset 0 -1px 0 #e5e7eb' // Consistent sticky border bottom
                }}>
                    <div className="flex items-center justify-center h-full w-full text-gray-700">
                        Actions
                    </div>
                </th>
            </tr>
        </thead>
    );
};

export default SpreadsheetHeader;