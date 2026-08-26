import { Plus } from 'lucide-react';
import { NinjaAvatar } from './NinjaAvatar';
import { FACILITIES, FACILITY_ORDER } from '../data/facilities';
import { formatDateJp, weekdayJp } from '../lib/format';
import { MOOD_LABEL } from '../lib/mood';
import type { DailyFinance, Employee, FacilityId, MoodResult, ShiftEntry } from '../types';

interface ShiftBoardProps {
  dates: string[];
  employees: Employee[];
  shifts: ShiftEntry[];
  moodMap: Map<string, MoodResult>;
  finance: DailyFinance[];
  onEditShift: (shift: ShiftEntry) => void;
  onAddShift: (date: string, facility: FacilityId) => void;
}

export function ShiftBoard({
  dates,
  employees,
  shifts,
  moodMap,
  finance,
  onEditShift,
  onAddShift,
}: ShiftBoardProps) {
  const employeeMap = new Map(employees.map((e) => [e.id, e]));
  const financeByDate = new Map(finance.map((f) => [f.date, f]));

  return (
    <div className="overflow-x-auto rounded-xl border border-paper/10">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="bg-void-soft/80 text-left text-xs text-paper-dim">
            <th className="sticky left-0 z-10 bg-void-soft px-3 py-2 font-medium">日付</th>
            {FACILITY_ORDER.map((f) => (
              <th key={f} className="px-3 py-2 font-medium">
                {FACILITIES[f].name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dates.map((date) => {
            const dayFinance = financeByDate.get(date);
            return (
              <tr key={date} className="border-t border-paper/10 align-top">
                <td className="sticky left-0 z-10 whitespace-nowrap bg-void px-3 py-3 text-xs text-paper-dim">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        dayFinance?.isBlack ? 'bg-jade' : 'bg-seal'
                      }`}
                    />
                    {formatDateJp(date, weekdayJp(date))}
                  </div>
                </td>
                {FACILITY_ORDER.map((facility) => {
                  const cellShifts = shifts
                    .filter((s) => s.date === date && s.facility === facility)
                    .sort((a, b) => a.start.localeCompare(b.start));
                  return (
                    <td key={facility} className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {cellShifts.map((shift) => {
                          const employee = employeeMap.get(shift.employeeId);
                          if (!employee) return null;
                          const mood = moodMap.get(shift.id);
                          return (
                            <button
                              key={shift.id}
                              type="button"
                              onClick={() => onEditShift(shift)}
                              title={`${employee.name} ${shift.start}-${shift.end} ${
                                mood ? MOOD_LABEL[mood.mood] : ''
                              }`}
                              className="flex items-center gap-1.5 rounded-full border border-paper/15 bg-void-soft/60 py-1 pl-1 pr-2.5 transition hover:border-gold"
                            >
                              <NinjaAvatar employee={employee} mood={mood?.mood ?? 'neutral'} facility={facility} size="sm" />
                              <span className="whitespace-nowrap text-xs text-paper">{employee.name}</span>
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => onAddShift(date, facility)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-paper/25 text-paper-dim transition hover:border-gold hover:text-gold"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
