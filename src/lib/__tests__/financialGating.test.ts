import { describe, it, expect } from 'vitest';
import { hasPcValue, countLinesByState, isBudgetFullyLocked } from '../financialWorkflow';
import { computePublishReadiness, allPublishChecksMet } from '../financialGating';
import type { ContractData } from '../../types';
import type { V3Row } from '../../components/views/spreadsheetV4/types';

describe('financialWorkflow', () => {
  it('hasPcValue returns true when contract sum is set', () => {
    const data: ContractData = {
      executedDate: null,
      startDate: null,
      endDate: null,
      finalCompletion: null,
      contractSum: 100000,
      owner: 'Owner',
      contractor: 'GC',
      projectName: 'Test',
      fileName: 'manual',
      uploadedAt: new Date().toISOString(),
      extractionMethod: 'manual',
    };
    expect(hasPcValue(data)).toBe(true);
    expect(hasPcValue(null)).toBe(false);
  });

  it('countLinesByState tracks open and locked lines', () => {
    const rows: V3Row[] = [
      { id: '1', cells: {}, lineState: 'open' },
      { id: '2', cells: {}, lineState: 'locked' },
      { id: '3', cells: {}, lineState: 'pending_approval' },
    ];
    expect(countLinesByState(rows)).toEqual({ total: 3, open: 1, pending: 1, locked: 1 });
    expect(isBudgetFullyLocked(rows)).toBe(false);
  });
});

describe('financialGating publish readiness', () => {
  it('blocks publish when checks unmet', () => {
    const rows: V3Row[] = [{ id: '1', cells: { name: 'Line' }, lineState: 'locked' }];
    const checks = computePublishReadiness(rows, [], [], []);
    expect(allPublishChecksMet(checks)).toBe(false);
  });
});
