import { dateRange } from '../lib/format';

// アプリ全体で扱うシフト対象期間。売上データ(finance_revenue、マネージャー専用)が
// 見えない従業員ロールでも同じ期間のカレンダーを操作できるよう、日付範囲は
// DBのデータ有無に依存しない固定値として持つ。
export const CALENDAR_START = '2026-08-01';
export const CALENDAR_END = '2026-12-31';

export const CALENDAR_DATES = dateRange(CALENDAR_START, CALENDAR_END);
