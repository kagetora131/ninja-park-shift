import { useState } from 'react';
import { X } from 'lucide-react';
import { resolveChatPerson } from '../lib/chatDisplay';
import { useLabelContext } from '../hooks/LabelContext';
import type { ChatDirectoryEntry, Employee } from '../types';

interface AddMembersModalProps {
  directory: ChatDirectoryEntry[];
  employeeMap: Map<string, Employee>;
  /** 既にグループにいるメンバー(選択肢から除外する)。 */
  currentMemberIds: Set<string>;
  onAdd: (memberProfileIds: string[]) => Promise<void>;
  onClose: () => void;
}

export function AddMembersModal({ directory, employeeMap, currentMemberIds, onAdd, onClose }: AddMembersModalProps) {
  const { employeeName, t } = useLabelContext();
  const managerLabel = t('header.roleManager');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const candidates = directory.filter((d) => !currentMemberIds.has(d.profileId));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    setSubmitting(true);
    try {
      await onAdd(Array.from(selected));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="animate-rise flex max-h-[80vh] w-full max-w-sm flex-col rounded-xl border border-gold/30 bg-void-soft p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mincho text-base font-bold text-paper">{t('chat.addMembers')}</h2>
          <button type="button" onClick={onClose} className="text-paper-dim hover:text-paper">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto pr-1">
          {candidates.length === 0 && <p className="text-xs text-paper-dim">{t('chat.noMoreMembers')}</p>}
          {candidates.map((entry) => {
            const person = resolveChatPerson(entry.profileId, directory, employeeMap, employeeName, managerLabel);
            return (
              <label
                key={entry.profileId}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition ${
                  selected.has(entry.profileId) ? 'border-jade bg-jade/10 text-jade' : 'border-paper/20 text-paper-dim'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(entry.profileId)}
                  onChange={() => toggle(entry.profileId)}
                  className="h-3 w-3 accent-jade"
                />
                {person.name}
              </label>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end border-t border-paper/10 pt-3">
          <button
            type="button"
            onClick={handleAdd}
            disabled={selected.size === 0 || submitting}
            className="rounded-full bg-gold/20 px-3 py-1.5 text-xs font-medium text-gold disabled:opacity-40"
          >
            {t('chat.add')}
          </button>
        </div>
      </div>
    </div>
  );
}
