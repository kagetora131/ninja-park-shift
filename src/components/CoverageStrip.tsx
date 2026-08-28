import { computeHourlyCoverage, summarizeShortHours } from '../lib/coverage';
import type { ShiftEntry } from '../types';

interface CoverageStripProps {
  facilityShifts: ShiftEntry[];
  required: number | null | undefined;
}

export function CoverageStrip({ facilityShifts, required }: CoverageStripProps) {
  const hourly = computeHourlyCoverage(facilityShifts, required);
  const shortHours = summarizeShortHours(hourly);
  const isFullyCovered = shortHours.length === 0;

  return (
    <div className="mb-2">
      <div className="flex gap-[2px]">
        {hourly.map((h) => (
          <span
            key={h.hour}
            className={`h-1.5 flex-1 rounded-full ${h.isShort ? 'bg-seal/70' : 'bg-jade/60'}`}
            title={`${h.hour}〜${h.hour + 1}時: ${h.count}/${h.required}名`}
          />
        ))}
      </div>
      <p className={`mt-1 text-[10px] ${isFullyCovered ? 'text-paper-dim' : 'text-seal-bright'}`}>
        {isFullyCovered ? '9-18時 必要人数を満たしています' : `不足: ${shortHours.map((h) => `${h}時台`).join('・')}`}
      </p>
    </div>
  );
}
