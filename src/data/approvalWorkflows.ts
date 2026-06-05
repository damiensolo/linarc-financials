/**
 * Preconfigured approval workflows sourced from the platform's workflow engine.
 * Dummy data for the prototype — selecting one drives the per-line approval routing.
 * Each workflow is an ordered chain of approver roles.
 */
export interface ApprovalWorkflow {
  id: string;
  steps: string[];
}

export const APPROVAL_WORKFLOWS: ApprovalWorkflow[] = [
  { id: 'pm-cc-fm', steps: ['Project Manager', 'Cost Controller', 'Finance Manager'] },
  { id: 'sm-pa-controller', steps: ['Site Manager', 'Project Accountant', 'Controller'] },
  { id: 'sub-super-pm', steps: ['Subcontractor', 'Superintendent', 'Project Manager'] },
  { id: 'pm-fm-cfo', steps: ['Project Manager', 'Finance Manager', 'CFO'] },
];

export const approvalWorkflowLabel = (wf: ApprovalWorkflow): string => wf.steps.join(' → ');
