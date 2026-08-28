import { SALARY_WORKING_DAYS_PER_MONTH } from '../data/constants';
import type { Employee, FacilityId, ShiftEntry, WageSettings } from '../types';

/**
 * 1件のシフトの人件費(研修中 > 社員月給の日割り > ポジション別時給、の優先順位)。
 * 社員はその日に働いた施設数で月給の日割り分を均等に按分する。
 */
export function computeShiftCost(
  shift: ShiftEntry,
  employee: Employee | undefined,
  wageSettings: WageSettings,
  facilitiesWorkedThatDay = 1,
): number {
  if (!employee) return 0;

  if (employee.isTrainee) {
    return shift.actualHours * wageSettings.traineeHourlyWage;
  }

  if (employee.role === '社員') {
    const dailyPortion = wageSettings.fulltimeMonthlySalary / SALARY_WORKING_DAYS_PER_MONTH;
    return dailyPortion / Math.max(facilitiesWorkedThatDay, 1);
  }

  const rate = wageSettings.facilityRates[shift.facility] ?? wageSettings.facilityRates.goods;
  return shift.actualHours * rate;
}

/** 指定日・指定施設に配置された全シフトの人件費合計。 */
export function computeFacilityLaborCost(
  shifts: ShiftEntry[],
  employeeMap: Map<string, Employee>,
  date: string,
  facility: FacilityId,
  wageSettings: WageSettings,
): number {
  const shiftsThatDay = shifts.filter((s) => s.date === date);
  const facilitiesWorkedByEmployee = new Map<string, Set<FacilityId>>();
  for (const s of shiftsThatDay) {
    const set = facilitiesWorkedByEmployee.get(s.employeeId) ?? new Set<FacilityId>();
    set.add(s.facility);
    facilitiesWorkedByEmployee.set(s.employeeId, set);
  }

  return shiftsThatDay
    .filter((s) => s.facility === facility)
    .reduce((sum, s) => {
      const employee = employeeMap.get(s.employeeId);
      const facilitiesWorkedThatDay = facilitiesWorkedByEmployee.get(s.employeeId)?.size ?? 1;
      return sum + computeShiftCost(s, employee, wageSettings, facilitiesWorkedThatDay);
    }, 0);
}
