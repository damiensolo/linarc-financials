import React, { useMemo } from 'react';
import { Link2, AlertCircle, ChevronRight } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { getLineState, isSovMappingConfirmed } from '../../../lib/financialWorkflow';
import SOVMappingGrid from './SOVMappingGrid';

const ContinuousOpsWorkspace: React.FC = () => {
  const {
    budgetRows,
    opsActiveTab,
    setOpsActiveTab,
    sovMappings,
    wbsLinks,
    addWbsLink,
    removeWbsLink,
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
  const unlinkedWbs = committedRows.filter((r) => !wbsLinks.some((l) => l.rowId === r.id)).length;

  const publishRemaining = publishReadiness.filter((c) => !c.met).length;

  const showSovAlerts = opsActiveTab === 'sov' && (unconfirmedSov > 0 || openRows.length > 0);
  const showScheduleAlert = opsActiveTab === 'schedule' && unlinkedWbs > 0;
  const hasTopAlerts = showSovAlerts || showScheduleAlert;

  const scheduleActivities = useMemo(
    () => [
      { id: 'wbs-101', name: 'Site Mobilization', costCode: '01-100' },
      { id: 'wbs-102', name: 'Excavation & Grading', costCode: '02-100' },
      { id: 'wbs-103', name: 'Concrete Foundations', costCode: '03-300' },
      { id: 'wbs-104', name: 'Structural Steel', costCode: '05-500' },
      { id: 'wbs-105', name: 'MEP Rough-In', costCode: '15-100' },
    ],
    []
  );

  const suggestWbs = (costCode: string) =>
    scheduleActivities.find((a) => a.costCode === costCode);

  const linkAllWbs = () => {
    committedRows.forEach((row) => {
      if (wbsLinks.some((l) => l.rowId === row.id)) return;
      const costCode = String(row.cells['costCode'] ?? '');
      const act = suggestWbs(costCode) ?? scheduleActivities[0];
      addWbsLink({
        rowId: row.id,
        wbsActivityId: act.id,
        wbsActivityName: act.name,
        costCode: act.costCode,
      });
    });
  };

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
                    <p>{unlinkedWbs} committed line(s) have no WBS link.</p>
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
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3 gap-3">
              <p className="text-sm text-gray-600">
                Link committed lines to WBS activities. Cost code matches are suggested
                automatically.
              </p>
              {unlinkedWbs > 0 && (
                <button
                  type="button"
                  onClick={linkAllWbs}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap flex-shrink-0"
                >
                  Link all ({unlinkedWbs})
                </button>
              )}
            </div>
            {committedRows.map((row) => {
              const link = wbsLinks.find((l) => l.rowId === row.id);
              const costCode = String(row.cells['costCode'] ?? '');
              const suggestion = suggestWbs(costCode);
              return (
                <div
                  key={row.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {String(row.cells['name'] ?? 'Line')}
                    </p>
                    <p className="text-xs text-gray-500">Cost code: {costCode || '—'}</p>
                    {suggestion && !link && (
                      <p className="text-xs text-blue-600 mt-1">
                        Suggested: {suggestion.name} ({suggestion.costCode})
                      </p>
                    )}
                  </div>
                  {link ? (
                    <div className="flex items-center gap-2">
                      <Link2 size={14} className="text-green-600" />
                      <span className="text-xs text-green-800">{link.wbsActivityName}</span>
                      <button
                        type="button"
                        onClick={() => removeWbsLink(row.id)}
                        className="text-xs text-red-600"
                      >
                        Unlink
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const act = suggestion ?? scheduleActivities[0];
                        addWbsLink({
                          rowId: row.id,
                          wbsActivityId: act.id,
                          wbsActivityName: act.name,
                          costCode: act.costCode,
                        });
                      }}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      {suggestion ? 'Accept Suggestion' : 'Link WBS'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContinuousOpsWorkspace;
