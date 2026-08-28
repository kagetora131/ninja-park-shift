import { GripVertical } from 'lucide-react';
import { NinjaAvatar } from './NinjaAvatar';
import { FACILITIES, capableFacilities } from '../data/facilities';
import { EMPLOYEE_DRAG_MIME } from '../lib/dragDrop';
import type { Employee, ShiftEntry } from '../types';

interface ShiftRosterPanelProps {
  employees: Employee[];
  day: string;
  shiftsToday: ShiftEntry[];
  onDragStartEmployee: (id: string) => void;
  onDragEndEmployee: () => void;
}

export function ShiftRosterPanel({
  employees,
  day,
  shiftsToday,
  onDragStartEmployee,
  onDragEndEmployee,
}: ShiftRosterPanelProps) {
  const shiftsByEmployeeId = new Map<string, ShiftEntry[]>();
  for (const shift of shiftsToday) {
    const list = shiftsByEmployeeId.get(shift.employeeId) ?? [];
    list.push(shift);
    shiftsByEmployeeId.set(shift.employeeId, list);
  }

  const sorted = [...employees].sort((a, b) => {
    const aAssigned = shiftsByEmployeeId.has(a.id) ? 1 : 0;
    const bAssigned = shiftsByEmployeeId.has(b.id) ? 1 : 0;
    return aAssigned - bAssigned || a.name.localeCompare(b.name, 'ja');
  });

  return (
    <div className="w-full shrink-0 rounded-xl border border-paper/10 bg-void-soft/50 p-3 lg:w-72">
      <p className="mb-3 px-1 text-[11px] leading-snug text-paper-dim">
        <GripVertical size={12} className="mr-1 inline -translate-y-px" />
        忍者をつまんで施設へドラッグ配置。配置済みのカードも別施設へドラッグで移動できます。
      </p>
      <div className="max-h-[70vh] space-y-1.5 overflow-y-auto pr-1 lg:max-h-[calc(100vh-14rem)]">
        {sorted.map((employee) => {
          const assigned = shiftsByEmployeeId.get(employee.id) ?? [];
          const isOffDayWish = employee.desiredDaysOff.includes(day);
          const capable = capableFacilities(employee);

          return (
            <div
              key={employee.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(EMPLOYEE_DRAG_MIME, employee.id);
                e.dataTransfer.effectAllowed = 'move';
                onDragStartEmployee(employee.id);
              }}
              onDragEnd={onDragEndEmployee}
              className="flex cursor-grab items-center gap-2 rounded-lg border border-paper/10 bg-void/50 p-2 transition active:cursor-grabbing hover:border-gold/40"
            >
              <NinjaAvatar employee={employee} mood="neutral" size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-paper">{employee.name}</p>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {capable.map((f) => (
                    <span
                      key={f}
                      className="rounded-full px-1.5 py-[1px] text-[9px]"
                      style={{
                        color: FACILITIES[f].id === employee.mainFacility ? '#0a0d12' : undefined,
                        background:
                          f === employee.mainFacility ? 'var(--color-gold)' : 'transparent',
                        border: f === employee.mainFacility ? 'none' : '1px solid var(--color-paper-dim)',
                      }}
                      title={f === employee.mainFacility ? `所属: ${FACILITIES[f].name}` : `応援可: ${FACILITIES[f].name}`}
                    >
                      {FACILITIES[f].shortName}
                    </span>
                  ))}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {assigned.length > 0 ? (
                    <span className="rounded-full bg-jade/15 px-1.5 py-[1px] text-[9px] text-jade">
                      配置中：{assigned.map((s) => FACILITIES[s.facility].shortName).join('・')}
                    </span>
                  ) : (
                    <span className="rounded-full bg-paper/10 px-1.5 py-[1px] text-[9px] text-paper-dim">
                      未配置
                    </span>
                  )}
                  {isOffDayWish && (
                    <span className="rounded-full bg-seal/15 px-1.5 py-[1px] text-[9px] text-seal-bright">
                      休み希望日
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
