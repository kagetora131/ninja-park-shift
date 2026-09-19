import { X } from 'lucide-react';
import { ChatPersonAvatar } from './ChatPersonAvatar';
import { resolveChatPerson } from '../lib/chatDisplay';
import { useLabelContext } from '../hooks/LabelContext';
import type { ChatDirectoryEntry, Employee } from '../types';

interface NewDmModalProps {
  directory: ChatDirectoryEntry[];
  employeeMap: Map<string, Employee>;
  myProfileId: string;
  onSelect: (profileId: string) => void;
  onClose: () => void;
}

export function NewDmModal({ directory, employeeMap, myProfileId, onSelect, onClose }: NewDmModalProps) {
  const { employeeName, t } = useLabelContext();
  const managerLabel = t('header.roleManager');
  const others = directory.filter((d) => d.profileId !== myProfileId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="animate-rise flex max-h-[80vh] w-full max-w-sm flex-col rounded-xl border border-gold/30 bg-void-soft p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mincho text-base font-bold text-paper">{t('chat.newDm')}</h2>
          <button type="button" onClick={onClose} className="text-paper-dim hover:text-paper">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto pr-1">
          {others.map((entry) => {
            const person = resolveChatPerson(entry.profileId, directory, employeeMap, employeeName, managerLabel);
            return (
              <button
                key={entry.profileId}
                type="button"
                onClick={() => onSelect(entry.profileId)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-paper transition hover:bg-void/40"
              >
                <ChatPersonAvatar employee={person.employee} size="sm" />
                {person.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
