import { V3Row } from '../components/views/spreadsheetV4/types';

// Common construction contract line item patterns
const COMMON_LINE_ITEMS = [
  'MOBILIZATION',
  'DEMOBILIZATION',
  'SHOP DRAWINGS',
  'SUBMITTAL',
  'TRAILER',
  'TEMP',
  'WATER',
  'WARRANTY',
  'MANUALS',
  'ORIENTATIONS',
  'BOND',
  'OCIP',
  'BASEMENT',
  'UNDERGROUND',
  'PIPING',
  'MATERIAL',
  'LABOR',
  'CONCRETE',
  'STEEL',
  'EXCAVATION',
  'FOUNDATION',
  'FRAMING',
  'ROOFING',
  'MASONRY',
  'MECHANICAL',
  'ELECTRICAL',
  'PLUMBING',
  'HVAC',
];

interface ExtractedLineItem {
  name: string;
  value: number;
}

/**
 * Extract contract line items and amounts from contract text.
 * Returns an array of {name, value} pairs.
 */
export function extractLineItems(text: string): ExtractedLineItem[] {
  const items: ExtractedLineItem[] = [];

  // Normalize: collapse multiple spaces, handle various line breaks
  const normalized = text.replace(/\s+/g, ' ').toUpperCase();

  // Strategy 1: Look for currency amounts followed by descriptive text
  // Pattern: "TEXT_DESCRIPTION $amount" or "$amount TEXT_DESCRIPTION"
  const currencyPattern = /(\$\s*[\d,]+(?:\.\d{2})?)\s+([A-Z\s&\-.,()]+?)(?=\$|\d{5,}|$)/g;
  let match;

  while ((match = currencyPattern.exec(normalized)) !== null) {
    const amount = extractAmount(match[1]);
    const description = match[2].trim().substring(0, 80);

    if (amount && amount > 100 && description.length > 3) {
      items.push({
        name: description,
        value: amount,
      });
    }
  }

  // Strategy 2: If currency pattern didn't find much, fall back to keyword matching
  if (items.length < 3) {
    const lines = text.split(/[\n\r]+/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Try to match common line item names
      for (const itemName of COMMON_LINE_ITEMS) {
        if (line.toUpperCase().includes(itemName)) {
          // Look for currency amount in same line or next line
          let amount = extractAmount(line);

          if (!amount && i + 1 < lines.length) {
            amount = extractAmount(lines[i + 1]);
          }

          if (amount && amount > 100) {
            items.push({
              name: line.substring(0, 80),
              value: amount,
            });
            break;
          }
        }
      }
    }
  }

  // Deduplicate and remove very similar items
  const result = deduplicateItems(items);
  console.log(`[ContractExtraction] Found ${result.length} line items:`, result);
  return result;
}

/**
 * Extract currency amount from a string.
 * Handles formats like: "$123,456.78", "$123456", etc.
 */
function extractAmount(text: string): number | null {
  // Match currency patterns: $123,456.78 or $123456
  const match = text.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
  if (match) {
    const cleaned = match[1].replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Remove duplicate/similar line items, keeping the one with highest value.
 */
function deduplicateItems(items: ExtractedLineItem[]): ExtractedLineItem[] {
  const seen = new Map<string, ExtractedLineItem>();

  for (const item of items) {
    const key = item.name.toUpperCase();
    const existing = seen.get(key);

    if (!existing || item.value > existing.value) {
      seen.set(key, item);
    }
  }

  return Array.from(seen.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 20); // Limit to top 20 items
}

/**
 * Convert extracted line items to V3Row format for the prime contract sheet.
 */
export function createPrimeContractRowsFromLineItems(items: ExtractedLineItem[]): V3Row[] {
  return items.map((item, index) => ({
    id: `contract-line-${index}`,
    cells: {
      name: item.name,
      costCode: `CL-${String(index + 1).padStart(3, '0')}`,
      contractValue: item.value,
    },
  }));
}

/** @deprecated Use createPrimeContractRowsFromLineItems */
export function createBudgetRowsFromLineItems(items: ExtractedLineItem[]): V3Row[] {
  return createPrimeContractRowsFromLineItems(items);
}
