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

/**
 * カレンダー系の画面(シフト表・自分のシフト・健全性スコア)を開いた瞬間に
 * 最初に表示すべき年月。「実際の今月」を対象期間(CALENDAR_START〜CALENDAR_END)
 * にクリップして返す(常にCALENDAR_STARTに戻ってしまうと、開くたびに過去月が
 * 表示されてしまうため)。対象期間より前なら開始月、後なら終了月にフォールバックする。
 */
export function defaultView(): { year: number; month: number } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const key = year * 12 + month;
  const startKey = CALENDAR_START_YEAR * 12 + CALENDAR_START_MONTH;
  const endKey = CALENDAR_END_YEAR * 12 + CALENDAR_END_MONTH;
  if (key < startKey) return { year: CALENDAR_START_YEAR, month: CALENDAR_START_MONTH };
  if (key > endKey) return { year: CALENDAR_END_YEAR, month: CALENDAR_END_MONTH };
  return { year, month };
}
