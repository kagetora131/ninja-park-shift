import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { FACILITIES, FACILITY_ORDER } from '../data/facilities';
import { SHIFT_PATTERNS } from '../data/shiftPatterns';
import { formatDateJp, weekdayJp } from '../lib/format';
import type { NewShiftInput } from '../hooks/useShiftStore';
import type { Employee, FacilityId, ShiftEntry } from '../types';

export interface ShiftDraft {
  mode: 'create' | 'edit';
  date: string;
  facility: FacilityId;
  employeeId?: string;
  existingShift?: ShiftEntry;
}

interface ShiftEditModalProps {
  draft: ShiftDraft;
  employees: Employee[];
  onClose: () => void;
  onSave: (input: NewShiftInput) => void;
  onDelete: (id: string) => void;
}

export function ShiftEditModal({ draft, employees, onClose, onSave, onDelete }: ShiftEditModalProps) {
  const existing = draft.existingShift;
  const [employeeId, setEmployeeId] = useState(existing?.employeeId ?? draft.employeeId ?? employees[0]?.id ?? '');
  const [facility, setFacility] = useState<FacilityId>(draft.facility);
  const [start, setStart] = useState(existing?.start ?? SHIFT_PATTERNS[draft.facility][0].start);
  const [end, setEnd] = useState(existing?.end ?? SHIFT_PATTERNS[draft.facility][0].end);
  const [breakMinutes, setBreakMinutes] = useState(existing?.breakMinutes ?? SHIFT_PATTERNS[draft.facility][0].breakMinutes);
  const [isDesired, setIsDesired] = useState(existing?.isDesired ?? true);
  const [note, setNote] = useState(existing?.note ?? '');

  const selectedEmployee = employees.find((e) => e.id === employeeId);

  const applyPattern = (pattern: (typeof SHIFT_PATTERNS)[FacilityId][number]) => {
    setStart(pattern.start);
    setEnd(pattern.end);
    setBreakMinutes(pattern.breakMinutes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;
    onSave({
      date: draft.date,
      employeeId,
      facility,
      start,
      end,
      breakMinutes,
      isDesired,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="animate-rise w-full max-w-md rounded-xl border border-gold/30 bg-void-soft p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-mincho text-base font-bold text-paper">
              {draft.mode === 'create' ? '配置を追加' : 'シフトを編集'}
            </h2>
            <p className="text-xs text-paper-dim">{formatDateJp(draft.date, weekdayJp(draft.date))}</p>
          </div>
          <button type="button" onClick={onClose} className="text-paper-dim hover:text-paper">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-paper-dim">担当者</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full rounded-md border border-paper/20 bg-void px-3 py-2 text-sm text-paper focus:border-gold focus:outline-none"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}（{FACILITIES[emp.mainFacility].shortName}所属）
                </option>
              ))}
            </select>
            {selectedEmployee && facility !== selectedEmployee.mainFacility && (
              <p className="mt-1 text-[11px] text-gold">
                ※本来は{FACILITIES[selectedEmployee.mainFacility].name}所属の応援配置になります
                {!selectedEmployee.crossTrained.includes(facility) && '（未経験の施設）'}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-paper-dim">配置施設</label>
            <div className="flex gap-2">
              {FACILITY_ORDER.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setFacility(f);
                    applyPattern(SHIFT_PATTERNS[f][0]);
                  }}
                  className={`flex-1 rounded-md border px-2 py-1.5 text-xs transition ${
                    facility === f
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
            <label className="mb-1 block text-xs text-paper-dim">よく使う時間帯</label>
            <div className="flex flex-wrap gap-1.5">
              {SHIFT_PATTERNS[facility].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPattern(p)}
                  className="rounded-full border border-paper/20 px-2.5 py-1 text-[11px] text-paper-dim transition hover:border-gold hover:text-gold"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-paper-dim">開始</label>
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-md border border-paper/20 bg-void px-2 py-1.5 text-sm text-paper focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-paper-dim">終了</label>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-md border border-paper/20 bg-void px-2 py-1.5 text-sm text-paper focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-paper-dim">休憩(分)</label>
              <input
                type="number"
                min={0}
                step={5}
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Number(e.target.value))}
                className="w-full rounded-md border border-paper/20 bg-void px-2 py-1.5 text-sm text-paper focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-paper-dim">
            <input
              type="checkbox"
              checked={isDesired}
              onChange={(e) => setIsDesired(e.target.checked)}
              className="h-3.5 w-3.5 accent-gold"
            />
            本人の希望通りのシフトである
          </label>

          <div>
            <label className="mb-1 block text-xs text-paper-dim">備考</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="例：繁忙のため応援 など"
              className="w-full resize-none rounded-md border border-paper/20 bg-void px-3 py-2 text-sm text-paper focus:border-gold focus:outline-none"
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
                削除
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
