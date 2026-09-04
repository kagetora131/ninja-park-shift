import { useMemo, useState } from 'react';
import { AlertTriangle, Pencil } from 'lucide-react';
import { DatePicker } from './DatePicker';
import { FACILITY_ORDER } from '../data/facilities';
import { formatDateJp } from '../lib/format';
import { bestProfitDay, longestRedStreak, totalsOf } from '../lib/finance';
import { ShurikenIcon } from './ShurikenIcon';
import { useLabelContext } from '../hooks/LabelContext';
import type { FinanceDraft } from './FinanceEditModal';
import type { DailyFinance } from '../types';

function formatYen(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}¥${Math.abs(value).toLocaleString('ja-JP')}`;
}

interface FinanceDashboardProps {
  finance: DailyFinance[];
  onEditFacility: (draft: FinanceDraft) => void;
}

export function FinanceDashboard({ finance, onEditFacility }: FinanceDashboardProps) {
  const { locale, facilityName, t } = useLabelContext();
  const [selectedDate, setSelectedDate] = useState(finance[0]?.date ?? '');
  const totals = useMemo(() => totalsOf(finance), [finance]);
  const streak = useMemo(() => longestRedStreak(finance), [finance]);
  const best = useMemo(() => bestProfitDay(finance), [finance]);
  const maxAbsProfit = useMemo(
    () => Math.max(1, ...finance.map((f) => Math.abs(f.profit))),
    [finance],
  );
  const selected = finance.find((f) => f.date === selectedDate);

  return (
    <div className="space-y-5">
      <DatePicker
        dates={finance.map((f) => f.date)}
        value={selectedDate}
        onChange={setSelectedDate}
        dotColorFor={(date) => {
          const f = finance.find((day) => day.date === date);
          return f?.isBlack ? 'var(--color-jade)' : 'var(--color-seal)';
        }}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t('finance.periodRevenue')} value={formatYen(totals.revenue)} tone="paper" />
        <StatCard label={t('finance.periodLabor')} value={formatYen(totals.laborCost)} tone="paper" />
        <StatCard
          label={t('finance.periodProfit')}
          value={formatYen(totals.profit)}
          tone={totals.profit >= 0 ? 'jade' : 'seal'}
        />
      </div>

      {streak.length >= 2 && (
        <div className="flex items-center gap-2 rounded-lg border border-seal/50 bg-seal/10 px-4 py-2.5 text-sm text-seal-bright">
          <AlertTriangle size={16} />
          {t('finance.redStreak', { n: streak.length, endDate: streak.endDate })}
        </div>
      )}

      <div className="rounded-xl border border-paper/10 bg-void-soft/50 p-4">
        <h3 className="mb-4 font-mincho text-sm font-bold text-paper">{t('finance.dailyChart')}</h3>
        <div className="flex h-64 items-stretch gap-1.5 overflow-x-auto pb-1">
          {finance.map((day) => {
            const isBest = best && day.date === best.date && day.profit > 0;
            const isSelected = day.date === selectedDate;
            const positivePct = day.profit > 0 ? (day.profit / maxAbsProfit) * 100 : 0;
            const negativePct = day.profit < 0 ? (Math.abs(day.profit) / maxAbsProfit) * 100 : 0;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDate(day.date)}
                className="flex min-w-[38px] flex-1 flex-col items-center"
                title={`${formatDateJp(day.date, locale)}：${formatYen(day.profit)}`}
              >
                <div className="relative flex w-full flex-1 items-end justify-center">
                  {isBest && (
                    <ShurikenIcon size={16} className="animate-shuriken absolute -top-5" />
                  )}
                  <div
                    className={`w-full rounded-t-sm transition ${
                      isSelected ? 'bg-gold' : 'bg-jade'
                    }`}
                    style={{ height: `${positivePct}%` }}
                  />
                </div>
                <div className="h-px w-full bg-paper/25" />
                <div className="flex w-full flex-1 justify-center">
                  <div
                    className={`w-full rounded-b-sm transition ${
                      isSelected ? 'bg-gold' : 'bg-seal'
                    }`}
                    style={{ height: `${negativePct}%` }}
                  />
                </div>
                <span className="mt-1.5 text-[10px] text-paper-dim">{Number(day.date.slice(-2))}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="rounded-xl border border-paper/10 bg-void-soft/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-mincho text-sm font-bold text-paper">
              {t('finance.detailHeading', { date: formatDateJp(selected.date, locale) })}
            </h3>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] ${
                selected.isBlack ? 'bg-jade/15 text-jade' : 'bg-seal/15 text-seal-bright'
              }`}
            >
              {selected.isBlack ? t('finance.black') : t('finance.red')} {formatYen(selected.profit)}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {FACILITY_ORDER.map((facilityId) => {
              const f = selected.facilities[facilityId];
              const margin = f.revenue - f.laborCost;
              return (
                <div key={facilityId} className="rounded-lg border border-paper/10 bg-void/40 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-paper">{facilityName(facilityId)}</p>
                    <button
                      type="button"
                      onClick={() =>
                        onEditFacility({
                          date: selected.date,
                          facility: facilityId,
                          revenue: f.revenue,
                        })
                      }
                      className="text-paper-dim transition hover:text-gold"
                      title={t('finance.editRevenueTitle')}
                    >
                      <Pencil size={12} />
                    </button>
                  </div>
                  <p className="text-[11px] text-paper-dim">{t('finance.revenue')} {formatYen(f.revenue)}</p>
                  <p className="text-[11px] text-paper-dim">{t('finance.laborAuto')} {formatYen(f.laborCost)}</p>
                  <p className={`text-[11px] font-medium ${margin >= 0 ? 'text-jade' : 'text-seal-bright'}`}>
                    {t('finance.margin')} {formatYen(margin)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: 'paper' | 'jade' | 'seal' }) {
  const toneClass = tone === 'jade' ? 'text-jade' : tone === 'seal' ? 'text-seal-bright' : 'text-paper';
  return (
    <div className="rounded-xl border border-paper/10 bg-void-soft/50 p-4">
      <p className="text-xs text-paper-dim">{label}</p>
      <p className={`mt-1 font-mincho text-xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
