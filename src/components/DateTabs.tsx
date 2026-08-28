import { formatDateJp, weekdayJp } from '../lib/format';

interface DateTabsProps {
  dates: string[];
  value: string;
  onChange: (date: string) => void;
  dotColorFor?: (date: string) => string;
}

export function DateTabs({ dates, value, onChange, dotColorFor }: DateTabsProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {dates.map((date) => {
        const isActive = date === value;
        return (
          <button
            key={date}
            type="button"
            onClick={() => onChange(date)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
              isActive
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-paper/15 text-paper-dim hover:border-paper/30 hover:text-paper'
            }`}
          >
            {formatDateJp(date, weekdayJp(date))}
            {dotColorFor && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColorFor(date) }} />}
          </button>
        );
      })}
    </div>
  );
}
