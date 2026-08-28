import type { ShiftEntry } from '../types';

export const OPEN_HOUR = 9;
export const CLOSE_HOUR = 18;
const DEFAULT_MIN_STAFF = 1;

export interface HourlyCoverage {
  hour: number;
  count: number;
  required: number;
  isShort: boolean;
}

function toDecimalHours(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h + m / 60;
}

/**
 * 営業時間帯(9-18時)を1時間刻みで区切り、各時間帯の必要最低人数を満たしているか判定する。
 * 必要人数が未設定の場合は「最低1名」を既定値とする。
 */
export function computeHourlyCoverage(facilityShifts: ShiftEntry[], required: number | null | undefined): HourlyCoverage[] {
  const effectiveRequired = required ?? DEFAULT_MIN_STAFF;
  const hours: HourlyCoverage[] = [];
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h += 1) {
    const count = facilityShifts.filter((s) => {
      const start = toDecimalHours(s.start);
      const end = toDecimalHours(s.end);
      return start <= h && end > h;
    }).length;
    hours.push({ hour: h, count, required: effectiveRequired, isShort: count < effectiveRequired });
  }
  return hours;
}

export function summarizeShortHours(hourly: HourlyCoverage[]): number[] {
  return hourly.filter((h) => h.isShort).map((h) => h.hour);
}
