import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/** Scroll a table row into view after Add row — only scrolls when the row is outside the viewport. */
export function useScrollToRowOnAdd(rowCount: number) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [pendingRowId, setPendingRowId] = useState<string | null>(null);

  const requestScrollToRow = useCallback((rowId: string) => {
    setPendingRowId(rowId);
  }, []);

  useLayoutEffect(() => {
    if (!pendingRowId || !scrollContainerRef.current) return;

    const row = scrollContainerRef.current.querySelector<HTMLElement>(
      `[data-row-id="${pendingRowId}"]`
    );
    if (!row) return;

    row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    setPendingRowId(null);
  }, [pendingRowId, rowCount]);

  return { scrollContainerRef, requestScrollToRow };
}
