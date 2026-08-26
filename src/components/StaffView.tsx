import { Plus } from 'lucide-react';
import { NinjaAvatar } from './NinjaAvatar';
import { FACILITIES } from '../data/facilities';
import { FACILITY_ICON } from './facilityIcon';
import type { Employee } from '../types';

interface StaffViewProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onCreate: () => void;
}

export function StaffView({ employees, onEdit, onCreate }: StaffViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mincho text-sm font-bold text-paper">忍者名簿({employees.length}名)</h2>
        <button
          type="button"
          onClick={onCreate}
          className="flex items-center gap-1.5 rounded-full border border-gold/50 px-3 py-1.5 text-xs text-gold transition hover:bg-gold/10"
        >
          <Plus size={14} />
          新しい忍者を雇う
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {employees.map((employee) => {
          const MainIcon = FACILITY_ICON[employee.mainFacility];
          return (
            <button
              key={employee.id}
              type="button"
              onClick={() => onEdit(employee)}
              className="animate-rise flex items-start gap-3 rounded-xl border border-paper/10 bg-void-soft/50 p-4 text-left transition hover:border-gold/50"
            >
              <NinjaAvatar employee={employee} mood="happy" size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-paper">{employee.name}</p>
                <p className="text-[11px] text-paper-dim">{employee.role}</p>
                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-gold">
                  <MainIcon size={12} />
                  {FACILITIES[employee.mainFacility].name}
                </div>
                {employee.crossTrained.length > 0 && (
                  <p className="mt-1 text-[10px] text-paper-dim">
                    応援可：{employee.crossTrained.map((f) => FACILITIES[f].shortName).join('・')}
                  </p>
                )}
                <p className="mt-1 text-[10px] text-paper-dim">
                  週{employee.desiredWorkDaysPerWeek}日希望・連勤上限{employee.maxConsecutiveDays}日
                </p>
                {employee.wage && (
                  <p className="mt-1 text-[10px] text-paper-dim">{employee.wage}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
