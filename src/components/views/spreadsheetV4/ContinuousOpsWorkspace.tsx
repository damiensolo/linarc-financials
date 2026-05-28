import React, { useMemo } from 'react';
import { Link2, AlertCircle } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { getLineState, getBudgetLineAmount } from '../../../lib/financialWorkflow';

const ContinuousOpsWorkspace: React.FC = () => {
  const {
    budgetRows,
    opsActiveTab,
    setOpsActiveTab,
    sovMappings,
    wbsLinks,
    addSovMapping,
    addWbsLink,
    removeSovMapping,
    removeWbsLink,
    navigateToSetupStep,
    publishReadiness,
    canPublishSOV,
  } = useProject();

  const committedRows = budgetRows.filter((r) => getLineState(r) === 'locked');
  const openRows = budgetRows.filter((r) => getLineState(r) !== 'locked');

  const unmappedSov = committedRows.filter((r) => !sovMappings.some((m) => m.rowId === r.id)).length;
  const unlinkedWbs = committedRows.filter((r) => !wbsLinks.some((l) => l.rowId === r.id)).length;

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

  const mapAllSov = () => {
    committedRows.forEach((row, idx) => {
      if (sovMappings.some((m) => m.rowId === row.id)) return;
      const amount = getBudgetLineAmount(row);
      addSovMapping({
        rowId: row.id,
        sovLineNumber: idx + 1,
        sovDescription: String(row.cells['name'] ?? ''),
        amount,
      });
    });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      <div className="flex gap-2 border-b border-gray-200 px-4">
        <button
          type="button"
          onClick={() => setOpsActiveTab('sov')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            opsActiveTab === 'sov' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          SOV Mapping
        </button>
        <button
          type="button"
          onClick={() => setOpsActiveTab('schedule')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            opsActiveTab === 'schedule' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          Schedule Linking
        </button>
      </div>

      {(unmappedSov > 0 || unlinkedWbs > 0) && (
        <div className="mx-4 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-900 flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            {unmappedSov > 0 && <p>{unmappedSov} committed line(s) not yet mapped to SOV.</p>}
            {unlinkedWbs > 0 && <p>{unlinkedWbs} committed line(s) have no WBS link.</p>}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {opsActiveTab === 'sov' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600">
                Map committed budget lines to owner-facing SOV entries.
              </p>
              {unmappedSov > 0 && (
                <button
                  type="button"
                  onClick={mapAllSov}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
                >
                  Map all ({unmappedSov})
                </button>
              )}
            </div>
            {committedRows.map((row, idx) => {
              const mapping = sovMappings.find((m) => m.rowId === row.id);
              const amount = getBudgetLineAmount(row);
              return (
                <div key={row.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{String(row.cells['name'] ?? 'Line')}</p>
                    <p className="text-xs text-gray-500">{row.cells['costCode'] ?? 'No cost code'} · ${amount.toLocaleString()}</p>
                  </div>
                  {mapping ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">SOV #{mapping.sovLineNumber}</span>
                      <button type="button" onClick={() => removeSovMapping(row.id)} className="text-xs text-red-600">Remove</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        addSovMapping({
                          rowId: row.id,
                          sovLineNumber: idx + 1,
                          sovDescription: String(row.cells['name'] ?? ''),
                          amount,
                        })
                      }
                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      Map to SOV
                    </button>
                  )}
                </div>
              );
            })}
            {openRows.length > 0 && (
              <p className="text-xs text-gray-400 mt-4">{openRows.length} open/pending line(s) dimmed — commit to enable.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3 gap-3">
              <p className="text-sm text-gray-600">
                Link committed lines to WBS activities. Cost code matches are suggested automatically.
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
                <div key={row.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{String(row.cells['name'] ?? 'Line')}</p>
                    <p className="text-xs text-gray-500">Cost code: {costCode || '—'}</p>
                    {suggestion && !link && (
                      <p className="text-xs text-blue-600 mt-1">Suggested: {suggestion.name} ({suggestion.costCode})</p>
                    )}
                  </div>
                  {link ? (
                    <div className="flex items-center gap-2">
                      <Link2 size={14} className="text-green-600" />
                      <span className="text-xs text-green-800">{link.wbsActivityName}</span>
                      <button type="button" onClick={() => removeWbsLink(row.id)} className="text-xs text-red-600">Unlink</button>
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
        )}
      </div>

      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigateToSetupStep(5)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Open Step 5 — Publish SOV
        </button>
        <span className={`text-xs font-medium ${canPublishSOV ? 'text-green-700' : 'text-amber-700'}`}>
          {canPublishSOV ? 'Ready to publish' : `${publishReadiness.filter((c) => !c.met).length} checks remaining`}
        </span>
      </div>
    </div>
  );
};

export default ContinuousOpsWorkspace;
