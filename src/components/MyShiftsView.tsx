import { useState } from 'react';
import { ArrowLeftRight, Users } from 'lucide-react';
import { NinjaAvatar } from './NinjaAvatar';
import { DatePicker } from './DatePicker';
import { FACILITY_ORDER, capableFacilities } from '../data/facilities';
import { FACILITY_ICON } from './facilityIcon';
import { formatDateJp, weekdayJp } from '../lib/format';
import { MOOD_LABEL } from '../lib/mood';
import { useLabelContext } from '../hooks/LabelContext';
import type { Employee, MoodResult, ShiftEntry } from '../types';

interface MyShiftsViewProps {
  employee: Employee;
  employees: Employee[];
  shifts: ShiftEntry[];
  moodMap: Map<string, MoodResult>;
  dates: string[];
}

function todayDefault(dates: string[]): string {
  const today = new Date().toISOString().slice(0, 10);
  return dates.includes(today) ? today : (dates[0] ?? '');
}

export function MyShiftsView({ employee, employees, shifts, moodMap, dates }: MyShiftsViewProps) {
  const { employeeName, facilityName } = useLabelContext();
  const [selectedDate, setSelectedDate] = useState(() => todayDefault(dates));

  const myWorkDates = new Set(shifts.filter((s) => s.employeeId === employee.id).map((s) => s.date));
  const anyWorkDates = new Set(shifts.map((s) => s.date));

  const shiftsForDate = shifts.filter((s) => s.date === selectedDate);
  const myShiftToday = shiftsForDate.find((s) => s.employeeId === employee.id);
  const selectedDay = weekdayJp(selectedDate);

  const swapCandidates = myShiftToday
    ? employees.filter(
        (e) =>
          e.id !== employee.id &&
          capableFacilities(e).includes(myShiftToday.facility) &&
          !shiftsForDate.some((s) => s.employeeId === e.id),
      )
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-paper/10 bg-void-soft/50 p-3">
          <NinjaAvatar employee={employee} mood="neutral" size="md" />
          <div>
            <p className="font-mincho text-sm font-bold text-paper">{employeeName(employee)}</p>
            <p className="text-[11px] text-paper-dim">シフトの閲覧のみです(編集はマネージャーが行います)</p>
          </div>
        </div>
        <DatePicker
          dates={dates}
          value={selectedDate}
          onChange={setSelectedDate}
          dotColorFor={(date) => (myWorkDates.has(date) ? 'var(--color-gold)' : anyWorkDates.has(date) ? 'var(--color-paper-dim)' : 'transparent')}
        />
      </div>

      <div className="rounded-xl border border-paper/10 bg-void-soft/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mincho text-sm font-bold text-paper">
            {formatDateJp(selectedDate, selectedDay)} の配置
          </h2>
          <span className="flex items-center gap-1 text-[11px] text-paper-dim">
            <Users size={12} />
            {shiftsForDate.length}名出勤
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {FACILITY_ORDER.map((facility) => {
            const facilityShifts = shiftsForDate
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
                            <p className="text-[10px] text-paper-dim">
                              {shift.start}–{shift.end}
                              {mood ? ` ・${MOOD_LABEL[mood.mood]}` : ''}
                            </p>
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

      {!myShiftToday && (
        <p className="rounded-xl border border-dashed border-paper/15 p-4 text-center text-xs text-paper-dim/70">
          この日はあなたのシフトはありません
        </p>
      )}
    </div>
  );
}
