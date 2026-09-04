import { shiftDate } from './format';
import type { Employee, MoodReason, MoodResult, ShiftEntry } from '../types';

const HELP_WINDOW = 5;
const SEVERE_OVERRUN = 3;

/** その従業員の、対象日を含む「連続勤務日数」を数える(前日以前に遡って空白日で打ち切り)。 */
function countConsecutiveDays(shiftsByDate: Map<string, ShiftEntry>, targetDate: string): number {
  let count = 0;
  let cursor = targetDate;
  while (shiftsByDate.has(cursor)) {
    count += 1;
    cursor = shiftDate(cursor, -1);
  }
  return count;
}

/** 対象日を含む直近 N 件のシフトのうち、本来所属施設ではない施設で働いた回数。 */
function countRecentHelp(employee: Employee, sortedShifts: ShiftEntry[], targetIndex: number): number {
  const start = Math.max(0, targetIndex - HELP_WINDOW + 1);
  let count = 0;
  for (let i = start; i <= targetIndex; i += 1) {
    if (sortedShifts[i].facility !== employee.mainFacility) count += 1;
  }
  return count;
}

/**
 * 従業員一人の全シフトから、対象シフト時点でのアバターの表情(mood)を判定する。
 * 優先順位: unhappy > tired > neutral > happy (該当した時点で確定)
 */
export function computeMoodForShift(
  employee: Employee,
  employeeShiftsSorted: ShiftEntry[],
  targetShift: ShiftEntry,
): MoodResult {
  const shiftsByDate = new Map(employeeShiftsSorted.map((s) => [s.date, s]));
  const targetIndex = employeeShiftsSorted.findIndex((s) => s.id === targetShift.id);

  const consecutiveDays = countConsecutiveDays(shiftsByDate, targetShift.date);
  const helpCountRecent = countRecentHelp(employee, employeeShiftsSorted, targetIndex);
  const isRequestedDayOff = employee.desiredDaysOff.includes(targetShift.day);
  const isRequestedOffDate = employee.desiredOffDates.includes(targetShift.date);
  const isFullyUnfamiliar =
    targetShift.facility !== employee.mainFacility && !employee.crossTrained.includes(targetShift.facility);
  const overrun = consecutiveDays - employee.maxConsecutiveDays;

  const reasons: MoodReason[] = [];

  if (isRequestedOffDate) {
    reasons.push({ key: 'offDateRequested' });
    return { mood: 'unhappy', reasons, consecutiveDays, helpCountRecent };
  }
  if (isRequestedDayOff) {
    reasons.push({ key: 'offWeekdayRequested' });
    return { mood: 'unhappy', reasons, consecutiveDays, helpCountRecent };
  }
  if (overrun >= SEVERE_OVERRUN) {
    reasons.push({ key: 'severeOverrun', params: { max: employee.maxConsecutiveDays, overrun } });
    return { mood: 'unhappy', reasons, consecutiveDays, helpCountRecent };
  }
  if (!targetShift.isDesired && isFullyUnfamiliar) {
    reasons.push({ key: 'unfamiliarHelpUndesired' });
    return { mood: 'unhappy', reasons, consecutiveDays, helpCountRecent };
  }

  if (consecutiveDays >= 4) {
    reasons.push({ key: 'consecutiveDays', params: { n: consecutiveDays } });
    return { mood: 'tired', reasons, consecutiveDays, helpCountRecent };
  }
  if (overrun >= 1) {
    reasons.push({ key: 'overrun', params: { max: employee.maxConsecutiveDays } });
    return { mood: 'tired', reasons, consecutiveDays, helpCountRecent };
  }
  if (helpCountRecent >= 2) {
    reasons.push({ key: 'unfamiliarHelpContinuing' });
    return { mood: 'tired', reasons, consecutiveDays, helpCountRecent };
  }

  if (!targetShift.isDesired) {
    reasons.push({ key: 'adjustedFromDesired' });
    return { mood: 'neutral', reasons, consecutiveDays, helpCountRecent };
  }
  if (helpCountRecent === 1) {
    reasons.push({ key: 'helpOnce' });
    return { mood: 'neutral', reasons, consecutiveDays, helpCountRecent };
  }

  reasons.push({ key: 'allGood' });
  return { mood: 'happy', reasons, consecutiveDays, helpCountRecent };
}

export function computeMoodMap(
  employees: Employee[],
  shifts: ShiftEntry[],
): Map<string, MoodResult> {
  const result = new Map<string, MoodResult>();
  const byEmployee = new Map<string, ShiftEntry[]>();

  for (const shift of shifts) {
    const list = byEmployee.get(shift.employeeId) ?? [];
    list.push(shift);
    byEmployee.set(shift.employeeId, list);
  }

  for (const employee of employees) {
    const list = (byEmployee.get(employee.id) ?? []).slice().sort((a, b) => a.date.localeCompare(b.date));
    for (const shift of list) {
      result.set(shift.id, computeMoodForShift(employee, list, shift));
    }
  }

  return result;
}

export const MOOD_COLOR: Record<string, string> = {
  happy: 'var(--color-jade)',
  neutral: 'var(--color-paper-dim)',
  tired: 'var(--color-gold)',
  unhappy: 'var(--color-seal)',
};
