import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { V3Sheet, V3Row, V3Column, V3CellStyle, CellValue, evaluateFormula, slugifyLabel } from './types';
import { createTemplateSheets } from './templates';
import FormulaBar from './components/FormulaBar';
import V3Header, { ROW_NUM_WIDTH, ACTIONS_WIDTH } from './components/V3Header';
import V3RowComponent from './components/V3Row';
import SpreadsheetToolbar from '../spreadsheetV2/components/SpreadsheetToolbar';
import AddColumnModal from './components/AddColumnModal';
import ContractDetailsForm from './ContractDetailsForm';
import ContractSummaryHeader from './ContractSummaryHeader';
import { ContextMenu, ContextMenuItem } from '../../common/ui/ContextMenu';
import ColorPicker from '../../common/ui/ColorPicker';
import {
  PlusIcon, ScissorsIcon, CopyIcon, ClipboardIcon, TrashIcon,
  ArrowUpIcon, ArrowDownIcon, ChevronLeftIcon, ChevronRightIcon, XIcon,
  FillColorIcon, IndentIcon, OutdentIcon, TextColorIcon, BorderColorIcon,
  AlertTriangleIcon, PaperclipIcon,
} from '../../common/Icons';
import { BACKGROUND_COLORS, TEXT_BORDER_COLORS } from '../../../constants/designTokens';
import { SPREADSHEET_INDEX_COLUMN_WIDTH } from '../../../constants/spreadsheetLayout';
import { useProject } from '../../../context/ProjectContext';
import { COLUMN_TYPES } from './components/AddColumnModal';
import { V3ColumnType } from './types';
import { Pencil } from 'lucide-react';

// ─── Flat row representation for rendering ────────────────────────────────────
interface FlatRow {
  row: V3Row;
  level: number;
  isSummary: boolean;
  parentId?: string;
}

function flattenRows(rows: V3Row[], expandedIds: Set<string>, level = 0, showSubtotals = true, parentId?: string): FlatRow[] {
  const result: FlatRow[] = [];
  for (const row of rows) {
    result.push({ row, level, isSummary: false, parentId });
    if (row.children?.length && expandedIds.has(row.id)) {
      result.push(...flattenRows(row.children, expandedIds, level + 1, showSubtotals, row.id));
      // summary row for groups
      if (row.isGroup && showSubtotals) result.push({ row, level: level + 1, isSummary: true, parentId: row.id });
    }
  }
  return result;
}

// ─── Column totals ─────────────────────────────────────────────────────────────
function sumColumn(rows: V3Row[], col: V3Column, allRows: V3Row[], allColumns: V3Column[]): number {
  let total = 0;
  const recurse = (items: V3Row[]) => {
    for (const r of items) {
      const val = col.type === 'formula' && col.formula
        ? Number(evaluateFormula(col.formula, r.cells, allRows, allColumns) || 0)
        : Number(r.cells[col.id] || 0);
      if (!r.children?.length) total += isNaN(val) ? 0 : val;
      if (r.children) recurse(r.children);
    }
  };
  recurse(rows);
  return total;
}

function formatCurrency(v: number) {
  const abs = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v < 0 ? `(${abs})` : abs;
}

// ─── ID generator ─────────────────────────────────────────────────────────────
let _uid = 1;
const uid = (prefix: string) => `${prefix}-${Date.now()}-${_uid++}`;

// ─── Row tree helpers ─────────────────────────────────────────────────────────
function indentRowInTree(rows: V3Row[], rowId: string): { rows: V3Row[]; newParentId: string } | null {
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].id === rowId) {
      if (i === 0) return null;
      const prev = rows[i - 1];
      const row = rows[i];
      // Preserve the parent's isGroup status — don't force group styling on normal rows
      const newPrev: V3Row = { ...prev, children: [...(prev.children ?? []), row] };
      return { rows: [...rows.slice(0, i - 1), newPrev, ...rows.slice(i + 1)], newParentId: prev.id };
    }
    if (rows[i].children?.length) {
      const result = indentRowInTree(rows[i].children!, rowId);
      if (result) return { rows: rows.map((r, j) => j === i ? { ...r, children: result.rows } : r), newParentId: result.newParentId };
    }
  }
  return null;
}

function outdentRowInTree(rows: V3Row[], rowId: string): V3Row[] | null {
  for (let i = 0; i < rows.length; i++) {
    if (!rows[i].children?.length) continue;
    const childIdx = rows[i].children!.findIndex(c => c.id === rowId);
    if (childIdx >= 0) {
      const extracted = rows[i].children![childIdx];
      const newChildren = rows[i].children!.filter((_, j) => j !== childIdx);
      const newParent: V3Row = { ...rows[i], children: newChildren.length > 0 ? newChildren : undefined, isGroup: newChildren.length > 0 };
      return [...rows.slice(0, i), newParent, extracted, ...rows.slice(i + 1)];
    }
    const newChildren = outdentRowInTree(rows[i].children!, rowId);
    if (newChildren !== null) return rows.map((r, j) => j === i ? { ...r, children: newChildren } : r);
  }
  return null;
}

function collectExpandableIdsFromRow(row: V3Row): string[] {
  const ids: string[] = [];
  if (row.children?.length) {
    ids.push(row.id);
    row.children.forEach((child) => {
      ids.push(...collectExpandableIdsFromRow(child));
    });
  }
  return ids;
}

const getModKeyLabel = () => (typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform) ? '⌘' : 'Ctrl');

// ─── Main component ──────────────────────────────────────────────────────────
const SpreadsheetViewV4: React.FC = () => {
  const { activeView, updateView, contractData, setIsContractUploadOpen, contractConfirmed } = useProject();

  // ── Single-sheet state + persistence sync ──────────────────────────────────
  const [localSheet, setLocalSheet] = useState<V3Sheet>(() => {
    if (activeView.v3Sheets && activeView.v3Sheets.length > 0) {
      return activeView.v3Sheets[0];
    }
    return createTemplateSheets('schedule')[0];
  });

  const lastSyncedRef = useRef<V3Sheet | null>(null);

  // Sync context → local (external updates e.g. undo from another view)
  useEffect(() => {
    if (activeView.v3Sheets && activeView.v3Sheets.length > 0) {
      const incoming = activeView.v3Sheets[0];
      if (incoming !== lastSyncedRef.current) {
        setLocalSheet(incoming);
        lastSyncedRef.current = incoming;
      }
    }
  }, [activeView.v3Sheets]);

  // Push local → context (persistence)
  useEffect(() => {
    if (localSheet !== lastSyncedRef.current) {
      updateView({ v3Sheets: [localSheet] });
      lastSyncedRef.current = localSheet;
    }
  }, [localSheet, updateView]);

  // Stable sheet updater — wraps setLocalSheet for callers that need a setter function
  const setSheet = useCallback((updater: V3Sheet | ((prev: V3Sheet) => V3Sheet)) => {
    setLocalSheet(prev => typeof updater === 'function' ? updater(prev) : updater);
  }, []);

  // The single active sheet (alias kept for wide use throughout the component)
  const activeSheet = localSheet;

  // activeSheetId is constant — derived once from the sheet's fixed ID
  const activeSheetId = localSheet.id;

  // sheetsRef lets indent/outdent handlers read the latest rows without stale closures
  const sheetsRef = useRef<V3Sheet[]>([localSheet]);
  sheetsRef.current = [localSheet];

  // Convenience updaters used throughout the component
  const updateSheet = useCallback((updates: Partial<V3Sheet>) => {
    setSheet(prev => ({ ...prev, ...updates }));
  }, [setSheet]);

  const updateRows = useCallback((updater: (rows: V3Row[]) => V3Row[]) => {
    setSheet(prev => ({ ...prev, rows: updater(prev.rows) }));
  }, [setSheet]);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    // Will be re-initialized after template loads via effect below
    return ids;
  });

  useEffect(() => {
    if (!activeSheet) return;
    const defaults = new Set<string>();
    const gather = (rows: V3Row[]) => rows.forEach(r => {
      if ((r.isExpanded || r.isGroup) && r.children?.length) { defaults.add(r.id); gather(r.children!); }
    });
    gather(activeSheet.rows);
    setExpandedIds(defaults);
  }, [activeSheetId]);



  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [focusedCell, _setFocusedCell] = useState<{ rowId: string; colId: string } | null>(null);
  const setFocusedCell = useCallback((cell: { rowId: string; colId: string } | null) => {
    focusedCellRef.current = cell;
    _setFocusedCell(cell);
  }, []);

  const [visitedDraftIds, setVisitedDraftIds] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    if (focusedCell?.rowId) {
      setVisitedDraftIds(prev => {
        if (prev.has(focusedCell.rowId)) return prev;
        return new Set([...prev, focusedCell.rowId]);
      });
    }
  }, [focusedCell?.rowId]);

  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string; initial?: string; mode?: 'append' | 'overwrite' } | null>(null);
  const [editSource, setEditSource] = useState<'cell' | 'formula' | null>(null);

  const [liveCellEdit, _setLiveCellEdit] = useState<{ rowId: string; colId: string; value: string } | null>(null);
  const setLiveCellEdit = useCallback((edit: { rowId: string; colId: string; value: string } | null) => {
    liveCellEditRef.current = edit;
    _setLiveCellEdit(edit);
  }, []);
  const [clipboard, setClipboard] = useState<V3Row[] | null>(null);
  const [scrollState, setScrollState] = useState({ isAtStart: true, isAtEnd: false, isScrolledTop: false });
  const [resizingColId, setResizingColId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ colId: string; dir: 'asc' | 'desc' } | null>(null);
  const density = (activeView?.displayDensity ?? 'compact') as 'compact' | 'standard' | 'comfortable';
  const fontSize = activeView?.fontSize ?? 12;
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [editingColumn, setEditingColumn] = useState<{ id: string; targetType?: V3ColumnType } | null>(null);
  const [addRowCount, setAddRowCount] = useState(10);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean; position: { x: number; y: number };
    type: 'row' | 'cell' | 'column';
    rowId?: string; colId?: string;
  } | null>(null);

  // Column selection
  const [selectedColId, setSelectedColId] = useState<string | null>(null);

  // Cell-level clipboard (for cut/copy/paste of cell values)
  const [cellClipboard, setCellClipboard] = useState<{ grid: (CellValue | null)[][]; colIds: string[] } | null>(null);

  // Deferred cut source — actual deletion happens on paste, not immediately
  const [cutSource, setCutSource] = useState<
    | { type: 'column'; colId: string }
    | { type: 'cells'; rowIds: Set<string>; colIds: Set<string> }
    | null
  >(null);
  const emptySetRef = useRef(new Set<string>());

  // Fill handle removed for simplified Spreadsheet + UI

  // Undo / Redo
  const undoStack = useRef<V3Row[][]>([]);
  const redoStack = useRef<V3Row[][]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const checkboxRef = useRef<HTMLInputElement>(null);
  const activeResizerRef = useRef<string | null>(null);

  // Refs to prevent stale closures in event handlers
  const focusedCellRef = useRef<{ rowId: string; colId: string } | null>(null);
  const liveCellEditRef = useRef<{ rowId: string; colId: string; value: string } | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────
  const columns = useMemo(() => (activeSheet?.columns ?? []).filter(c => c.visible !== false), [activeSheet]);

  const sortedRows = useMemo(() => {
    if (!sort || !activeSheet) return activeSheet?.rows ?? [];
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...activeSheet.rows].sort((a, b) => {
      const va = a.cells[sort.colId] ?? '';
      const vb = b.cells[sort.colId] ?? '';
      return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
  }, [activeSheet, sort]);

  const flatRows = useMemo(() => {
    const showSub = activeSheet?.id !== 'sheet-schedule';
    return flattenRows(sortedRows, expandedIds, 0, showSub);
  }, [sortedRows, expandedIds, activeSheet]);

  // Range selection helpers removed

  const selectableFlat = useMemo(() => flatRows.filter(f => !f.isSummary), [flatRows]);
  const isAllSelected = selectableFlat.length > 0 && selectableFlat.every(f => selectedRowIds.has(f.row.id));
  const isSomeSelected = !isAllSelected && selectableFlat.some(f => selectedRowIds.has(f.row.id));
  useEffect(() => { if (checkboxRef.current) checkboxRef.current.indeterminate = isSomeSelected; }, [isSomeSelected]);

  // ── Scroll handler ────────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
        const next = {
          isAtStart: el.scrollLeft <= 2,
          isAtEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
          isScrolledTop: el.scrollTop > 0,
        };
        setScrollState(prev => {
            if (prev.isAtStart === next.isAtStart && 
                prev.isAtEnd === next.isAtEnd && 
                prev.isScrolledTop === next.isScrolledTop) return prev;
            return next;
        });
    };
    el.addEventListener('scroll', update);
    const timeoutId = setTimeout(update, 100);
    return () => {
        el.removeEventListener('scroll', update);
        clearTimeout(timeoutId);
    };
  }, [flatRows, columns]);

  // Restore keyboard focus only when no text input currently owns focus.
  useEffect(() => {
    if (!editingCell && editSource !== 'formula' && containerRef.current) {
      const activeEl = document.activeElement as HTMLElement | null;
      const isTextInputActive =
        !!activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
      if (!isTextInputActive) {
        containerRef.current.focus({ preventScroll: true });
      }
    }
  }, [editingCell, editSource]);

  // ── Range selection helpers ───────────────────────────────────────────
  // Range selection helpers removed



  // GUIDED CREATION: Ensure there's always exactly one empty draft row at the end of the Schedule
  useEffect(() => {
    if (activeSheetId !== 'sheet-schedule' || !activeSheet) return;

    const targetColId = 'name';
    const rows = activeSheet.rows;

    // Guard: if there are 2+ top-level empty drafts (e.g. from Strict Mode double-invoke
    // or persisted bad state), remove all but the last one.
    const topLevelEmptyDrafts = rows.filter(r => r.isDraft && !r.cells[targetColId]);
    if (topLevelEmptyDrafts.length > 1) {
      const toRemove = new Set(topLevelEmptyDrafts.slice(0, -1).map(r => r.id));
      updateRows(prev => prev.filter(r => !toRemove.has(r.id)));
      return;
    }

    // Only check the LAST top-level row. If it is already an empty draft, we are done.
    // Drafts inserted in the middle (during editing) must NOT prevent the bottom placeholder
    // from being created — they are separate rows with their own lifecycle.
    const lastRow = rows[rows.length - 1];
    if (lastRow?.isDraft && !lastRow.cells[targetColId]) return;

    // The bottom placeholder is absent or has content — append a fresh one.
    const newDraft: V3Row = { id: uid('draft'), cells: {}, isDraft: true };
    updateRows(prev => [...prev, newDraft]);
  }, [activeSheet?.rows, activeSheetId, updateRows]);

  // ── Undo / Redo ────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    if (!undoStack.current.length || !activeSheet) return;
    const prev = undoStack.current.pop()!;
    redoStack.current.push(JSON.parse(JSON.stringify(activeSheet.rows)));
    updateRows(() => prev);
  }, [activeSheet, updateRows]);

  const handleRedo = useCallback(() => {
    if (!redoStack.current.length || !activeSheet) return;
    const next = redoStack.current.pop()!;
    undoStack.current.push(JSON.parse(JSON.stringify(activeSheet.rows)));
    updateRows(() => next);
  }, [activeSheet, updateRows]);



  // ── Row CRUD ────────────────────────────────────────────────────────────
  const checkBlockingDraft = (): boolean => {
    const isSchedule = activeSheetId === 'sheet-schedule';
    const targetColId = isSchedule ? 'name' : (columns[0]?.id || 'name');
    
    const placeholderId = flatRows[flatRows.length - 1]?.row.id;
    
    // Find any row that has an empty task name and has been visited/interacted with
    const blocking = flatRows.find(f => {
      const isEmpty = !f.row.cells[targetColId];
      const isVisited = visitedDraftIds.has(f.row.id);
      
      if (!isEmpty || !isVisited) return false;
      
      // The bottom placeholder is only blocking if it's currently focused (being edited)
      if (f.row.id === placeholderId) {
        return focusedCell?.rowId === placeholderId;
      }
      
      return true;
    });
    
    if (blocking) {
      setFocusedCell({ rowId: blocking.row.id, colId: targetColId });
      handleCellDoubleClick(blocking.row.id, targetColId);
      return true;
    }
    return false;
  };

  const handleAddRow = () => {
    const isSchedule = activeSheetId === 'sheet-schedule';
    const targetColId = isSchedule ? 'name' : (columns[0]?.id || 'name');

    if (checkBlockingDraft()) return;

    // If there are no blocking drafts, just focus the bottom placeholder
    const placeholderId = flatRows[flatRows.length - 1]?.row.id;
    if (placeholderId) {
      setFocusedCell({ rowId: placeholderId, colId: targetColId });
      setEditingCell({ rowId: placeholderId, colId: targetColId, mode: 'append' });
      setEditSource('cell');
      setLiveCellEdit({ rowId: placeholderId, colId: targetColId, value: '' });
      
      // Scroll slightly delayed to ensure render
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 10);
    }
  };

  const handleDeleteRows = (ids: Set<string>) => {
    const filter = (rows: V3Row[]): V3Row[] =>
      rows.filter(r => !ids.has(r.id)).map(r => ({ ...r, children: r.children ? filter(r.children) : undefined }));
    updateRows(filter);
    setSelectedRowIds(new Set());
  };

  const handleInsertRow = (targetId: string, position: 'above' | 'below' = 'below') => {
    const isSchedule = activeSheetId === 'sheet-schedule';
    const targetColId = isSchedule ? 'name' : (columns[0]?.id || 'name');

    // Always create a fresh row — never steal the bottom placeholder.
    // The placeholder's job is to stay at the bottom permanently; the useEffect
    // will ensure it is always present regardless of what is inserted elsewhere.
    const newId = uid('row');

    const insert = (rows: V3Row[]): V3Row[] => {
      const idx = rows.findIndex(r => r.id === targetId);
      if (idx >= 0) {
        const next = [...rows];
        const insertIdx = position === 'above' ? idx : idx + 1;
        next.splice(insertIdx, 0, { id: newId, cells: {}, isDraft: true });
        return next;
      }
      return rows.map(r => ({ ...r, children: r.children ? insert(r.children) : undefined }));
    };
    updateRows(insert);

    setFocusedCell({ rowId: newId, colId: targetColId });
    setEditingCell({ rowId: newId, colId: targetColId, mode: 'append' });
    setEditSource('cell');
    setLiveCellEdit({ rowId: newId, colId: targetColId, value: '' });
  };

  const handleAddSubRow = (parentId: string) => {
    const isSchedule = activeSheetId === 'sheet-schedule';
    const targetColId = isSchedule ? 'name' : (columns[0]?.id || 'name');

    // Always create a fresh child row — never steal the bottom placeholder.
    const newId = uid('row');

    const add = (rows: V3Row[]): V3Row[] => rows.map(r => {
      if (r.id === parentId) {
        return { ...r, children: [...(r.children ?? []), { id: newId, cells: {}, isDraft: true }], isExpanded: true };
      }
      return { ...r, children: r.children ? add(r.children) : undefined };
    });
    updateRows(add);

    setExpandedIds(prev => new Set([...prev, parentId]));
    setFocusedCell({ rowId: newId, colId: targetColId });
    setEditingCell({ rowId: newId, colId: targetColId, mode: 'append' });
    setEditSource('cell');
    setLiveCellEdit({ rowId: newId, colId: targetColId, value: '' });
  };

  const handleIndentRow = useCallback((rowId: string) => {
    updateRows(prevRows => {
      const result = indentRowInTree(prevRows, rowId);
      if (!result) return prevRows;
      setExpandedIds(prev => new Set([...prev, result.newParentId]));
      return result.rows;
    });
  }, [updateRows]);

  const handleOutdentRow = useCallback((rowId: string) => {
    updateRows(prevRows => {
      const newRows = outdentRowInTree(prevRows, rowId);
      return newRows || prevRows;
    });
  }, [updateRows]);

  const handleUpdateCell = useCallback((rowId: string, colId: string, value: CellValue, direction?: 'up' | 'down' | 'left' | 'right') => {
    // Snapshot for undo before applying change
    if (activeSheet) {
      undoStack.current.push(JSON.parse(JSON.stringify(activeSheet.rows)));
      if (undoStack.current.length > 100) undoStack.current.shift();
      redoStack.current = [];
    }

    const update = (rows: V3Row[]): V3Row[] => rows.map(r => {
      if (r.id === rowId) {
        const isSchedule = activeSheetId === 'sheet-schedule';
        const targetColId = isSchedule ? 'name' : (columns[0]?.id || 'name');
        
        const nextRow = { ...r, cells: { ...r.cells, [colId]: value } };
        // If required field is filled, convert from draft to normal row
        if (colId === targetColId && value && r.isDraft) {
          nextRow.isDraft = false;
        }
        return nextRow;
      }
      return { ...r, children: r.children ? update(r.children) : undefined };
    });
    updateRows(update);
    setEditingCell(null);
    setEditSource(null);
    setLiveCellEdit(null);

    if (direction && focusedCell) {
      const flatIdx = flatRows.findIndex(f => f.row.id === rowId);
      const colIdx = columns.findIndex(c => c.id === colId);
      let nr = flatIdx, nc = colIdx;
      if (direction === 'down') nr = Math.min(flatRows.length - 1, flatIdx + 1);
      if (direction === 'up') nr = Math.max(0, flatIdx - 1);
      if (direction === 'right') nc = Math.min(columns.length - 1, colIdx + 1);
      if (direction === 'left') nc = Math.max(0, colIdx - 1);
      if (nr !== flatIdx || nc !== colIdx) {
        setFocusedCell({ rowId: flatRows[nr].row.id, colId: columns[nc].id });
      }
    }
  }, [flatRows, columns, focusedCell, updateRows, activeSheet]);

  const getCellDisplayValue = useCallback((rowId: string, colId: string): string => {
    const row = flatRows.find(f => f.row.id === rowId && !f.isSummary)?.row;
    const col = columns.find(c => c.id === colId);
    if (!row || !col) return '';
    if (col.type === 'formula' && col.formula) return col.formula;
    const raw = row.cells[colId];
    return raw === null || raw === undefined ? '' : String(raw);
  }, [flatRows, columns]);

  // Cleanup: clear edit state when editingCell is cleared (append / formula mode exits).
  // Overwrite mode never sets editingCell, so this doesn't affect it.
  useEffect(() => {
    if (!editingCell) {
      setEditSource(null);
    }
  }, [editingCell]);

  const handleLiveCellEditChange = useCallback((rowId: string, colId: string, value: string) => {
    setLiveCellEdit({ rowId, colId, value });
  }, []);

  // Commits a pending overwrite (typed chars in Navigation Mode) without changing focus.
  // Uses refs to ensure we always have the latest values in high-frequency event handlers.
  const flushPendingOverwrite = useCallback(() => {
    const lEdit = liveCellEditRef.current;
    const fCell = focusedCellRef.current;

    // Only flush if we are in Navigation Mode (editingCell is null) 
    // and have a pending overwrite.
    if (editingCell || !lEdit || !fCell) return;
    if (lEdit.rowId !== fCell.rowId || lEdit.colId !== fCell.colId) return;

    const col = columns.find(c => c.id === lEdit.colId);
    let val: CellValue = lEdit.value;
    if (col?.type === 'number' || col?.type === 'currency') {
      val = lEdit.value === '' ? null : parseFloat(lEdit.value.replace(/,/g, '')) || 0;
    } else if (col?.type === 'checkbox') {
      val = lEdit.value === 'true';
    }
    handleUpdateCell(lEdit.rowId, lEdit.colId, val);
  }, [editingCell, columns, handleUpdateCell]);

  const handleFormulaBarStartEdit = useCallback((rowId: string, colId: string) => {
    flushPendingOverwrite();
    setFocusedCell({ rowId, colId });
    setEditSource('formula');
    setEditingCell(prev => (prev?.rowId === rowId && prev?.colId === colId) ? prev : { rowId, colId });
    setLiveCellEdit({ rowId, colId, value: getCellDisplayValue(rowId, colId) });
  }, [getCellDisplayValue, flushPendingOverwrite, setFocusedCell, setEditingCell, setLiveCellEdit]);

  // ── Cell focus/click ───────────────────────────────────────────────────
  const handleCellDoubleClick = useCallback((rowId: string, colId: string) => {
    const col = columns.find(c => c.id === colId);
    const flatRow = flatRows.find(f => f.row.id === rowId);
    if (col?.editable !== false && col?.type !== 'formula' && flatRow && !flatRow.isSummary) {
      const seed = getCellDisplayValue(rowId, colId);
      setEditSource('cell');
      setEditingCell({ rowId, colId, mode: 'append' });
      setLiveCellEdit({ rowId, colId, value: seed });
    }
  }, [columns, flatRows, getCellDisplayValue]);

  const handleCellClick = (rowId: string, colId: string, e: React.MouseEvent) => {
    // If clicking the cell currently being edited (append mode), let the input handle it.
    if (editingCell?.rowId === rowId && editingCell?.colId === colId) return;

    // Commit any pending overwrite value from the previous cell before moving focus.
    flushPendingOverwrite();

    // Clear selection states
    setSelectedColId(null);
    setSelectedRowIds(new Set());
    setFocusedCell({ rowId, colId });
    setEditSource(null);
    setEditingCell(null);
  };

  // Selection management

  // Global mouseup removed

  // ── Keyboard navigation ────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      if (e.key === 'z') { e.preventDefault(); e.shiftKey ? handleRedo() : handleUndo(); return; }
      if (e.key === 'y') { e.preventDefault(); handleRedo(); return; }
      if (e.key === 'c') {
        e.preventDefault();
        if (selectedColId) handleCopyColumn(selectedColId); else handleCellCopy(false);
        return;
      }
      if (e.key === 'x') {
        e.preventDefault();
        if (selectedColId) handleCutColumn(selectedColId); else handleCellCopy(true);
        return;
      }
      if (e.key === 'v') {
        e.preventDefault();
        if (selectedColId) handlePasteColumn(selectedColId); else handleCellPaste();
        return;
      }
    }

    if (editingCell) return; // Append/Edit Mode: the <input> handles its own keys.

    // Column selected — only handle escape/delete
    if (selectedColId) {
      if (e.key === 'Escape') { setSelectedColId(null); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); handleClearColumn(selectedColId); return; }
      return;
    }

    if (!focusedCell) return;

    const rIdx = flatRows.findIndex(f => f.row.id === focusedCell.rowId);
    const cIdx = columns.findIndex(c => c.id === focusedCell.colId);
    if (rIdx < 0 || cIdx < 0) return;
    const focusedFlatRow = flatRows[rIdx];
    if (!focusedFlatRow || focusedFlatRow.isSummary) return;
    const focusedRowId = focusedFlatRow.row.id;

    // ── Overwrite pending mode ────────────────────────────────────────────
    // When the user types in Navigation Mode we set liveCellEdit WITHOUT setting
    // editingCell. No <input> is rendered; the cell shows the typed text as normal
    // content. All 4 arrow keys, Enter, and Tab commit the value and navigate.
    const isPendingOverwrite =
      !!liveCellEdit &&
      liveCellEdit.rowId === focusedCell.rowId &&
      liveCellEdit.colId === focusedCell.colId;

    if (isPendingOverwrite) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setLiveCellEdit(null); // discard — does NOT save
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        const next = liveCellEdit!.value.slice(0, -1);
        setLiveCellEdit(next === '' ? null : { ...liveCellEdit!, value: next });
        return;
      }
      if (e.key === 'Delete') {
        e.preventDefault();
        setLiveCellEdit(null);
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setLiveCellEdit({ ...liveCellEdit!, value: liveCellEdit!.value + e.key });
        return;
      }
      // Navigation keys below will call flushPendingOverwrite() before moving.
    }

    const moveTo = (nr: number, nc: number) => {
      const isSchedule = activeSheetId === 'sheet-schedule';
      const targetColId = isSchedule ? 'name' : (columns[0]?.id || 'name');

      const nextRowIdx = Math.max(0, Math.min(flatRows.length - 1, nr));
      const nextRow = flatRows[nextRowIdx];
      let nextColId = columns[Math.max(0, Math.min(columns.length - 1, nc))].id;
      
      const isDraftEmpty = nextRow.row.isDraft && !nextRow.row.cells[targetColId];

      // GUIDED NAVIGATION: If row is draft & empty, force focus to Task Name
      if (isDraftEmpty) {
        nextColId = targetColId;
      }
      
      setFocusedCell({ rowId: nextRow.row.id, colId: nextColId });

      // AUTO-EDIT: If we just moved INTO the draft row, start editing immediately
      if (isDraftEmpty && nr !== rIdx) {
        setTimeout(() => handleCellDoubleClick(nextRow.row.id, targetColId), 10);
      }

      return { nextRow, nextCol: columns.find(c => c.id === nextColId)! };
    };

    const move = (dr: number, dc: number) => {
      e.preventDefault();
      flushPendingOverwrite();
      let nr = rIdx + dr, nc = cIdx + dc;
      if (e.key === 'Tab' && !e.shiftKey && nc >= columns.length) { nc = 0; nr++; }
      if (e.key === 'Tab' && e.shiftKey && nc < 0) { nc = columns.length - 1; nr--; }
      moveTo(nr, nc);
    };

    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key === ']') {
      e.preventDefault();
      handleIndentRow(focusedRowId);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key === '[') {
      e.preventDefault();
      handleOutdentRow(focusedRowId);
      return;
    }

    // ── Clipboard Shortcuts ──────────────────────────────────────────────
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault();
      if (selectedRowIds.size > 0) handleCopy();
      else if (selectedColId) handleCopyColumn(selectedColId);
      else if (focusedCell) contextMenuCellCopy(focusedCell.rowId, focusedCell.colId, false);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
      e.preventDefault();
      if (selectedRowIds.size > 0) handleCut();
      else if (selectedColId) handleCutColumn(selectedColId);
      else if (focusedCell) contextMenuCellCopy(focusedCell.rowId, focusedCell.colId, true);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      if (clipboard?.length) {
        handlePaste(focusedRowId);
      } else if (cellClipboard) {
        if (selectedColId) handlePasteColumn(selectedColId);
        else if (focusedCell) handleCellPaste(focusedCell.rowId, focusedCell.colId);
      }
      return;
    }

    if (e.altKey && e.key === 'ArrowRight') {
      e.preventDefault();
      const ids = collectExpandableIdsFromRow(focusedFlatRow.row);
      if (!ids.length) return;
      setExpandedIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.add(id));
        return next;
      });
      return;
    }

    if (e.altKey && e.key === 'ArrowLeft') {
      e.preventDefault();
      const ids = collectExpandableIdsFromRow(focusedFlatRow.row);
      if (!ids.length) return;
      setExpandedIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      });
      return;
    }

    if (e.shiftKey && e.key === ' ') {
      e.preventDefault();
      setSelectedRowIds(prev => {
        const next = new Set(prev);
        if (next.has(focusedRowId)) next.delete(focusedRowId);
        else next.add(focusedRowId);
        return next;
      });
      return;
    }

    switch (e.key) {
      case 'ArrowUp':    move(-1, 0); break;
      case 'ArrowDown':  move(1, 0); break;
      case 'ArrowLeft':  move(0, -1); break;
      case 'ArrowRight': move(0, 1); break;
      case 'Tab': {
        e.preventDefault();
        flushPendingOverwrite();
        let nr = rIdx, nc = cIdx + (e.shiftKey ? -1 : 1);
        if (!e.shiftKey && nc >= columns.length) { nc = 0; nr++; }
        if (e.shiftKey && nc < 0) { nc = columns.length - 1; nr--; }
        nr = Math.max(0, Math.min(flatRows.length - 1, nr));
        nc = Math.max(0, Math.min(columns.length - 1, nc));
        setFocusedCell({ rowId: flatRows[nr].row.id, colId: columns[nc].id });
        break;
      }
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        if (!e.shiftKey && columns[cIdx]?.editable !== false && columns[cIdx]?.type !== 'formula' && !focusedFlatRow.isSummary) {
          // Enter → Edit Mode (Google Sheets behavior).
          // If the user was mid-overwrite, carry that value into Edit Mode rather than discarding it.
          const seed = isPendingOverwrite ? liveCellEdit!.value : getCellDisplayValue(focusedRowId, columns[cIdx].id);
          setEditSource('cell');
          setEditingCell({ rowId: focusedRowId, colId: columns[cIdx].id, mode: 'append' });
          setLiveCellEdit({ rowId: focusedRowId, colId: columns[cIdx].id, value: seed });
        } else {
          // Shift+Enter or non-editable cell: navigate (move() flushes pending overwrite internally).
          move(e.shiftKey ? -1 : 1, 0);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setLiveCellEdit(null); // discard any pending overwrite
        setCutSource(null);    // cancel any pending cut
        break;
      case 'F2':
        e.preventDefault();
        if (columns[cIdx]?.editable !== false && !focusedFlatRow.isSummary) {
          const f2Seed = getCellDisplayValue(focusedRowId, columns[cIdx].id);
          setEditSource('cell');
          setEditingCell({ rowId: focusedRowId, colId: columns[cIdx].id, mode: 'append' });
          setLiveCellEdit({ rowId: focusedRowId, colId: columns[cIdx].id, value: f2Seed });
        }
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        if (selectedColId) {
          handleClearColumn(selectedColId);
        } else if (selectedRowIds.size > 0) {
          handleDeleteRows(selectedRowIds);
        } else if (columns[cIdx]?.editable && !focusedFlatRow.isSummary) {
          handleUpdateCell(focusedRowId, columns[cIdx].id, null);
        }
        break;
      default:
        // Typing in Navigation Mode: start an overwrite pending value.
        // We do NOT set editingCell — no <input> is rendered.
        // The cell stays in Navigation Mode visually (thick blue border, no cursor).
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const col = columns[cIdx];
          if (col?.editable !== false && col?.type !== 'formula' && !flatRows[rIdx].isSummary) {
            setLiveCellEdit({ rowId: flatRows[rIdx].row.id, colId: col.id, value: e.key });
            e.preventDefault();
          }
        }
    }
  };

  // ── Cut / Copy / Paste ──────────────────────────────────────────────────
  const handleCut = useCallback((ids?: Set<string>) => {
    const target = ids ?? selectedRowIds;
    const items: V3Row[] = [];
    const find = (rows: V3Row[]) => rows.forEach(r => { if (target.has(r.id)) items.push(JSON.parse(JSON.stringify(r))); if (r.children) find(r.children); });
    find(activeSheet?.rows ?? []);
    if (items.length) { setClipboard(items); handleDeleteRows(target); }
  }, [selectedRowIds, activeSheet]);

  const handleCopy = useCallback((ids?: Set<string>) => {
    const target = ids ?? selectedRowIds;
    const items: V3Row[] = [];
    const find = (rows: V3Row[]) => rows.forEach(r => { if (target.has(r.id)) items.push(JSON.parse(JSON.stringify(r))); if (r.children) find(r.children); });
    find(activeSheet?.rows ?? []);
    if (items.length) setClipboard(items);
  }, [selectedRowIds, activeSheet]);

  const handlePaste = useCallback((afterId?: string) => {
    if (!clipboard?.length) return;
    const fresh = clipboard.map(r => ({ ...r, id: uid('row'), cells: { ...r.cells } }));
    if (afterId) {
      const ins = (rows: V3Row[]): V3Row[] => {
        const idx = rows.findIndex(r => r.id === afterId);
        if (idx >= 0) { const next = [...rows]; next.splice(idx + 1, 0, ...fresh); return next; }
        return rows.map(r => ({ ...r, children: r.children ? ins(r.children) : undefined }));
      };
      updateRows(ins);
    } else {
      updateRows(rows => [...rows, ...fresh]);
    }
  }, [clipboard, updateRows]);

  // ── Style update ─────────────────────────────────────────────────────────
  const handleStyleUpdate = (style: Partial<V3CellStyle>, ids?: Set<string>) => {
    let target = ids;

    if (!target) {
      if (selectedRowIds.size > 0) {
        target = selectedRowIds;
      } else if (contextMenu?.rowId) {
        target = new Set([contextMenu.rowId]);
      }
    }

    if (!target || !target.size) return;
    
    if (activeSheet) {
      undoStack.current.push(JSON.parse(JSON.stringify(activeSheet.rows)));
      redoStack.current = [];
    }

    const update = (rows: V3Row[]): V3Row[] => rows.map(r => {
      let next = r;
      if (target!.has(r.id)) {
        const currentStyle = r.style ?? {};
        const merged = { ...currentStyle, ...style };
        Object.keys(style).forEach(k => { 
          if ((style as any)[k] === undefined || (style as any)[k] === null) {
            delete (merged as any)[k]; 
          }
        });
        next = { ...r, style: merged };
      }
      if (next.children) next = { ...next, children: update(next.children) };
      return next;
    });
    updateRows(update);
  };

  const handleCellStyleUpdate = (style: Partial<V3CellStyle>, explicitRowIds?: Set<string>, explicitColIds?: Set<string>) => {
    if (!activeSheet) return;
    
    let targetRowIds = explicitRowIds;
    let colIds = explicitColIds;

    if (!targetRowIds?.size || !colIds?.size) return;

    undoStack.current.push(JSON.parse(JSON.stringify(activeSheet.rows)));
    redoStack.current = [];

    const update = (rows: V3Row[]): V3Row[] => rows.map(r => {
      let next = r;
      if (targetRowIds!.has(r.id)) {
        const newCellStyles = { ...(r.cellStyles ?? {}) };
        colIds!.forEach(cid => {
          const currentStyle = newCellStyles[cid] ?? {};
          const merged = { ...currentStyle, ...style };
          Object.keys(style).forEach(k => { 
            if ((style as any)[k] === undefined || (style as any)[k] === null) {
              delete (merged as any)[k]; 
            }
          });
          newCellStyles[cid] = merged;
        });
        next = { ...r, cellStyles: newCellStyles };
      }
      if (next.children) next = { ...next, children: update(next.children) };
      return next;
    });
    updateRows(update);
  };

  const handleClearAllStyling = (type: 'row' | 'cell', rId?: string, cId?: string) => {
    if (!activeSheet) return;
    undoStack.current.push(JSON.parse(JSON.stringify(activeSheet.rows)));
    redoStack.current = [];

    if (type === 'row') {
      const targetRows = rId ? new Set([rId]) : (selectedRowIds.size > 0 ? selectedRowIds : new Set());
      if (targetRows.size === 0) return;
      updateRows(rows => {
        const update = (items: V3Row[]): V3Row[] => items.map(r => {
          let next = r;
          if (targetRows.has(r.id)) next = { ...r, style: undefined, cellStyles: undefined };
          if (next.children) next.children = update(next.children);
          return next;
        });
        return update(rows);
      });
    } else {
      const rid = rId || focusedCell?.rowId;
      const cid = cId || focusedCell?.colId;
      if (!rid || !cid) return;
      updateRows(rows => {
        const update = (items: V3Row[]): V3Row[] => items.map(r => {
          let next = r;
          if (r.id === rid) {
            const newCellStyles = { ...(r.cellStyles ?? {}) };
            delete newCellStyles[cid];
            next = { ...r, cellStyles: newCellStyles };
          }
          if (next.children) next.children = update(next.children);
          return next;
        });
        return update(rows);
      });
    }
  };

  // ── Column CRUD ────────────────────────────────────────────────────────
  const handleAddColumn = (colDef: Omit<V3Column, 'id'>) => {
    let newId = slugifyLabel(colDef.label);
    if (activeSheet?.columns.some(c => c.id === newId)) {
      let i = 1;
      while (activeSheet?.columns.some(c => c.id === `${newId}_${i}`)) i++;
      newId = `${newId}_${i}`;
    }
    const newCol: V3Column = { ...colDef, id: newId };
    updateSheet({ columns: [...(activeSheet?.columns ?? []), newCol] });
    setShowAddColumn(false);
  };

  const handleResizeColumn = useCallback((colId: string, newWidth: number) => {
    updateSheet({ columns: (activeSheet?.columns ?? []).map(c => c.id === colId ? { ...c, width: Math.max(newWidth, 50) } : c) });
  }, [activeSheet, updateSheet]);

  const onMouseDownResize = (colId: string) => (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    activeResizerRef.current = colId; setResizingColId(colId);
    const col = columns.find(c => c.id === colId);
    if (!col) return;
    const startX = e.clientX, startWidth = col.width;
    const onMove = (ev: MouseEvent) => { if (activeResizerRef.current === colId) handleResizeColumn(colId, startWidth + (ev.clientX - startX)); };
    const onUp = () => { activeResizerRef.current = null; setResizingColId(null); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  };

  const handleColumnMove = (fromId: string, toId: string, pos: 'left' | 'right') => {
    const cols = [...(activeSheet?.columns ?? [])];
    const si = cols.findIndex(c => c.id === fromId);
    let ti = cols.findIndex(c => c.id === toId);
    if (si < 0 || ti < 0) return;
    if (pos === 'right') ti++;
    if (si < ti) ti--;
    const [moved] = cols.splice(si, 1);
    cols.splice(ti, 0, moved);
    updateSheet({ columns: cols });
  };

  const handleSort = (colId: string) => {
    setSort(prev => {
      if (prev?.colId === colId) return prev.dir === 'asc' ? { colId, dir: 'desc' } : null;
      return { colId, dir: 'asc' };
    });
  };

  // ── Column selection & operations ─────────────────────────────────────────
  const handleColumnHeaderClick = useCallback((colId: string) => {
    flushPendingOverwrite();
    setSelectedColId(prev => prev === colId ? null : colId);
    setSelectedRowIds(new Set());
    setFocusedCell(null);
    setEditingCell(null);
    setEditSource(null);
  }, [flushPendingOverwrite]);

  const handleUpdateColumn = useCallback((colId: string, updates: Partial<Omit<V3Column, 'id'>>) => {
    updateSheet({ columns: (activeSheet?.columns ?? []).map(c => c.id === colId ? { ...c, ...updates } : c) });
  }, [activeSheet, updateSheet]);

  const handleRenameColumn = useCallback((colId: string, newLabel: string) => {
    if (!activeSheet) return;

    const oldId = colId;
    let newId = slugifyLabel(newLabel);

    // Collision check
    if (activeSheet.columns.some(c => c.id === newId && c.id !== oldId)) {
      let i = 1;
      while (activeSheet.columns.some(c => c.id === `${newId}_${i}`)) i++;
      newId = `${newId}_${i}`;
    }

    const oldCol = activeSheet.columns.find(c => c.id === oldId);
    const oldLabel = oldCol?.label || '';

    const updateFormula = (formula: string | undefined): string | undefined => {
      if (!formula || !formula.startsWith('=')) return formula;
      
      const escL = oldLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escI = oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Match bracketed version [Old Label] or the ID/Label followed by digits or a boundary
      const patterns: string[] = [];
      if (oldLabel) patterns.push(`\\[${escL}\\]`);
      
      const ids: string[] = [escI];
      if (oldLabel && !oldLabel.includes(' ')) ids.push(escL);
      const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
      
      if (uniqueIds.length > 0) {
        // Match the ID/Label if it's either a standalone word or followed by row numbers
        patterns.push(`\\b(${uniqueIds.join('|')})(?=\\b|\\d)`);
      }

      if (patterns.length === 0) return formula;
      
      const regex = new RegExp(patterns.join('|'), 'gi');
      return formula.replace(regex, (match, p1) => {
        if (match.startsWith('[')) return `[${newLabel}]`;
        // If we matched the second pattern (standalone or with digits), replace only the identifier part
        return newId;
      });
    };

    // 1. Update Columns
    const newColumns = activeSheet.columns.map(c => {
      if (c.id === oldId) return { ...c, label: newLabel, id: newId };
      if (c.type === 'formula') return { ...c, formula: updateFormula(c.formula) };
      return c;
    });

    // 2. Migrate row data and cell formulas if ID changed
    const migrateRows = (rows: V3Row[]): V3Row[] => rows.map(r => {
      let cells = { ...r.cells };
      if (oldId !== newId && oldId in cells) {
        cells[newId] = cells[oldId];
        delete cells[oldId];
      }
      Object.keys(cells).forEach(key => {
        const val = cells[key];
        if (typeof val === 'string' && val.startsWith('=')) {
          cells[key] = updateFormula(val) as string;
        }
      });

      let next: V3Row = { ...r, cells };
      if (r.children) next.children = migrateRows(r.children);
      return next;
    });

    // 3. Update all state references to the old column ID
    updateSheet({ columns: newColumns });
    updateRows(migrateRows);

    if (focusedCell?.colId === oldId) setFocusedCell({ ...focusedCell, colId: newId });
    if (selectedColId === oldId) setSelectedColId(newId);
    if (editingCell?.colId === oldId) setEditingCell({ ...editingCell, colId: newId });
    if (liveCellEdit?.colId === oldId) setLiveCellEdit({ ...liveCellEdit, colId: newId });
  }, [activeSheet, updateSheet, updateRows, focusedCell, selectedColId, editingCell, liveCellEdit, setFocusedCell, setLiveCellEdit]);

  const handleAddManyRows = useCallback(() => {
    const count = Math.max(1, Math.min(1000, addRowCount));
    const newRows: V3Row[] = Array.from({ length: count }, () => ({ id: uid('row'), cells: {} }));
    updateRows(rows => [...rows, ...newRows]);
    setTimeout(() => scrollRef.current && (scrollRef.current.scrollTop = scrollRef.current.scrollHeight), 60);
  }, [addRowCount, updateRows]);

  const handleInsertColumnLeft = useCallback((colId: string) => {
    const cols = [...(activeSheet?.columns ?? [])];
    const idx = cols.findIndex(c => c.id === colId);
    if (idx < 0) return;
    const label = `Col ${cols.length + 1}`;
    const newCol: V3Column = { id: slugifyLabel(label), label, type: 'text', width: 150, editable: true, visible: true };
    cols.splice(idx, 0, newCol);
    updateSheet({ columns: cols });
  }, [activeSheet, updateSheet]);

  const handleInsertColumnRight = useCallback((colId: string) => {
    const cols = [...(activeSheet?.columns ?? [])];
    const idx = cols.findIndex(c => c.id === colId);
    if (idx < 0) return;
    const label = `Col ${cols.length + 1}`;
    const newCol: V3Column = { id: slugifyLabel(label), label, type: 'text', width: 150, editable: true, visible: true };
    cols.splice(idx + 1, 0, newCol);
    updateSheet({ columns: cols });
  }, [activeSheet, updateSheet]);

  const handleDeleteColumn = useCallback((colId: string) => {
    updateSheet({ columns: (activeSheet?.columns ?? []).filter(c => c.id !== colId) });
    setSelectedColId(prev => prev === colId ? null : prev);
  }, [activeSheet, updateSheet]);

  const handleClearColumn = useCallback((colId: string) => {
    if (!activeSheet) return;
    undoStack.current.push(JSON.parse(JSON.stringify(activeSheet.rows)));
    redoStack.current = [];
    updateRows(rows => {
      const clear = (items: V3Row[]): V3Row[] => items.map(r => ({
        ...r, cells: { ...r.cells, [colId]: null },
        children: r.children ? clear(r.children) : undefined,
      }));
      return clear(rows);
    });
  }, [activeSheet, updateRows]);

  const handleCopyColumn = useCallback((colId: string) => {
    const allRows = flatRows.filter(f => !f.isSummary);
    setCellClipboard({ grid: allRows.map(f => [f.row.cells[colId] ?? null]), colIds: [colId] });
  }, [flatRows]);

  const handleCutColumn = useCallback((colId: string) => {
    handleCopyColumn(colId);
    setCutSource({ type: 'column', colId }); // deferred — actual clear happens on paste
  }, [handleCopyColumn]);

  const handlePasteColumn = useCallback((colId: string) => {
    if (!cellClipboard || !activeSheet) return;
    const col = columns.find(c => c.id === colId);
    if (!col?.editable || col.type === 'formula') return;
    undoStack.current.push(JSON.parse(JSON.stringify(activeSheet.rows)));
    redoStack.current = [];
    const nonSummaryRows = flatRows.filter(f => !f.isSummary);
    const updates: Record<string, CellValue | null> = {};
    cellClipboard.grid.forEach((rowData, ri) => {
      const target = nonSummaryRows[ri];
      if (target) updates[target.row.id] = rowData[0] ?? null;
    });
    const pendingCut = cutSource;
    updateRows(rows => {
      const apply = (items: V3Row[]): V3Row[] => items.map(r => {
        let next = r;
        if (r.id in updates) next = { ...r, cells: { ...r.cells, [colId]: updates[r.id] } };
        // Deferred cut: clear the original cut column
        if (pendingCut?.type === 'column') {
          next = { ...next, cells: { ...next.cells, [pendingCut.colId]: null } };
        }
        if (next.children) next = { ...next, children: apply(next.children) };
        return next;
      });
      return apply(rows);
    });
    setCutSource(null);
  }, [cellClipboard, activeSheet, columns, flatRows, updateRows, cutSource]);

  // ── Cell clipboard (range) ─────────────────────────────────────────────────
  const getCellsInRange = useCallback((): { grid: (CellValue | null)[][]; colIds: string[] } | null => {
    if (focusedCell) {
      const flat = flatRows.find(f => f.row.id === focusedCell.rowId);
      if (!flat) return null;
      return { grid: [[flat.row.cells[focusedCell.colId] ?? null]], colIds: [focusedCell.colId] };
    }
    return null;
  }, [flatRows, focusedCell]);

  const clearCellsInRange = useCallback(() => {
    if (focusedCell) {
      const col = columns.find(c => c.id === focusedCell.colId);
      if (col?.editable && col.type !== 'formula') handleUpdateCell(focusedCell.rowId, focusedCell.colId, null);
    }
  }, [columns, focusedCell, handleUpdateCell]);

  const handleCellCopy = useCallback((cut = false) => {
    const data = getCellsInRange();
    if (!data) return;
    setCellClipboard(data);
    if (cut && focusedCell) {
      setCutSource({ type: 'cells', rowIds: new Set([focusedCell.rowId]), colIds: new Set([focusedCell.colId]) });
    } else {
      setCutSource(null);
    }
  }, [getCellsInRange, focusedCell]);

  const handleCellPaste = useCallback((targetRowId?: string, targetColId?: string) => {
    if (!cellClipboard) return;
    const pasteRowId = targetRowId ?? focusedCell?.rowId;
    const pasteColId = targetColId ?? focusedCell?.colId;
    if (!pasteRowId || !pasteColId || !activeSheet) return;
    const startRowIdx = flatRows.findIndex(f => f.row.id === pasteRowId);
    const startColIdx = columns.findIndex(c => c.id === pasteColId);
    if (startRowIdx < 0 || startColIdx < 0) return;
    undoStack.current.push(JSON.parse(JSON.stringify(activeSheet.rows)));
    redoStack.current = [];
    const updates: Record<string, Record<string, CellValue | null>> = {};
    cellClipboard.grid.forEach((rowData, ri) => {
      const target = flatRows[startRowIdx + ri];
      if (!target || target.isSummary) return;
      rowData.forEach((val, ci) => {
        const targetCol = columns[startColIdx + ci];
        if (!targetCol?.editable || targetCol.type === 'formula') return;
        if (!updates[target.row.id]) updates[target.row.id] = {};
        updates[target.row.id][targetCol.id] = val;
      });
    });
    // Capture cutSource for use inside the updater
    const pendingCut = cutSource;
    updateRows(rows => {
      const apply = (items: V3Row[]): V3Row[] => items.map(r => {
        let next = r;
        if (updates[r.id]) next = { ...r, cells: { ...r.cells, ...updates[r.id] } };
        // Deferred cut: clear the original cut cells now that paste has occurred
        if (pendingCut?.type === 'cells' && pendingCut.rowIds.has(r.id)) {
          const cells = { ...next.cells };
          pendingCut.colIds.forEach(cid => {
            const c = columns.find(col => col.id === cid);
            if (c?.editable && c.type !== 'formula') cells[cid] = null;
          });
          next = { ...next, cells };
        }
        if (next.children) next = { ...next, children: apply(next.children) };
        return next;
      });
      return apply(rows);
    });
    setCutSource(null);
  }, [cellClipboard, focusedCell, flatRows, columns, activeSheet, updateRows, cutSource]);

  // Direct cell copy for context menu (bypasses range state)
  const contextMenuCellCopy = useCallback((rowId: string, colId: string, cut = false) => {
    const flat = flatRows.find(f => f.row.id === rowId);
    if (!flat) return;
    setCellClipboard({ grid: [[flat.row.cells[colId] ?? null]], colIds: [colId] });
    if (cut) {
      setCutSource({ type: 'cells', rowIds: new Set([rowId]), colIds: new Set([colId]) });
    } else {
      setCutSource(null);
    }
  }, [flatRows]);


  // ── Context menu ─────────────────────────────────────────────────────
  const handleContextMenu = (e: React.MouseEvent, type: 'row' | 'cell' | 'column', rowId?: string, colId?: string) => {
    e.preventDefault();
    flushPendingOverwrite();
    setContextMenu({ visible: true, position: { x: e.clientX, y: e.clientY }, type, rowId, colId });
  };

  const getContextItems = (): ContextMenuItem[] => {
    if (!contextMenu) return [];
    const { type, rowId, colId } = contextMenu;

    // ── Row-creation block detection ─────────────────────────────────────
    // The bottom placeholder draft is always the last top-level row with isDraft + no name.
    // It must NEVER be treated as a blocker — its whole purpose is to stay empty.
    const isSchedule = activeSheetId === 'sheet-schedule';
    const targetColId = isSchedule ? 'name' : (columns[0]?.id || 'name');

    const allTopLevelRows = activeSheet?.rows ?? [];
    const bottomPlaceholderId = (() => {
      // Walk from the end to find the last empty draft at the top level
      for (let i = allTopLevelRows.length - 1; i >= 0; i--) {
        const r = allTopLevelRows[i];
        if (r.isDraft && !r.cells[targetColId]) return r.id;
      }
      return null;
    })();

    // Find a row that: (a) has an empty task name, (b) has been visited/focused, (c) is NOT the bottom placeholder
    const blockingRow = flatRows.find(f => {
      if (f.isSummary) return false;
      if (f.row.id === bottomPlaceholderId) return false;
      return !f.row.cells[targetColId] && visitedDraftIds.has(f.row.id);
    })?.row ?? null;

    const isRowCreationBlocked = blockingRow !== null;
    const friendlyHint = isRowCreationBlocked
      ? 'A row is missing its Task Name. Fill it in first, then you can add more rows.'
      : undefined;


    // ── Column context menu ───────────────────────────────────────────────
    if (type === 'column' && colId) {
      const currentCol = columns.find(c => c.id === colId);
      return [
        { label: 'Cut column',         icon: <ScissorsIcon className="w-4 h-4" />,    shortcut: '⌘X', onClick: () => handleCutColumn(colId) },
        { label: 'Copy column',        icon: <CopyIcon className="w-4 h-4" />,         shortcut: '⌘C', onClick: () => handleCopyColumn(colId) },
        { label: 'Paste into column',  icon: <ClipboardIcon className="w-4 h-4" />,   shortcut: '⌘V', disabled: !cellClipboard, onClick: () => handlePasteColumn(colId) },
        { separator: true } as any,
        { label: 'Insert column left',  icon: <ChevronLeftIcon className="w-4 h-4" />,  onClick: () => handleInsertColumnLeft(colId) },
        { label: 'Insert column right', icon: <ChevronRightIcon className="w-4 h-4" />, onClick: () => handleInsertColumnRight(colId) },
        { separator: true } as any,
        { label: 'Sort A → Z', icon: <ArrowUpIcon className="w-4 h-4" />,   onClick: () => setSort({ colId, dir: 'asc' }) },
        { label: 'Sort Z → A', icon: <ArrowDownIcon className="w-4 h-4" />, onClick: () => setSort({ colId, dir: 'desc' }) },
        { separator: true } as any,
        // ── Column type inline picker ─────────────────────────────────
        {
          label: 'Column Type', onClick: () => {},
          render: (onClose: () => void) => (
            <div className="px-3 py-2">
              <div className="text-[10px] text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">Column Type</div>
              <div className="grid grid-cols-4 gap-1">
                {COLUMN_TYPES.map(ct => (
                  <button
                    key={ct.id}
                    className={`flex flex-col items-center gap-0.5 p-1.5 rounded text-center text-[10px] transition-all border
                      ${currentCol?.type === ct.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                      }`}
                    onClick={(e) => {
                      if (ct.id === 'formula' || ct.id === 'select') {
                        setEditingColumn({ id: colId, targetType: ct.id });
                      } else {
                        handleUpdateColumn(colId, {
                          type: ct.id,
                          editable: true,
                          align: (ct.id === 'number' || ct.id === 'currency') ? 'right' : 'left',
                          isTotal: ct.id === 'currency' || ct.id === 'number',
                        });
                      }
                      onClose();
                    }}
                  >
                    <span className="text-sm leading-none">{ct.icon}</span>
                    <span className="font-medium">{ct.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ),
        } as any,
        {
          label: 'Edit Column…', icon: <Pencil className="w-4 h-4 text-gray-500" />,
          onClick: () => setEditingColumn({ id: colId }),
        },
        { separator: true } as any,
        { label: 'Clear column',  icon: <XIcon className="w-4 h-4" />,      onClick: () => handleClearColumn(colId) },
        { label: 'Delete column', icon: <TrashIcon className="w-4 h-4" />,  danger: true, onClick: () => handleDeleteColumn(colId) },
      ];
    }

    // ── Cell context menu ─────────────────────────────────────────────────
    if (type === 'cell' && rowId && colId) {
      const renderColorRow = (l: string, i: React.ReactNode, t: 'bg' | 'text' | 'border', onClrClose: () => void) => (
        <div className="flex items-center justify-between px-3 py-1 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2 flex-1 mr-3">
            <span className="text-gray-600 flex-shrink-0">{i}</span>
            <span className="text-[11px] text-gray-900 font-medium whitespace-nowrap">{l}</span>
          </div>
          <div className="flex-shrink-0">
            <ColorPicker
              icon={<div className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: '#fff' }} />}
              label={l}
              onColorSelect={(color) => {
                const s = t === 'bg' ? { backgroundColor: color } : t === 'text' ? { textColor: color } : { borderColor: color };
                handleCellStyleUpdate(s);
                onClrClose();
              }}
              presets={t === 'bg' ? BACKGROUND_COLORS : TEXT_BORDER_COLORS}
            />
          </div>
        </div>
      );

      const mod = getModKeyLabel();

      return [
        { label: 'Cut',   icon: <ScissorsIcon className="w-4 h-4" />,   shortcut: `${mod}X`, onClick: () => contextMenuCellCopy(rowId, colId, true) },
        { label: 'Copy',  icon: <CopyIcon className="w-4 h-4" />,        shortcut: `${mod}C`, onClick: () => contextMenuCellCopy(rowId, colId, false) },
        { label: 'Paste', icon: <ClipboardIcon className="w-4 h-4" />,  shortcut: `${mod}V`, disabled: !cellClipboard, onClick: () => handleCellPaste(rowId, colId) },
        { separator: true } as any,
        { label: 'Clear cell', icon: <XIcon className="w-4 h-4" />, onClick: () => handleUpdateCell(rowId, colId, null) },
        { separator: true } as any,
        { label: 'Insert row above', icon: <ArrowUpIcon className="w-4 h-4" />,   disabled: isRowCreationBlocked, onClick: () => handleInsertRow(rowId, 'above') },
        { label: 'Insert row below', icon: <ArrowDownIcon className="w-4 h-4" />, disabled: isRowCreationBlocked, onClick: () => handleInsertRow(rowId, 'below') },
        { label: 'Add child row',    icon: <PlusIcon className="w-4 h-4" />,      disabled: isRowCreationBlocked, onClick: () => handleAddSubRow(rowId) },
        ...(friendlyHint ? [{ label: '', hint: friendlyHint, onClick: () => {} } as any] : []),
        { separator: true } as any,
        { label: 'Indent row',  shortcut: `${mod}]`,  icon: <IndentIcon className="w-4 h-4" />,  onClick: () => handleIndentRow(rowId) },
        { label: 'Outdent row', shortcut: `${mod}[`, icon: <OutdentIcon className="w-4 h-4" />, onClick: () => handleOutdentRow(rowId) },
        { separator: true } as any,
        { label: 'Cell Background', render: (close) => renderColorRow('Cell Background', <FillColorIcon className="w-4 h-4" />, 'bg', close) } as any,
        { label: 'Cell Text Color', render: (close) => renderColorRow('Cell Text Color', <TextColorIcon className="w-4 h-4" />, 'text', close) } as any,
        { label: 'Cell Border Color', render: (close) => renderColorRow('Cell Border Color', <BorderColorIcon className="w-4 h-4" />, 'border', close) } as any,
        { label: 'Clear all styling', icon: <XIcon className="w-4 h-4" />, onClick: () => handleClearAllStyling('cell', rowId, colId) },
        { separator: true } as any,
        { label: 'Delete row', icon: <TrashIcon className="w-4 h-4" />, danger: true, onClick: () => handleDeleteRows(new Set([rowId])) },
      ];
    }

    // ── Row context menu (row number click) ──────────────────────────────
    if (rowId) {
      const renderRowColorRow = (l: string, i: React.ReactNode, t: 'bg' | 'text' | 'border', onClrClose: () => void) => (
        <div className="flex items-center justify-between px-3 py-1 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2 flex-1 mr-3">
            <span className="text-gray-600 flex-shrink-0">{i}</span>
            <span className="text-[11px] text-gray-900 font-medium whitespace-nowrap">{l}</span>
          </div>
          <div className="flex-shrink-0">
            <ColorPicker
              icon={<div className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: '#fff' }} />}
              label={l}
              onColorSelect={(color) => {
                const s = t === 'bg' ? { backgroundColor: color } : t === 'text' ? { textColor: color } : { borderColor: color };
                handleStyleUpdate(s);
                onClrClose();
              }}
              presets={t === 'bg' ? BACKGROUND_COLORS : TEXT_BORDER_COLORS}
            />
          </div>
        </div>
      );

      return [
        { label: 'Insert row above', icon: <ArrowUpIcon className="w-4 h-4" />,   disabled: isRowCreationBlocked, onClick: () => handleInsertRow(rowId, 'above') },
        { label: 'Insert row below', icon: <ArrowDownIcon className="w-4 h-4" />, disabled: isRowCreationBlocked, onClick: () => handleInsertRow(rowId, 'below') },
        { label: 'Add child row',    icon: <PlusIcon className="w-4 h-4" />,      disabled: isRowCreationBlocked, onClick: () => handleAddSubRow(rowId) },
        ...(friendlyHint ? [{ label: '', hint: friendlyHint, onClick: () => {} } as any] : []),
        { separator: true } as any,
        { label: 'Indent row',  icon: <IndentIcon className="w-4 h-4" />,  onClick: () => handleIndentRow(rowId) },
        { label: 'Outdent row', icon: <OutdentIcon className="w-4 h-4" />, onClick: () => handleOutdentRow(rowId) },
        { separator: true } as any,
        { label: 'Row Background', render: (close) => renderRowColorRow('Row Background', <FillColorIcon className="w-4 h-4" />, 'bg', close) } as any,
        { label: 'Row Text Color', render: (close) => renderRowColorRow('Row Text Color', <TextColorIcon className="w-4 h-4" />, 'text', close) } as any,
        { label: 'Row Border Color', render: (close) => renderRowColorRow('Row Border Color', <BorderColorIcon className="w-4 h-4" />, 'border', close) } as any,
        { label: 'Clear all styling', icon: <XIcon className="w-4 h-4" />, onClick: () => handleClearAllStyling('row', rowId) },
        { separator: true } as any,
        { label: 'Delete row', icon: <TrashIcon className="w-4 h-4" />, danger: true, onClick: () => handleDeleteRows(new Set([rowId])) },
      ];
    }

    return [];
  };

  const memoizedRows = useMemo(() => flatRows.map(f => f.row), [flatRows]);

  // ── Totals ────────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const result: Record<string, number> = {};
    for (const col of columns) {
      if (col.isTotal) result[col.id] = sumColumn(activeSheet?.rows ?? [], col, memoizedRows, columns);
    }
    return result;
  }, [columns, activeSheet, memoizedRows]);

  // ── Formula bar selection ─────────────────────────────────────────────
  const formulaBarSelection = useMemo(() => {
    if (!focusedCell) return null;
    const ri = flatRows.findIndex(f => f.row.id === focusedCell.rowId);
    const ci = columns.findIndex(c => c.id === focusedCell.colId);
    return ri >= 0 && ci >= 0 ? { rowIdx: ri, colIdx: ci } : null;
  }, [focusedCell, flatRows, columns]);

  const handleFormulaBarCommit = (rowId: string, colId: string, value: CellValue) => {
    handleUpdateCell(rowId, colId, value);
  };

  // ── Early returns (AFTER all hooks) ──────────────────────────────────
  if (!activeSheet) return null;

  // Show empty state if no contract attached
  if (!contractData) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 px-4">
        <div className="text-center max-w-md">
          <PaperclipIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Contract Attached</h2>
          <p className="text-gray-600 mb-6">
            Upload your prime contract to get started. We'll extract key dates and help you build your project schedule.
          </p>
          <button
            onClick={() => setIsContractUploadOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PaperclipIcon className="w-4 h-4" />
            Upload Contract
          </button>
        </div>
      </div>
    );
  }

  // Show contract details form if contract not confirmed
  if (!contractConfirmed) {
    return <ContractDetailsForm />;
  }

  // Otherwise show spreadsheet
  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full px-4 pt-[7px] pb-[7px] outline-none focus:ring-0 overflow-hidden gap-[7px]"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onBlur={(e) => {
        // Commit pending overwrite when focus leaves the spreadsheet entirely.
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          flushPendingOverwrite();
        }
      }}
    >
      {/* ── Toolbar (reuses shared SpreadsheetToolbar) ── */}
      <div className="flex items-center gap-2">
        <SpreadsheetToolbar
          isAllSelected={isAllSelected}
          handleToggleAll={() => {
            if (isAllSelected) setSelectedRowIds(new Set());
            else setSelectedRowIds(new Set(selectableFlat.map(f => f.row.id)));
          }}
          toolbarCheckboxRef={checkboxRef}
          hasRowSelection={selectedRowIds.size > 0}
          selectedCount={selectedRowIds.size}
          onStyleUpdate={(style) => handleStyleUpdate(style as Partial<V3CellStyle>)}
          onCut={() => handleCut()}
          onCopy={() => handleCopy()}
          onPaste={() => handlePaste()}
          onDelete={() => handleDeleteRows(selectedRowIds)}
          onDeselectAll={() => setSelectedRowIds(new Set())}
        />
      </div>

      {/* ── Contract Summary Header ── */}
      {contractData && <ContractSummaryHeader />}

      {/* ── Table card ── */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative flex flex-col focus:outline-none max-h-full min-h-0 flex-grow">

        {/* ── Formula bar (Hidden in v4.0 as per user request) ── */}
        {/*
        <FormulaBar
          selection={formulaBarSelection}
          rows={memoizedRows}
          columns={columns}
          liveEdit={liveCellEdit}
          onStartEdit={handleFormulaBarStartEdit}
          onLiveChange={handleLiveCellEditChange}
          onCommit={handleFormulaBarCommit}
        />
        */}

        {/* GUIDED CREATION WARNING */}
        {activeSheetId === 'sheet-schedule' && flatRows.some(f => 
          f.row.isDraft && 
          !f.row.cells['name'] && 
          visitedDraftIds.has(f.row.id) && 
          focusedCell?.rowId !== f.row.id
        ) && (
          <div className="bg-amber-50 border-b border-amber-100 px-4 py-1.5 flex items-center gap-2.5 animate-in slide-in-from-top duration-300 shrink-0">
            <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-amber-800 text-[10px] font-semibold tracking-tight uppercase">
              Draft Required: Enter a Task Name to unlock row creation
            </span>
          </div>
        )}

        {/* ── Main scroll area ── */}
        <div className="overflow-auto relative select-none focus:outline-none min-h-0 flex-grow" ref={scrollRef}>
          <table className="border-collapse min-w-max table-fixed relative" style={{ fontSize }}>
            <V3Header
              columns={columns}
              focusedColId={focusedCell?.colId ?? null}
              selectedColId={selectedColId}
              resizingColumnId={resizingColId}
              sort={sort}
              isScrolled={!scrollState.isAtStart}
              isAtEnd={scrollState.isAtEnd}
              isVerticalScrolled={scrollState.isScrolledTop}
              fontSize={fontSize}
              displayDensity={density}
              onColumnHeaderClick={handleColumnHeaderClick}
              onRenameColumn={handleRenameColumn}
              onResize={onMouseDownResize}
              onColumnMove={handleColumnMove}
              onAddColumn={() => setShowAddColumn(true)}
              onContextMenu={(e, colId) => handleContextMenu(e, 'column', undefined, colId)}
              cutColId={cutSource?.type === 'column' ? cutSource.colId : null}
              isAllSelected={isAllSelected}
              onToggleAll={() => {
                if (isAllSelected) setSelectedRowIds(new Set());
                else setSelectedRowIds(new Set(selectableFlat.map(f => f.row.id)));
              }}
              checkboxRef={checkboxRef}
            />

            <tbody>
              {flatRows.map(({ row, level, isSummary }, globalIdx) => (
                <V3RowComponent
                  key={`${row.id}-${isSummary ? 'sum' : 'row'}`}
                  row={row}
                  rowIndex={globalIdx}
                  level={level}
                  columns={columns}
                  isSelected={selectedRowIds.has(row.id)}
                  isExpanded={expandedIds.has(row.id)}
                  isSummary={isSummary}
                  focusedCell={focusedCell}
                  editingCell={editingCell}
                  selectedColId={selectedColId}
                  isScrolled={!scrollState.isAtStart}
                  isAtEnd={scrollState.isAtEnd}
                  fontSize={fontSize}
                  displayDensity={density}
                  onToggleSelect={(id) => {
                    setSelectedRowIds(prev => {
                      const next = new Set(prev);
                      next.has(id) ? next.delete(id) : next.add(id);
                      return next;
                    });
                  }}
                  onToggleExpand={(id) => {
                    setExpandedIds(prev => {
                      const next = new Set(prev);
                      next.has(id) ? next.delete(id) : next.add(id);
                      return next;
                    });
                  }}
                  onCellClick={handleCellClick}
                  onCellDoubleClick={handleCellDoubleClick}
                  onUpdateCell={handleUpdateCell}
                  onContextMenu={(e, type, rowId, colId) => handleContextMenu(e, type, rowId, colId)}
                  cutColId={cutSource?.type === 'column' ? cutSource.colId : null}
                  cutCellColIds={cutSource?.type === 'cells' && cutSource.rowIds.has(row.id) ? cutSource.colIds : emptySetRef.current}
                  liveEdit={liveCellEdit}
                  activeEditSource={editSource}
                  isVisitedDraft={visitedDraftIds.has(row.id)}
                  onLiveEditChange={handleLiveCellEditChange}
                  onStopEdit={() => { setEditingCell(null); setEditSource(null); setLiveCellEdit(null); }}
                  allRows={memoizedRows}
                />
              ))}
            </tbody>

            {/* ── Totals footer ── */}
            {Object.keys(totals).length > 0 && (
              <tfoot className="bg-gray-100 text-gray-900 border-t-2 border-gray-300 sticky bottom-0 z-30 font-bold shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <tr className="h-9">
                  <td
                    className={`sticky left-0 z-40 border-r border-gray-300 text-center bg-gray-100 ${!scrollState.isAtStart ? 'shadow-[4px_0_8px_-4px_rgba(0,0,0,0.3)]' : ''}`}
                    style={{ width: SPREADSHEET_INDEX_COLUMN_WIDTH, minWidth: SPREADSHEET_INDEX_COLUMN_WIDTH, maxWidth: SPREADSHEET_INDEX_COLUMN_WIDTH, fontSize }}
                  >
                    Total
                  </td>
                  {columns.map(col => (
                    <td key={col.id}
                      className={`border-r border-gray-300 px-2 bg-gray-100 whitespace-nowrap relative ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                      style={{ width: col.width, fontSize }}
                    >
                      {selectedColId === col.id && (
                        <div className="absolute inset-0 pointer-events-none z-20" style={{ boxShadow: 'inset 2px 0 0 0 #2563eb, inset -2px 0 0 0 #2563eb, inset 0 -2px 0 0 #2563eb' }} />
                      )}
                      {cutSource?.type === 'column' && cutSource.colId === col.id && (
                        <div className="absolute inset-0 border-l-2 border-r-2 border-b-2 border-dashed border-blue-600 pointer-events-none z-20" />
                      )}
                      {col.isTotal && totals[col.id] !== undefined
                        ? (col.type === 'number' ? totals[col.id].toLocaleString() : formatCurrency(totals[col.id]))
                        : ''}
                    </td>
                  ))}
                  <td className="bg-gray-100 border-r border-gray-300" style={{ width: 44 }} />
                  <td
                    className={`sticky right-0 z-40 border-l border-gray-200 bg-gray-100 w-20 ${!scrollState.isAtEnd ? 'shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.3)]' : ''}`}
                  />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* ── Add row ── */}
        <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 flex items-center gap-4 flex-wrap">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            <div className="w-4 h-4 rounded-full border border-blue-600 flex items-center justify-center">
              <PlusIcon className="w-2.5 h-2.5" />
            </div>
            Add row
          </button>
        </div>
      </div>

      {/* ── Modals ── */}
      {showAddColumn && (
        <AddColumnModal onAdd={handleAddColumn} onClose={() => setShowAddColumn(false)} />
      )}
      {editingColumn && (() => {
        const col = columns.find(c => c.id === editingColumn.id);
        if (!col) return null;
        return (
          <AddColumnModal
            mode="edit"
            initialValues={{ 
              label: col.label, 
              type: editingColumn.targetType ?? col.type, 
              formula: col.formula, 
              options: col.options 
            }}
            onAdd={(updates) => {
              handleUpdateColumn(editingColumn.id, updates);
              setEditingColumn(null);
            }}
            onClose={() => setEditingColumn(null)}
          />
        );
      })()}

      {/* ── Context menu ── */}
      {contextMenu?.visible && (
        <ContextMenu
          position={contextMenu.position}
          items={getContextItems()}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default SpreadsheetViewV4;
