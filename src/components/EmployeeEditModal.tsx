import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { AvatarPicker } from './AvatarPicker';
import { FACILITIES, FACILITY_ORDER } from '../data/facilities';
import { HAIR_STYLES_MALE, SKIN_COLORS } from '../data/avatarOptions';
import type { EmployeeInput } from '../hooks/useShiftStore';
import type { AvatarGender, Employee, FacilityId } from '../types';

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];
const ROLES = ['社員', 'アルバイト', 'パート'];
const SHURIKEN_QUALIFICATION = '手裏剣・忍具取り扱い研修修了';

function randomAvatarBase(): string {
  return `avatar_${Math.random().toString(36).slice(2, 9)}`;
}

export interface EmployeeDraft {
  mode: 'create' | 'edit';
  employee?: Employee;
}

interface EmployeeEditModalProps {
  draft: EmployeeDraft;
  onClose: () => void;
  onSave: (input: EmployeeInput) => void;
  onDelete: (id: string) => void;
}

export function EmployeeEditModal({ draft, onClose, onSave, onDelete }: EmployeeEditModalProps) {
  const existing = draft.employee;
  const [name, setName] = useState(existing?.name ?? '');
  const [role, setRole] = useState(existing?.role ?? 'アルバイト');
  const [mainFacility, setMainFacility] = useState<FacilityId>(existing?.mainFacility ?? 'goods');
  const [crossTrained, setCrossTrained] = useState<FacilityId[]>(existing?.crossTrained ?? []);
  const [desiredWorkDaysPerWeek, setDesiredWorkDaysPerWeek] = useState(
    existing?.desiredWorkDaysPerWeek ?? 3,
  );
  const [desiredDaysOff, setDesiredDaysOff] = useState<string[]>(existing?.desiredDaysOff ?? []);
  const [maxConsecutiveDays, setMaxConsecutiveDays] = useState(existing?.maxConsecutiveDays ?? 5);
  const [hasShurikenQualification, setHasShurikenQualification] = useState(
    existing?.qualifications.includes(SHURIKEN_QUALIFICATION) ?? false,
  );
  const [employmentType, setEmploymentType] = useState(existing?.employmentType ?? '');
  const [cafeKitchenOk, setCafeKitchenOk] = useState(existing?.cafeKitchenOk ?? false);
  const [isTrainee, setIsTrainee] = useState(existing?.isTrainee ?? false);

  const [avatarBase] = useState(existing?.avatarBase ?? randomAvatarBase);
  const [avatarGender, setAvatarGender] = useState<AvatarGender>(existing?.avatarGender ?? 'male');
  const [avatarTop, setAvatarTop] = useState(existing?.avatarTop ?? HAIR_STYLES_MALE[0].value);
  const [avatarSkinColor, setAvatarSkinColor] = useState(existing?.avatarSkinColor ?? SKIN_COLORS[0]);
  const [avatarGlasses, setAvatarGlasses] = useState(existing?.avatarGlasses ?? false);

  const toggleCrossTrained = (facility: FacilityId) => {
    setCrossTrained((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility],
    );
  };

  const toggleDayOff = (day: string) => {
    setDesiredDaysOff((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: existing?.id,
      avatarBase,
      name: name.trim(),
      role,
      mainFacility,
      crossTrained: crossTrained.filter((f) => f !== mainFacility),
      desiredWorkDaysPerWeek,
      desiredDaysOff,
      maxConsecutiveDays,
      qualifications: hasShurikenQualification ? [SHURIKEN_QUALIFICATION] : [],
      employmentType: employmentType.trim() || undefined,
      cafeKitchenOk,
      isTrainee,
      avatarGender,
      avatarTop,
      avatarSkinColor,
      avatarGlasses,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="animate-rise max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-gold/30 bg-void-soft p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-mincho text-base font-bold text-paper">
            {draft.mode === 'create' ? '新しい忍者を雇う' : '忍者情報を編集'}
          </h2>
          <button type="button" onClick={onClose} className="text-paper-dim hover:text-paper">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AvatarPicker
            avatarBase={avatarBase}
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
            <label className="mb-1 block text-xs text-paper-dim">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-paper/20 bg-void px-3 py-2 text-sm text-paper focus:border-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-paper-dim">雇用形態</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-md border border-paper/20 bg-void px-3 py-2 text-sm text-paper focus:border-gold focus:outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {role === '社員' && (
              <p className="mt-1 text-[11px] text-paper-dim">
                ※人件費は「給与・ポスト設定」の社員月給を日割りして自動計算されます
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-paper-dim">所属施設</label>
            <div className="flex gap-2">
              {FACILITY_ORDER.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setMainFacility(f)}
                  className={`flex-1 rounded-md border px-2 py-1.5 text-xs transition ${
                    mainFacility === f
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-paper/20 text-paper-dim hover:border-paper/40'
                  }`}
                >
                  {FACILITIES[f].shortName}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-paper-dim">応援可能な施設(掛け持ち)</label>
            <div className="flex flex-wrap gap-2">
              {FACILITY_ORDER.filter((f) => f !== mainFacility).map((f) => (
                <label
                  key={f}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
                    crossTrained.includes(f)
                      ? 'border-jade bg-jade/10 text-jade'
                      : 'border-paper/20 text-paper-dim'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={crossTrained.includes(f)}
                    onChange={() => toggleCrossTrained(f)}
                    className="h-3 w-3 accent-jade"
                  />
                  {FACILITIES[f].shortName}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-paper-dim">希望勤務日数/週</label>
              <input
                type="number"
                min={0}
                max={7}
                value={desiredWorkDaysPerWeek}
                onChange={(e) => setDesiredWorkDaysPerWeek(Number(e.target.value))}
                className="w-full rounded-md border border-paper/20 bg-void px-2 py-1.5 text-sm text-paper focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-paper-dim">連勤上限(日)</label>
              <input
                type="number"
                min={1}
                max={14}
                value={maxConsecutiveDays}
                onChange={(e) => setMaxConsecutiveDays(Number(e.target.value))}
                className="w-full rounded-md border border-paper/20 bg-void px-2 py-1.5 text-sm text-paper focus:border-gold focus:outline-none"
              />
            </div>
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

          <label className="flex items-center gap-2 text-xs text-paper-dim">
            <input
              type="checkbox"
              checked={hasShurikenQualification}
              onChange={(e) => setHasShurikenQualification(e.target.checked)}
              className="h-3.5 w-3.5 accent-gold"
            />
            資格：手裏剣・忍具取り扱い研修修了(修行アトラクションに必要)
          </label>

          <label className="flex items-center gap-2 text-xs text-paper-dim">
            <input
              type="checkbox"
              checked={cafeKitchenOk}
              onChange={(e) => setCafeKitchenOk(e.target.checked)}
              className="h-3.5 w-3.5 accent-gold"
            />
            忍者茶屋の厨房対応が可能
          </label>

          <label className="flex items-center gap-2 text-xs text-paper-dim">
            <input
              type="checkbox"
              checked={isTrainee}
              onChange={(e) => setIsTrainee(e.target.checked)}
              className="h-3.5 w-3.5 accent-gold"
            />
            研修中(人件費は「研修中時給」が優先適用されます)
          </label>

          <div>
            <label className="mb-1 block text-xs text-paper-dim">備考(求人用の雇用形態表記など)</label>
            <input
              type="text"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              placeholder="契約社員"
              className="w-full rounded-md border border-paper/20 bg-void px-3 py-2 text-sm text-paper focus:border-gold focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            {draft.mode === 'edit' && existing ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(existing.id);
                  onClose();
                }}
                className="flex items-center gap-1 rounded-md border border-seal/50 px-3 py-1.5 text-xs text-seal-bright transition hover:bg-seal/10"
              >
                <Trash2 size={13} />
                退職(削除)
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-paper/20 px-3 py-1.5 text-xs text-paper-dim hover:text-paper"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="rounded-md border border-gold bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold transition hover:bg-gold/20"
              >
                保存
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
