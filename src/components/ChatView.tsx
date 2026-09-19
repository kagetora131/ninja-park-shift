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

/** チャットタブの本体。会話一覧(左)+スレッド(右)の2ペイン構成。 */
export function ChatView({ employeeMap, myProfileId, isManager, chat }: ChatViewProps) {
  const { t } = useLabelContext();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showNewDm, setShowNewDm] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);

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
    toggleReaction,
  } = chat;

  // 未選択時は業務連絡チャンネルを既定表示にする(setStateを使わずrender時に導出する)。
  const fallbackId = myConversations.find((c) => c.type === 'broadcast')?.id ?? myConversations[0]?.id ?? null;
  const effectiveActiveId = activeId ?? fallbackId;

  const activeConversation =
    [...myConversations, ...otherConversations].find((c) => c.id === effectiveActiveId) ?? null;
  const activeIsParticipant = activeConversation ? isParticipant(activeConversation) : false;
  const activeMessages = activeConversation ? messagesByConversation.get(activeConversation.id) ?? [] : [];

  useEffect(() => {
    if (activeConversation && activeIsParticipant) {
      markConversationRead(activeConversation.id);
    }
  }, [activeConversation, activeIsParticipant, activeMessages.length, markConversationRead]);

  const handleSelectDm = async (otherProfileId: string) => {
    const id = await createDirectConversation(otherProfileId);
    setActiveId(id);
    setShowNewDm(false);
  };

  const handleCreateGroup = async (name: string, memberProfileIds: string[]) => {
    const id = await createGroupConversation(name, memberProfileIds);
    setActiveId(id);
    setShowNewGroup(false);
  };

  return (
    <div className="flex h-[70vh] gap-4">
      <div className="w-64 shrink-0 overflow-y-auto">
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
          onSelect={setActiveId}
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
              onSelect={setActiveId}
              unreadCounts={new Map()}
              employeeMap={employeeMap}
              directory={directory}
              myProfileId={myProfileId}
              memberIdsByConversation={memberIdsByConversation}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-paper/10 bg-void-soft/30">
        {activeConversation ? (
          <ChatThread
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
