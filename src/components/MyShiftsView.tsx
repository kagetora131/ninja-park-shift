import { useEffect, useState } from 'react';
import { ArrowLeftRight, Bell, Check, ChevronLeft, ChevronRight, Copy, Users } from 'lucide-react';
import { NinjaAvatar } from './NinjaAvatar';
import { FACILITY_COLOR, FACILITY_ORDER, capableFacilities, sortEmployeesByFacility } from '../data/facilities';
import { FACILITY_ICON } from './facilityIcon';
import { formatDateJp, weekdayJp } from '../lib/format';
import { MOOD_COLOR } from '../lib/mood';
import { translateReason, formatMonthLabel } from '../lib/i18n';
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

function seenStorageKey(employeeId: string): string {
  return `ninja-park-shift:shifts-seen:${employeeId}`;
}

function loadLastSeenAt(employeeId: string): string | null {
  try {
    return window.localStorage.getItem(seenStorageKey(employeeId));
  } catch {
    return null;
  }
}

function saveLastSeenAt(employeeId: string, iso: string) {
  try {
    window.localStorage.setItem(seenStorageKey(employeeId), iso);
  } catch {
    // 保存できない環境では通知の既読管理を諦める(表示のみ継続)
  }
}

export function MyShiftsView({ employee, employees, shifts, moodMap }: MyShiftsViewProps) {
  const { locale, employeeName, facilityName, t } = useLabelContext();
  const [view, setView] = useState({ year: CALENDAR_START_YEAR, month: CALENDAR_START_MONTH });
  const dates = datesInMonth(view.year, view.month);
  const [selectedDate, setSelectedDate] = useState(() => todayOr(dates));
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(() => loadLastSeenAt(employee.id));
  const [copiedCandidateId, setCopiedCandidateId] = useState<string | null>(null);

  // 初回訪問(このブラウザにまだ既読情報がない場合)は、既存シフトを一括で「更新済み」扱いにしないよう、
  // 今の時刻を基準として保存するだけにとどめる(以降の変更だけを検知する)。
  useEffect(() => {
    if (lastSeenAt === null) {
      const now = new Date().toISOString();
      saveLastSeenAt(employee.id, now);
      setLastSeenAt(now);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee.id]);

  const sortedEmployees = sortEmployeesByFacility(employees);

  const shiftByKey = new Map<string, ShiftEntry>();
  for (const s of shifts) shiftByKey.set(`${s.date}_${s.employeeId}`, s);

  const goMonth = (delta: number) => {
    const next = addMonths(view.year, view.month, delta);
    setView(next);
    const nextDates = datesInMonth(next.year, next.month);
    setSelectedDate((prev) => (nextDates.includes(prev) ? prev : (nextDates[0] ?? '')));
  };

  const myShifts = shifts.filter((s) => s.employeeId === employee.id);
  const changedShifts = lastSeenAt
    ? myShifts.filter((s) => s.updatedAt > lastSeenAt).sort((a, b) => a.date.localeCompare(b.date))
    : [];
  const changedShiftIds = new Set(changedShifts.map((s) => s.id));

  const acknowledgeChanges = () => {
    const now = new Date().toISOString();
    saveLastSeenAt(employee.id, now);
    setLastSeenAt(now);
  };

  const shiftsForSelected = shifts.filter((s) => s.date === selectedDate);
  const myShiftToday = shiftsForSelected.find((s) => s.employeeId === employee.id);

  const monthShiftCountByEmployee = new Map<string, number>();
  for (const s of shifts) {
    if (!dates.includes(s.date)) continue;
    monthShiftCountByEmployee.set(s.employeeId, (monthShiftCountByEmployee.get(s.employeeId) ?? 0) + 1);
  }

  const selectedWeekday = weekdayJp(selectedDate);
  const swapCandidates = myShiftToday
    ? employees
        .filter(
          (e) =>
            e.id !== employee.id &&
            capableFacilities(e).includes(myShiftToday.facility) &&
            !shiftsForSelected.some((s) => s.employeeId === e.id) &&
            !e.desiredOffDates.includes(selectedDate),
        )
        .sort((a, b) => {
          const scoreOf = (e: Employee) => {
            let score = 0;
            if (e.mainFacility !== myShiftToday.facility) score += 10; // 応援より所属を優先
            if (e.desiredDaysOff.includes(selectedWeekday)) score += 5; // 普段の休み希望日は後回し
            score += monthShiftCountByEmployee.get(e.id) ?? 0; // 今月の勤務数が少ない人を優先(公平さ)
            return score;
          };
          return scoreOf(a) - scoreOf(b);
        })
    : [];

  const copySwapMessage = async (candidate: Employee) => {
    if (!myShiftToday) return;
    const message = t('myShifts.swapMessageTemplate', {
      date: formatDateJp(selectedDate, locale),
      facility: facilityName(myShiftToday.facility),
      start: myShiftToday.start,
      end: myShiftToday.end,
      candidate: employeeName(candidate),
    });
    try {
      await navigator.clipboard.writeText(message);
      setCopiedCandidateId(candidate.id);
      window.setTimeout(() => setCopiedCandidateId((id) => (id === candidate.id ? null : id)), 2000);
    } catch {
      // クリップボードAPIが使えない環境では何もしない(コピー確認は表示されない)
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-paper/10 bg-void-soft/50 p-3">
        <NinjaAvatar employee={employee} mood="neutral" size="md" />
        <div>
          <p className="font-mincho text-sm font-bold text-paper">{employeeName(employee)}</p>
          <p className="text-[11px] text-paper-dim">{t('myShifts.viewOnlyNotice')}</p>
        </div>
      </div>

      {changedShifts.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-xs text-gold">
          <span className="flex items-center gap-2">
            <Bell size={14} />
            {t('myShifts.changedBanner', {
              n: changedShifts.length,
              dates: changedShifts.map((s) => formatDateJp(s.date, locale)).join('、'),
            })}
          </span>
          <button
            type="button"
            onClick={acknowledgeChanges}
            className="flex shrink-0 items-center gap-1 rounded-full border border-gold/50 px-2.5 py-1 transition hover:bg-gold/20"
          >
            <Check size={12} />
            {t('myShifts.changedAck')}
          </button>
        </div>
      )}

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

      <div className="max-h-[60vh] overflow-auto rounded-xl border border-paper/10">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 min-w-[92px] border-b border-r border-paper/10 bg-void-soft px-2 py-2 text-left font-medium text-paper-dim">
                {t('myShifts.dateHeader')}
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
                    title={`${employeeName(emp)} (${facilityName(emp.mainFacility)})`}
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
                      {formatDateJp(date, locale)}
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
                    const isChanged = isMe && changedShiftIds.has(shift.id);
                    return (
                      <td key={emp.id} className="border-b border-r border-paper/5 p-0.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDate(date)}
                          title={`${employeeName(emp)} ${facilityName(shift.facility)} ${shift.start}–${shift.end}${
                            isChanged ? ` / ${t('myShifts.changedBadgeTitle')}` : ''
                          }`}
                          className={`relative flex h-9 w-full flex-col items-center justify-center gap-0.5 rounded-sm border-l-4 bg-void/60 transition hover:brightness-125 ${
                            isChanged ? 'ring-1 ring-gold' : ''
                          }`}
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
                          {isChanged && (
                            <span className="absolute left-0.5 top-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
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
          <h2 className="font-mincho text-sm font-bold text-paper">
            {t('myShifts.placementHeading', { date: formatDateJp(selectedDate, locale) })}
          </h2>
          <span className="flex items-center gap-1 text-[11px] text-paper-dim">
            <Users size={12} />
            {t('myShifts.attendanceCount', { n: shiftsForSelected.length })}
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
                  <p className="py-2 text-center text-[11px] text-paper-dim/70">{t('myShifts.noPlacement')}</p>
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
                            title={mood?.reasons.map((r) => translateReason(r, locale)).join(' / ')}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-medium text-paper">
                              {employeeName(person)}
                              {isMe && <span className="ml-1 text-gold">{t('myShifts.you')}</span>}
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
            <h2 className="font-mincho text-sm font-bold text-paper">{t('myShifts.swapCandidatesHeading')}</h2>
          </div>
          <p className="mb-3 text-[11px] text-paper-dim">
            {t('myShifts.swapExplain', {
              facility: facilityName(myShiftToday.facility),
              start: myShiftToday.start,
              end: myShiftToday.end,
            })}
          </p>
          {swapCandidates.length === 0 ? (
            <p className="text-[11px] text-paper-dim/70">{t('myShifts.noSwapCandidates')}</p>
          ) : (
            <div className="space-y-2">
              {swapCandidates.map((c) => {
                const isMain = c.mainFacility === myShiftToday.facility;
                const isUsuallyOff = c.desiredDaysOff.includes(selectedWeekday);
                const monthCount = monthShiftCountByEmployee.get(c.id) ?? 0;
                const isCopied = copiedCandidateId === c.id;
                return (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-paper/10 bg-void/40 p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <NinjaAvatar employee={c} mood="neutral" size="sm" />
                      <div>
                        <p className="text-xs font-medium text-paper">{employeeName(c)}</p>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          <span className={`rounded-full px-1.5 py-[1px] text-[9px] ${isMain ? 'bg-jade/15 text-jade' : 'bg-gold/15 text-gold'}`}>
                            {isMain ? t('autoAssign.homeFacility') : t('autoAssign.helpFacility')}
                          </span>
                          {isUsuallyOff && (
                            <span className="rounded-full bg-seal/15 px-1.5 py-[1px] text-[9px] text-seal-bright">
                              {t('myShifts.usuallyOffBadge')}
                            </span>
                          )}
                          <span className="rounded-full bg-paper/10 px-1.5 py-[1px] text-[9px] text-paper-dim">
                            {t('myShifts.monthShiftCount', { n: monthCount })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copySwapMessage(c)}
                      className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition ${
                        isCopied
                          ? 'border-jade/50 bg-jade/10 text-jade'
                          : 'border-paper/20 text-paper-dim hover:border-gold hover:text-gold'
                      }`}
                    >
                      {isCopied ? <Check size={11} /> : <Copy size={11} />}
                      {isCopied ? t('myShifts.copied') : t('myShifts.copyMessage')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
