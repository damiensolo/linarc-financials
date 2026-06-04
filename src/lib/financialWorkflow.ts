import type { ContractData, FinancialConfig, BudgetLineState, PrimeContractState, FinancialActivationState, SOVMapping } from '../types';
import type { V3Row, V3Sheet, V3Column } from '../components/views/spreadsheetV4/types';
import { INVITED_SUBCONTRACTORS } from '../data/subcontractors';

/** Budget cell holding the assigned subcontractor (vendor) name — required to commit. */
export const SUBCONTRACTOR_FIELD = 'subcontractorName';

export const BUDGET_SHEET_ID = 'sheet-budget';
export const PRIME_CONTRACT_SHEET_ID = 'sheet-prime-contract';
export const SCHEDULE_SHEET_ID = 'sheet-schedule';

export function getBudgetSheet(sheets: V3Sheet[] | null | undefined): V3Sheet | undefined {
  return sheets?.find((s) => s.id === BUDGET_SHEET_ID);
}

export function getPrimeContractSheet(sheets: V3Sheet[] | null | undefined): V3Sheet | undefined {
  return sheets?.find((s) => s.id === PRIME_CONTRACT_SHEET_ID);
}

export function getBudgetRows(sheets: V3Sheet[] | null | undefined): V3Row[] {
  const sheet = getBudgetSheet(sheets);
  if (!sheet) return [];
  return sheet.rows.filter((r) => r.id !== 'empty-row' && !r.isGroup);
}

export function getPrimeContractRows(sheets: V3Sheet[] | null | undefined): V3Row[] {
  const sheet = getPrimeContractSheet(sheets);
  if (!sheet) return [];
  return sheet.rows.filter((r) => r.id !== 'empty-row' && !r.isGroup);
}

export function getLineState(row: V3Row): BudgetLineState {
  return row.lineState ?? 'open';
}

export function hasPcValue(contractData: ContractData | null): boolean {
  return contractData != null && contractData.contractSum != null && contractData.contractSum > 0;
}

export function hasUploadedContractDocument(contractData: ContractData | null): boolean {
  if (!contractData) return false;
  return (
    Boolean(contractData.fileName) &&
    contractData.fileName !== 'Manual Entry' &&
    contractData.extractionMethod !== 'manual'
  );
}

export function getPrimeContractState(
  contractData: ContractData | null,
  contractLocked: boolean
): PrimeContractState {
  if (!contractData) return 'none';
  if (contractLocked) return 'locked';
  return 'open';
}

export function countLinesByState(rows: V3Row[]): {
  total: number;
  open: number;
  pending: number;
  locked: number;
} {
  const dataRows = rows.filter((r) => !r.isGroup);
  let open = 0;
  let pending = 0;
  let locked = 0;
  for (const row of dataRows) {
    const state = getLineState(row);
    if (state === 'open') open++;
    else if (state === 'pending_approval') pending++;
    else if (state === 'locked') locked++;
  }
  return { total: dataRows.length, open, pending, locked };
}

export function committedLineCount(rows: V3Row[]): number {
  return countLinesByState(rows).locked;
}

export function hasCommittedLines(rows: V3Row[]): boolean {
  return committedLineCount(rows) > 0;
}

export function isBudgetFullyLocked(rows: V3Row[]): boolean {
  const { total, locked, pending } = countLinesByState(rows);
  return total > 0 && locked === total && pending === 0;
}

export function canAccessBudget(contractData: ContractData | null): boolean {
  return hasPcValue(contractData);
}

export function canAccessOperations(rows: V3Row[]): boolean {
  return hasCommittedLines(rows);
}

export function rowMissingCostCode(row: V3Row): boolean {
  const code = row.cells['costCode'];
  return code == null || String(code).trim() === '';
}

export function countOpenRowsMissingCostCode(rows: V3Row[]): number {
  return rows.filter((r) => getLineState(r) === 'open' && rowMissingCostCode(r)).length;
}

export function rowMissingSubcontractor(row: V3Row): boolean {
  const sub = row.cells[SUBCONTRACTOR_FIELD];
  return sub == null || String(sub).trim() === '';
}

export function countOpenRowsMissingSubcontractor(rows: V3Row[]): number {
  return rows.filter((r) => getLineState(r) === 'open' && rowMissingSubcontractor(r)).length;
}

export function canCommitBudgetLine(row: V3Row): boolean {
  return getLineState(row) === 'open' && !rowMissingCostCode(row) && !rowMissingSubcontractor(row);
}

// Prime Contract line items intentionally carry NO cost code — cost codes are a
// budget-side concept (see createBudgetColumns). The contract baseline is just a
// description + value per line.
export const DEFAULT_PRIME_CONTRACT_COLUMNS: V3Column[] = [
  { id: 'name', label: 'Contract Line', type: 'text', width: 480, editable: true, visible: true },
  {
    id: 'contractValue',
    label: 'Contract Value',
    type: 'currency',
    width: 150,
    align: 'right',
    editable: true,
    visible: true,
    isTotal: true,
  },
];

export function createBudgetColumns(financialConfig?: FinancialConfig | null): V3Column[] {
  const overheadRate = (financialConfig?.defaultOverhead ?? 5) / 100;
  return [
    { id: 'costCode', label: 'Cost Code', type: 'text', width: 110, editable: true, visible: true },
    { id: 'name', label: 'Description', type: 'text', width: 220, editable: true, visible: true },
    {
      id: SUBCONTRACTOR_FIELD,
      label: 'Subcontractor',
      type: 'select',
      width: 190,
      editable: true,
      visible: true,
      options: INVITED_SUBCONTRACTORS,
    },
    { id: 'location', label: 'Location', type: 'text', width: 100, editable: true, visible: true },
    { id: 'quantity', label: 'Quantity', type: 'number', width: 80, align: 'right', editable: true, visible: true },
    { id: 'unit', label: 'UOM', type: 'text', width: 90, editable: true, visible: true },
    {
      id: 'effortHours',
      label: 'Effort hours',
      type: 'number',
      width: 90,
      align: 'right',
      editable: true,
      visible: true,
      isTotal: true,
    },
    {
      id: 'budget',
      label: 'Budget',
      type: 'currency',
      width: 110,
      align: 'right',
      editable: true,
      visible: true,
      isTotal: true,
    },
    {
      id: 'revisedBudget',
      label: 'Revised Budget',
      type: 'currency',
      width: 120,
      align: 'right',
      editable: true,
      visible: true,
      isTotal: true,
    },
    { id: 'labor', label: 'Labor', type: 'currency', width: 90, align: 'right', editable: true, visible: true, isTotal: true },
    { id: 'material', label: 'Material', type: 'currency', width: 90, align: 'right', editable: true, visible: true, isTotal: true },
    { id: 'equipment', label: 'Equipment', type: 'currency', width: 90, align: 'right', editable: true, visible: true, isTotal: true },
    // Cost-breakdown amount. Id is `subCost` (not `subcontractor`) so the Profit
    // formula token doesn't collide with the `Subcontractor` select column's label.
    {
      id: 'subCost',
      label: 'Sub Cost',
      type: 'currency',
      width: 100,
      align: 'right',
      editable: true,
      visible: true,
      isTotal: true,
    },
    { id: 'others', label: 'Others', type: 'currency', width: 80, align: 'right', editable: true, visible: true, isTotal: true },
    {
      id: 'overhead',
      label: 'Overhead',
      type: 'formula',
      width: 90,
      align: 'right',
      editable: false,
      visible: true,
      isTotal: true,
      formula: `=budget*${overheadRate}`,
    },
    {
      id: 'profit',
      label: 'Profit',
      type: 'formula',
      width: 90,
      align: 'right',
      editable: false,
      visible: true,
      isTotal: true,
      formula: '=budget-labor-material-equipment-subCost-others-overhead',
    },
  ];
}

/** @deprecated Use createBudgetColumns — kept for imports that expect DEFAULT_BUDGET_COLUMNS */
export const DEFAULT_BUDGET_COLUMNS = createBudgetColumns();

export function createEmptyPrimeContractSheet(): V3Sheet {
  return {
    id: PRIME_CONTRACT_SHEET_ID,
    name: 'Prime Contract',
    columns: DEFAULT_PRIME_CONTRACT_COLUMNS,
    rows: [{ id: `pc-row-${Date.now()}`, cells: {}, isDraft: true }],
  };
}

export function createEmptyBudgetSheet(financialConfig?: FinancialConfig | null): V3Sheet {
  return {
    id: BUDGET_SHEET_ID,
    name: 'Project Budget',
    columns: createBudgetColumns(financialConfig),
    rows: [{ id: `row-${Date.now()}`, cells: {}, lineState: 'open' }],
  };
}

export function getPrimeContractLineValue(row: V3Row): number {
  return Number(row.cells['contractValue'] ?? row.cells['totalBudget'] ?? 0) || 0;
}

export function getBudgetLineAmount(row: V3Row): number {
  return Number(row.cells['budget'] ?? row.cells['totalBudget'] ?? row.cells['labor'] ?? 0) || 0;
}

export function sumPrimeContractValues(rows: V3Row[]): number {
  return rows.reduce((sum, row) => sum + getPrimeContractLineValue(row), 0);
}

function rowHasMeaningfulData(row: V3Row, fieldIds: string[]): boolean {
  return fieldIds.some((id) => {
    const val = row.cells[id];
    if (val == null || val === '') return false;
    if (typeof val === 'number') return val !== 0;
    return String(val).trim() !== '';
  });
}

export function hasPrimeContractLineData(rows: V3Row[]): boolean {
  return rows.some((row) => rowHasMeaningfulData(row, ['name', 'contractValue', 'totalBudget']));
}

export function isPrimeContractSheetEmpty(rows: V3Row[]): boolean {
  if (rows.length === 0) return true;
  return !hasPrimeContractLineData(rows);
}

export function isBudgetSheetEmpty(rows: V3Row[]): boolean {
  if (rows.length === 0) return true;
  const budgetFields = [
    'costCode',
    'name',
    'location',
    'quantity',
    'unit',
    'effortHours',
    'budget',
    'revisedBudget',
    'labor',
    'material',
    'equipment',
    'subCost',
    'others',
    'totalBudget',
  ];
  return rows.every((row) => !rowHasMeaningfulData(row, budgetFields));
}

export function contractSumMismatch(
  contractData: ContractData | null,
  primeRows: V3Row[],
  tolerance = 0.01
): { mismatched: boolean; lineSum: number; contractSum: number } {
  const lineSum = sumPrimeContractValues(primeRows);
  const contractSum = contractData?.contractSum ?? 0;
  if (contractSum <= 0 || lineSum <= 0) return { mismatched: false, lineSum, contractSum };
  return {
    mismatched: Math.abs(lineSum - contractSum) > tolerance,
    lineSum,
    contractSum,
  };
}

export function createDefaultFinancialConfig(): FinancialConfig {
  return {
    defaultRetainage: 10,
    defaultOverhead: 5,
    billingCutoffDay: 1,
    allowMultiplePayApps: true,
    perLineApprovalEnabled: false,
    approvalRouting: { roles: ['gc', 'pe', 'owner'], requireAll: true },
    costCodeEnforcementConfirmed: false,
  };
}

export const APPROVER_NAMES: Record<string, string> = {
  gc: 'Jane Smith (GC PM)',
  pe: 'Robert Chen (Project Executive)',
  owner: 'Desert Vista Owner Rep',
};

export function getActivationState(
  activationState: FinancialActivationState,
  contractData: ContractData | null,
  rows: V3Row[]
): FinancialActivationState {
  if (activationState === 'activated') return 'activated';
  if (hasCommittedLines(rows)) return 'operating';
  if (hasPcValue(contractData)) return 'operating';
  return 'setup';
}

export function isSovMappingConfirmed(mapping: SOVMapping): boolean {
  return (mapping.status ?? 'confirmed') === 'confirmed';
}

export function createManualSovMapping(sovLineNumber: number): SOVMapping {
  const rowId = `sov-manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    rowId,
    sovLineNumber,
    sovDescription: '',
    amount: 0,
    status: 'draft',
    costCode: '',
    budgetLineItem: '',
    quantity: null,
    uom: '',
    location: '',
  };
}

export function createDraftSovMapping(budgetRow: V3Row, sovLineNumber: number): SOVMapping {
  const amount = getBudgetLineAmount(budgetRow);
  const qty = budgetRow.cells['quantity'];
  return {
    rowId: budgetRow.id,
    sovLineNumber,
    sovDescription: String(budgetRow.cells['name'] ?? ''),
    amount,
    status: 'draft',
    costCode: String(budgetRow.cells['costCode'] ?? ''),
    budgetLineItem: String(budgetRow.cells['name'] ?? ''),
    quantity: typeof qty === 'number' ? qty : qty != null ? Number(qty) || null : null,
    uom: String(budgetRow.cells['unit'] ?? ''),
    location: String(budgetRow.cells['location'] ?? ''),
  };
}

export function syncDraftSovMappings(
  committedRows: V3Row[],
  existing: SOVMapping[]
): SOVMapping[] {
  const next = [...existing];
  committedRows.forEach((row) => {
    if (next.some((m) => m.rowId === row.id)) return;
    next.push(createDraftSovMapping(row, next.length + 1));
  });
  return next;
}

export function countUnconfirmedSovMappings(
  committedRowIds: string[],
  mappings: SOVMapping[]
): number {
  return committedRowIds.filter((id) => {
    const mapping = mappings.find((m) => m.rowId === id);
    return !mapping || !isSovMappingConfirmed(mapping);
  }).length;
}
