import { WEEKDAYS, SALARY_WORKING_DAYS_PER_MONTH } from '../data/constants';
import { FACILITIES, FACILITY_COLOR, FACILITY_ORDER } from '../data/facilities';
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
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-paper/10 bg-void-soft/50 p-4">
        <h2 className="font-mincho text-sm font-bold text-paper">ポジション別時給・給与</h2>
        <p className="mt-1 text-xs text-paper-dim">
          給与は従業員ごとではなく、ポジション(施設・雇用形態)ごとに設定します。収支の人件費はこの設定を使って自動計算されます。
        </p>

        <div className="mt-4 space-y-2.5">
          {FACILITY_ORDER.map((f) => (
            <div key={f} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-paper">
                <span className="h-2 w-2 rounded-full" style={{ background: FACILITY_COLOR[f] }} />
                {FACILITIES[f].name}スタッフ
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
                円/時
              </label>
            </div>
          ))}

          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-paper">研修中スタッフ(施設によらず一律)</span>
            <label className="flex items-center gap-1.5 text-xs text-paper-dim">
              <input
                type="number"
                min={0}
                step={10}
                value={wageSettings.traineeHourlyWage}
                onChange={(e) => onChangeTraineeHourlyWage(Number(e.target.value))}
                className="w-24 rounded-md border border-paper/20 bg-void px-2 py-1 text-right text-paper focus:border-gold focus:outline-none"
              />
              円/時
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-paper">社員(月給、稼働した日に日割りで按分)</span>
            <label className="flex items-center gap-1.5 text-xs text-paper-dim">
              <input
                type="number"
                min={0}
                step={1000}
                value={wageSettings.fulltimeMonthlySalary}
                onChange={(e) => onChangeFulltimeMonthlySalary(Number(e.target.value))}
                className="w-28 rounded-md border border-paper/20 bg-void px-2 py-1 text-right text-paper focus:border-gold focus:outline-none"
              />
              円/月(÷{SALARY_WORKING_DAYS_PER_MONTH}日で日割り)
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-paper/10 bg-void-soft/50 p-4">
        <h2 className="font-mincho text-sm font-bold text-paper">ポスト設定(曜日パターン)</h2>
        <p className="mt-1 text-xs text-paper-dim">
          曜日ごとに施設の必要人数を設定します。同じ曜日は期間中すべての日に適用されます。空欄は「設定なし」(過不足を表示しません)。
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs text-paper-dim">
                <th className="py-1.5 pr-3 font-medium">曜日</th>
                {FACILITY_ORDER.map((f) => (
                  <th key={f} className="px-2 py-1.5 font-medium">
                    {FACILITIES[f].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WEEKDAYS.map((day) => (
                <tr key={day} className="border-t border-paper/10">
                  <th scope="row" className="py-1.5 pr-3 text-left text-xs font-medium text-paper">
                    {day}
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
