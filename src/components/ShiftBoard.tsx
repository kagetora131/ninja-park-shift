import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { FACILITY_COLOR, FACILITY_ORDER } from '../data/facilities';
import { formatDateJp, weekdayJp } from '../lib/format';
import { MOOD_COLOR } from '../lib/mood';
import {
  CALENDAR_END_MONTH,
  CALENDAR_END_YEAR,
  CALENDAR_START_MONTH,
  CALENDAR_START_YEAR,
  addMonths,
  datesInMonth,
} from '../lib/monthGrid';
import { useLabelContext } from '../hooks/LabelContext';
import type { ShiftDraft } from './ShiftEditModal';
import type { DailyFinance, Employee, MoodResult, ShiftEntry } from '../types';

interface ShiftBoardProps {
  employees: Employee[];
  shifts: ShiftEntry[];
  moodMap: Map<string, MoodResult>;
  finance: DailyFinance[];
  onEditShift: (shift: ShiftEntry) => void;
  onCreateShift: (draft: ShiftDraft) => void;
}

export function ShiftBoard({ employees, shifts, moodMap, finance, onEditShift, onCreateShift }: ShiftBoardProps) {
  const { employeeName, facilityName } = useLabelContext();
  const [view, setView] = useState({ year: CALENDAR_START_YEAR, month: CALENDAR_START_MONTH });

  const dates = datesInMonth(view.year, view.month);

  const sortedEmployees = [...employees].sort((a, b) => {
    const fa = FACILITY_ORDER.indexOf(a.mainFacility);
    const fb = FACILITY_ORDER.indexOf(b.mainFacility);
    return fa - fb || a.name.localeCompare(b.name, 'ja');
  });

  const shiftByKey = new Map<string, ShiftEntry>();
  for (const s of shifts) shiftByKey.set(`${s.date}_${s.employeeId}`, s);

  const financeByDate = new Map(finance.map((f) => [f.date, f]));
  const blackDaysInView = dates.filter((d) => financeByDate.get(d)?.isBlack).length;

  const goMonth = (delta: number) => setView((v) => addMonths(v.year, v.month, delta));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goMonth(-1)}
            disabled={view.year === CALENDAR_START_YEAR && view.month === CALENDAR_START_MONTH}
            className="rounded-full border border-paper/20 p-1.5 text-paper-dim transition hover:border-gold hover:text-gold disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="font-mincho text-base font-bold text-paper">
            {view.year}年{view.month}月
          </p>
          <button
            type="button"
            onClick={() => goMonth(1)}
            disabled={view.year === CALENDAR_END_YEAR && view.month === CALENDAR_END_MONTH}
            className="rounded-full border border-paper/20 p-1.5 text-paper-dim transition hover:border-gold hover:text-gold disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-jade/40 bg-jade/10 px-3 py-1.5 text-xs text-jade">
          今月の黒字日数：{blackDaysInView} / {dates.length}日
        </div>
      </div>

      <div className="max-h-[70vh] overflow-auto rounded-xl border border-paper/10">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 min-w-[92px] border-b border-r border-paper/10 bg-void-soft px-2 py-2 text-left font-medium text-paper-dim">
                日付
              </th>
              {sortedEmployees.map((emp) => (
                <th
                  key={emp.id}
                  className="sticky top-0 z-20 min-w-[80px] border-b border-r border-paper/10 bg-void-soft px-1 py-2 text-center font-medium"
                  style={{ borderTop: `3px solid ${FACILITY_COLOR[emp.mainFacility]}` }}
                  title={`${employeeName(emp)}(${facilityName(emp.mainFacility)}所属)`}
                >
                  <span className="block max-w-[76px] truncate text-paper">{employeeName(emp)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dates.map((date) => {
              const dayFinance = financeByDate.get(date);
              const day = weekdayJp(date);
              return (
                <tr key={date} className="odd:bg-void/30">
                  <td className="sticky left-0 z-10 whitespace-nowrap border-b border-r border-paper/10 bg-void-soft px-2 py-1 text-paper-dim">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${dayFinance?.isBlack ? 'bg-jade' : 'bg-seal'}`}
                      />
                      {formatDateJp(date, day)}
                    </div>
                  </td>
                  {sortedEmployees.map((emp) => {
                    const shift = shiftByKey.get(`${date}_${emp.id}`);
                    if (!shift) {
                      return (
                        <td key={emp.id} className="border-b border-r border-paper/5 p-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              onCreateShift({ mode: 'create', date, facility: emp.mainFacility, employeeId: emp.id })
                            }
                            className="flex h-9 w-full items-center justify-center rounded-sm border border-dashed border-paper/10 text-paper-dim/0 transition hover:border-gold/50 hover:text-gold"
                          >
                            <Plus size={11} />
                          </button>
                        </td>
                      );
                    }
                    const mood = moodMap.get(shift.id);
                    return (
                      <td key={emp.id} className="border-b border-r border-paper/5 p-0.5">
                        <button
                          type="button"
                          onClick={() => onEditShift(shift)}
                          title={`${facilityName(shift.facility)} ${shift.start}–${shift.end}${
                            mood ? ` / ${mood.reasons.join(' / ')}` : ''
                          }`}
                          className="relative flex h-9 w-full flex-col items-center justify-center gap-0.5 rounded-sm border-l-4 bg-void/60 transition hover:brightness-125"
                          style={{ borderLeftColor: FACILITY_COLOR[shift.facility] }}
                        >
                          <span className="leading-none text-paper">{shift.start}</span>
                          <span className="leading-none text-paper-dim">{shift.end}</span>
                          {mood && (
                            <span
                              className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full"
                              style={{ background: MOOD_COLOR[mood.mood] }}
                            />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-paper-dim">
        セルをクリックしてシフトを追加・編集できます。左のカラーバーは配置施設、右上のドットは表情(緑=上機嫌／灰=普通／金=疲れ気味／朱=不満)を表します。
      </p>
    </div>
  );
}
