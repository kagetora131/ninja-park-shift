import { AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { FACILITY_COLOR, FACILITY_ORDER } from '../data/facilities';
import { formatDateJp, weekdayJp } from '../lib/format';
import { useLabelContext } from '../hooks/LabelContext';
import type { FacilityId, PostRequirements, ShiftEntry } from '../types';

interface CoverageRow {
  date: string;
  facility: FacilityId;
  required: number;
  actual: number;
  status: 'empty' | 'understaffed' | 'overstaffed';
}

interface PostCoveragePanelProps {
  dates: string[];
  shifts: ShiftEntry[];
  postRequirements: PostRequirements;
  onSelectDate: (date: string) => void;
}

function computeCoverageRows(
  dates: string[],
  shifts: ShiftEntry[],
  postRequirements: PostRequirements,
): CoverageRow[] {
  const rows: CoverageRow[] = [];

  for (const date of dates) {
    const weekday = weekdayJp(date);

    for (const facility of FACILITY_ORDER) {
      const required = postRequirements[weekday]?.[facility];
      if (required == null) continue;
      const actual = shifts.filter((s) => s.date === date && s.facility === facility).length;
      if (actual === required) continue;
      rows.push({
        date,
        facility,
        required,
        actual,
        status: actual === 0 ? 'empty' : actual < required ? 'understaffed' : 'overstaffed',
      });
    }
  }

  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

export function PostCoveragePanel({ dates, shifts, postRequirements, onSelectDate }: PostCoveragePanelProps) {
  const { locale, facilityName, t } = useLabelContext();
  const rows = computeCoverageRows(dates, shifts, postRequirements);
  const emptyCount = rows.filter((r) => r.status === 'empty').length;
  const shortCount = rows.filter((r) => r.status === 'understaffed').length;
  const overCount = rows.filter((r) => r.status === 'overstaffed').length;

  const STATUS_STYLE: Record<CoverageRow['status'], { label: string; className: string; Icon: typeof AlertTriangle }> = {
    empty: { label: t('coverage.statusEmpty'), className: 'border-seal/60 bg-seal/10 text-seal-bright', Icon: AlertTriangle },
    understaffed: { label: t('coverage.statusShort'), className: 'border-seal/40 bg-seal/5 text-seal-bright', Icon: Users },
    overstaffed: { label: t('coverage.statusOver'), className: 'border-gold/50 bg-gold/10 text-gold', Icon: TrendingUp },
  };

  return (
    <div className="flex w-full shrink-0 flex-col rounded-xl border border-paper/10 bg-void-soft/50 p-3 lg:w-72">
      <h3 className="font-mincho text-sm font-bold text-paper">{t('coverage.heading')}</h3>
      <p className="mt-1 text-[11px] text-paper-dim">{t('coverage.description')}</p>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
        <span className="rounded-full border border-seal/60 bg-seal/10 px-2 py-0.5 text-seal-bright">
          {t('coverage.empty')} {emptyCount}
        </span>
        <span className="rounded-full border border-seal/40 bg-seal/5 px-2 py-0.5 text-seal-bright">
          {t('coverage.short')} {shortCount}
        </span>
        <span className="rounded-full border border-gold/50 bg-gold/10 px-2 py-0.5 text-gold">
          {t('coverage.over')} {overCount}
        </span>
      </div>

      <div className="mt-3 max-h-[60vh] space-y-1.5 overflow-y-auto pr-1 lg:max-h-[calc(100vh-18rem)]">
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-paper/15 py-6 text-center text-xs text-paper-dim/70">
            {t('coverage.allGood')}
          </p>
        ) : (
          rows.map((row) => {
            const { label, className, Icon } = STATUS_STYLE[row.status];
            return (
              <button
                key={`${row.date}_${row.facility}`}
                type="button"
                onClick={() => onSelectDate(row.date)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition hover:brightness-110 ${className}`}
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <Icon size={12} className="shrink-0" />
                  <span className="shrink-0 font-medium">{formatDateJp(row.date, locale)}</span>
                  <span className="flex items-center gap-1 truncate">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: FACILITY_COLOR[row.facility] }} />
                    {facilityName(row.facility)}
                  </span>
                </span>
                <span className="shrink-0 whitespace-nowrap">
                  {t('coverage.rowSummary', { actual: row.actual, required: row.required, status: label })}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
