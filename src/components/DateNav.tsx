import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateJp, weekdayJp } from '../lib/format';

interface DateNavProps {
  dates: string[];
  value: string;
  onChange: (date: string) => void;
}

export function DateNav({ dates, value, onChange }: DateNavProps) {
  const index = dates.indexOf(value);

  const go = (delta: number) => {
    const next = dates[index + delta];
    if (next) onChange(next);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => go(-1)}
        disabled={index <= 0}
        className="rounded-full border border-paper/20 p-1.5 text-paper-dim transition hover:border-gold hover:text-gold disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </button>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-paper/20 bg-void px-3 py-1.5 text-sm text-paper focus:border-gold focus:outline-none"
      >
        {dates.map((date) => (
          <option key={date} value={date}>
            {formatDateJp(date, weekdayJp(date))}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => go(1)}
        disabled={index >= dates.length - 1}
        className="rounded-full border border-paper/20 p-1.5 text-paper-dim transition hover:border-gold hover:text-gold disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
