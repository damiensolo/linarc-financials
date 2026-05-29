import { describe, it, expect } from 'vitest';
import {
  extractLineItems,
  extractContractFields,
  sumLineItems,
} from '../contractLineExtraction';

const DESERT_VISTA_SOV_SNIPPET = `
5. Schedule of Values
Interior demolition and prep (all units)   Lump sum   $16,000.00
Flooring materials & installation   Approx. $4,250 per unit   $34,000.00
Interior paint (walls/ceilings/trim)   Approx. $2,250 per unit   $18,000.00
Kitchen updates (cabinets, tops, sink, misc.)   Approx. $5,250 per unit   $42,000.00
Bathroom updates (vanities, fixtures, tile)   Approx. $4,000 per unit   $32,000.00
Unit lighting & electrical device updates   Approx. $2,000 per unit   $16,000.00
Unit plumbing fixture connections   Approx. $1,750 per unit   $14,000.00
Subtotal – Interiors (8 units)   $172,000.00
Corridor/stairwell drywall repair & paint   $14,000.00
Corridor & exterior lighting upgrades   $10,000.00
Exterior trim repair and targeted paint   $9,000.00
Minor concrete and entry repairs   $5,000.00
Signage and mail area upgrades   $6,000.00
Permits, testing, plan fees   $8,000.00
Subtotal – Building & Site   $52,000.00
Project management, supervision, temp facilities   $32,000.00
Contractor overhead & profit   $40,000.00
Subtotal – GC / OH&P   $72,000.00
Total Contract Sum   $296,000.00
6. Allowances
`;

const DESERT_VISTA_HEADER = `
entered into on May 20, 2026
Property Name: Desert Vista Apartments Property Address: 1902 E. Desert Vista Court
Owner Name: Desert Vista Capital LLC
Company Name: Sonoran Build & Repair LLC
Estimated Construction Start: June 10, 2026
Substantial Completion (all 8 units + common corridors): September 30, 2026
Final Completion (punch and closeout): October 14, 2026
Contract Sum of $296,000.00
`;

describe('contractLineExtraction', () => {
  it('extracts all 15 SOV lines totaling contract sum', () => {
    const items = extractLineItems(DESERT_VISTA_SOV_SNIPPET);
    expect(items).toHaveLength(15);
    expect(sumLineItems(items)).toBe(296000);
  });

  it('extracts contract metadata from desert vista sample text', () => {
    const fields = extractContractFields(DESERT_VISTA_HEADER + DESERT_VISTA_SOV_SNIPPET);
    expect(fields.contractSum).toBe(296000);
    expect(fields.owner).toBe('Desert Vista Capital LLC');
    expect(fields.contractor).toBe('Sonoran Build & Repair LLC');
    expect(fields.projectName).toBe('Desert Vista Apartments');
  });
});
