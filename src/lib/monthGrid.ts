import { CALENDAR_START, CALENDAR_END } from '../data/calendarRange';
import { dateRange } from './format';

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export const [CALENDAR_START_YEAR, CALENDAR_START_MONTH] = CALENDAR_START.split('-').map(Number);
export const [CALENDAR_END_YEAR, CALENDAR_END_MONTH] = CALENDAR_END.split('-').map(Number);

/** 指定した年月の全日付を、アプリ全体の対象期間(CALENDAR_START〜CALENDAR_END)にクリップして返す。 */
export function datesInMonth(year: number, month: number): string[] {
  const first = `${year}-${pad2(month)}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const last = `${year}-${pad2(month)}-${pad2(lastDay)}`;
  const start = first < CALENDAR_START ? CALENDAR_START : first;
  const end = last > CALENDAR_END ? CALENDAR_END : last;
  return dateRange(start, end);
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}
