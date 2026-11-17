import { BottomSheet } from './BottomSheet';
import { NinjaAvatar } from './NinjaAvatar';
import { FACILITIES, FACILITY_COLOR, capableFacilities } from '../data/facilities';
import { WEEKDAYS } from '../data/constants';
import { facilityShortLabel, weekdayLabel } from '../lib/i18n';
import { useLabelContext } from '../hooks/LabelContext';
import type { Employee } from '../types';

interface StaffInfoSheetProps {
  employee: Employee;
  onClose: () => void;
}

/** スマホのシフト表で、細いスタッフ欄に入りきらない「希望勤務日数・希望休み曜日・対応施設」を見せる窓。 */
export function StaffInfoSheet({ employee, onClose }: StaffInfoSheetProps) {
  const { locale, employeeName, facilityName, t } = useLabelContext();
  const name = employeeName(employee);

  return (
    <BottomSheet title={t('staffInfo.heading', { name })} onClose={onClose}>
      <div className="flex items-center gap-3">
        <NinjaAvatar employee={employee} mood="neutral" size="md" />
        <div className="min-w-0">
          <p className="font-mincho text-base font-bold text-paper">{name}</p>
          <p className="text-xs text-paper-dim">
            {t('shiftBoard.desiredWorkAndMax', { days: employee.desiredWorkDaysPerWeek, max: employee.maxConsecutiveDays })}
          </p>
        </div>
      </div>

      <p className="mb-1 mt-4 text-xs font-medium text-paper-dim">{t('common.desiredDaysOff')}</p>
      <div className="flex gap-1.5">
        {WEEKDAYS.map((day) => {
          const isOff = employee.desiredDaysOff.includes(day);
          const dayLabel = weekdayLabel(day, locale);
          return (
            <span
              key={day}
              title={isOff ? t('shiftBoard.offWeekdayTitle', { day: dayLabel }) : dayLabel}
              className={`flex h-8 w-8 items-center justify-center rounded-md text-xs ${
                isOff ? 'bg-seal/25 text-seal-bright' : 'bg-void text-paper-dim/60'
              }`}
            >
              {locale === 'ja' ? day : dayLabel.slice(0, 1)}
            </span>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {capableFacilities(employee).map((f) => {
          const isMain = f === employee.mainFacility;
          return (
            <span
              key={f}
              title={
                isMain
                  ? t('shiftBoard.mainFacilityBadge', { facility: facilityName(f) })
                  : t('shiftBoard.helpFacilityBadge', { facility: facilityName(f) })
              }
              className={`rounded-full px-3 py-1 text-xs ${isMain ? 'text-void' : 'border border-dashed'}`}
              style={isMain ? { background: FACILITY_COLOR[f] } : { borderColor: FACILITY_COLOR[f], color: FACILITY_COLOR[f] }}
            >
              {facilityShortLabel(f, FACILITIES[f].shortName, locale)}
            </span>
          );
        })}
      </div>
    </BottomSheet>
  );
}
