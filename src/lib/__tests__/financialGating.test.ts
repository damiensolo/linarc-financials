import { describe, it, expect } from 'vitest';
import { hasPcValue, countLinesByState, isBudgetFullyLocked } from '../financialWorkflow';
import {
  computePublishReadiness,
  allPublishChecksMet,
  computeSetupMilestoneReadiness,
  isPrimeContractReadinessComplete,
} from '../financialGating';
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

  it('countLinesByState tracks open, locked, pending, and committed lines', () => {
    const rows: V3Row[] = [
      { id: '1', cells: {}, lineState: 'open' },
      { id: '2', cells: {}, lineState: 'locked' },
      { id: '3', cells: {}, lineState: 'pending_approval' },
      { id: '4', cells: {}, lineState: 'committed' },
    ];
    expect(countLinesByState(rows)).toEqual({
      total: 4,
      open: 1,
      locked: 1,
      pending: 1,
      committed: 1,
    });
    // An open line remains → not fully locked into the SOV.
    expect(isBudgetFullyLocked(rows)).toBe(false);
  });
});

describe('setup milestone readiness', () => {
  const pcData: ContractData = {
    executedDate: null,
    startDate: null,
    endDate: null,
    finalCompletion: null,
    contractSum: 500000,
    owner: 'Owner',
    contractor: 'GC',
    projectName: 'Test',
    fileName: 'manual',
    uploadedAt: new Date().toISOString(),
    extractionMethod: 'manual',
  };

  it('does not mark milestones complete on step 1 (Prime Contract) choose phase despite persisted data', () => {
    const readiness = computeSetupMilestoneReadiness(1, pcData, false, 'choose', 1, true);
    expect(readiness.primeContractValueMet).toBe(false);
    expect(readiness.budgetLinesMet).toBe(false);
    expect(readiness.continuousOpsMet).toBe(false);
  });

  it('marks prime contract complete in step 1 review when value is present', () => {
    expect(isPrimeContractReadinessComplete(1, pcData, false, 'review')).toBe(true);
  });

  it('marks prime contract complete when locked on step 1', () => {
    expect(isPrimeContractReadinessComplete(1, pcData, true, 'choose')).toBe(true);
  });

  it('keeps prime contract incomplete on step 1 choose phase, complete once past it', () => {
    expect(isPrimeContractReadinessComplete(1, pcData, false, 'choose')).toBe(false);
    expect(isPrimeContractReadinessComplete(2, pcData, false, 'choose')).toBe(true);
  });
});

describe('financialGating publish readiness', () => {
  it('blocks publish when checks unmet', () => {
    const rows: V3Row[] = [{ id: '1', cells: { name: 'Line' }, lineState: 'locked' }];
    const checks = computePublishReadiness(rows, [], [], []);
    expect(allPublishChecksMet(checks)).toBe(false);
  });
});
