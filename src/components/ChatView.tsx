import { useEffect, useState } from 'react';
import { ChatConversationList } from './ChatConversationList';
import { ChatThread } from './ChatThread';
import { NewDmModal } from './NewDmModal';
import { NewGroupModal } from './NewGroupModal';
import { useLabelContext } from '../hooks/LabelContext';
import type { useChatStore } from '../hooks/useChatStore';
import type { Employee } from '../types';

interface ChatViewProps {
  employeeMap: Map<string, Employee>;
  myProfileId: string;
  isManager: boolean;
  chat: ReturnType<typeof useChatStore>;
}

const DESKTOP_QUERY = '(min-width: 768px)';

/** Tailwindの`md`ブレークポイント以上(2ペイン表示)かどうか。 */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return isDesktop;
}

/**
 * チャットタブの本体。PC幅では会話一覧(左)+スレッド(右)の2ペイン、
 * スマホ幅では「一覧→タップでスレッド→戻る」の1ペイン切り替えにする。
 */
export function ChatView({ employeeMap, myProfileId, isManager, chat }: ChatViewProps) {
  const { t } = useLabelContext();
  const isDesktop = useIsDesktop();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [showNewDm, setShowNewDm] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const threadVisible = isDesktop || mobileThreadOpen;

  const {
    directory,
    myConversations,
    otherConversations,
    memberIdsByConversation,
    isParticipant,
    messagesByConversation,
    reactionsByMessage,
    unreadCounts,
    sendMessage,
    createDirectConversation,
    createGroupConversation,
    markConversationRead,
    uploadChatImage,
    getSignedImageUrl,
    togglePinMessage,
    toggleReaction,
    revisionsByMessage,
    editMessage,
    deleteMessage,
    addGroupMembers,
    leaveGroup,
    removeGroupMember,
  } = chat;

  // 未選択時は業務連絡チャンネルを既定表示にする(setStateを使わずrender時に導出する)。
  const fallbackId = myConversations.find((c) => c.type === 'broadcast')?.id ?? myConversations[0]?.id ?? null;
  const effectiveActiveId = activeId ?? fallbackId;

  const activeConversation =
    [...myConversations, ...otherConversations].find((c) => c.id === effectiveActiveId) ?? null;
  const activeIsParticipant = activeConversation ? isParticipant(activeConversation) : false;
  const activeMessages = activeConversation ? messagesByConversation.get(activeConversation.id) ?? [] : [];

  // スマホで一覧だけを見ている間は、既定の会話を既読にしない
  useEffect(() => {
    if (threadVisible && activeConversation && activeIsParticipant) {
      markConversationRead(activeConversation.id);
    }
  }, [threadVisible, activeConversation, activeIsParticipant, activeMessages.length, markConversationRead]);

  const openConversation = (id: string) => {
    setActiveId(id);
    setMobileThreadOpen(true);
  };

  const handleSelectDm = async (otherProfileId: string) => {
    const id = await createDirectConversation(otherProfileId);
    openConversation(id);
    setShowNewDm(false);
  };

  const handleCreateGroup = async (name: string, memberProfileIds: string[]) => {
    const id = await createGroupConversation(name, memberProfileIds);
    openConversation(id);
    setShowNewGroup(false);
  };

  return (
    <div className="flex h-[70vh] gap-4">
      <div className={`${mobileThreadOpen ? 'hidden' : 'block'} w-full overflow-y-auto md:block md:w-64 md:shrink-0`}>
        <div className="mb-3 flex gap-1.5">
          <button
            type="button"
            onClick={() => setShowNewDm(true)}
            className="flex-1 rounded-full border border-paper/20 px-2 py-1.5 text-[11px] text-paper-dim transition hover:border-gold hover:text-gold"
          >
            {t('chat.newDm')}
          </button>
          <button
            type="button"
            onClick={() => setShowNewGroup(true)}
            className="flex-1 rounded-full border border-paper/20 px-2 py-1.5 text-[11px] text-paper-dim transition hover:border-gold hover:text-gold"
          >
            {t('chat.newGroup')}
          </button>
        </div>

        <ChatConversationList
          heading={isManager ? t('chat.myConversations') : undefined}
          conversations={myConversations}
          activeId={effectiveActiveId}
          onSelect={openConversation}
          unreadCounts={unreadCounts}
          employeeMap={employeeMap}
          directory={directory}
          myProfileId={myProfileId}
          memberIdsByConversation={memberIdsByConversation}
        />

        {isManager && otherConversations.length > 0 && (
          <div className="mt-4">
            <ChatConversationList
              heading={t('chat.allStaffConversations')}
              conversations={otherConversations}
              activeId={effectiveActiveId}
              onSelect={openConversation}
              unreadCounts={new Map()}
              employeeMap={employeeMap}
              directory={directory}
              myProfileId={myProfileId}
              memberIdsByConversation={memberIdsByConversation}
            />
          </div>
        )}
      </div>

      <div
        className={`${mobileThreadOpen ? 'block' : 'hidden'} min-w-0 flex-1 overflow-hidden rounded-xl border border-paper/10 bg-void-soft/30 md:block`}
      >
        {/* 表示中のときだけ描画し、会話ごとに作り直す(開いた時点で最新メッセージまでスクロールさせ、入力途中の文や編集状態を他の会話に持ち越さないため) */}
        {activeConversation && threadVisible ? (
          <ChatThread
            key={activeConversation.id}
            conversation={activeConversation}
            messages={activeMessages}
            employeeMap={employeeMap}
            directory={directory}
            memberIdsByConversation={memberIdsByConversation}
            myProfileId={myProfileId}
            isManager={isManager}
            isParticipant={activeIsParticipant}
            reactionsByMessage={reactionsByMessage}
            onSendMessage={(body, imagePath) => sendMessage(activeConversation.id, body, imagePath)}
            onUploadImage={(file) => uploadChatImage(activeConversation.id, file)}
            getSignedImageUrl={getSignedImageUrl}
            onToggleReaction={toggleReaction}
            onTogglePin={togglePinMessage}
            revisionsByMessage={revisionsByMessage}
            onEditMessage={editMessage}
            onDeleteMessage={deleteMessage}
            onBack={() => setMobileThreadOpen(false)}
            onAddMembers={(ids) => addGroupMembers(activeConversation.id, ids)}
            onLeaveGroup={async () => {
              await leaveGroup(activeConversation.id);
              // 退出後はその会話を開いたままにしない(マネージャーだと閲覧専用として残ってしまうため)
              setActiveId(null);
              setMobileThreadOpen(false);
            }}
            onRemoveMember={(profileId) => removeGroupMember(activeConversation.id, profileId)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-paper-dim">
            {t('chat.noConversations')}
          </div>
        )}
      </div>

      {showNewDm && (
        <NewDmModal
          directory={directory}
          employeeMap={employeeMap}
          myProfileId={myProfileId}
          onSelect={handleSelectDm}
          onClose={() => setShowNewDm(false)}
        />
      )}
      {showNewGroup && (
        <NewGroupModal
          directory={directory}
          employeeMap={employeeMap}
          myProfileId={myProfileId}
          onCreate={handleCreateGroup}
          onClose={() => setShowNewGroup(false)}
        />
      )}
    </div>
  );
}
