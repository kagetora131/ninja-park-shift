import { useState } from 'react';
import { X } from 'lucide-react';
import { formatDateJp } from '../lib/format';
import { useLabelContext } from '../hooks/LabelContext';
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
  const { locale, facilityName, t } = useLabelContext();
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
            <h2 className="font-mincho text-base font-bold text-paper">{t('financeModal.heading')}</h2>
            <p className="text-xs text-paper-dim">
              {formatDateJp(draft.date, locale)} ／ {facilityName(draft.facility)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-paper-dim hover:text-paper">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-paper-dim">{t('financeModal.revenueLabel')}</label>
            <input
              type="number"
              min={0}
              step={1000}
              value={revenue}
              onChange={(e) => setRevenue(Number(e.target.value))}
              className="w-full rounded-md border border-paper/20 bg-void px-3 py-2 text-sm text-paper focus:border-gold focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-paper-dim">{t('financeModal.autoCalcNote')}</p>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-paper/20 px-3 py-1.5 text-xs text-paper-dim hover:text-paper"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="rounded-md border border-gold bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold transition hover:bg-gold/20"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
