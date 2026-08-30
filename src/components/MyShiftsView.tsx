import { NinjaAvatar } from './NinjaAvatar';
import { formatDateJp, weekdayJp } from '../lib/format';
import { MOOD_LABEL } from '../lib/mood';
import { useLabelContext } from '../hooks/LabelContext';
import type { Employee, MoodResult, ShiftEntry } from '../types';

interface MyShiftsViewProps {
  employee: Employee;
  shifts: ShiftEntry[];
  moodMap: Map<string, MoodResult>;
}

export function MyShiftsView({ employee, shifts, moodMap }: MyShiftsViewProps) {
  const { employeeName, facilityName } = useLabelContext();
  const sorted = [...shifts].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-paper/10 bg-void-soft/50 p-4">
        <NinjaAvatar employee={employee} mood="neutral" size="lg" />
        <div>
          <p className="font-mincho text-base font-bold text-paper">{employeeName(employee)}</p>
          <p className="text-xs text-paper-dim">自分のシフトは閲覧のみです(編集はマネージャーが行います)</p>
        </div>
      </div>

      <div className="rounded-xl border border-paper/10 bg-void-soft/50 p-4">
        <h2 className="mb-3 font-mincho text-sm font-bold text-paper">マイシフト</h2>
        {sorted.length === 0 ? (
          <p className="text-xs text-paper-dim/70">配置されているシフトはありません</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((shift) => {
              const mood = moodMap.get(shift.id);
              return (
                <div
                  key={shift.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-paper/10 bg-void/40 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-paper">
                      {formatDateJp(shift.date, weekdayJp(shift.date))} ／ {facilityName(shift.facility)}
                    </p>
                    <p className="text-xs text-paper-dim">
                      {shift.start}–{shift.end}
                      {shift.note ? `・${shift.note}` : ''}
                    </p>
                  </div>
                  <span className="rounded-full bg-void px-2.5 py-1 text-[11px] text-paper-dim">
                    {mood ? MOOD_LABEL[mood.mood] : ''}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
