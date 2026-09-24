import { useMemo, useState } from 'react';
import { AlertTriangle, Check, TrendingUp, Users } from 'lucide-react';
import { FACILITY_COLOR } from '../data/facilities';
import { formatDateJp, shiftDate, todayLocalIso } from '../lib/format';
import { computeCoverageRows, type CoverageRow, type CoverageStatus } from '../lib/postCoverage';
import { useLabelContext } from '../hooks/LabelContext';
import type { PostRequirements, ShiftEntry } from '../types';

interface PostCoveragePanelProps {
  dates: string[];
  shifts: ShiftEntry[];
  postRequirements: PostRequirements;
  onSelectDate: (date: string) => void;
}

function rowKey(row: Pick<CoverageRow, 'date' | 'facility'>): string {
  return `${row.date}_${row.facility}`;
}

/** 実機の「今日」を含む月曜始まりの週(月〜日)の日付範囲。 */
function currentWeekRange(): { start: string; end: string } {
  const today = todayLocalIso();
  const jsWeekday = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0=Sun..6=Sat
  const mondayOffset = jsWeekday === 0 ? -6 : 1 - jsWeekday;
  return { start: shiftDate(today, mondayOffset), end: shiftDate(today, mondayOffset + 6) };
}

type ScopeFilter = 'today' | 'week' | 'all';

export function PostCoveragePanel({ dates, shifts, postRequirements, onSelectDate }: PostCoveragePanelProps) {
  const { locale, facilityName, t } = useLabelContext();
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [unresolvedOnly, setUnresolvedOnly] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const allRows = useMemo(() => computeCoverageRows(dates, shifts, postRequirements), [dates, shifts, postRequirements]);

  const today = useMemo(() => todayLocalIso(), []);
  const week = useMemo(() => currentWeekRange(), []);

  const scopedRows = useMemo(() => {
    if (scope === 'today') return allRows.filter((r) => r.date === today);
    if (scope === 'week') return allRows.filter((r) => r.date >= week.start && r.date <= week.end);
    return allRows;
  }, [allRows, scope, today, week]);

  const visibleRows = unresolvedOnly ? scopedRows.filter((r) => !dismissed.has(rowKey(r))) : scopedRows;

  const dismissedInScopeCount = scopedRows.filter((r) => dismissed.has(rowKey(r))).length;

  const emptyCount = visibleRows.filter((r) => r.status === 'empty').length;
  const shortCount = visibleRows.filter((r) => r.status === 'understaffed').length;
  const overCount = visibleRows.filter((r) => r.status === 'overstaffed').length;

  const groups = useMemo(() => {
    const byDate = new Map<string, CoverageRow[]>();
    for (const row of visibleRows) {
      const list = byDate.get(row.date) ?? [];
      list.push(row);
      byDate.set(row.date, list);
    }
    return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [visibleRows]);

  const STATUS_STYLE: Record<CoverageStatus, { label: string; className: string; Icon: typeof AlertTriangle }> = {
    empty: { label: t('coverage.statusEmpty'), className: 'border-seal/60 bg-seal/10 text-seal-bright', Icon: AlertTriangle },
    understaffed: { label: t('coverage.statusShort'), className: 'border-seal/40 bg-seal/5 text-seal-bright', Icon: Users },
    overstaffed: { label: t('coverage.statusOver'), className: 'border-gold/50 bg-gold/10 text-gold', Icon: TrendingUp },
  };

  const SCOPE_OPTIONS: { id: ScopeFilter; label: string }[] = [
    { id: 'today', label: t('coverage.scopeToday') },
    { id: 'week', label: t('coverage.scopeWeek') },
    { id: 'all', label: t('coverage.scopeAll') },
  ];

  const toggleDismiss = (row: CoverageRow) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      const key = rowKey(row);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="flex w-full shrink-0 flex-col rounded-xl border border-paper/10 bg-void-soft/50 p-3 lg:w-80">
      <h3 className="font-mincho text-sm font-bold text-paper">{t('coverage.heading')}</h3>
      <p className="mt-1 text-[11px] text-paper-dim">{t('coverage.description')}</p>

      <div className="mt-2 flex items-center gap-1 rounded-full border border-paper/15 bg-void/40 p-0.5 text-[11px]">
        {SCOPE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setScope(opt.id)}
            className={`flex-1 rounded-full px-2 py-1 transition ${
              scope === opt.id ? 'bg-gold/20 text-gold' : 'text-paper-dim hover:text-paper'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <label className="mt-2 flex items-center gap-1.5 text-[11px] text-paper-dim">
        <input
          type="checkbox"
          checked={unresolvedOnly}
          onChange={(e) => setUnresolvedOnly(e.target.checked)}
          className="h-3 w-3 accent-gold"
        />
        {t('coverage.unresolvedOnly')}
        {dismissedInScopeCount > 0 && (
          <span className="text-paper-dim/60">{t('coverage.dismissedCount', { n: dismissedInScopeCount })}</span>
        )}
      </label>

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

      <div className="mt-3 max-h-[60vh] space-y-3 overflow-y-auto pr-1 lg:max-h-[calc(100vh-22rem)]">
        {groups.length === 0 ? (
          <p className="rounded-lg border border-dashed border-paper/15 py-6 text-center text-xs text-paper-dim/70">
            {t('coverage.allGood')}
          </p>
        ) : (
          groups.map(([date, rowsForDate]) => (
            <div key={date}>
              <p className="mb-1 px-0.5 text-[10px] font-medium uppercase tracking-wide text-paper-dim/70">
                {formatDateJp(date, locale)}
              </p>
              <div className="space-y-1.5">
                {rowsForDate.map((row) => {
                  const { label, className, Icon } = STATUS_STYLE[row.status];
                  const isDismissed = dismissed.has(rowKey(row));
                  return (
                    <div
                      key={rowKey(row)}
                      className={`flex w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition ${className} ${
                        isDismissed ? 'opacity-40' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectDate(row.date)}
                        className="flex min-w-0 flex-1 items-center justify-between gap-2 hover:brightness-110"
                      >
                        <span className="flex min-w-0 items-center gap-1.5">
                          <Icon size={12} className="shrink-0" />
                          <span className="flex items-center gap-1 truncate">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: FACILITY_COLOR[row.facility] }} />
                            {facilityName(row.facility)}
                          </span>
                        </span>
                        <span className="shrink-0 whitespace-nowrap">
                          {t('coverage.rowSummary', { actual: row.actual, required: row.required, status: label })}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleDismiss(row)}
                        title={isDismissed ? t('coverage.markUnresolved') : t('coverage.markResolved')}
                        className={`shrink-0 rounded-full border p-1 transition ${
                          isDismissed
                            ? 'border-jade/60 bg-jade/20 text-jade'
                            : 'border-paper/20 text-paper-dim hover:border-jade hover:text-jade'
                        }`}
                      >
                        <Check size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
