import { AlertTriangle, Award, Home, Repeat, X } from 'lucide-react';
import { FACILITY_COLOR } from '../data/facilities';
import { formatDateJp } from '../lib/format';
import { useLabelContext } from '../hooks/LabelContext';
import type { AutoAssignCandidate, AutoAssignResult } from '../lib/autoAssign';
import type { Employee } from '../types';

interface AutoAssignPreviewModalProps {
  result: AutoAssignResult;
  employees: Employee[];
  applying: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AutoAssignPreviewModal({ result, employees, applying, onConfirm, onCancel }: AutoAssignPreviewModalProps) {
  const { locale, employeeName, facilityName, t } = useLabelContext();
  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  const grouped = new Map<string, AutoAssignCandidate[]>();
  for (const c of result.created) {
    const list = grouped.get(c.date) ?? [];
    list.push(c);
    grouped.set(c.date, list);
  }
  const dates = [...grouped.keys()].sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onCancel}>
      <div
        className="animate-rise flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-gold/30 bg-void-soft p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mincho text-base font-bold text-paper">{t('autoAssign.previewHeading')}</h2>
          <button type="button" onClick={onCancel} className="text-paper-dim hover:text-paper">
            <X size={18} />
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-jade/40 bg-jade/10 px-3 py-1 text-jade">
            {t('autoAssign.candidateCount', { n: result.created.length })}
          </span>
          {result.shortfalls.length > 0 && (
            <span className="rounded-full border border-seal/50 bg-seal/10 px-3 py-1 text-seal-bright">
              {t('autoAssign.unresolvedCount', { n: result.shortfalls.length })}
            </span>
          )}
        </div>

        {result.created.length === 0 ? (
          <p className="rounded-lg border border-dashed border-paper/15 py-8 text-center text-sm text-paper-dim">
            {t('autoAssign.noCandidates')}
          </p>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {dates.map((date) => (
              <div key={date}>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-paper-dim/70">
                  {formatDateJp(date, locale)}
                </p>
                <div className="space-y-1.5">
                  {(grouped.get(date) ?? []).map((c) => {
                    const emp = employeeMap.get(c.employeeId);
                    if (!emp) return null;
                    return (
                      <div
                        key={`${c.date}_${c.employeeId}`}
                        className={`rounded-lg border px-3 py-2 text-xs ${
                          c.isRequestedOffWeekday
                            ? 'border-seal/40 bg-seal/5'
                            : c.isMainFacility
                              ? 'border-jade/30 bg-jade/5'
                              : 'border-gold/30 bg-gold/5'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-1.5 font-medium text-paper">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: FACILITY_COLOR[c.facility] }} />
                            <span className="truncate">{employeeName(emp)}</span>
                            <span className="shrink-0 text-paper-dim">{facilityName(c.facility)}</span>
                          </span>
                          <span className="shrink-0 text-paper-dim">
                            {c.start}–{c.end}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <span
                            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                              c.isMainFacility ? 'bg-jade/15 text-jade' : 'bg-gold/15 text-gold'
                            }`}
                          >
                            <Home size={10} />
                            {c.isMainFacility ? t('autoAssign.homeFacility') : t('autoAssign.helpFacility')}
                          </span>
                          {c.isRequestedOffWeekday && (
                            <span className="flex items-center gap-1 rounded-full bg-seal/15 px-2 py-0.5 text-[10px] text-seal-bright">
                              <AlertTriangle size={10} />
                              {t('autoAssign.forcedOffDay')}
                            </span>
                          )}
                          <span className="flex items-center gap-1 rounded-full bg-paper/10 px-2 py-0.5 text-[10px] text-paper-dim">
                            <Repeat size={10} />
                            {t('autoAssign.consecutiveDays', { n: c.consecutiveDaysAfter })}
                          </span>
                          {c.requiresQualification && (
                            <span className="flex items-center gap-1 rounded-full bg-jade/15 px-2 py-0.5 text-[10px] text-jade">
                              <Award size={10} />
                              {t('autoAssign.qualified')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-paper/10 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-paper/20 px-3 py-1.5 text-xs text-paper-dim hover:text-paper"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={applying || result.created.length === 0}
            className="rounded-md border border-gold bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold transition hover:bg-gold/20 disabled:opacity-50"
          >
            {applying ? t('autoAssign.applying') : t('autoAssign.apply')}
          </button>
        </div>
      </div>
    </div>
  );
}
