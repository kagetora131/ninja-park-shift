import { FACILITY_ORDER } from '../data/facilities';
import { weekdayJp } from './format';
import type { FacilityId, PostRequirements, ShiftEntry } from '../types';

export type CoverageStatus = 'empty' | 'understaffed' | 'overstaffed';

export interface CoverageRow {
  date: string;
  facility: FacilityId;
  required: number;
  actual: number;
  status: CoverageStatus;
}

/** 「不在」→「不足」→「過多」の固定順。グループ内の並び替えに使う。 */
export const COVERAGE_STATUS_ORDER: Record<CoverageStatus, number> = { empty: 0, understaffed: 1, overstaffed: 2 };

/** 指定期間の各日付×施設について、ポスト設定の必要人数と実配置人数を比較し、一致しない組み合わせだけを返す。 */
export function computeCoverageRows(
  dates: string[],
  shifts: ShiftEntry[],
  postRequirements: PostRequirements,
): CoverageRow[] {
  const rows: CoverageRow[] = [];

  for (const date of dates) {
    const weekday = weekdayJp(date);

    for (const facility of FACILITY_ORDER) {
      const required = postRequirements[weekday]?.[facility];
      if (required == null) continue;
      const actual = shifts.filter((s) => s.date === date && s.facility === facility).length;
      if (actual === required) continue;
      rows.push({
        date,
        facility,
        required,
        actual,
        status: actual === 0 ? 'empty' : actual < required ? 'understaffed' : 'overstaffed',
      });
    }
  }

  return rows.sort((a, b) => a.date.localeCompare(b.date) || COVERAGE_STATUS_ORDER[a.status] - COVERAGE_STATUS_ORDER[b.status]);
}

/** 日付ごとの充足状況サマリー(俯瞰モードの見出しドット等に使う)。 */
export type DateCoverageSummary = 'short' | 'over' | 'ok';

export function summarizeCoverageByDate(rows: CoverageRow[]): Map<string, DateCoverageSummary> {
  const byDate = new Map<string, DateCoverageSummary>();
  for (const row of rows) {
    const current = byDate.get(row.date);
    if (row.status === 'empty' || row.status === 'understaffed') {
      byDate.set(row.date, 'short');
    } else if (current !== 'short') {
      byDate.set(row.date, 'over');
    }
  }
  return byDate;
}
