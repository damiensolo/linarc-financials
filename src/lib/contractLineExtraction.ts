import { V3Row } from '../components/views/spreadsheetV4/types';

export interface ExtractedLineItem {
  name: string;
  value: number;
}

export interface ExtractedContractFields {
  executedDate: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  finalCompletion: Date | null;
  contractSum: number | null;
  owner: string;
  contractor: string;
  projectName: string;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

function parseNaturalDate(raw: string | undefined): Date | null {
  if (!raw) return null;
  const d = new Date(raw.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

function cleanLabel(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s*Page\s+\d+\s+of\s+\d+\s*/gi, ' ')
    .replace(/^(?:Schedule of Values|Interior Unit Work \(8 Units\)|Building & Site Work|General Conditions, Overhead & Profit|Category|Basis|Amount|\d+\.\s*)+\s*/gi, '')
    .replace(/\s*(?:Lump sum|Approx\.\s*\$[\d,]+(?:\.\d{2})?\s*(?:per\s+unit)?)\s*$/i, '')
    .trim();
}

const SKIP_LINE_NAME =
  /^(?:subtotal|total|category|basis|amount|interiors?\s*\(|building\s*&\s*site|gc\s*\/|allowance|payment|retainage|per\s*unit|approx\.?|lump\s*sum)/i;

function shouldSkipLineItem(name: string, value: number): boolean {
  const n = cleanLabel(name);
  if (n.length < 6) return true;
  if (SKIP_LINE_NAME.test(n)) return true;
  if (/total\s+contract\s+sum/i.test(n)) return true;
  if (/^totals?$/i.test(n)) return true;
  if (/release|punch\s*list|closeout|waiver/i.test(n)) return true;
  if (/allowance/i.test(n)) return true;
  if (value >= 100000) return true;
  return false;
}

function descriptionBeforeAmount(block: string, amountIndex: number, prevAmountEnd: number): string {
  const context = block.slice(prevAmountEnd, amountIndex);
  return cleanLabel(
    context.replace(/\s*(?:Lump\s+sum|Approx\.\s*\$[\d,]+(?:\.\d{2})?\s*(?:per\s+unit)?)\s*$/i, '').trim()
  );
}

function parseAmountRows(block: string): ExtractedLineItem[] {
  const items: ExtractedLineItem[] = [];
  const amounts = [...block.matchAll(/\$\s*([\d,]+\.\d{2})/g)];

  for (let i = 0; i < amounts.length; i++) {
    const value = parseAmount(amounts[i][1]);
    if (!value || value < 1000) continue;

    const amountIndex = amounts[i].index ?? 0;
    const prevAmountEnd =
      i > 0 ? (amounts[i - 1].index ?? 0) + amounts[i - 1][0].length : 0;
    const context = block.slice(prevAmountEnd, amountIndex);

    if (value < 10000 && /\bApprox\.\s*$/i.test(context.trim())) continue;

    const name = descriptionBeforeAmount(block, amountIndex, prevAmountEnd);
    if (shouldSkipLineItem(name, value)) continue;

    items.push({ name: name.slice(0, 120), value });
  }

  return items;
}

/**
 * Parse Schedule of Values tables (Arizona sample prime contract format).
 */
function extractScheduleOfValuesItems(text: string): ExtractedLineItem[] {
  const start = text.search(/(?:5\.\s*)?Schedule\s+of\s+Values/i);
  if (start === -1) return [];

  const endCandidates = [
    text.search(/\b6\.\s*Allowances\b/i),
    text.search(/\bAllowances\b[\s\S]{0,40}Contract\s+Sum\s+includes/i),
    text.search(/\b7\.\s*Payment\s+Schedule/i),
  ].filter((i) => i > start);

  const end = endCandidates.length > 0 ? Math.min(...endCandidates) : text.length;
  const section = text.slice(start, end);

  const blocks = [
    section.match(/Interior demolition[\s\S]*?Subtotal\s*[–-]\s*Interiors/i)?.[0],
    section.match(/Corridor\/stairwell[\s\S]*?Subtotal\s*[–-]\s*Building\s*&\s*Site/i)?.[0],
    section.match(/Project management[\s\S]*?Subtotal\s*[–-]\s*GC/i)?.[0],
  ].filter((b): b is string => Boolean(b));

  const items = blocks.flatMap(parseAmountRows);
  return deduplicateItems(items);
}

/**
 * Extract contract metadata from uploaded contract text.
 */
export function extractContractFields(text: string): ExtractedContractFields {
  const t = text.replace(/\s+/g, ' ');

  const executedMatch =
    t.match(/entered\s+into\s+on\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
    t.match(/effective\s+date[^:]*:\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i);

  const startMatch = t.match(
    /(?:estimated\s+)?construction\s+start[^:]*:?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i
  );

  const endMatch = t.match(
    /substantial\s+completion[^:]*:?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i
  );

  const finalMatch = t.match(
    /final\s+completion[^:]*:?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i
  );

  const sumMatch =
    t.match(/total\s+contract\s+sum[^$\d]*\$\s*([\d,]+(?:\.\d{2})?)/i) ||
    t.match(/contract\s+sum\s+of\s+\$\s*([\d,]+(?:\.\d{2})?)/i) ||
    t.match(/fixed\s+contract\s+sum[^$\d]*\$\s*([\d,]+(?:\.\d{2})?)/i);

  const ownerMatch =
    t.match(/owner[\s\S]{0,80}?name:\s*([A-Za-z][A-Za-z0-9 &.,'-]+?(?:LLC|Inc\.?|Corp\.?|Ltd\.?))/i) ||
    t.match(/\bowner\b[^:]*:\s*([A-Za-z][A-Za-z0-9 &.,'-]+?(?:LLC|Inc\.?|Corp\.?|Ltd\.?))/i);

  const contractorMatch =
    t.match(
      /(?:company\s+name|contractor)[\s\S]{0,80}?:\s*([A-Za-z][A-Za-z0-9 &.,'-]+?(?:LLC|Inc\.?|Corp\.?|Ltd\.?))/i
    ) || t.match(/\bcontractor\b[^:]*:\s*([A-Za-z][A-Za-z0-9 &.,'-]+?(?:LLC|Inc\.?|Corp\.?|Ltd\.?))/i);

  const projectMatch =
    t.match(/property\s+name:\s*([A-Za-z][A-Za-z0-9 &.,'-]+?)(?:\s+property\s+address|\s+building\s+type|$)/i) ||
    t.match(/project\s*(?:name)?[^:]*:\s*([A-Za-z][A-Za-z0-9 &.,'-]+)/i);

  return {
    executedDate: parseNaturalDate(executedMatch?.[1]),
    startDate: parseNaturalDate(startMatch?.[1]),
    endDate: parseNaturalDate(endMatch?.[1]),
    finalCompletion: parseNaturalDate(finalMatch?.[1]),
    contractSum: sumMatch ? parseAmount(sumMatch[1]) : null,
    owner: ownerMatch?.[1]?.trim() ?? '',
    contractor: contractorMatch?.[1]?.trim() ?? '',
    projectName: projectMatch?.[1]?.trim() ?? '',
  };
}

/**
 * Extract contract line items and amounts from contract text.
 */
export function extractLineItems(text: string): ExtractedLineItem[] {
  const sovItems = extractScheduleOfValuesItems(text);
  if (sovItems.length >= 5) {
    return sovItems;
  }

  return extractLineItemsFallback(text);
}

function extractLineItemsFallback(text: string): ExtractedLineItem[] {
  const items: ExtractedLineItem[] = [];
  const lines = text.split(/[\n\r]+/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const amounts = [...trimmed.matchAll(/\$\s*([\d,]+(?:\.\d{2})?)/g)];
    if (amounts.length === 0) continue;

    const lastAmount = parseAmount(amounts[amounts.length - 1][1]);
    if (!lastAmount || lastAmount < 1000) continue;

    const desc = trimmed.replace(/\$\s*[\d,]+(?:\.\d{2})?/g, '').replace(/\s+/g, ' ').trim();
    if (desc.length < 8 || shouldSkipLineItem(desc, lastAmount)) continue;

    items.push({ name: cleanLabel(desc).slice(0, 120), value: lastAmount });
  }

  return deduplicateItems(items);
}

function deduplicateItems(items: ExtractedLineItem[]): ExtractedLineItem[] {
  const seen = new Map<string, ExtractedLineItem>();

  for (const item of items) {
    const key = item.name.toUpperCase();
    if (!seen.has(key)) {
      seen.set(key, item);
    }
  }

  return Array.from(seen.values()).sort((a, b) => b.value - a.value);
}

export function sumLineItems(items: ExtractedLineItem[]): number {
  return items.reduce((sum, item) => sum + item.value, 0);
}

/**
 * Convert extracted line items to V3Row format for the prime contract sheet.
 * Prime Contract lines carry no cost code — only a description and value.
 */
export function createPrimeContractRowsFromLineItems(items: ExtractedLineItem[]): V3Row[] {
  return items.map((item, index) => ({
    id: `contract-line-${index}`,
    cells: {
      name: item.name,
      contractValue: item.value,
    },
  }));
}
