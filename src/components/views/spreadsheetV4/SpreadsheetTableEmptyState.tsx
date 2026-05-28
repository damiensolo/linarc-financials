import React from 'react';

interface SpreadsheetTableEmptyStateProps {
  title: string;
  description: string;
}

const SpreadsheetTableEmptyState: React.FC<SpreadsheetTableEmptyStateProps> = ({
  title,
  description,
}) => (
  <div
    className="absolute inset-x-0 bottom-0 top-9 flex items-center justify-center pointer-events-none z-10"
    aria-live="polite"
  >
    <div className="text-center max-w-md px-8 py-6">
      <p className="text-sm font-medium text-gray-700">{title}</p>
      <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{description}</p>
    </div>
  </div>
);

export default SpreadsheetTableEmptyState;
