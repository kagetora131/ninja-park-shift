import { capableFacilities, FACILITY_ORDER } from '../data/facilities';
import { SHIFT_PATTERNS } from '../data/shiftPatterns';
import { shiftDate, weekdayJp } from './format';
import type { NewShiftInput } from '../hooks/useShiftStore';
import type { Employee, FacilityId, PostRequirements, ShiftEntry } from '../types';

/** 修行アトラクションへの配置に必要な資格。 */
const AMUSE_QUALIFICATION = '手裏剣・忍具取り扱い研修修了';

export interface AutoAssignShortfall {
  date: string;
  facility: FacilityId;
  missing: number;
}

export interface AutoAssignResult {
  created: NewShiftInput[];
  shortfalls: AutoAssignShortfall[];
}

function pickDefaultPattern(facility: FacilityId) {
  return SHIFT_PATTERNS[facility].find((p) => p.kind === 'full') ?? SHIFT_PATTERNS[facility][0];
}

/** `workDates` に基づき、`date` の前日から遡って何日連続で勤務しているかを数える。 */
function priorConsecutiveStreak(workDates: Set<string>, date: string): number {
  let streak = 0;
  let cursor = shiftDate(date, -1);
  while (workDates.has(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

/**
 * 曜日×施設の必要人数(ポスト設定)を満たすように、指定期間の**空いているセルだけ**を埋める
 * 簡易な自動配置。既存のシフトは一切変更・削除しない(不足分の穴埋めのみ)。
 *
 * 優先順位(スコアが低いほど優先):
 * 1. 資格・対応可能施設を満たさない/その日は他施設で既に勤務/個別希望休み日 → 候補から除外(必須条件)
 * 2. 連勤上限を超える配置になる → 候補から除外(必須条件)
 * 3. 所属施設(応援ではない) を優先
 * 4. 希望休みの曜日ではないことを優先(やむを得ず希望休み曜日に入れる場合は isDesired=false にする)
 * 5. これまでの割当数が少ない人を優先(できるだけ均等に配分する)
 */
export function autoAssignShifts(
  employees: Employee[],
  existingShifts: ShiftEntry[],
  postRequirements: PostRequirements,
  dates: string[],
): AutoAssignResult {
  const created: NewShiftInput[] = [];
  const shortfalls: AutoAssignShortfall[] = [];

  const workDatesByEmployee = new Map<string, Set<string>>();
  for (const s of existingShifts) {
    const set = workDatesByEmployee.get(s.employeeId) ?? new Set<string>();
    set.add(s.date);
    workDatesByEmployee.set(s.employeeId, set);
  }

  const runAssignedCount = new Map<string, number>();

  const sortedDates = [...dates].sort();

  for (const date of sortedDates) {
    const weekday = weekdayJp(date);
    const existingToday = existingShifts.filter((s) => s.date === date);
    const workingTodayEmployeeIds = new Set(existingToday.map((s) => s.employeeId));

    for (const facility of FACILITY_ORDER) {
      const required = postRequirements[weekday]?.[facility];
      if (required == null || required <= 0) continue;

      const currentCount =
        existingToday.filter((s) => s.facility === facility).length +
        created.filter((c) => c.date === date && c.facility === facility).length;
      let need = required - currentCount;
      if (need <= 0) continue;

      const candidates = employees.filter((emp) => {
        if (workingTodayEmployeeIds.has(emp.id)) return false;
        if (!capableFacilities(emp).includes(facility)) return false;
        if (facility === 'amuse' && !emp.qualifications.includes(AMUSE_QUALIFICATION)) return false;
        if (emp.desiredOffDates.includes(date)) return false;
        const workDates = workDatesByEmployee.get(emp.id) ?? new Set<string>();
        if (priorConsecutiveStreak(workDates, date) + 1 > emp.maxConsecutiveDays) return false;
        return true;
      });

      candidates.sort((a, b) => {
        const scoreOf = (emp: Employee) => {
          let score = 0;
          if (emp.mainFacility !== facility) score += 10; // 応援より所属を優先
          if (emp.desiredDaysOff.includes(weekday)) score += 20; // 希望休みの曜日はできるだけ避ける
          score += runAssignedCount.get(emp.id) ?? 0; // 今回の割当が少ない人を優先(均等配分)
          return score;
        };
        return scoreOf(a) - scoreOf(b);
      });

      const chosen = candidates.slice(0, need);
      const pattern = pickDefaultPattern(facility);

      for (const emp of chosen) {
        const isDesired = !emp.desiredDaysOff.includes(weekday);
        created.push({
          date,
          employeeId: emp.id,
          facility,
          start: pattern.start,
          end: pattern.end,
          breakMinutes: pattern.breakMinutes,
          isDesired,
          note: isDesired ? undefined : '自動配置(希望休みの曜日のため要確認)',
        });
        workingTodayEmployeeIds.add(emp.id);
        const set = workDatesByEmployee.get(emp.id) ?? new Set<string>();
        set.add(date);
        workDatesByEmployee.set(emp.id, set);
        runAssignedCount.set(emp.id, (runAssignedCount.get(emp.id) ?? 0) + 1);
        need -= 1;
      }

      if (need > 0) {
        shortfalls.push({ date, facility, missing: need });
      }
    }
  }

  return { created, shortfalls };
}
