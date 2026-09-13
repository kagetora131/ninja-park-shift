import { FACILITY_COLOR, sortEmployeesByFacility } from '../data/facilities';
import { NinjaAvatar } from './NinjaAvatar';
import { computeCoverageRows, summarizeCoverageByDate } from '../lib/postCoverage';
import { useLabelContext } from '../hooks/LabelContext';
import type { ShiftDraft } from './ShiftEditModal';
import type { Employee, PostRequirements, ShiftEntry } from '../types';

interface ShiftOverviewGridProps {
  employees: Employee[];
  shifts: ShiftEntry[];
  postRequirements: PostRequirements;
  dates: string[];
  onEditShift: (shift: ShiftEntry) => void;
  onCreateShift: (draft: ShiftDraft) => void;
}

/** 俯瞰モード：勤務／休み／不足だけを示すコンパクトな月間ヒートマップ。 */
export function ShiftOverviewGrid({
  employees,
  shifts,
  postRequirements,
  dates,
  onEditShift,
  onCreateShift,
}: ShiftOverviewGridProps) {
  const { employeeName, facilityName, t } = useLabelContext();
  const sortedEmployees = sortEmployeesByFacility(employees);

  const shiftByKey = new Map<string, ShiftEntry>();
  for (const s of shifts) shiftByKey.set(`${s.date}_${s.employeeId}`, s);

  const coverageRows = computeCoverageRows(dates, shifts, postRequirements);
  const dateSummary = summarizeCoverageByDate(coverageRows);

  return (
    <div className="space-y-2">
      <div className="max-h-[70vh] overflow-auto rounded-xl border border-paper/10">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 min-w-[160px] border-b border-r border-paper/10 bg-void-soft px-2 py-2 text-left font-medium text-paper-dim">
                {t('shiftBoard.staffHeader')}
              </th>
              {dates.map((date) => {
                const summary = dateSummary.get(date);
                return (
                  <th
                    key={date}
                    className="sticky top-0 z-20 min-w-[30px] border-b border-r border-paper/10 bg-void-soft px-0.5 py-2 text-center font-medium text-paper-dim"
                  >
                    <span
                      className={`mx-auto mb-1 block h-1.5 w-1.5 rounded-full ${
                        summary === 'short' ? 'bg-seal' : summary === 'over' ? 'bg-gold' : 'bg-jade/30'
                      }`}
                    />
                    {Number(date.slice(-2))}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedEmployees.map((emp) => (
              <tr key={emp.id} className="odd:bg-void/30">
                <td
                  className="sticky left-0 z-10 border-b border-r border-paper/10 bg-void-soft px-2 py-1.5"
                  style={{ borderLeft: `3px solid ${FACILITY_COLOR[emp.mainFacility]}` }}
                >
                  <div className="flex items-center gap-2">
                    <NinjaAvatar employee={emp} mood="neutral" size="sm" />
                    <span className="truncate text-xs text-paper">{employeeName(emp)}</span>
                  </div>
                </td>
                {dates.map((date) => {
                  const shift = shiftByKey.get(`${date}_${emp.id}`);
                  return (
                    <td key={date} className="border-b border-r border-paper/5 p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          shift
                            ? onEditShift(shift)
                            : onCreateShift({ mode: 'create', date, facility: emp.mainFacility, employeeId: emp.id })
                        }
                        title={
                          shift
                            ? t('overview.workingTitle', { facility: facilityName(shift.facility), start: shift.start, end: shift.end })
                            : t('overview.offTitle')
                        }
                        className="flex h-6 w-full items-center justify-center rounded-sm transition hover:brightness-125"
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-sm border border-dashed border-paper/10"
                          style={shift ? { background: FACILITY_COLOR[shift.facility], border: 'none' } : undefined}
                        />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-paper-dim">{t('overview.legend')}</p>
    </div>
  );
}
