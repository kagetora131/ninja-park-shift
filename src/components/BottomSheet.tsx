import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useLabelContext } from '../hooks/LabelContext';

interface BottomSheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** スマホでは画面の下から出て高さは画面の9割まで(中身はスクロール)。sm以上は中央の窓。Escで閉じる。 */
export function BottomSheet({ title, onClose, children }: BottomSheetProps) {
  const { t } = useLabelContext();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-rise flex max-h-[90vh] w-full max-w-md flex-col rounded-t-2xl border border-gold/30 bg-void-soft shadow-2xl sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-paper/10 px-4 py-2">
          <h2 className="font-mincho text-sm font-bold text-paper">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="flex items-center justify-center text-paper-dim hover:text-paper"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}
