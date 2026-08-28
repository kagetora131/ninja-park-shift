import { useState } from 'react';
import { X } from 'lucide-react';
import { FACILITIES } from '../data/facilities';
import { formatDateJp, weekdayJp } from '../lib/format';
import type { FinanceInput } from '../hooks/useShiftStore';
import type { FacilityId } from '../types';

export interface FinanceDraft {
  date: string;
  facility: FacilityId;
  revenue: number;
}

interface FinanceEditModalProps {
  draft: FinanceDraft;
  onClose: () => void;
  onSave: (input: FinanceInput) => void;
}

export function FinanceEditModal({ draft, onClose, onSave }: FinanceEditModalProps) {
  const [revenue, setRevenue] = useState(draft.revenue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ date: draft.date, facility: draft.facility, revenue });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="animate-rise w-full max-w-sm rounded-xl border border-gold/30 bg-void-soft p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-mincho text-base font-bold text-paper">売上を編集</h2>
            <p className="text-xs text-paper-dim">
              {formatDateJp(draft.date, weekdayJp(draft.date))} ／ {FACILITIES[draft.facility].name}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-paper-dim hover:text-paper">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-paper-dim">売上(円)</label>
            <input
              type="number"
              min={0}
              step={1000}
              value={revenue}
              onChange={(e) => setRevenue(Number(e.target.value))}
              className="w-full rounded-md border border-paper/20 bg-void px-3 py-2 text-sm text-paper focus:border-gold focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-paper-dim">
            人件費はシフト実働時間と「給与・ポスト設定」の給与から自動計算されます。
          </p>

          <div className="flex justify-end gap-2 pt-1">
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
        </form>
      </div>
    </div>
  );
}
