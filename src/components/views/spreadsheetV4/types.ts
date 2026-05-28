// ─── SpreadsheetV3 Types ───────────────────────────────────────────────────────
// A superset of the V2 BudgetLineItem model with freeform column/sheet support.

export type V3ColumnType = 'text' | 'number' | 'currency' | 'date' | 'formula' | 'select' | 'checkbox';

export interface V3SelectOption {
  label: string;
  color?: string; // Optional hex color for the status dot
}

export interface V3Column {
  id: string;
  label: string;
  type: V3ColumnType;
  width: number;
  align?: 'left' | 'right' | 'center';
  visible?: boolean;
  editable?: boolean;
  isTotal?: boolean;
  /** For 'select' columns: list of options (can be strings or objects with color) */
  options?: (string | V3SelectOption)[];
  /** For 'formula' columns: the formula string e.g. "=labor+material+equipment" */
  formula?: string;
}

export type CellValue = string | number | boolean | null;

export interface V3CellStyle {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  bold?: boolean;
  italic?: boolean;
}

import type { BudgetLineState } from '../../../types';

export interface V3Row {
  id: string;
  cells: Record<string, CellValue>;
  style?: V3CellStyle;
  cellStyles?: Record<string, V3CellStyle>;
  children?: V3Row[];
  isExpanded?: boolean;
  isGroup?: boolean;
  level?: number;
  isDraft?: boolean;
  lineState?: BudgetLineState;
  approvalRequestId?: string;
  changeOrderId?: string;
}

export interface V3Sheet {
  id: string;
  name: string;
  columns: V3Column[];
  rows: V3Row[];
  frozenColumns?: number;
}

export interface V3Selection {
  start: { row: number; col: number };
  end: { row: number; col: number };
}

export type V3Template = 'blank' | 'budget' | 'schedule';

// ─── Formula evaluation ─────────────────────────────────────────────────────

/** Evaluate a formula string like "=labor+material" or "=A1+B2" against a sheet's data */
export function evaluateFormula(
  formula: string, 
  cells: Record<string, CellValue>,
  allRows?: V3Row[],
  columns?: V3Column[]
): CellValue {
  if (!formula.startsWith('=')) return formula;
  const expr = formula.slice(1);

  const colLetterToIndex = (letters: string) => {
    let index = 0;
    const str = letters.toUpperCase();
    for (let i = 0; i < str.length; i++) {
      index = index * 26 + (str.charCodeAt(i) - 64);
    }
    return index - 1;
  };

  try {
    let evalExpr = expr;

    // 1. Resolve Multi-word Labels (e.g., Total Labor or Total Labor 1)
    // We do this first and greedily (longest labels first) to prevent partial matches.
    if (columns) {
      const multiWordCols = columns
        .filter(c => c.label.trim().includes(' '))
        .sort((a, b) => b.label.length - a.label.length);

      for (const col of multiWordCols) {
        const esc = col.label.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match "Label" or "Label 123" or "Label123"
        const regex = new RegExp(`\\b${esc}\\s*(\\d+)?\\b`, 'gi');
        
        evalExpr = evalExpr.replace(regex, (match, rowNum) => {
          let targetCells = cells;
          if (rowNum && allRows) {
            const rowIdx = parseInt(rowNum, 10) - 1;
            if (rowIdx >= 0 && rowIdx < allRows.length) {
              targetCells = allRows[rowIdx].cells;
            }
          }
          const val = targetCells[col.id];
          if (val === null || val === undefined || val === '') return '0';
          if (typeof val === 'boolean') return val ? '1' : '0';
          return String(val).replace(/,/g, '');
        });
      }
    }

    // 2. Resolve Bracketed Labels (e.g., [Total Cost]) - Still supported for edge cases
    evalExpr = evalExpr.replace(/\[([^\]]+)\]/g, (match, label) => {
      if (!columns) return match;
      const col = columns.find(c => c.label.toLowerCase() === label.toLowerCase() || c.id.toLowerCase() === label.toLowerCase());
      if (col) {
        const val = cells[col.id];
        if (val === null || val === undefined || val === '') return '0';
        if (typeof val === 'boolean') return val ? '1' : '0';
        return String(val).replace(/,/g, '');
      }
      return '0';
    });

    // 3. Resolve Cell References & Label+Row (e.g., A1, qty1, Price5)
    evalExpr = evalExpr.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*([0-9]+)\b/g, (match, prefix, rowNum) => {
      if (!allRows || !columns) return match;
      
      let targetCol: V3Column | undefined;
      targetCol = columns.find(c => c.label.toLowerCase() === prefix.toLowerCase() || c.id.toLowerCase() === prefix.toLowerCase());
      
      if (!targetCol && prefix.length <= 2) {
        const colIdx = colLetterToIndex(prefix);
        if (colIdx >= 0 && colIdx < columns.length) {
          targetCol = columns[colIdx];
        }
      }

      if (targetCol) {
        const rowIdx = parseInt(rowNum, 10) - 1;
        if (rowIdx >= 0 && rowIdx < allRows.length) {
          const val = allRows[rowIdx].cells[targetCol.id];
          if (val === null || val === undefined || val === '') return '0';
          if (typeof val === 'boolean') return val ? '1' : '0';
          return String(val).replace(/,/g, '');
        }
      }
      return match;
    });

    // 4. Resolve Identifiers / Column Letters (e.g., Labor, A, B)
    evalExpr = evalExpr.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match) => {
      if (!isNaN(Number(match))) return match;
      if (!columns) return match;

      const col = columns.find(c => c.id.toLowerCase() === match.toLowerCase() || c.label.toLowerCase() === match.toLowerCase());
      if (col) {
        const val = cells[col.id];
        if (val === null || val === undefined || val === '') return '0';
        if (typeof val === 'boolean') return val ? '1' : '0';
        return String(val).replace(/,/g, '');
      }

      const potentialColIdx = colLetterToIndex(match);
      if (match.length <= 2 && potentialColIdx >= 0 && potentialColIdx < columns.length) {
        const colByIndex = columns[potentialColIdx];
        const val = cells[colByIndex.id];
        if (val === null || val === undefined || val === '') return '0';
        if (typeof val === 'boolean') return val ? '1' : '0';
        return String(val).replace(/,/g, '');
      }

      return match;
    });

    // Basic SUM function support
    const sumMatch = evalExpr.match(/^SUM\(([^)]+)\)$/i);
    if (sumMatch) {
      const parts = sumMatch[1].split(',').map(s => parseFloat(s.trim()) || 0);
      return parts.reduce((a, b) => a + b, 0);
    }

    // Safe numeric eval
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${evalExpr}`)();
    return typeof result === 'number' && !isNaN(result) ? result : null;
  } catch {
    return '#ERR';
  }
}

/** Convert a display label into a valid identifier for formulas (lowercase, safe chars) */
export function slugifyLabel(label: string): string {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
    
  // Ensure it starts with a letter or underscore to be a valid variable name
  if (/^[0-9]/.test(slug)) return '_' + slug;
  return slug || 'col';
}
