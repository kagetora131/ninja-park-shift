import { FACILITY_COLOR, FACILITY_ORDER } from '../data/facilities';
import { useLabelContext } from '../hooks/LabelContext';

/** 施設の色の凡例(色の四角+施設名)。色だけでは分からないので、スマホの表のすぐ上に常に出す。 */
export function FacilityLegend() {
  const { facilityName, t } = useLabelContext();
  return (
    <ul
      aria-label={t('shiftBoard.facilityLegendLabel')}
      className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-paper-dim sm:hidden"
    >
      {FACILITY_ORDER.map((f) => (
        <li key={f} className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: FACILITY_COLOR[f] }} />
          {facilityName(f)}
        </li>
      ))}
    </ul>
  );
}
