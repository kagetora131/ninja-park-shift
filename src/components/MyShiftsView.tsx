import { useState } from 'react';
import { ArrowLeftRight, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { NinjaAvatar } from './NinjaAvatar';
import { FACILITY_COLOR, FACILITY_ORDER, capableFacilities } from '../data/facilities';
import { FACILITY_ICON } from './facilityIcon';
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
import type { Employee, MoodResult, ShiftEntry } from '../types';

interface MyShiftsViewProps {
  employee: Employee;
  employees: Employee[];
  shifts: ShiftEntry[];
  moodMap: Map<string, MoodResult>;
}

function todayOr(dates: string[]): string {
  const today = new Date().toISOString().slice(0, 10);
  return dates.includes(today) ? today : (dates[0] ?? '');
}

export function MyShiftsView({ employee, employees, shifts, moodMap }: MyShiftsViewProps) {
  const { employeeName, facilityName } = useLabelContext();
  const [view, setView] = useState({ year: CALENDAR_START_YEAR, month: CALENDAR_START_MONTH });
  const dates = datesInMonth(view.year, view.month);
  const [selectedDate, setSelectedDate] = useState(() => todayOr(dates));

  const sortedEmployees = [...employees].sort((a, b) => {
    const fa = FACILITY_ORDER.indexOf(a.mainFacility);
    const fb = FACILITY_ORDER.indexOf(b.mainFacility);
    return fa - fb || a.name.localeCompare(b.name, 'ja');
  });

  const shiftByKey = new Map<string, ShiftEntry>();
  for (const s of shifts) shiftByKey.set(`${s.date}_${s.employeeId}`, s);

  const goMonth = (delta: number) => {
    const next = addMonths(view.year, view.month, delta);
    setView(next);
    const nextDates = datesInMonth(next.year, next.month);
    setSelectedDate((prev) => (nextDates.includes(prev) ? prev : (nextDates[0] ?? '')));
  };

  const shiftsForSelected = shifts.filter((s) => s.date === selectedDate);
  const myShiftToday = shiftsForSelected.find((s) => s.employeeId === employee.id);
  const swapCandidates = myShiftToday
    ? employees.filter(
        (e) =>
          e.id !== employee.id &&
          capableFacilities(e).includes(myShiftToday.facility) &&
          !shiftsForSelected.some((s) => s.employeeId === e.id),
      )
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-paper/10 bg-void-soft/50 p-3">
        <NinjaAvatar employee={employee} mood="neutral" size="md" />
        <div>
          <p className="font-mincho text-sm font-bold text-paper">{employeeName(employee)}</p>
          <p className="text-[11px] text-paper-dim">シフトの閲覧のみです(編集はマネージャーが行います)</p>
        </div>
      </div>

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

      <div className="max-h-[60vh] overflow-auto rounded-xl border border-paper/10">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 min-w-[92px] border-b border-r border-paper/10 bg-void-soft px-2 py-2 text-left font-medium text-paper-dim">
                日付
              </th>
              {sortedEmployees.map((emp) => {
                const isMe = emp.id === employee.id;
                return (
                  <th
                    key={emp.id}
                    className={`sticky top-0 z-20 min-w-[80px] border-b border-r border-paper/10 px-1 py-2 text-center font-medium ${
                      isMe ? 'bg-gold/15' : 'bg-void-soft'
                    }`}
                    style={{ borderTop: `3px solid ${FACILITY_COLOR[emp.mainFacility]}` }}
                    title={`${employeeName(emp)}(${facilityName(emp.mainFacility)}所属)`}
                  >
                    <span className={`block max-w-[76px] truncate ${isMe ? 'text-gold' : 'text-paper'}`}>
                      {employeeName(emp)}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {dates.map((date) => {
              const isSelected = date === selectedDate;
              return (
                <tr key={date} className={isSelected ? 'bg-gold/10' : 'odd:bg-void/30'}>
                  <td
                    className="sticky left-0 z-10 whitespace-nowrap border-b border-r border-paper/10 bg-void-soft px-2 py-1 text-paper-dim"
                    style={isSelected ? { background: 'rgba(182,146,79,0.12)' } : undefined}
                  >
                    <button type="button" onClick={() => setSelectedDate(date)} className="flex items-center gap-1.5">
                      {formatDateJp(date, weekdayJp(date))}
                    </button>
                  </td>
                  {sortedEmployees.map((emp) => {
                    const shift = shiftByKey.get(`${date}_${emp.id}`);
                    const isMe = emp.id === employee.id;
                    if (!shift) {
                      return (
                        <td
                          key={emp.id}
                          onClick={() => setSelectedDate(date)}
                          className={`cursor-pointer border-b border-r border-paper/5 p-0.5 ${isMe ? 'bg-gold/5' : ''}`}
                        />
                      );
                    }
                    const mood = moodMap.get(shift.id);
                    return (
                      <td key={emp.id} className="border-b border-r border-paper/5 p-0.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDate(date)}
                          title={`${employeeName(emp)} ${facilityName(shift.facility)} ${shift.start}–${shift.end}`}
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

      <div className="rounded-xl border border-paper/10 bg-void-soft/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mincho text-sm font-bold text-paper">{formatDateJp(selectedDate, weekdayJp(selectedDate))} の配置</h2>
          <span className="flex items-center gap-1 text-[11px] text-paper-dim">
            <Users size={12} />
            {shiftsForSelected.length}名出勤
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {FACILITY_ORDER.map((facility) => {
            const facilityShifts = shiftsForSelected
              .filter((s) => s.facility === facility)
              .sort((a, b) => a.start.localeCompare(b.start));
            const Icon = FACILITY_ICON[facility];
            return (
              <div key={facility} className="rounded-lg border border-paper/10 bg-void/40 p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <Icon size={13} className="text-gold" />
                  <p className="text-xs font-medium text-paper">{facilityName(facility)}</p>
                </div>
                {facilityShifts.length === 0 ? (
                  <p className="py-2 text-center text-[11px] text-paper-dim/70">配置なし</p>
                ) : (
                  <div className="space-y-2">
                    {facilityShifts.map((shift) => {
                      const person = employees.find((e) => e.id === shift.employeeId);
                      if (!person) return null;
                      const mood = moodMap.get(shift.id);
                      const isMe = person.id === employee.id;
                      return (
                        <div
                          key={shift.id}
                          className={`flex items-center gap-2 rounded-md p-1.5 ${isMe ? 'bg-gold/10' : ''}`}
                        >
                          <NinjaAvatar
                            employee={person}
                            mood={mood?.mood ?? 'neutral'}
                            facility={facility}
                            size="sm"
                            title={mood?.reasons.join(' / ')}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-medium text-paper">
                              {employeeName(person)}
                              {isMe && <span className="ml-1 text-gold">(あなた)</span>}
                            </p>
                            <p className="text-[10px] text-paper-dim">{shift.start}–{shift.end}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {myShiftToday && (
        <div className="rounded-xl border border-gold/30 bg-void-soft/50 p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <ArrowLeftRight size={14} className="text-gold" />
            <h2 className="font-mincho text-sm font-bold text-paper">交代候補</h2>
          </div>
          <p className="mb-3 text-[11px] text-paper-dim">
            この日({facilityName(myShiftToday.facility)}・{myShiftToday.start}–{myShiftToday.end})を代わってもらえそうな、
            対応可能かつこの日は空いている忍者です。交代したい場合はマネージャーに相談してください。
          </p>
          {swapCandidates.length === 0 ? (
            <p className="text-[11px] text-paper-dim/70">現在、対応可能で空いている忍者はいません</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {swapCandidates.map((c) => (
                <div key={c.id} className="flex flex-col items-center gap-1">
                  <NinjaAvatar employee={c} mood="neutral" size="sm" />
                  <span className="text-[10px] text-paper-dim">{employeeName(c)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
