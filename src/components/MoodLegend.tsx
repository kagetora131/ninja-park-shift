import { Frown, Meh, Moon, Smile } from 'lucide-react';
import type { Mood } from '../types';

const ITEMS: { mood: Mood; label: string; color: string; icon: typeof Smile }[] = [
  { mood: 'happy', label: '上機嫌：希望通り', color: 'var(--color-jade)', icon: Smile },
  { mood: 'neutral', label: '普通：軽い調整あり', color: 'var(--color-paper-dim)', icon: Meh },
  { mood: 'tired', label: '疲れ気味：連勤/応援続き', color: 'var(--color-gold)', icon: Moon },
  { mood: 'unhappy', label: '不満：希望と大きく乖離', color: 'var(--color-seal)', icon: Frown },
];

export function MoodLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg border border-paper/10 bg-void-soft/60 px-4 py-2.5 text-xs text-paper-dim">
      {ITEMS.map(({ mood, label, color, icon: Icon }) => (
        <div key={mood} className="flex items-center gap-1.5">
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full"
            style={{ background: color }}
          >
            <Icon size={12} color="#0a0d12" strokeWidth={2.5} />
          </span>
          {label}
        </div>
      ))}
    </div>
  );
}
