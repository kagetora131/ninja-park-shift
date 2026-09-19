import { Megaphone, Users } from 'lucide-react';
import { ChatPersonAvatar } from './ChatPersonAvatar';
import { getConversationDisplayName, resolveChatPerson } from '../lib/chatDisplay';
import { useLabelContext } from '../hooks/LabelContext';
import type { ChatConversation, ChatDirectoryEntry, Employee } from '../types';

interface ChatConversationListProps {
  heading?: string;
  conversations: ChatConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  unreadCounts: Map<string, number>;
  employeeMap: Map<string, Employee>;
  directory: ChatDirectoryEntry[];
  myProfileId: string;
  memberIdsByConversation: Map<string, Set<string>>;
}

export function ChatConversationList({
  heading,
  conversations,
  activeId,
  onSelect,
  unreadCounts,
  employeeMap,
  directory,
  myProfileId,
  memberIdsByConversation,
}: ChatConversationListProps) {
  const { employeeName, t } = useLabelContext();
  const managerLabel = t('header.roleManager');
  const sorted = [...conversations].sort((a, b) => {
    if (a.type === 'broadcast') return -1;
    if (b.type === 'broadcast') return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <div>
      {heading && <p className="mb-1 px-1 text-[10px] font-medium uppercase tracking-wide text-paper-dim">{heading}</p>}
      <div className="space-y-1">
        {sorted.map((conversation) => {
          const memberIds = Array.from(memberIdsByConversation.get(conversation.id) ?? []);
          const name = getConversationDisplayName(
            conversation,
            memberIds,
            directory,
            employeeMap,
            myProfileId,
            employeeName,
            t('chat.broadcastName'),
            managerLabel,
          );
          const otherId =
            conversation.type === 'dm' ? memberIds.find((id) => id !== myProfileId) ?? memberIds[0] : undefined;
          const otherPerson = otherId
            ? resolveChatPerson(otherId, directory, employeeMap, employeeName, managerLabel)
            : undefined;
          const unread = unreadCounts.get(conversation.id) ?? 0;
          const isActive = conversation.id === activeId;
          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition ${
                isActive ? 'bg-gold/15 text-gold' : 'text-paper-dim hover:bg-void/40 hover:text-paper'
              }`}
            >
              {conversation.type === 'broadcast' && (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-seal/20 text-seal-bright">
                  <Megaphone size={18} />
                </span>
              )}
              {conversation.type === 'group' && (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-jade/20 text-jade">
                  <Users size={18} />
                </span>
              )}
              {conversation.type === 'dm' && <ChatPersonAvatar employee={otherPerson?.employee} size="sm" />}
              <span className="flex-1 truncate">{name}</span>
              {unread > 0 && (
                <span className="rounded-full bg-seal-bright px-1.5 py-[1px] text-[10px] font-semibold text-void">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          );
        })}
        {sorted.length === 0 && <p className="px-2 py-3 text-xs text-paper-dim">{t('chat.noConversations')}</p>}
      </div>
    </div>
  );
}
