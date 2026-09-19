import { useState } from 'react';
import { X } from 'lucide-react';
import { resolveChatPerson } from '../lib/chatDisplay';
import { useLabelContext } from '../hooks/LabelContext';
import type { ChatDirectoryEntry, Employee } from '../types';

interface NewGroupModalProps {
  directory: ChatDirectoryEntry[];
  employeeMap: Map<string, Employee>;
  myProfileId: string;
  onCreate: (name: string, memberProfileIds: string[]) => void;
  onClose: () => void;
}

export function NewGroupModal({ directory, employeeMap, myProfileId, onCreate, onClose }: NewGroupModalProps) {
  const { employeeName, t } = useLabelContext();
  const managerLabel = t('header.roleManager');
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const others = directory.filter((d) => d.profileId !== myProfileId);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canCreate = name.trim().length > 0 && selected.size > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="animate-rise flex max-h-[80vh] w-full max-w-sm flex-col rounded-xl border border-gold/30 bg-void-soft p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mincho text-base font-bold text-paper">{t('chat.newGroup')}</h2>
          <button type="button" onClick={onClose} className="text-paper-dim hover:text-paper">
            <X size={18} />
          </button>
        </div>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('chat.groupNamePlaceholder')}
          className="mb-3 rounded-md border border-paper/20 bg-void px-3 py-1.5 text-sm text-paper placeholder:text-paper-dim/60 focus:border-gold focus:outline-none"
        />

        <label className="mb-1 block text-xs text-paper-dim">{t('chat.selectMembers')}</label>
        <div className="flex-1 space-y-1 overflow-y-auto pr-1">
          {others.map((entry) => {
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
            onClick={() => onCreate(name.trim(), Array.from(selected))}
            disabled={!canCreate}
            className="rounded-full bg-gold/20 px-3 py-1.5 text-xs font-medium text-gold disabled:opacity-40"
          >
            {t('chat.create')}
          </button>
        </div>
      </div>
    </div>
  );
}
