import { useEffect, useRef, useState } from 'react';
import { Eye, ImagePlus, Pin, PinOff, Plus } from 'lucide-react';
import { ChatPersonAvatar } from './ChatPersonAvatar';
import { getConversationDisplayName, resolveChatPerson } from '../lib/chatDisplay';
import { useLabelContext } from '../hooks/LabelContext';
import type { ChatConversation, ChatDirectoryEntry, ChatMessage, ChatReaction, ChatStampKey, Employee } from '../types';

const STAMP_KEYS: ChatStampKey[] = ['ninja', 'thumbs_up', 'cheer', 'muscle', 'fire', 'thanks'];
const STAMP_EMOJI: Record<ChatStampKey, string> = {
  ninja: '🥷',
  thumbs_up: '👍',
  cheer: '🎉',
  muscle: '💪',
  fire: '🔥',
  thanks: '🙏',
};
const STAMP_LABEL_KEY = {
  ninja: 'chat.reactions.ninja',
  thumbs_up: 'chat.reactions.thumbsUp',
  cheer: 'chat.reactions.cheer',
  muscle: 'chat.reactions.muscle',
  fire: 'chat.reactions.fire',
  thanks: 'chat.reactions.thanks',
} as const satisfies Record<ChatStampKey, string>;

interface ChatThreadProps {
  conversation: ChatConversation;
  messages: ChatMessage[];
  employeeMap: Map<string, Employee>;
  directory: ChatDirectoryEntry[];
  memberIdsByConversation: Map<string, Set<string>>;
  myProfileId: string;
  isManager: boolean;
  isParticipant: boolean;
  reactionsByMessage: Map<string, ChatReaction[]>;
  onSendMessage: (body: string | null, imagePath: string | null) => Promise<void>;
  onUploadImage: (file: File) => Promise<string>;
  getSignedImageUrl: (path: string) => Promise<string>;
  onToggleReaction: (messageId: string, stampKey: ChatStampKey) => Promise<void>;
  onTogglePin: (messageId: string, pinned: boolean) => Promise<void>;
}

function ChatImage({ path, getSignedImageUrl }: { path: string; getSignedImageUrl: (path: string) => Promise<string> }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSignedImageUrl(path).then((signedUrl) => {
      if (!cancelled) setUrl(signedUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [path, getSignedImageUrl]);

  if (!url) return <div className="mt-1.5 h-32 w-32 animate-pulse rounded-lg bg-void/50" />;
  return <img src={url} alt="" className="mt-1.5 max-h-64 max-w-64 rounded-lg border border-paper/10" />;
}

function ReactionBar({
  messageId,
  reactions,
  directory,
  employeeMap,
  myProfileId,
  canReact,
  onToggle,
}: {
  messageId: string;
  reactions: ChatReaction[];
  directory: ChatDirectoryEntry[];
  employeeMap: Map<string, Employee>;
  myProfileId: string;
  canReact: boolean;
  onToggle: (messageId: string, stampKey: ChatStampKey) => Promise<void>;
}) {
  const { employeeName, t } = useLabelContext();
  const managerLabel = t('header.roleManager');
  const [pickerOpen, setPickerOpen] = useState(false);

  const grouped = new Map<ChatStampKey, ChatReaction[]>();
  for (const r of reactions) {
    if (!grouped.has(r.stampKey)) grouped.set(r.stampKey, []);
    grouped.get(r.stampKey)!.push(r);
  }

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {STAMP_KEYS.filter((key) => (grouped.get(key)?.length ?? 0) > 0).map((key) => {
        const reactors = grouped.get(key) ?? [];
        const mine = reactors.some((r) => r.profileId === myProfileId);
        const names = reactors.map(
          (r) => resolveChatPerson(r.profileId, directory, employeeMap, employeeName, managerLabel).name,
        );
        return (
          <button
            key={key}
            type="button"
            disabled={!canReact}
            onClick={() => onToggle(messageId, key)}
            title={names.join(', ')}
            className={`rounded-full border px-1.5 py-[1px] text-[11px] transition ${
              mine ? 'border-gold bg-gold/15 text-gold' : 'border-paper/15 text-paper-dim'
            } ${canReact ? 'hover:border-gold' : 'opacity-60'}`}
          >
            {STAMP_EMOJI[key]} {reactors.length}
          </button>
        );
      })}
      {canReact && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            title={t('chat.addReaction')}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-paper/15 text-paper-dim transition hover:border-gold hover:text-gold"
          >
            <Plus size={11} />
          </button>
          {pickerOpen && (
            <div className="absolute bottom-full left-0 z-10 mb-1 flex gap-1 rounded-full border border-paper/15 bg-void-soft p-1 shadow-lg">
              {STAMP_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  title={t(STAMP_LABEL_KEY[key])}
                  onClick={() => {
                    onToggle(messageId, key);
                    setPickerOpen(false);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-sm transition hover:bg-gold/15"
                >
                  {STAMP_EMOJI[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ChatThread({
  conversation,
  messages,
  employeeMap,
  directory,
  memberIdsByConversation,
  myProfileId,
  isManager,
  isParticipant,
  reactionsByMessage,
  onSendMessage,
  onUploadImage,
  getSignedImageUrl,
  onToggleReaction,
  onTogglePin,
}: ChatThreadProps) {
  const { locale, employeeName, t } = useLabelContext();
  const managerLabel = t('header.roleManager');
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const memberIds = Array.from(memberIdsByConversation.get(conversation.id) ?? []);
  const title = getConversationDisplayName(
    conversation,
    memberIds,
    directory,
    employeeMap,
    myProfileId,
    employeeName,
    t('chat.broadcastName'),
    managerLabel,
  );

  const canPostText = isParticipant;
  const canReact = isParticipant;
  const isBroadcast = conversation.type === 'broadcast';
  // ピン留めは参加者なら誰でも可。ただし業務連絡チャンネルのみマネージャー限定(DB側のRPCでも同じ検査をしている)。
  const canPin = isParticipant && (!isBroadcast || isManager);
  const isManagerProfile = (profileId: string) => directory.find((d) => d.profileId === profileId)?.role === 'manager';
  const pinnedMessages = messages
    .filter((m) => m.pinnedAt)
    .sort((a, b) => (b.pinnedAt ?? '').localeCompare(a.pinnedAt ?? ''));

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    await onSendMessage(trimmed, null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = await onUploadImage(file);
      await onSendMessage(null, path);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(locale === 'en' ? 'en-US' : 'ja-JP', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-paper/10 px-4 py-3">
        <h3 className="font-mincho text-sm font-bold text-paper">{title}</h3>
        {conversation.type !== 'broadcast' && (
          <p className="mt-0.5 text-[10px] text-paper-dim">{t('chat.managerVisibilityNotice')}</p>
        )}
      </div>

      {!isParticipant && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-paper/20 bg-void/40 px-3 py-2 text-xs text-paper-dim">
          <Eye size={14} />
          {t('chat.viewOnlyNotice')}
        </div>
      )}
      {pinnedMessages.length > 0 && (
        <div className="mx-4 mt-3 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-gold/40 bg-gold/10 p-3">
          <p className="flex items-center gap-1 text-[11px] font-medium text-gold">
            <Pin size={12} />
            {t('chat.pinnedSectionHeading')}
          </p>
          {pinnedMessages.map((message) => {
            const sender = resolveChatPerson(message.senderProfileId, directory, employeeMap, employeeName, managerLabel);
            return (
              <div key={message.id} className="flex items-start gap-2 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-paper">{sender.name}</span>
                    {isBroadcast && isManagerProfile(message.senderProfileId) && (
                      <span className="rounded-full bg-seal/20 px-1.5 py-[1px] text-[9px] font-medium text-seal-bright">
                        {t('chat.officialBadge')}
                      </span>
                    )}
                    <span className="text-[10px] text-paper-dim">{formatTime(message.createdAt)}</span>
                  </div>
                  {message.body && <p className="mt-0.5 whitespace-pre-wrap text-paper">{message.body}</p>}
                  {message.imagePath && <ChatImage path={message.imagePath} getSignedImageUrl={getSignedImageUrl} />}
                </div>
                {canPin && (
                  <button
                    type="button"
                    onClick={() => onTogglePin(message.id, false)}
                    title={t('chat.unpinMessage')}
                    className="text-gold transition hover:text-paper"
                  >
                    <PinOff size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && <p className="text-xs text-paper-dim">{t('chat.noMessages')}</p>}
        {messages.map((message) => {
          const sender = resolveChatPerson(message.senderProfileId, directory, employeeMap, employeeName, managerLabel);
          const isPinned = !!message.pinnedAt;
          return (
            <div key={message.id} className="flex items-start gap-2">
              <ChatPersonAvatar employee={sender.employee} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-paper">{sender.name}</span>
                  {isBroadcast && isManagerProfile(message.senderProfileId) && (
                    <span className="rounded-full bg-seal/20 px-1.5 py-[1px] text-[9px] font-medium text-seal-bright">
                      {t('chat.officialBadge')}
                    </span>
                  )}
                  <span className="text-[10px] text-paper-dim">{formatTime(message.createdAt)}</span>
                  {canPin && (
                    <button
                      type="button"
                      onClick={() => onTogglePin(message.id, !isPinned)}
                      title={isPinned ? t('chat.unpinMessage') : t('chat.pinMessage')}
                      className={`self-center transition ${isPinned ? 'text-gold' : 'text-paper-dim hover:text-gold'}`}
                    >
                      <Pin size={11} />
                    </button>
                  )}
                </div>
                {message.body && <p className="mt-0.5 whitespace-pre-wrap text-sm text-paper">{message.body}</p>}
                {message.imagePath && <ChatImage path={message.imagePath} getSignedImageUrl={getSignedImageUrl} />}
                <ReactionBar
                  messageId={message.id}
                  reactions={reactionsByMessage.get(message.id) ?? []}
                  directory={directory}
                  employeeMap={employeeMap}
                  myProfileId={myProfileId}
                  canReact={canReact}
                  onToggle={onToggleReaction}
                />
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {canPostText && (
        <div className="border-t border-paper/10 p-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title={t('chat.attachImage')}
              className="text-paper-dim transition hover:text-gold disabled:opacity-40"
            >
              <ImagePlus size={18} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder={t('chat.messagePlaceholder')}
              className="flex-1 rounded-full border border-paper/20 bg-void px-3 py-1.5 text-sm text-paper placeholder:text-paper-dim/60 focus:border-gold focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!text.trim()}
              className="rounded-full bg-gold/20 px-3 py-1.5 text-xs font-medium text-gold transition disabled:opacity-40"
            >
              {t('chat.send')}
            </button>
          </div>
          {uploading && <p className="mt-1.5 text-[11px] text-paper-dim">{t('chat.uploading')}</p>}
        </div>
      )}
    </div>
  );
}
