import { WEEKDAYS, SALARY_WORKING_DAYS_PER_MONTH } from '../data/constants';
import { FACILITY_COLOR, FACILITY_ORDER } from '../data/facilities';
import { weekdayLabel } from '../lib/i18n';
import { useLabelContext } from '../hooks/LabelContext';
import type { FacilityId, PostRequirements, WageSettings } from '../types';

interface PostRequirementEditorProps {
  wageSettings: WageSettings;
  postRequirements: PostRequirements;
  onChangeFacilityRate: (facility: FacilityId, value: number) => void;
  onChangeTraineeHourlyWage: (value: number) => void;
  onChangeFulltimeMonthlySalary: (value: number) => void;
  onChangePostRequirement: (weekday: string, facility: FacilityId, value: number | null) => void;
}

export function PostRequirementEditor({
  wageSettings,
  postRequirements,
  onChangeFacilityRate,
  onChangeTraineeHourlyWage,
  onChangeFulltimeMonthlySalary,
  onChangePostRequirement,
}: PostRequirementEditorProps) {
  const { locale, facilityName, t } = useLabelContext();
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-paper/10 bg-void-soft/50 p-4">
        <h2 className="font-mincho text-sm font-bold text-paper">{t('posts.wageHeading')}</h2>
        <p className="mt-1 text-xs text-paper-dim">{t('posts.wageDescription')}</p>

        <div className="mt-4 space-y-2.5">
          {FACILITY_ORDER.map((f) => (
            <div key={f} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-paper">
                <span className="h-2 w-2 rounded-full" style={{ background: FACILITY_COLOR[f] }} />
                {t('posts.facilityStaffSuffix', { facility: facilityName(f) })}
              </span>
              <label className="flex items-center gap-1.5 text-xs text-paper-dim">
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={wageSettings.facilityRates[f]}
                  onChange={(e) => onChangeFacilityRate(f, Number(e.target.value))}
                  className="w-24 rounded-md border border-paper/20 bg-void px-2 py-1 text-right text-paper focus:border-gold focus:outline-none"
                />
                {t('posts.yenPerHour')}
              </label>
            </div>
          ))}

          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-paper">{t('posts.traineeStaff')}</span>
            <label className="flex items-center gap-1.5 text-xs text-paper-dim">
              <input
                type="number"
                min={0}
                step={10}
                value={wageSettings.traineeHourlyWage}
                onChange={(e) => onChangeTraineeHourlyWage(Number(e.target.value))}
                className="w-24 rounded-md border border-paper/20 bg-void px-2 py-1 text-right text-paper focus:border-gold focus:outline-none"
              />
              {t('posts.yenPerHour')}
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-paper">{t('posts.fulltimeStaff')}</span>
            <label className="flex items-center gap-1.5 text-xs text-paper-dim">
              <input
                type="number"
                min={0}
                step={1000}
                value={wageSettings.fulltimeMonthlySalary}
                onChange={(e) => onChangeFulltimeMonthlySalary(Number(e.target.value))}
                className="w-28 rounded-md border border-paper/20 bg-void px-2 py-1 text-right text-paper focus:border-gold focus:outline-none"
              />
              {t('posts.yenPerMonthSuffix', { days: SALARY_WORKING_DAYS_PER_MONTH })}
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-paper/10 bg-void-soft/50 p-4">
        <h2 className="font-mincho text-sm font-bold text-paper">{t('posts.requirementsHeading')}</h2>
        <p className="mt-1 text-xs text-paper-dim">{t('posts.requirementsDescription')}</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs text-paper-dim">
                <th className="py-1.5 pr-3 font-medium">{t('posts.weekdayHeader')}</th>
                {FACILITY_ORDER.map((f) => (
                  <th key={f} className="px-2 py-1.5 font-medium">
                    {facilityName(f)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WEEKDAYS.map((day) => (
                <tr key={day} className="border-t border-paper/10">
                  <th scope="row" className="py-1.5 pr-3 text-left text-xs font-medium text-paper">
                    {weekdayLabel(day, locale)}
                  </th>
                  {FACILITY_ORDER.map((f) => (
                    <td key={f} className="px-2 py-1.5">
                      <input
                        type="number"
                        min={0}
                        max={20}
                        placeholder="―"
                        value={postRequirements[day]?.[f] ?? ''}
                        onChange={(e) =>
                          onChangePostRequirement(day, f, e.target.value === '' ? null : Number(e.target.value))
                        }
                        className="w-16 rounded-md border border-paper/20 bg-void px-2 py-1 text-center text-sm text-paper focus:border-gold focus:outline-none"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
