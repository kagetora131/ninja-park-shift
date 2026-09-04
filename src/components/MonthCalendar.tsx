import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatMonthLabel, weekdayLabel } from '../lib/i18n';
import { useLabelContext } from '../hooks/LabelContext';

const WEEKDAY_HEADERS = ['日', '月', '火', '水', '木', '金', '土'];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function daysInMonth(year: number, month: number): number {
  // month: 1-12。翌月の0日目 = 当月の末日(UTC基準で計算しローカルTZの影響を受けない)
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function firstWeekday(year: number, month: number): number {
  // 0=日曜
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

interface MonthCalendarProps {
  year: number;
  month: number; // 1-12
  onMonthChange: (year: number, month: number) => void;
  minDate?: string;
  maxDate?: string;
  isSelected?: (date: string) => boolean;
  onDayClick?: (date: string) => void;
  renderBadge?: (date: string) => ReactNode;
}

export function MonthCalendar({
  year,
  month,
  onMonthChange,
  minDate,
  maxDate,
  isSelected,
  onDayClick,
  renderBadge,
}: MonthCalendarProps) {
  const { locale } = useLabelContext();
  const total = daysInMonth(year, month);
  const lead = firstWeekday(year, month);
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const goPrev = () => {
    const { year: y, month: m } = addMonths(year, month, -1);
    onMonthChange(y, m);
  };
  const goNext = () => {
    const { year: y, month: m } = addMonths(year, month, 1);
    onMonthChange(y, m);
  };

  return (
    <div className="rounded-xl border border-paper/10 bg-void-soft/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          className="rounded-full border border-paper/20 p-1 text-paper-dim transition hover:border-gold hover:text-gold"
        >
          <ChevronLeft size={14} />
        </button>
        <p className="font-mincho text-sm font-bold text-paper">{formatMonthLabel(year, month, locale)}</p>
        <button
          type="button"
          onClick={goNext}
          className="rounded-full border border-paper/20 p-1 text-paper-dim transition hover:border-gold hover:text-gold"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-paper-dim">
        {WEEKDAY_HEADERS.map((w) => (
          <div key={w} className="py-1">
            {weekdayLabel(w, locale)}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />;
          const date = toDateStr(year, month, day);
          const outOfRange = (minDate && date < minDate) || (maxDate && date > maxDate);
          const selected = isSelected?.(date) ?? false;
          return (
            <button
              key={date}
              type="button"
              disabled={!!outOfRange}
              onClick={() => onDayClick?.(date)}
              className={`relative flex h-9 flex-col items-center justify-center rounded-lg border text-xs transition ${
                outOfRange
                  ? 'cursor-not-allowed border-transparent text-paper-dim/30'
                  : selected
                    ? 'border-gold bg-gold/15 text-gold'
                    : 'border-transparent text-paper hover:border-paper/30'
              }`}
            >
              {day}
              {!outOfRange && renderBadge && <span className="mt-0.5">{renderBadge(date)}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
