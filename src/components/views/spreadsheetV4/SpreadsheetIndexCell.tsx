import React from 'react';
import { SPREADSHEET_INDEX_COLUMN_WIDTH } from '../../../constants/spreadsheetLayout';

interface SpreadsheetIndexCellProps {
  rowIndex: number;
  rowId: string;
  isSelected: boolean;
  onToggleSelect: (rowId: string) => void;
  disabled?: boolean;
  fontSize?: number;
  sticky?: boolean;
  className?: string;
}

const SpreadsheetIndexCell: React.FC<SpreadsheetIndexCellProps> = ({
  rowIndex,
  rowId,
  isSelected,
  onToggleSelect,
  disabled = false,
  fontSize = 12,
  sticky = false,
  className = '',
}) => (
  <td
    onClick={() => !disabled && onToggleSelect(rowId)}
    className={`group/index border-r border-gray-200 text-center p-0 ${
      disabled ? 'cursor-default' : 'cursor-pointer'
    } ${sticky ? 'sticky left-0 z-30 bg-white' : ''} ${className}`}
    style={{
      width: SPREADSHEET_INDEX_COLUMN_WIDTH,
      minWidth: SPREADSHEET_INDEX_COLUMN_WIDTH,
      maxWidth: SPREADSHEET_INDEX_COLUMN_WIDTH,
    }}
  >
    <div className="flex items-center justify-center h-full">
      {disabled ? (
        <span className="font-mono text-gray-500" style={{ fontSize }}>
          {rowIndex + 1}
        </span>
      ) : (
        <>
          <span
            className={`font-mono text-gray-500 ${isSelected ? 'hidden' : 'group-hover/index:hidden'}`}
            style={{ fontSize }}
          >
            {rowIndex + 1}
          </span>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(rowId)}
            onClick={(e) => e.stopPropagation()}
            className={`h-4 w-4 rounded border-gray-300 text-blue-600 ${
              isSelected ? 'block' : 'hidden group-hover/index:block'
            }`}
          />
        </>
      )}
    </div>
  </td>
);

export default SpreadsheetIndexCell;
