import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { MonthCalendar } from './MonthCalendar';
import { formatDateJp, weekdayJp } from '../lib/format';

interface DatePickerProps {
  dates: string[];
  value: string;
  onChange: (date: string) => void;
  dotColorFor?: (date: string) => string;
}

export function DatePicker({ dates, value, onChange, dotColorFor }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<{ year: number; month: number } | null>(null);
  const index = dates.indexOf(value);

  const go = (delta: number) => {
    const next = dates[index + delta];
    if (next) onChange(next);
  };

  const handleOpen = () => {
    const [y, m] = value ? value.split('-').map(Number) : [2026, 1];
    setView({ year: y, month: m });
    setOpen(true);
  };

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => go(-1)}
        disabled={index <= 0}
        className="rounded-full border border-paper/20 p-1.5 text-paper-dim transition hover:border-gold hover:text-gold disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </button>

      <button
        type="button"
        onClick={() => (open ? setOpen(false) : handleOpen())}
        className="flex items-center gap-1.5 rounded-md border border-paper/20 bg-void px-3 py-1.5 text-sm text-paper transition hover:border-gold"
      >
        <CalendarDays size={14} className="text-gold" />
        {value ? formatDateJp(value, weekdayJp(value)) : '日付を選択'}
      </button>

      <button
        type="button"
        onClick={() => go(1)}
        disabled={index === -1 || index >= dates.length - 1}
        className="rounded-full border border-paper/20 p-1.5 text-paper-dim transition hover:border-gold hover:text-gold disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </button>

      {open && view && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-72">
            <MonthCalendar
              year={view.year}
              month={view.month}
              onMonthChange={(y, m) => setView({ year: y, month: m })}
              minDate={dates[0]}
              maxDate={dates[dates.length - 1]}
              isSelected={(d) => d === value}
              renderBadge={
                dotColorFor
                  ? (d) => (
                      <span
                        className="mx-auto block h-1 w-1 rounded-full"
                        style={{ background: dotColorFor(d) }}
                      />
                    )
                  : undefined
              }
              onDayClick={(d) => {
                if (dates.includes(d)) {
                  onChange(d);
                  setOpen(false);
                }
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
