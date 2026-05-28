import React from 'react';
import { PlusIcon, TrashIcon } from '../../common/Icons';

interface SpreadsheetTableFooterBarProps {
  onAddRow: () => void;
  addDisabled?: boolean;
  selectedCount: number;
  onDeleteSelected: () => void;
  deleteDisabled?: boolean;
}

/** Inline add-row / delete controls — use inside a table row via SpreadsheetTableAddRowRow. */
export const SpreadsheetTableFooterBar: React.FC<SpreadsheetTableFooterBarProps> = ({
  onAddRow,
  addDisabled = false,
  selectedCount,
  onDeleteSelected,
  deleteDisabled = false,
}) => (
  <div className="flex items-center gap-3 py-2 pl-2 pr-4">
    <button
      type="button"
      onClick={onAddRow}
      disabled={addDisabled}
      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-base transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
    >
      <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center disabled:border-gray-400">
        <PlusIcon className="w-3 h-3" />
      </div>
      Add row
    </button>
    {selectedCount > 0 && !deleteDisabled && (
      <button
        type="button"
        onClick={onDeleteSelected}
        className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
      >
        <TrashIcon className="w-4 h-4" />
        Delete ({selectedCount})
      </button>
    )}
  </div>
);

/** Add-row controls as the last row of a table — scrolls with content, sticks with tfoot. */
export const SpreadsheetTableAddRowRow: React.FC<
  SpreadsheetTableFooterBarProps & { colSpan: number }
> = ({ colSpan, ...barProps }) => (
  <tr className="bg-gray-50">
    <td colSpan={colSpan} className="p-0 border-t border-gray-200">
      <SpreadsheetTableFooterBar {...barProps} />
    </td>
  </tr>
);

export default SpreadsheetTableFooterBar;
