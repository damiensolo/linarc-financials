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

  const config = {
    defaultRetainage: 10,
    defaultOverhead: 5,
    billingCutoffDay: 1,
    allowMultiplePayApps: false,
    perLineApprovalEnabled: false,
    approvalRouting: { roles: ['gc'] as const, requireAll: false },
    approvalWorkflowId: null,
    costCodeEnforcementConfirmed: true,
  };

  it('does not mark milestones complete on step 1 despite persisted data', () => {
    const readiness = computeSetupMilestoneReadiness(1, config, pcData, false, 'choose', 1, true);
    expect(readiness.financialConfigMet).toBe(false);
    expect(readiness.primeContractValueMet).toBe(false);
    expect(readiness.budgetLinesMet).toBe(false);
    expect(readiness.continuousOpsMet).toBe(false);
  });

  it('marks prime contract complete in step 2 review when value is present', () => {
    expect(isPrimeContractReadinessComplete(2, pcData, false, 'review')).toBe(true);
  });

  it('marks prime contract complete when locked on step 2', () => {
    expect(isPrimeContractReadinessComplete(2, pcData, true, 'choose')).toBe(true);
  });

  it('keeps prime contract incomplete on step 2 choose phase', () => {
    expect(isPrimeContractReadinessComplete(1, pcData, false, 'choose')).toBe(false);
    expect(isPrimeContractReadinessComplete(2, pcData, false, 'choose')).toBe(false);
    expect(isPrimeContractReadinessComplete(3, pcData, false, 'choose')).toBe(true);
  });
});

describe('financialGating publish readiness', () => {
  it('blocks publish when checks unmet', () => {
    const rows: V3Row[] = [{ id: '1', cells: { name: 'Line' }, lineState: 'locked' }];
    const checks = computePublishReadiness(rows, [], [], []);
    expect(allPublishChecksMet(checks)).toBe(false);
  });
});
