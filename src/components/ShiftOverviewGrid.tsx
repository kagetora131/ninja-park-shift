import { useEffect, useRef } from 'react';
import { FACILITY_COLOR, sortEmployeesByFacility } from '../data/facilities';
import { NinjaAvatar } from './NinjaAvatar';
import { computeCoverageRows, summarizeCoverageByDate } from '../lib/postCoverage';
import { todayLocalIso } from '../lib/format';
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
  /** ドラッグ中、指の下にあるマスの印(`${employeeId}_${date}`) */
  highlightCell?: string | null;
}

/** 俯瞰モード：勤務／休み／不足だけを示すコンパクトな月間ヒートマップ。 */
export function ShiftOverviewGrid({
  employees,
  shifts,
  postRequirements,
  dates,
  onEditShift,
  onCreateShift,
  highlightCell,
}: ShiftOverviewGridProps) {
  const { employeeName, facilityName, t } = useLabelContext();
  const sortedEmployees = sortEmployeesByFacility(employees);
  const columnRefs = useRef(new Map<string, HTMLTableCellElement>());

  const shiftByKey = new Map<string, ShiftEntry>();
  for (const s of shifts) shiftByKey.set(`${s.date}_${s.employeeId}`, s);

  // この月のシフトが1件も無いときは、全日が「不足」の赤になってしまうので、充足の判定をしない
  const dateSet = new Set(dates);
  const monthHasShifts = shifts.some((s) => dateSet.has(s.date));
  const coverageRows = monthHasShifts ? computeCoverageRows(dates, shifts, postRequirements) : [];
  const dateSummary = summarizeCoverageByDate(coverageRows);

  // 開いたとき、今日の列が横スクロールの中央に来るように合わせる(今月が対象外なら何もしない)
  useEffect(() => {
    const today = todayLocalIso();
    if (!dates.includes(today)) return;
    columnRefs.current.get(today)?.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      <div data-dnd-scroll className="max-h-[70vh] overflow-auto rounded-xl border border-paper/10">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 min-w-[96px] border-b border-r border-paper/10 bg-void-soft px-2 py-2 text-left font-medium text-paper-dim sm:min-w-[160px]">
                {t('shiftBoard.staffHeader')}
              </th>
              {dates.map((date) => {
                const summary = dateSummary.get(date);
                return (
                  <th
                    key={date}
                    ref={(el) => {
                      if (el) columnRefs.current.set(date, el);
                      else columnRefs.current.delete(date);
                    }}
                    className="sticky top-0 z-20 min-w-[44px] border-b border-r border-paper/10 bg-void-soft px-0.5 py-2 text-center font-medium text-paper-dim sm:min-w-[30px]"
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
                  {/* スマホ: 顔+名前を縦に並べた細い列。PC: 今までどおり横並び */}
                  <div
                    className="flex flex-col items-center gap-0.5 sm:hidden"
                    data-dnd="staff"
                    data-employee-id={emp.id}
                    data-dnd-label={employeeName(emp)}
                  >
                    <NinjaAvatar employee={emp} mood="neutral" size="xs" />
                    <span className="max-w-[80px] truncate text-xs text-paper">{employeeName(emp)}</span>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <NinjaAvatar employee={emp} mood="neutral" size="sm" />
                    <span className="truncate text-xs text-paper">{employeeName(emp)}</span>
                  </div>
                </td>
                {dates.map((date) => {
                  const shift = shiftByKey.get(`${date}_${emp.id}`);
                  return (
                    <td
                      key={date}
                      data-drop-cell
                      data-employee-id={emp.id}
                      data-date={date}
                      className={`border-b border-r border-paper/5 p-0.5 ${
                        highlightCell === `${emp.id}_${date}` ? 'bg-gold/20 shadow-[inset_0_0_0_2px_var(--color-gold)]' : ''
                      }`}
                    >
                      <button
                        type="button"
                        data-compact
                        {...(shift
                          ? { 'data-dnd': 'shift', 'data-shift-id': shift.id, 'data-dnd-label': `${employeeName(emp)} ${shift.start}–${shift.end}` }
                          : {})}
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
                        className="flex h-10 w-full items-center justify-center rounded-sm transition hover:brightness-125 sm:h-6"
                      >
                        <span
                          className="h-5 w-5 rounded-sm border border-dashed border-paper/10 sm:h-3.5 sm:w-3.5"
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
      <p className="text-xs text-paper-dim sm:text-[11px]">{t('overview.legend')}</p>
    </div>
  );
}
