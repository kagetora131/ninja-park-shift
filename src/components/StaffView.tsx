import { Plus } from 'lucide-react';
import { NinjaAvatar } from './NinjaAvatar';
import { FACILITIES } from '../data/facilities';
import { FACILITY_ICON } from './facilityIcon';
import { facilityShortLabel } from '../lib/i18n';
import { useLabelContext } from '../hooks/LabelContext';
import type { Employee } from '../types';

interface StaffViewProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onCreate: () => void;
}

export function StaffView({ employees, onEdit, onCreate }: StaffViewProps) {
  const { locale, employeeName, facilityName, roleName, t } = useLabelContext();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mincho text-sm font-bold text-paper">{t('staff.heading', { n: employees.length })}</h2>
        <button
          type="button"
          onClick={onCreate}
          className="flex items-center gap-1.5 rounded-full border border-gold/50 px-3 py-1.5 text-xs text-gold transition hover:bg-gold/10"
        >
          <Plus size={14} />
          {t('staff.hire')}
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
                <p className="truncate text-sm font-medium text-paper">{employeeName(employee)}</p>
                <p className="text-[11px] text-paper-dim">
                  {roleName(employee.role)}
                  {employee.isTrainee && <span className="ml-1 text-gold">{t('staff.traineeSuffix')}</span>}
                </p>
                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-gold">
                  <MainIcon size={12} />
                  {facilityName(employee.mainFacility)}
                </div>
                {employee.crossTrained.length > 0 && (
                  <p className="mt-1 text-[10px] text-paper-dim">
                    {t('staff.crossTrainedPrefix', {
                      list: employee.crossTrained
                        .map((f) => facilityShortLabel(f, FACILITIES[f].shortName, locale))
                        .join(locale === 'en' ? ', ' : '・'),
                    })}
                  </p>
                )}
                <p className="mt-1 text-[10px] text-paper-dim">
                  {t('shiftBoard.desiredWorkAndMax', { days: employee.desiredWorkDaysPerWeek, max: employee.maxConsecutiveDays })}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
