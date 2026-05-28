import React, { useEffect, useRef } from 'react';
import { SPREADSHEET_INDEX_COLUMN_WIDTH } from '../../../constants/spreadsheetLayout';

interface SpreadsheetIndexHeaderCellProps {
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: () => void;
  disabled?: boolean;
  sticky?: boolean;
  className?: string;
}

const SpreadsheetIndexHeaderCell: React.FC<SpreadsheetIndexHeaderCellProps> = ({
  allSelected,
  someSelected,
  onToggleAll,
  disabled = false,
  sticky = false,
  className = '',
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

  return (
    <th
      className={`border-r border-gray-300 bg-gray-100 text-center p-0 ${
        sticky ? 'sticky left-0 z-40' : ''
      } ${className}`}
      style={{
        width: SPREADSHEET_INDEX_COLUMN_WIDTH,
        minWidth: SPREADSHEET_INDEX_COLUMN_WIDTH,
      }}
    >
      <div className="flex items-center justify-center h-full">
        {disabled ? (
          <span className="text-xs font-semibold text-gray-500">#</span>
        ) : (
          <input
            ref={checkboxRef}
            type="checkbox"
            checked={allSelected}
            onChange={onToggleAll}
            aria-label="Select all rows"
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
        )}
      </div>
    </th>
  );
};

export default SpreadsheetIndexHeaderCell;
