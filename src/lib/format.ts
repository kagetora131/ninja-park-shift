export function formatYen(value: number): string {
  return `¥${value.toLocaleString('ja-JP')}`;
}

export function formatDateJp(date: string, day: string): string {
  const [, month, d] = date.split('-');
  return `${Number(month)}/${Number(d)}(${day})`;
}

/** "YYYY-MM-DD" を、タイムゾーンの影響を受けない UTC 基準の Date にパースする。 */
function toUtcDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

/** "YYYY-MM-DD" から deltaDays 日ずらした日付文字列を返す(UTC基準、ローカルTZに依存しない)。 */
export function shiftDate(date: string, deltaDays: number): string {
  const d = toUtcDate(date);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

export function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor = toUtcDate(start);
  const last = toUtcDate(end);
  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

const WEEKDAY_JP = ['日', '月', '火', '水', '木', '金', '土'];

export function weekdayJp(date: string): string {
  return WEEKDAY_JP[toUtcDate(date).getUTCDay()];
}
