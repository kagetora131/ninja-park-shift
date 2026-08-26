import { Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { DateNav } from './DateNav';
import { MoodLegend } from './MoodLegend';
import { NinjaAvatar } from './NinjaAvatar';
import { FACILITY_ICON } from './facilityIcon';
import { FACILITIES, FACILITY_ORDER } from '../data/facilities';
import { formatYen } from '../lib/format';
import { MOOD_LABEL } from '../lib/mood';
import type { DailyFinance, Employee, MoodResult, ShiftEntry } from '../types';

interface RosterViewProps {
  dates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  employees: Employee[];
  shifts: ShiftEntry[];
  moodMap: Map<string, MoodResult>;
  finance: DailyFinance[];
  onEditShift: (shift: ShiftEntry) => void;
  onAddShift: (date: string, facility: ShiftEntry['facility']) => void;
}

export function RosterView({
  dates,
  selectedDate,
  onSelectDate,
  employees,
  shifts,
  moodMap,
  finance,
  onEditShift,
  onAddShift,
}: RosterViewProps) {
  const todayShifts = shifts.filter((s) => s.date === selectedDate);
  const workingIds = new Set(todayShifts.map((s) => s.employeeId));
  const offEmployees = employees.filter((e) => !workingIds.has(e.id));
  const todayFinance = finance.find((f) => f.date === selectedDate);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateNav dates={dates} value={selectedDate} onChange={onSelectDate} />
        {todayFinance && (
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
              todayFinance.isBlack
                ? 'border-jade/60 bg-jade/10 text-jade'
                : 'border-seal/60 bg-seal/10 text-seal-bright'
            }`}
          >
            {todayFinance.isBlack ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            本日{todayFinance.isBlack ? '黒字' : '赤字'}見込み：{formatYen(todayFinance.profit)}
          </div>
        )}
      </div>

      <MoodLegend />

      <div className="grid gap-4 md:grid-cols-3">
        {FACILITY_ORDER.map((facilityId) => {
          const meta = FACILITIES[facilityId];
          const Icon = FACILITY_ICON[facilityId];
          const facilityShifts = todayShifts
            .filter((s) => s.facility === facilityId)
            .sort((a, b) => a.start.localeCompare(b.start));
          const facilityFinance = todayFinance?.facilities[facilityId];

          return (
            <div
              key={facilityId}
              className="flex flex-col rounded-xl border border-paper/10 bg-void-soft/50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-gold" />
                  <h3 className="font-mincho text-sm font-bold text-paper">{meta.name}</h3>
                </div>
                <span className="text-[11px] text-paper-dim">{facilityShifts.length}名</span>
              </div>

              {facilityFinance && (
                <div className="mb-3 flex justify-between text-[11px] text-paper-dim">
                  <span>売上 {formatYen(facilityFinance.revenue)}</span>
                  <span>人件費 {formatYen(facilityFinance.laborCost)}</span>
                </div>
              )}

              <div className="flex-1 space-y-3">
                {facilityShifts.length === 0 && (
                  <p className="py-4 text-center text-xs text-paper-dim/70">本日の配置なし</p>
                )}
                {facilityShifts.map((shift) => {
                  const employee = employees.find((e) => e.id === shift.employeeId);
                  if (!employee) return null;
                  const mood = moodMap.get(shift.id);
                  return (
                    <button
                      key={shift.id}
                      type="button"
                      onClick={() => onEditShift(shift)}
                      className="animate-rise flex w-full items-center gap-3 rounded-lg border border-transparent p-1.5 text-left transition hover:border-paper/20 hover:bg-void/40"
                    >
                      <NinjaAvatar
                        employee={employee}
                        mood={mood?.mood ?? 'neutral'}
                        facility={shift.facility}
                        size="md"
                        title={mood?.reasons.join(' / ')}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-paper">{employee.name}</p>
                        <p className="text-[11px] text-paper-dim">
                          {shift.start}–{shift.end}
                        </p>
                        <p className="truncate text-[11px] text-paper-dim/80">
                          {mood ? MOOD_LABEL[mood.mood] : ''}
                          {mood?.reasons[0] ? `：${mood.reasons[0]}` : ''}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => onAddShift(selectedDate, facilityId)}
                className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-dashed border-paper/20 py-2 text-xs text-paper-dim transition hover:border-gold hover:text-gold"
              >
                <Plus size={13} />
                配置を追加
              </button>
            </div>
          );
        })}
      </div>

      {offEmployees.length > 0 && (
        <div className="rounded-xl border border-paper/10 bg-void-soft/30 p-4">
          <h3 className="mb-3 text-xs font-medium text-paper-dim">本日お休み ({offEmployees.length}名)</h3>
          <div className="flex flex-wrap gap-3">
            {offEmployees.map((employee) => (
              <div key={employee.id} className="flex flex-col items-center gap-1 opacity-50">
                <NinjaAvatar employee={employee} mood="neutral" size="sm" />
                <span className="text-[10px] text-paper-dim">{employee.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
