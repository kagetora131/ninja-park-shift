import { generateNinjaAvatar } from '../lib/avatar';
import { HAIR_STYLES_BY_GENDER, SKIN_COLORS } from '../data/avatarOptions';
import type { AvatarGender } from '../types';

interface AvatarPickerProps {
  avatarBase: string;
  gender: AvatarGender;
  top: string;
  skinColor: string;
  glasses: boolean;
  onChange: (patch: Partial<{ gender: AvatarGender; top: string; skinColor: string; glasses: boolean }>) => void;
}

const GENDERS: [AvatarGender, string][] = [
  ['male', '男性'],
  ['female', '女性'],
];

export function AvatarPicker({ avatarBase, gender, top, skinColor, glasses, onChange }: AvatarPickerProps) {
  const hairOptions = HAIR_STYLES_BY_GENDER[gender];
  const previewUri = generateNinjaAvatar(avatarBase, 'neutral', { top, skinColor, glasses });

  const setGender = (nextGender: AvatarGender) => {
    const options = HAIR_STYLES_BY_GENDER[nextGender];
    const stillValid = options.some((o) => o.value === top);
    onChange({ gender: nextGender, top: stillValid ? top : options[0].value });
  };

  return (
    <div className="flex gap-3 rounded-lg border border-paper/10 bg-void/40 p-3">
      <img src={previewUri} alt="プレビュー" width={64} height={64} className="h-16 w-16 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-[11px] text-paper-dim">性別</span>
          <div className="flex gap-1.5">
            {GENDERS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setGender(value)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                  gender === value
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-paper/20 text-paper-dim hover:border-paper/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-[11px] text-paper-dim">肌の色</span>
          <div className="flex gap-1.5">
            {SKIN_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onChange({ skinColor: color })}
                title="肌の色を選択"
                className="h-5 w-5 rounded-full transition"
                style={{
                  background: `#${color}`,
                  boxShadow: skinColor === color ? '0 0 0 2px var(--color-gold)' : '0 0 0 1px var(--color-paper-dim)',
                }}
              />
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-[11px] text-paper-dim">髪型</span>
          <select
            value={top}
            onChange={(e) => onChange({ top: e.target.value })}
            className="flex-1 rounded-md border border-paper/20 bg-void px-2 py-1 text-[11px] text-paper focus:border-gold focus:outline-none"
          >
            {hairOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-[11px] text-paper-dim">
          <span className="w-14 shrink-0">眼鏡</span>
          <input
            type="checkbox"
            checked={glasses}
            onChange={(e) => onChange({ glasses: e.target.checked })}
            className="h-3.5 w-3.5 accent-gold"
          />
          かける
        </label>
      </div>
    </div>
  );
}
