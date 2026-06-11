import { V3Row } from '../components/views/spreadsheetV4/types';
import { extractLineItems, type ExtractedLineItem } from './contractLineExtraction';

export interface ExtractedBudgetLine {
  name: string;
  costCode: string;
  /** Construction trade derived from the line name; '' when no rule matches. */
  trade: string;
  budget: number;
  labor: number;
  material: number;
  equipment: number;
  subcontractor: number;
  others: number;
  quantity: number | null;
  unit: string;
  location: string;
}

export type BudgetExtractionMethod = 'parsed' | 'fallback';

export interface BudgetExtractionResult {
  lines: ExtractedBudgetLine[];
  method: BudgetExtractionMethod;
}

/**
 * CSI MasterFormat cost codes keyed by work type. Cost code is the connector
 * across Budget → Schedule, so these must match the codes used on the
 * construction schedule's tasks. Rules are evaluated top-to-bottom; put the most
 * specific patterns first. (Moved here from contract extraction — cost codes are
 * a budget-side concept; the Prime Contract baseline carries none.)
 */
const CSI_CODE_RULES: { test: RegExp; code: string }[] = [
  { test: /kitchen/i, code: '11 31 00' },                                          // Residential Appliances
  { test: /bath/i, code: '22 40 00' },                                             // Plumbing Fixtures
  { test: /plumb/i, code: '22 40 00' },                                            // Plumbing Fixtures (shares code with bath)
  { test: /floor|lvp|carpet|resilient/i, code: '09 65 13' },                       // Resilient Flooring
  { test: /demo|demolition|prep/i, code: '02 41 00' },                             // Demolition
  { test: /drywall|stairwell|gypsum/i, code: '09 29 00' },                         // Gypsum Board
  { test: /exterior.*(trim|paint)|trim.*paint/i, code: '09 91 00' },               // Painting (exterior)
  { test: /paint/i, code: '09 91 00' },                                            // Painting (interior — shares code)
  { test: /light|electric/i, code: '26 51 00' },                                   // Interior Lighting
  { test: /concrete|entry/i, code: '03 30 00' },                                   // Cast-in-Place Concrete
  { test: /signage|mail/i, code: '10 14 00' },                                     // Signage
  { test: /permit|testing|plan\s*fee|inspection/i, code: '01 41 00' },             // Regulatory Requirements
  { test: /project\s*management|supervision|temp(orary)?\s*facilit|general\s*condition/i, code: '01 31 00' }, // Project Management
  { test: /overhead|profit|markup|fee/i, code: '01 00 00' },                       // General Requirements (OH&P)
];

export function csiCodeForLineItem(name: string): string {
  for (const rule of CSI_CODE_RULES) {
    if (rule.test.test(name)) return rule.code;
  }
  return '01 00 00';
}

/**
 * Construction trade keyed by work type — values MUST match the keys in
 * `data/trades.ts` (SUBCONTRACTORS_BY_TRADE) so the Subcontractor dropdown can be
 * scoped. Unlike cost codes, this intentionally has NO default: a line that
 * matches no rule gets '' (empty), so a Prime-Contract import lands with most
 * trades pre-filled and a few blank to demonstrate the picker.
 */
const TRADE_RULES: { test: RegExp; trade: string }[] = [
  { test: /demo|demolition|prep/i, trade: 'Demolition' },
  { test: /site\s*work|grading|excavat|earthwork/i, trade: 'Sitework / Earthwork' },
  { test: /concrete|foundation|flatwork|entry/i, trade: 'Concrete' },
  { test: /mason|brick|block|stone/i, trade: 'Masonry' },
  { test: /structural\s*steel|steel\s*erect|joist/i, trade: 'Structural Steel' },
  { test: /fram(e|ing)|rough\s*carpentry|carpentry|millwork|trim|cabinet/i, trade: 'Carpentry / Framing' },
  { test: /roof/i, trade: 'Roofing' },
  { test: /door|window|glaz|glass|storefront/i, trade: 'Doors & Windows' },
  { test: /drywall|gypsum|stairwell/i, trade: 'Drywall' },
  { test: /paint|coating/i, trade: 'Painting' },
  { test: /floor|lvp|carpet|resilient/i, trade: 'Flooring' },
  { test: /tile/i, trade: 'Tile' },
  { test: /plumb|bath|fixture|water\s*heater/i, trade: 'Plumbing' },
  { test: /hvac|mechanical|air\s*condition|ductwork|furnace/i, trade: 'HVAC / Mechanical' },
  { test: /electric|light|power|lv|low\s*voltage/i, trade: 'Electrical' },
  { test: /fire\s*(protection|sprinkler|alarm)|sprinkler/i, trade: 'Fire Protection' },
  { test: /landscap|irrigation|grounds|hardscape/i, trade: 'Landscaping' },
  { test: /project\s*management|supervision|temp(orary)?\s*facilit|general\s*condition/i, trade: 'General Conditions' },
];

export function tradeForLineItem(name: string): string {
  for (const rule of TRADE_RULES) {
    if (rule.test.test(name)) return rule.trade;
  }
  return '';
}

/** Demo budget used when a file can't be parsed (xlsx, scanned PDF, etc.). */
// Trades are pre-filled to mirror a real Prime-Contract import; "Kitchen updates"
// is intentionally left blank to demo selecting a trade.
const DEMO_BUDGET_LINES: ExtractedBudgetLine[] = [
  { name: 'Interior demolition and prep', costCode: '02 41 00', trade: 'Demolition', budget: 16000, labor: 11000, material: 2000, equipment: 3000, subcontractor: 0, others: 0, quantity: 8, unit: 'unit', location: '' },
  { name: 'Flooring materials & installation', costCode: '09 65 13', trade: 'Flooring', budget: 34000, labor: 14000, material: 20000, equipment: 0, subcontractor: 0, others: 0, quantity: 8, unit: 'unit', location: '' },
  { name: 'Interior paint (walls/ceilings/trim)', costCode: '09 91 00', trade: 'Painting', budget: 18000, labor: 12000, material: 6000, equipment: 0, subcontractor: 0, others: 0, quantity: 8, unit: 'unit', location: '' },
  { name: 'Kitchen updates (cabinets, tops, sink)', costCode: '11 31 00', trade: '', budget: 42000, labor: 14000, material: 28000, equipment: 0, subcontractor: 0, others: 0, quantity: 8, unit: 'unit', location: '' },
  { name: 'Bathroom updates (vanities, fixtures, tile)', costCode: '22 40 00', trade: 'Plumbing', budget: 32000, labor: 12000, material: 20000, equipment: 0, subcontractor: 0, others: 0, quantity: 8, unit: 'unit', location: '' },
  { name: 'Unit lighting & electrical device updates', costCode: '26 51 00', trade: 'Electrical', budget: 16000, labor: 9000, material: 7000, equipment: 0, subcontractor: 0, others: 0, quantity: 8, unit: 'unit', location: '' },
  { name: 'Corridor/stairwell drywall repair & paint', costCode: '09 29 00', trade: 'Drywall', budget: 14000, labor: 8000, material: 6000, equipment: 0, subcontractor: 0, others: 0, quantity: null, unit: 'ls', location: 'Common' },
  { name: 'Project management, supervision, temp facilities', costCode: '01 31 00', trade: 'General Conditions', budget: 32000, labor: 32000, material: 0, equipment: 0, subcontractor: 0, others: 0, quantity: null, unit: 'ls', location: '' },
];

function parseAmount(raw: string | undefined): number {
  if (!raw) return 0;
  const num = parseFloat(raw.replace(/[$,\s"]/g, ''));
  return Number.isFinite(num) ? num : 0;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}

const HEADER_ALIASES: Record<keyof ExtractedBudgetLine, RegExp> = {
  name: /descr|line|item|scope|work|task/i,
  costCode: /cost\s*code|csi|code/i,
  budget: /budget|amount|total|value|cost(?!\s*code)/i,
  labor: /labou?r/i,
  material: /material/i,
  equipment: /equip/i,
  subcontractor: /sub(contractor)?/i,
  others: /other|misc/i,
  quantity: /qty|quantity/i,
  unit: /uom|unit/i,
  location: /location|loc\b|area/i,
};

function buildHeaderMap(header: string[]): Partial<Record<keyof ExtractedBudgetLine, number>> {
  const map: Partial<Record<keyof ExtractedBudgetLine, number>> = {};
  (Object.keys(HEADER_ALIASES) as (keyof ExtractedBudgetLine)[]).forEach((field) => {
    const idx = header.findIndex((h) => HEADER_ALIASES[field].test(h));
    if (idx !== -1) map[field] = idx;
  });
  return map;
}

function extractFromCsv(text: string): ExtractedBudgetLine[] {
  const rows = text
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter(Boolean);
  if (rows.length < 2) return [];

  const header = splitCsvLine(rows[0]);
  const map = buildHeaderMap(header);
  // Need at least a description and a budget/amount column to treat as a budget CSV.
  if (map.name == null || map.budget == null) return [];

  const cellAt = (cells: string[], field: keyof ExtractedBudgetLine): string =>
    map[field] != null ? cells[map[field] as number] ?? '' : '';

  const lines: ExtractedBudgetLine[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = splitCsvLine(rows[i]);
    const name = cellAt(cells, 'name');
    const budget = parseAmount(cellAt(cells, 'budget'));
    if (!name || budget <= 0) continue;

    const qtyRaw = cellAt(cells, 'quantity');
    lines.push({
      name,
      costCode: cellAt(cells, 'costCode') || csiCodeForLineItem(name),
      trade: tradeForLineItem(name),
      budget,
      labor: parseAmount(cellAt(cells, 'labor')),
      material: parseAmount(cellAt(cells, 'material')),
      equipment: parseAmount(cellAt(cells, 'equipment')),
      subcontractor: parseAmount(cellAt(cells, 'subcontractor')),
      others: parseAmount(cellAt(cells, 'others')),
      quantity: qtyRaw ? parseAmount(qtyRaw) || null : null,
      unit: cellAt(cells, 'unit'),
      location: cellAt(cells, 'location'),
    });
  }
  return lines;
}

function lineFromExtractedItem(item: ExtractedLineItem): ExtractedBudgetLine {
  return {
    name: item.name,
    costCode: csiCodeForLineItem(item.name),
    trade: tradeForLineItem(item.name),
    budget: item.value,
    labor: 0,
    material: 0,
    equipment: 0,
    subcontractor: 0,
    others: 0,
    quantity: null,
    unit: '',
    location: '',
  };
}

/**
 * Extract budget line items from an uploaded file's text content. CSV is parsed
 * by header; PDF/text fall back to the shared Schedule-of-Values extractor. When
 * too little is found we return a demo budget so the prototype stays usable.
 */
export function extractBudgetLines(rawText: string, fileName: string): BudgetExtractionResult {
  const isCsv = /\.csv$/i.test(fileName) || (rawText.includes(',') && /\n/.test(rawText) && !rawText.includes('%PDF'));

  let lines: ExtractedBudgetLine[] = [];
  if (isCsv) {
    lines = extractFromCsv(rawText);
  }
  if (lines.length === 0 && rawText.trim()) {
    lines = extractLineItems(rawText).map(lineFromExtractedItem);
  }

  if (lines.length >= 3) {
    return { lines, method: 'parsed' };
  }
  return { lines: DEMO_BUDGET_LINES, method: 'fallback' };
}

export function sumExtractedBudgetLines(lines: ExtractedBudgetLine[]): number {
  return lines.reduce((sum, line) => sum + line.budget, 0);
}

/**
 * Seed budget rows from Prime Contract line items (testing convenience). The
 * Prime Contract has no cost code, so we derive one (CSI) from the line name.
 * Cost categories start at 0; Budget = the contract line value.
 */
export function createBudgetRowsFromPrimeContract(primeRows: V3Row[]): V3Row[] {
  const lines: ExtractedBudgetLine[] = primeRows
    .map((row) => {
      const name = String(row.cells['name'] ?? '').trim();
      const value = Number(row.cells['contractValue'] ?? row.cells['totalBudget'] ?? 0) || 0;
      return { name, value };
    })
    .filter((l) => l.name !== '' || l.value !== 0)
    .map((l) => ({
      name: l.name,
      costCode: csiCodeForLineItem(l.name),
      trade: tradeForLineItem(l.name),
      budget: l.value,
      labor: 0,
      material: 0,
      equipment: 0,
      subcontractor: 0,
      others: 0,
      quantity: null,
      unit: '',
      location: '',
    }));
  return createBudgetRowsFromExtractedLines(lines);
}

export function createBudgetRowsFromExtractedLines(lines: ExtractedBudgetLine[]): V3Row[] {
  const base = Date.now();
  return lines.map((line, idx) => ({
    id: `row-${base}-${idx}`,
    cells: {
      name: line.name,
      costCode: line.costCode,
      trade: line.trade,
      location: line.location,
      quantity: line.quantity,
      unit: line.unit,
      budget: line.budget || null,
      revisedBudget: line.budget || null,
      labor: line.labor,
      material: line.material,
      equipment: line.equipment,
      subCost: line.subcontractor,
      others: line.others,
    },
    lineState: 'open' as const,
  }));
}
