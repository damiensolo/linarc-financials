import React from 'react';
import { Check, X } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';

const ApprovalQueuePanel: React.FC = () => {
  const { approvalQueue, approveRequest, rejectRequest } = useProject();
  const pending = approvalQueue.filter((a) => a.status === 'pending');

  if (pending.length === 0) return null;

  return (
    <div className="border-t border-gray-200 p-4 space-y-2">
      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Pending Approvals</h4>
      {pending.map((req) => (
        <div key={req.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <p className="font-medium text-amber-900">
            {req.type === 'pc_value_change' && 'PC Value Change'}
            {req.type === 'line_commit' && `Line Commit: ${req.lineDescription}`}
            {req.type === 'bulk_line_commit' && `Bulk Commit (${req.rowIds?.length ?? 0} lines)`}
          </p>
          <p className="text-xs text-amber-700 mt-1">Awaiting {req.approverName}</p>
          {req.type === 'pc_value_change' && (
            <p className="text-xs text-amber-800 mt-1">
              ${req.currentPcValue?.toLocaleString()} → ${req.proposedPcValue?.toLocaleString()}
            </p>
          )}
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => approveRequest(req.id)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
            >
              <Check size={12} /> Approve
            </button>
            <button
              type="button"
              onClick={() => rejectRequest(req.id, 'Rejected by approver')}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
            >
              <X size={12} /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ApprovalQueuePanel;
