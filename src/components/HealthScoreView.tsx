import { useState } from 'react';
import { ChevronLeft, ChevronRight, HeartPulse } from 'lucide-react';
import { NinjaAvatar } from './NinjaAvatar';
import { HealthDetailModal } from './HealthDetailModal';
import { formatMonthLabel } from '../lib/i18n';
import { tallyMoods, scoreFromCounts, healthLabelForScore, worstMood } from '../lib/health';
import {
  CALENDAR_END_MONTH,
  CALENDAR_END_YEAR,
  CALENDAR_START_MONTH,
  CALENDAR_START_YEAR,
  addMonths,
  datesInMonth,
} from '../lib/monthGrid';
import { useLabelContext } from '../hooks/LabelContext';
import type { Employee, MoodResult, ShiftEntry } from '../types';

interface HealthScoreViewProps {
  employees: Employee[];
  shifts: ShiftEntry[];
  moodMap: Map<string, MoodResult>;
  onRemoveShift: (id: string) => Promise<void> | void;
}

const LABEL_STYLE: Record<'good' | 'ok' | 'warning', string> = {
  good: 'text-jade border-jade/50 bg-jade/10',
  ok: 'text-gold border-gold/50 bg-gold/10',
  warning: 'text-seal-bright border-seal/50 bg-seal/10',
};

export function HealthScoreView({ employees, shifts, moodMap, onRemoveShift }: HealthScoreViewProps) {
  const { locale, employeeName, t } = useLabelContext();
  const [view, setView] = useState({ year: CALENDAR_START_YEAR, month: CALENDAR_START_MONTH });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const dates = datesInMonth(view.year, view.month);
  const dateSet = new Set(dates);
  const monthShifts = shifts.filter((s) => dateSet.has(s.date));

  const goMonth = (delta: number) => setView((v) => addMonths(v.year, v.month, delta));

  const shiftsByEmployee = new Map<string, ShiftEntry[]>();
  for (const s of monthShifts) {
    const list = shiftsByEmployee.get(s.employeeId) ?? [];
    list.push(s);
    shiftsByEmployee.set(s.employeeId, list);
  }

  const perEmployee = employees.map((emp) => {
    const empShifts = shiftsByEmployee.get(emp.id) ?? [];
    const counts = tallyMoods(
      empShifts.map((s) => s.id),
      moodMap,
    );
    return { employee: emp, counts, score: scoreFromCounts(counts) };
  });

  const teamCounts = tallyMoods(
    monthShifts.map((s) => s.id),
    moodMap,
  );
  const teamScore = scoreFromCounts(teamCounts);

  const atRisk = perEmployee
    .filter((e) => e.counts.tired + e.counts.unhappy > 0)
    .sort((a, b) => b.counts.unhappy - a.counts.unhappy || b.counts.tired - a.counts.tired);

  const selectedEmployee = selectedEmployeeId ? employees.find((e) => e.id === selectedEmployeeId) : undefined;

  const teamLabel = teamScore === null ? 'ok' : healthLabelForScore(teamScore);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => goMonth(-1)}
          disabled={view.year === CALENDAR_START_YEAR && view.month === CALENDAR_START_MONTH}
          className="rounded-full border border-paper/20 p-1.5 text-paper-dim transition hover:border-gold hover:text-gold disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="font-mincho text-base font-bold text-paper">{formatMonthLabel(view.year, view.month, locale)}</p>
        <button
          type="button"
          onClick={() => goMonth(1)}
          disabled={view.year === CALENDAR_END_YEAR && view.month === CALENDAR_END_MONTH}
          className="rounded-full border border-paper/20 p-1.5 text-paper-dim transition hover:border-gold hover:text-gold disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="rounded-xl border border-paper/10 bg-void-soft/50 p-5">
        <div className="mb-1 flex items-center gap-1.5">
          <HeartPulse size={16} className="text-gold" />
          <h2 className="font-mincho text-sm font-bold text-paper">{t('health.heading')}</h2>
        </div>
        <p className="mb-4 text-[11px] text-paper-dim">{t('health.description')}</p>

        <div className="flex flex-wrap items-center gap-4">
          <div className={`rounded-xl border px-5 py-3 text-center ${LABEL_STYLE[teamLabel]}`}>
            <p className="font-mincho text-3xl font-bold">{teamScore ?? '–'}</p>
            <p className="text-[11px]">{t(`health.label${teamLabel === 'good' ? 'Good' : teamLabel === 'ok' ? 'Ok' : 'Warning'}`)}</p>
          </div>
          <p className="text-xs text-paper-dim">
            {t('health.shiftBreakdown', {
              happy: teamCounts.happy,
              neutral: teamCounts.neutral,
              tired: teamCounts.tired,
              unhappy: teamCounts.unhappy,
              total: teamCounts.total,
            })}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-paper/10 bg-void-soft/50 p-4">
        <h3 className="font-mincho text-sm font-bold text-paper">{t('health.atRiskHeading')}</h3>
        <p className="mt-1 text-[11px] text-paper-dim">{t('health.atRiskDescription')}</p>

        <div className="mt-3 space-y-2">
          {atRisk.length === 0 ? (
            <p className="rounded-lg border border-dashed border-paper/15 py-6 text-center text-xs text-paper-dim/70">
              {t('health.allGood')}
            </p>
          ) : (
            atRisk.map(({ employee, counts, score }) => (
              <button
                key={employee.id}
                type="button"
                onClick={() => setSelectedEmployeeId(employee.id)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-paper/10 bg-void/40 p-3 text-left transition hover:border-gold/50"
              >
                <div className="flex items-center gap-3">
                  <NinjaAvatar employee={employee} mood={worstMood(counts)} size="sm" />
                  <div>
                    <p className="text-xs font-medium text-paper">{employeeName(employee)}</p>
                    <p className="text-[10px] text-paper-dim">
                      {t('health.tiredCount', { n: counts.tired })} ・ {t('health.unhappyCount', { n: counts.unhappy })}
                    </p>
                  </div>
                </div>
                {score !== null && (
                  <div className={`rounded-full border px-3 py-1 text-xs font-medium ${LABEL_STYLE[healthLabelForScore(score)]}`}>
                    {t('health.scoreOutOf100', { score })}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {selectedEmployee && (
        <HealthDetailModal
          employee={selectedEmployee}
          employees={employees}
          shifts={shifts}
          moodMap={moodMap}
          monthDates={dates}
          onRemoveShift={onRemoveShift}
          onClose={() => setSelectedEmployeeId(null)}
        />
      )}
    </div>
  );
}
