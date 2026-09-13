import { sortEmployeesByFacility } from '../data/facilities';
import { NinjaAvatar } from './NinjaAvatar';
import { useLabelContext } from '../hooks/LabelContext';
import type { Employee, ShiftEntry } from '../types';

interface PersonalSummaryTableProps {
  employees: Employee[];
  shifts: ShiftEntry[];
  dates: string[];
}

/** `dates`(連続した暦日の配列)のうち、`workDates`に含まれる日が最大何日連続するかを数える。 */
function longestStreak(dates: string[], workDates: Set<string>): number {
  let max = 0;
  let current = 0;
  for (const date of dates) {
    if (workDates.has(date)) {
      current += 1;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }
  return max;
}

/** 個人モード：希望勤務日数・実勤務日数・最大連勤日数・応援回数を1行で比較できる表示(この月のみ集計)。 */
export function PersonalSummaryTable({ employees, shifts, dates }: PersonalSummaryTableProps) {
  const { employeeName, t } = useLabelContext();
  const sortedEmployees = sortEmployeesByFacility(employees);
  const dateSet = new Set(dates);

  const rows = sortedEmployees.map((emp) => {
    const empShifts = shifts.filter((s) => s.employeeId === emp.id && dateSet.has(s.date));
    const workDates = new Set(empShifts.map((s) => s.date));
    return {
      employee: emp,
      actual: empShifts.length,
      maxConsecutive: longestStreak(dates, workDates),
      help: empShifts.filter((s) => s.facility !== emp.mainFacility).length,
    };
  });

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-paper/10 bg-void-soft/50 p-4">
        <h3 className="font-mincho text-sm font-bold text-paper">{t('personal.heading')}</h3>
        <p className="mt-1 text-[11px] text-paper-dim">{t('personal.description')}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-paper/10">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="bg-void-soft text-left text-xs text-paper-dim">
              <th className="px-3 py-2 font-medium">{t('personal.colStaff')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('personal.colDesired')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('personal.colActual')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('personal.colMaxConsecutive')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('personal.colHelp')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ employee, actual, maxConsecutive, help }) => {
              const overLimit = maxConsecutive > employee.maxConsecutiveDays;
              return (
                <tr key={employee.id} className="border-t border-paper/10 odd:bg-void/20">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <NinjaAvatar employee={employee} mood="neutral" size="sm" />
                      <span className="text-paper">{employeeName(employee)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-paper-dim">{employee.desiredWorkDaysPerWeek}</td>
                  <td className="px-3 py-2 text-right text-paper">{actual}</td>
                  <td className={`px-3 py-2 text-right ${overLimit ? 'font-medium text-seal-bright' : 'text-paper'}`}>
                    {maxConsecutive} / {employee.maxConsecutiveDays}
                  </td>
                  <td className="px-3 py-2 text-right text-paper-dim">{help}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
