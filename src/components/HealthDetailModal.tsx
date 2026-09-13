import { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { NinjaAvatar } from './NinjaAvatar';
import { computeMoodMap } from '../lib/mood';
import { formatDateJp } from '../lib/format';
import { healthSuggestion, translateReason } from '../lib/i18n';
import { tallyMoods, scoreFromCounts } from '../lib/health';
import { useLabelContext } from '../hooks/LabelContext';
import type { Employee, MoodResult, ShiftEntry } from '../types';

interface HealthDetailModalProps {
  employee: Employee;
  employees: Employee[];
  shifts: ShiftEntry[];
  moodMap: Map<string, MoodResult>;
  monthDates: string[];
  onRemoveShift: (id: string) => Promise<void> | void;
  onClose: () => void;
}

interface SimResult {
  shiftId: string;
  beforeCounts: ReturnType<typeof tallyMoods>;
  afterCounts: ReturnType<typeof tallyMoods>;
}

export function HealthDetailModal({
  employee,
  employees,
  shifts,
  moodMap,
  monthDates,
  onRemoveShift,
  onClose,
}: HealthDetailModalProps) {
  const { locale, employeeName, facilityName, t } = useLabelContext();
  const [sim, setSim] = useState<SimResult | null>(null);
  const [applying, setApplying] = useState(false);

  const monthDateSet = new Set(monthDates);
  const myMonthShifts = shifts.filter((s) => s.employeeId === employee.id && monthDateSet.has(s.date));
  const problemShifts = myMonthShifts
    .filter((s) => {
      const mood = moodMap.get(s.id)?.mood;
      return mood === 'tired' || mood === 'unhappy';
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const myCounts = tallyMoods(
    myMonthShifts.map((s) => s.id),
    moodMap,
  );

  const runSimulation = (shift: ShiftEntry) => {
    const withoutShift = shifts.filter((s) => s.id !== shift.id);
    const simulatedMoodMap = computeMoodMap(employees, withoutShift);
    const remainingIds = myMonthShifts.filter((s) => s.id !== shift.id).map((s) => s.id);
    const afterCounts = tallyMoods(remainingIds, simulatedMoodMap);
    setSim({ shiftId: shift.id, beforeCounts: myCounts, afterCounts });
  };

  const applyRemoval = async () => {
    if (!sim) return;
    setApplying(true);
    try {
      await onRemoveShift(sim.shiftId);
      setSim(null);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="animate-rise flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl border border-gold/30 bg-void-soft p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NinjaAvatar employee={employee} mood="neutral" size="md" />
            <h2 className="font-mincho text-base font-bold text-paper">
              {t('health.detailHeading', { name: employeeName(employee) })}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-paper-dim hover:text-paper">
            <X size={18} />
          </button>
        </div>

        <p className="mb-3 text-xs text-paper-dim">
          {t('health.tiredCount', { n: myCounts.tired })} ・ {t('health.unhappyCount', { n: myCounts.unhappy })}
        </p>

        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-paper">
          <AlertTriangle size={13} className="text-seal-bright" />
          {t('health.problemShiftsHeading')}
        </h3>

        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {problemShifts.map((shift) => {
            const mood = moodMap.get(shift.id);
            const reasonKey = mood?.reasons[0]?.key;
            const suggestion = reasonKey ? healthSuggestion(reasonKey, locale) : '';
            const isSimulatingThis = sim?.shiftId === shift.id;
            return (
              <div key={shift.id} className="rounded-lg border border-seal/30 bg-seal/5 p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-paper">
                    {formatDateJp(shift.date, locale)} ・ {facilityName(shift.facility)} ・ {shift.start}–{shift.end}
                  </span>
                </div>
                {mood && (
                  <p className="mt-1 text-paper-dim">{mood.reasons.map((r) => translateReason(r, locale)).join(' / ')}</p>
                )}
                {suggestion && (
                  <p className="mt-1.5 text-[11px] text-gold">
                    <span className="font-medium">{t('health.suggestionLabel')}: </span>
                    {suggestion}
                  </p>
                )}

                {!isSimulatingThis && (
                  <button
                    type="button"
                    onClick={() => runSimulation(shift)}
                    className="mt-2 rounded-full border border-paper/20 px-2.5 py-1 text-[11px] text-paper-dim transition hover:border-gold hover:text-gold"
                  >
                    {t('health.simulateRemove')}
                  </button>
                )}

                {isSimulatingThis && sim && (
                  <div className="mt-2 rounded-lg border border-gold/40 bg-gold/10 p-2.5">
                    <p className="text-[11px] text-gold">
                      {t('health.simulateResult', {
                        before: sim.beforeCounts.tired + sim.beforeCounts.unhappy,
                        after: sim.afterCounts.tired + sim.afterCounts.unhappy,
                        scoreBefore: scoreFromCounts(sim.beforeCounts) ?? 0,
                        scoreAfter: scoreFromCounts(sim.afterCounts) ?? 0,
                      })}
                    </p>
                    <button
                      type="button"
                      onClick={applyRemoval}
                      disabled={applying}
                      className="mt-2 flex items-center gap-1 rounded-full border border-seal/50 px-2.5 py-1 text-[11px] text-seal-bright transition hover:bg-seal/10 disabled:opacity-50"
                    >
                      <Trash2 size={11} />
                      {t('health.applyRemove')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end border-t border-paper/10 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-paper/20 px-3 py-1.5 text-xs text-paper-dim hover:text-paper"
          >
            {t('health.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
