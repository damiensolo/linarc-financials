import React, { useState, useRef, useEffect } from 'react';
import { ColumnId, DisplayDensity } from '../../types';
import { GripVerticalIcon, MinusIcon, PlusIcon } from '../common/Icons';
import { useProject } from '../../context/ProjectContext';
import { getDefaultTableColumns, getDefaultSpreadsheetColumns } from '../../constants';
import { cn } from '../../lib/utils';

interface SettingsMenuProps {
  onClose: () => void;
  className?: string;
  disableClickOutside?: boolean;
}

const CompactIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <rect x="2" y="3" width="16" height="2" rx="1" opacity="0.8" />
    <rect x="2" y="7" width="16" height="2" rx="1" opacity="0.8" />
    <rect x="2" y="11" width="16" height="2" rx="1" opacity="0.8" />
    <rect x="2" y="15" width="16" height="2" rx="1" opacity="0.8" />
  </svg>
);

const StandardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <rect x="2" y="4" width="16" height="2" rx="1" opacity="0.8" />
    <rect x="2" y="9" width="16" height="2" rx="1" opacity="0.8" />
    <rect x="2" y="14" width="16" height="2" rx="1" opacity="0.8" />
  </svg>
);

const ComfortableIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <rect x="2" y="5" width="16" height="2" rx="1" opacity="0.8" />
    <rect x="2" y="13" width="16" height="2" rx="1" opacity="0.8" />
  </svg>
);

const DensityButton: React.FC<{
  label: string;
  density: DisplayDensity;
  current: DisplayDensity;
  onClick: (d: DisplayDensity) => void;
  icon: React.ReactNode;
}> = ({ label, density, current, onClick, icon }) => (
  <button
    onClick={() => onClick(density)}
    title={label}
    className={cn(
      "flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-md border transition-all h-14",
      current === density
        ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm"
        : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
    )}
  >
    {icon}
    <span className="text-[10px] mt-1 font-medium">{label}</span>
  </button>
);


const FieldsMenu: React.FC<SettingsMenuProps> = ({ onClose, className, disableClickOutside }) => {
  const { activeView, updateView, setColumns, setDisplayDensity, setShowGridLines, setShowColoredRows, setFontSize, setShowToolbarLabels, activeViewMode } = useProject();
  const { displayDensity, fontSize } = activeView;
  const menuRef = useRef<HTMLDivElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null);
  
  const isSpreadsheetV2 = activeViewMode === 'spreadsheetV2';
  const isSpreadsheetV4 = activeViewMode === 'spreadsheetV4';
  const isAnySpreadsheet = isSpreadsheetV2 || isSpreadsheetV4;
  const showFields = true;

  const activeSheetId = activeView.v3ActiveSheetId;
  const activeSheet = isSpreadsheetV4 ? (activeView.v3Sheets?.find(s => s.id === activeSheetId) || activeView.v3Sheets?.[0]) : null;

  const columns = isSpreadsheetV4
      ? (activeSheet?.columns || [])
      : (isAnySpreadsheet ? (activeView.spreadsheetColumns || []) : activeView.columns);

  useEffect(() => {
    if (disableClickOutside) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, disableClickOutside]);

  const handleVisibilityChange = (id: string) => {
    if (isV3OrV4 && activeSheet && activeView.v3Sheets) {
        const newCols = columns.map(c => c.id === id ? { ...c, visible: !(c.visible ?? true) } : c);
        const newSheets = activeView.v3Sheets.map(s => s.id === activeSheet.id ? { ...s, columns: newCols } : s);
        updateView({ v3Sheets: newSheets });
    } else if (isSpreadsheet || isSpreadsheetV2) {
        const newCols = columns.map(c => c.id === id ? { ...c, visible: !(c.visible ?? true) } : c);
        updateView({ spreadsheetColumns: newCols });
    } else {
        setColumns(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
    }
  };
  
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const isAfter = e.clientY > rect.top + rect.height / 2;
    
    setDropIndicatorIndex(isAfter ? index + 1 : index);
  };
  
  const handleDrop = () => {
    if (draggedIndex === null || dropIndicatorIndex === null || draggedIndex === dropIndicatorIndex) {
      // no change or invalid drop
    } else {
        if (isV3OrV4 && activeSheet && activeView.v3Sheets) {
            const newColumns = [...columns];
            const [removed] = newColumns.splice(draggedIndex, 1);
            const adjustedDropIndex = draggedIndex < dropIndicatorIndex ? dropIndicatorIndex - 1 : dropIndicatorIndex;
            newColumns.splice(adjustedDropIndex, 0, removed);
            const newSheets = activeView.v3Sheets.map(s => s.id === activeSheet.id ? { ...s, columns: newColumns } : s);
            updateView({ v3Sheets: newSheets });
        } else if (isSpreadsheet || isSpreadsheetV2) {
            const newColumns = [...columns];
            const [removed] = newColumns.splice(draggedIndex, 1);
            const adjustedDropIndex = draggedIndex < dropIndicatorIndex ? dropIndicatorIndex - 1 : dropIndicatorIndex;
            newColumns.splice(adjustedDropIndex, 0, removed);
            updateView({ spreadsheetColumns: newColumns });
        } else {
            setColumns(prev => {
                const newColumns = [...prev];
                const [removed] = newColumns.splice(draggedIndex, 1);
                const adjustedDropIndex = draggedIndex < dropIndicatorIndex ? dropIndicatorIndex - 1 : dropIndicatorIndex;
                newColumns.splice(adjustedDropIndex, 0, removed);
                return newColumns;
            });
        }
    }
    setDraggedIndex(null);
    setDropIndicatorIndex(null);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDropIndicatorIndex(null);
      }
  };

  const onResetColumns = () => {
    if (isV3OrV4 && activeSheet && activeView.v3Sheets) {
        // Can't easily reset V3/V4 without knowing the template, skip for now or set to defaults
        // If needed, we would need to call createTemplateSheets
    } else if (isSpreadsheet || isSpreadsheetV2) {
        updateView({ spreadsheetColumns: getDefaultSpreadsheetColumns() });
    } else {
        setColumns(getDefaultTableColumns());
    }
  };

  return (
    <div ref={menuRef} className={cn("absolute top-full right-0 mt-2 w-72 bg-white rounded-md shadow-lg border border-gray-200 z-50 flex flex-col", className)}>
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800">View settings</h3>
      </div>
      
      {/* Density Section */}
      <div className="p-3 border-b border-gray-200">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Display Density</h4>
        <div className="flex gap-2">
          <DensityButton label="Compact" density="compact" current={displayDensity} onClick={setDisplayDensity} icon={<CompactIcon />} />
          <DensityButton label="Standard" density="standard" current={displayDensity} onClick={setDisplayDensity} icon={<StandardIcon />} />
          <DensityButton label="Comfortable" density="comfortable" current={displayDensity} onClick={setDisplayDensity} icon={<ComfortableIcon />} />
        </div>
      </div>

      {/* Font Size Section */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-gray-700">Font Size</h4>
            <div className="flex items-center gap-2 bg-gray-100 rounded-md p-1">
                <button 
                    onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                    disabled={fontSize <= 10}
                    className="p-1 hover:bg-white rounded shadow-sm disabled:opacity-50 disabled:hover:bg-transparent disabled:shadow-none"
                >
                    <MinusIcon className="w-3 h-3 text-gray-600" />
                </button>
                <span className="text-xs font-medium text-gray-700 w-8 text-center">{fontSize}px</span>
                <button 
                    onClick={() => setFontSize(Math.min(20, fontSize + 1))}
                    disabled={fontSize >= 20}
                    className="p-1 hover:bg-white rounded shadow-sm disabled:opacity-50 disabled:hover:bg-transparent disabled:shadow-none"
                >
                    <PlusIcon className="w-3 h-3 text-gray-600" />
                </button>
            </div>
        </div>
      </div>
      


      {/* Toolbar Labels Toggle */}
      <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Show toolbar labels</h4>
              <label htmlFor="labels-toggle" className="relative inline-flex items-center cursor-pointer">
                  <input
                      type="checkbox"
                      id="labels-toggle"
                      className="sr-only peer"
                      checked={activeView.showToolbarLabels ?? true}
                      onChange={(e) => setShowToolbarLabels(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
          </div>
      </div>

      {/* Colored Rows Toggle - Only for budget spreadsheet view */}
      {isSpreadsheetV2 && (
        <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">Show colored rows</h4>
                <label htmlFor="colored-rows-toggle" className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        id="colored-rows-toggle"
                        className="sr-only peer"
                        checked={activeView.showColoredRows ?? true}
                        onChange={(e) => setShowColoredRows(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>
        </div>
      )}

      {/* Fields Section - Hidden for some views */}
      {showFields && (
        <>
          <div className="p-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fields</h4>
            <p className="text-xs text-gray-500 mb-2">Toggle visibility and reorder.</p>
          </div>
          <ul className="px-1 pb-2 flex-grow overflow-y-auto" style={{ maxHeight: '250px' }} onDragLeave={handleDragLeave}>
            {columns.map((column, index) => (
              <React.Fragment key={column.id}>
                {dropIndicatorIndex === index && (
                    <li className="h-0.5 bg-blue-500 mx-2 my-0.5"></li>
                  )}
                <li
                  className={`flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded-md ${draggedIndex === index ? 'opacity-50' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={handleDrop}
                >
                  <div className="flex items-center">
                    <GripVerticalIcon className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-grab mr-1" />
                    <label htmlFor={`field-${column.id}`} className="text-sm text-gray-700 cursor-pointer">{column.label}</label>
                  </div>
                  <input
                    type="checkbox"
                    id={`field-${column.id}`}
                    checked={column.visible ?? true}
                    onChange={() => handleVisibilityChange(column.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </li>
              </React.Fragment>
            ))}
            {dropIndicatorIndex === columns.length && (
                <li className="h-0.5 bg-blue-500 mx-2 my-0.5"></li>
            )}
          </ul>
          <div className="p-2 border-t border-gray-200 mt-auto">
            <button 
              onClick={onResetColumns}
              className="w-full text-center text-sm font-medium text-gray-700 hover:text-blue-600 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              Reset fields to default
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FieldsMenu;