import { shiftDate } from './format';
import type { Employee, MoodResult, ShiftEntry } from '../types';

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

  const reasons: string[] = [];

  if (isRequestedOffDate) {
    reasons.push('カレンダーで指定した希望休みの日に出勤している');
    return { mood: 'unhappy', reasons, consecutiveDays, helpCountRecent };
  }
  if (isRequestedDayOff) {
    reasons.push('希望休みの曜日に出勤している');
    return { mood: 'unhappy', reasons, consecutiveDays, helpCountRecent };
  }
  if (overrun >= SEVERE_OVERRUN) {
    reasons.push(`連勤上限(${employee.maxConsecutiveDays}日)を${overrun}日超過`);
    return { mood: 'unhappy', reasons, consecutiveDays, helpCountRecent };
  }
  if (!targetShift.isDesired && isFullyUnfamiliar) {
    reasons.push('希望と異なり、未経験の施設へ応援に入っている');
    return { mood: 'unhappy', reasons, consecutiveDays, helpCountRecent };
  }

  if (consecutiveDays >= 4) {
    reasons.push(`${consecutiveDays}連勤目`);
    return { mood: 'tired', reasons, consecutiveDays, helpCountRecent };
  }
  if (overrun >= 1) {
    reasons.push(`連勤上限(${employee.maxConsecutiveDays}日)を超過`);
    return { mood: 'tired', reasons, consecutiveDays, helpCountRecent };
  }
  if (helpCountRecent >= 2) {
    reasons.push('不慣れな施設への応援が続いている');
    return { mood: 'tired', reasons, consecutiveDays, helpCountRecent };
  }

  if (!targetShift.isDesired) {
    reasons.push('希望と少し異なるシフト調整あり');
    return { mood: 'neutral', reasons, consecutiveDays, helpCountRecent };
  }
  if (helpCountRecent === 1) {
    reasons.push('他施設への応援が1回ある');
    return { mood: 'neutral', reasons, consecutiveDays, helpCountRecent };
  }

  reasons.push('希望通りのシフトで、連勤も無理がない');
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

export const MOOD_LABEL: Record<string, string> = {
  happy: '上機嫌',
  neutral: '普通',
  tired: '疲れ気味',
  unhappy: '不満',
};

export const MOOD_COLOR: Record<string, string> = {
  happy: 'var(--color-jade)',
  neutral: 'var(--color-paper-dim)',
  tired: 'var(--color-gold)',
  unhappy: 'var(--color-seal)',
};
