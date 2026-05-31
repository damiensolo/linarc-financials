import React, { useMemo } from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { getLineState, isSovMappingConfirmed } from '../../../lib/financialWorkflow';
import { computeScheduleCoverage } from '../../../lib/scheduleLinking';
import SOVMappingGrid from './SOVMappingGrid';
import BudgetScheduleLinker from './BudgetScheduleLinker';

const ContinuousOpsWorkspace: React.FC = () => {
  const {
    budgetRows,
    opsActiveTab,
    setOpsActiveTab,
    sovMappings,
    budgetScheduleLinks,
    navigateToSetupStep,
    publishReadiness,
    canPublishSOV,
  } = useProject();

  const committedRows = budgetRows.filter((r) => getLineState(r) === 'locked');
  const openRows = budgetRows.filter((r) => getLineState(r) !== 'locked');

  const unconfirmedSov = committedRows.filter((r) => {
    const mapping = sovMappings.find((m) => m.rowId === r.id);
    return !mapping || !isSovMappingConfirmed(mapping);
  }).length;

  const scheduleCoverage = useMemo(
    () => computeScheduleCoverage(committedRows, budgetScheduleLinks),
    [committedRows, budgetScheduleLinks]
  );
  const unresolvedSchedule = scheduleCoverage.unlinkedRowIds.length;

  const publishRemaining = publishReadiness.filter((c) => !c.met).length;

  const showSovAlerts = opsActiveTab === 'sov' && (unconfirmedSov > 0 || openRows.length > 0);
  const showScheduleAlert = opsActiveTab === 'schedule' && unresolvedSchedule > 0;
  const hasTopAlerts = showSovAlerts || showScheduleAlert;

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full bg-white">
      <div
        className={`flex-shrink-0 border-b border-gray-200 ${
          hasTopAlerts ? 'bg-blue-50' : 'bg-gray-50'
        }`}
      >
        <div className="flex items-start justify-between gap-4 px-4 py-3">
          <div className="flex-1 min-w-0">
            {hasTopAlerts && (
              <div className="flex items-start gap-2 text-sm text-blue-900">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {showSovAlerts && (
                    <>
                      {unconfirmedSov > 0 && (
                        <p>
                          {unconfirmedSov} committed line(s) have draft SOV entries awaiting
                          confirmation.
                        </p>
                      )}
                      {openRows.length > 0 && (
                        <p>
                          {openRows.length} open/pending budget line(s) — commit in Step 3 to add
                          SOV drafts.
                        </p>
                      )}
                    </>
                  )}
                  {showScheduleAlert && (
                    <p>{unresolvedSchedule} committed line(s) not yet allocated to the schedule.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => navigateToSetupStep(5)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Publish SOV
              <ChevronRight size={16} />
            </button>
            <span
              className={`text-xs font-medium ${
                canPublishSOV ? 'text-green-700' : 'text-amber-700'
              }`}
            >
              {canPublishSOV
                ? 'Ready to publish'
                : `${publishRemaining} check${publishRemaining === 1 ? '' : 's'} remaining`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 px-4 flex-shrink-0 bg-white">
        <button
          type="button"
          onClick={() => setOpsActiveTab('sov')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            opsActiveTab === 'sov'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600'
          }`}
        >
          SOV Mapping
        </button>
        <button
          type="button"
          onClick={() => setOpsActiveTab('schedule')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            opsActiveTab === 'schedule'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600'
          }`}
        >
          Schedule Linking
        </button>
      </div>

      {opsActiveTab === 'sov' ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <SOVMappingGrid />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden">
          <BudgetScheduleLinker />
        </div>
      )}
    </div>
  );
};

export default ContinuousOpsWorkspace;
