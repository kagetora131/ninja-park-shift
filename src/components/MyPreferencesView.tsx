import { useState } from 'react';
import { Save } from 'lucide-react';
import { AvatarPicker } from './AvatarPicker';
import { WEEKDAYS } from '../data/constants';
import { HAIR_STYLES_MALE, SKIN_COLORS } from '../data/avatarOptions';
import { supabase } from '../lib/supabaseClient';
import type { AvatarGender, Employee } from '../types';

interface MyPreferencesViewProps {
  employee: Employee;
  onSaved: () => Promise<void>;
}

export function MyPreferencesView({ employee, onSaved }: MyPreferencesViewProps) {
  const [desiredWorkDaysPerWeek, setDesiredWorkDaysPerWeek] = useState(employee.desiredWorkDaysPerWeek);
  const [desiredDaysOff, setDesiredDaysOff] = useState<string[]>(employee.desiredDaysOff);
  const [avatarGender, setAvatarGender] = useState<AvatarGender>(employee.avatarGender ?? 'male');
  const [avatarTop, setAvatarTop] = useState(employee.avatarTop ?? HAIR_STYLES_MALE[0].value);
  const [avatarSkinColor, setAvatarSkinColor] = useState(employee.avatarSkinColor ?? SKIN_COLORS[0]);
  const [avatarGlasses, setAvatarGlasses] = useState(employee.avatarGlasses ?? false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleDayOff = (day: string) => {
    setDesiredDaysOff((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const [{ error: prefError }, { error: avatarError }] = await Promise.all([
      supabase.rpc('update_my_shift_preferences', {
        p_desired_work_days_per_week: desiredWorkDaysPerWeek,
        p_desired_days_off: desiredDaysOff,
      }),
      supabase.rpc('update_my_avatar', {
        p_avatar_gender: avatarGender,
        p_avatar_top: avatarTop,
        p_avatar_skin_color: avatarSkinColor,
        p_avatar_glasses: avatarGlasses,
      }),
    ]);
    setSaving(false);
    if (prefError || avatarError) {
      setError((prefError ?? avatarError)?.message ?? '保存に失敗しました');
      return;
    }
    await onSaved();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-mincho text-sm font-bold text-paper">自分の設定</h2>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-paper/10 bg-void-soft/50 p-4">
        <AvatarPicker
          avatarBase={employee.avatarBase}
          gender={avatarGender}
          top={avatarTop}
          skinColor={avatarSkinColor}
          glasses={avatarGlasses}
          onChange={(patch) => {
            if (patch.gender !== undefined) setAvatarGender(patch.gender);
            if (patch.top !== undefined) setAvatarTop(patch.top);
            if (patch.skinColor !== undefined) setAvatarSkinColor(patch.skinColor);
            if (patch.glasses !== undefined) setAvatarGlasses(patch.glasses);
          }}
        />

        <div>
          <label className="mb-1 block text-xs text-paper-dim">希望勤務日数/週</label>
          <input
            type="number"
            min={0}
            max={7}
            value={desiredWorkDaysPerWeek}
            onChange={(e) => setDesiredWorkDaysPerWeek(Number(e.target.value))}
            className="w-32 rounded-md border border-paper/20 bg-void px-2 py-1.5 text-sm text-paper focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-paper-dim">希望休み曜日</label>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((day) => (
              <label
                key={day}
                className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border text-xs transition ${
                  desiredDaysOff.includes(day)
                    ? 'border-seal bg-seal/10 text-seal-bright'
                    : 'border-paper/20 text-paper-dim'
                }`}
              >
                <input
                  type="checkbox"
                  checked={desiredDaysOff.includes(day)}
                  onChange={() => toggleDayOff(day)}
                  className="hidden"
                />
                {day}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-seal-bright">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 rounded-md border border-gold bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold transition hover:bg-gold/20 disabled:opacity-50"
        >
          <Save size={13} />
          {saving ? '保存中...' : saved ? '保存しました' : '保存'}
        </button>
      </form>
    </div>
  );
}
