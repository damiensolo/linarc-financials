import { useCallback, useLayoutEffect, useRef, useState } from 'react';

export interface ScrollToRowOptions {
  /** Called once the row is in the DOM and scrolled into view. */
  onRowReady?: (rowId: string, row: HTMLElement) => void;
}

/** Scroll a table row into view after Add row and optionally focus / activate it. */
export function useScrollToRowOnAdd(rowCount: number) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [pendingRowId, setPendingRowId] = useState<string | null>(null);
  const pendingOptionsRef = useRef<ScrollToRowOptions | undefined>(undefined);

  const requestScrollToRow = useCallback((rowId: string, options?: ScrollToRowOptions) => {
    pendingOptionsRef.current = options;
    setPendingRowId(rowId);
  }, []);

  useLayoutEffect(() => {
    if (!pendingRowId || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const rowId = pendingRowId;
    const options = pendingOptionsRef.current;
    let cancelled = false;
    let focusTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = (row: HTMLElement, didScroll: boolean) => {
      const activateRow = () => {
        if (cancelled) return;
        options?.onRowReady?.(rowId, row);

        const tryFocus = (attempt = 0) => {
          if (cancelled) return;
          const currentRow = container.querySelector<HTMLElement>(`[data-row-id="${rowId}"]`);
          const input = currentRow?.querySelector<HTMLInputElement>('input:not([disabled])');
          if (input) {
            input.focus({ preventScroll: true });
            input.select?.();
            return;
          }
          if (attempt < 12) {
            requestAnimationFrame(() => tryFocus(attempt + 1));
          }
        };

        tryFocus();
      };

      if (didScroll) {
        focusTimer = setTimeout(activateRow, 200);
      } else {
        activateRow();
      }

      pendingOptionsRef.current = undefined;
      setPendingRowId(null);
    };

    const scrollAndFocus = (attempt = 0) => {
      if (cancelled) return;

      const row = container.querySelector<HTMLElement>(`[data-row-id="${rowId}"]`);
      if (!row) {
        if (attempt < 8) {
          requestAnimationFrame(() => scrollAndFocus(attempt + 1));
        } else {
          pendingOptionsRef.current = undefined;
          setPendingRowId(null);
        }
        return;
      }

      const tfoot = container.querySelector('tfoot');
      const footerHeight = tfoot?.getBoundingClientRect().height ?? 0;
      const padding = 12;

      const rowTop =
        row.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop;
      const rowBottom = rowTop + row.offsetHeight;
      const visibleBottom = container.scrollTop + container.clientHeight - footerHeight - padding;

      let targetScrollTop = container.scrollTop;
      if (rowBottom > visibleBottom) {
        targetScrollTop = rowBottom - container.clientHeight + footerHeight + padding;
      } else if (rowTop < container.scrollTop + padding) {
        targetScrollTop = rowTop - padding;
      }

      const didScroll = Math.abs(targetScrollTop - container.scrollTop) > 1;
      if (didScroll) {
        container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
      }

      finish(row, didScroll);
    };

    scrollAndFocus();

    return () => {
      cancelled = true;
      if (focusTimer) clearTimeout(focusTimer);
    };
  }, [pendingRowId, rowCount]);

  return { scrollContainerRef, requestScrollToRow };
}
