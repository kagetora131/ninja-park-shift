import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  mapChatConversationRow,
  mapChatDirectoryRow,
  mapChatMessageRevisionRow,
  mapChatMessageRow,
  mapChatReactionRow,
  type ChatConversationRow,
  type ChatDirectoryRow,
  type ChatMessageRevisionRow,
  type ChatMessageRow,
  type ChatReactionRow,
} from '../data/supabaseMappers';
import type {
  ChatConversation,
  ChatDirectoryEntry,
  ChatMessage,
  ChatMessageRevision,
  ChatReaction,
  ChatStampKey,
} from '../types';

/** 送信後、本人が編集・取り消しできる期間(DB側のRPCと同じ24時間)。 */
export const CHAT_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

interface MemberRow {
  conversationId: string;
  profileId: string;
}

interface ReadRow {
  conversationId: string;
  lastReadAt: string;
}

/**
 * チャット(業務連絡・個人チャット・グループチャット)のストア。
 * 参加者の識別子はemployees.idではなくprofiles.id(認証ユーザーID)を使う
 * (マネージャーアカウントはemployees行を持たないため)。
 * useShiftStoreと同じ「取得できたものをそのままstateにする、更新後はrefetch」方式に
 * Supabase Realtimeの購読を1本追加する形。行の可視範囲はRLSに任せる。
 */
export function useChatStore(myProfileId: string, isManager: boolean) {
  const [loading, setLoading] = useState(true);
  const [revisions, setRevisions] = useState<ChatMessageRevision[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<ChatReaction[]>([]);
  const [reads, setReads] = useState<ReadRow[]>([]);
  const [directory, setDirectory] = useState<ChatDirectoryEntry[]>([]);
  const signedUrlCache = useRef(new Map<string, string>());

  const refetchConversations = useCallback(async () => {
    const { data } = await supabase.from('chat_conversations').select('*').order('created_at');
    setConversations(((data as ChatConversationRow[]) ?? []).map(mapChatConversationRow));
  }, []);

  const refetchMembers = useCallback(async () => {
    const { data } = await supabase.from('chat_conversation_members').select('conversation_id, profile_id');
    setMembers(
      ((data ?? []) as { conversation_id: string; profile_id: string }[]).map((r) => ({
        conversationId: r.conversation_id,
        profileId: r.profile_id,
      })),
    );
  }, []);

  const refetchMessages = useCallback(async () => {
    const { data } = await supabase.from('chat_messages').select('*').order('created_at');
    setMessages(((data as ChatMessageRow[]) ?? []).map(mapChatMessageRow));
  }, []);

  const refetchReactions = useCallback(async () => {
    const { data } = await supabase.from('chat_message_reactions').select('*');
    setReactions(((data as ChatReactionRow[]) ?? []).map(mapChatReactionRow));
  }, []);

  const refetchReads = useCallback(async () => {
    const { data } = await supabase
      .from('chat_reads')
      .select('conversation_id, last_read_at')
      .eq('profile_id', myProfileId);
    setReads(
      ((data ?? []) as { conversation_id: string; last_read_at: string }[]).map((r) => ({
        conversationId: r.conversation_id,
        lastReadAt: r.last_read_at,
      })),
    );
  }, [myProfileId]);

  const refetchDirectory = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('id, employee_id, role');
    setDirectory(((data as ChatDirectoryRow[]) ?? []).map(mapChatDirectoryRow));
  }, []);

  /** 編集・取り消し前の原文。RLSでマネージャー以外は0件になるため、マネージャーのときだけ取得する。 */
  const refetchRevisions = useCallback(async () => {
    if (!isManager) return;
    const { data } = await supabase.from('chat_message_revisions').select('*').order('created_at');
    setRevisions(((data as ChatMessageRevisionRow[]) ?? []).map(mapChatMessageRevisionRow));
  }, [isManager]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([
        refetchConversations(),
        refetchMembers(),
        refetchMessages(),
        refetchReactions(),
        refetchReads(),
        refetchDirectory(),
        refetchRevisions(),
      ]);
      setLoading(false);
    })();
  }, [
    refetchConversations,
    refetchMembers,
    refetchMessages,
    refetchReactions,
    refetchReads,
    refetchDirectory,
    refetchRevisions,
  ]);

  useEffect(() => {
    const channel = supabase
      .channel('chat-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const row = mapChatMessageRow(payload.new as ChatMessageRow);
        setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, (payload) => {
        const row = mapChatMessageRow(payload.new as ChatMessageRow);
        setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));
        // 編集・取り消しで履歴が増えている可能性があるので取り直す(マネージャー以外は何もしない)
        refetchRevisions();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_message_reactions' }, (payload) => {
        const row = mapChatReactionRow(payload.new as ChatReactionRow);
        setReactions((prev) => [...prev.filter((r) => !(r.messageId === row.messageId && r.profileId === row.profileId)), row]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_message_reactions' }, (payload) => {
        const row = mapChatReactionRow(payload.new as ChatReactionRow);
        setReactions((prev) => [...prev.filter((r) => !(r.messageId === row.messageId && r.profileId === row.profileId)), row]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_message_reactions' }, (payload) => {
        const old = payload.old as Partial<ChatReactionRow>;
        setReactions((prev) => prev.filter((r) => !(r.messageId === old.message_id && r.profileId === old.profile_id)));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchRevisions]);

  const memberIdsByConversation = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const m of members) {
      if (!map.has(m.conversationId)) map.set(m.conversationId, new Set());
      map.get(m.conversationId)!.add(m.profileId);
    }
    return map;
  }, [members]);

  const isParticipant = useCallback(
    (conversation: ChatConversation) => {
      if (conversation.type === 'broadcast') return true;
      return memberIdsByConversation.get(conversation.id)?.has(myProfileId) ?? false;
    },
    [memberIdsByConversation, myProfileId],
  );

  /** 自分が実際に参加している会話(業務連絡+自分がメンバーのDM/グループ)。 */
  const myConversations = useMemo(() => conversations.filter(isParticipant), [conversations, isParticipant]);
  /** マネージャーが閲覧のみできる、自分が参加していない他人の会話。 */
  const otherConversations = useMemo(
    () => conversations.filter((c) => !isParticipant(c)),
    [conversations, isParticipant],
  );

  const messagesByConversation = useMemo(() => {
    const map = new Map<string, ChatMessage[]>();
    for (const m of messages) {
      if (!map.has(m.conversationId)) map.set(m.conversationId, []);
      map.get(m.conversationId)!.push(m);
    }
    for (const list of map.values()) list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return map;
  }, [messages]);

  const lastReadAtByConversation = useMemo(() => new Map(reads.map((r) => [r.conversationId, r.lastReadAt])), [reads]);

  /** 未読件数(自分が参加している会話のみ対象。マネージャーが閲覧のみできる他人の会話は含めない)。 */
  const unreadCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const conversation of myConversations) {
      const lastReadAt = lastReadAtByConversation.get(conversation.id);
      const list = messagesByConversation.get(conversation.id) ?? [];
      const count = list.filter(
        (m) => m.senderProfileId !== myProfileId && (!lastReadAt || m.createdAt > lastReadAt),
      ).length;
      if (count > 0) map.set(conversation.id, count);
    }
    return map;
  }, [myConversations, lastReadAtByConversation, messagesByConversation, myProfileId]);

  const totalUnreadCount = useMemo(
    () => Array.from(unreadCounts.values()).reduce((a, b) => a + b, 0),
    [unreadCounts],
  );

  const reactionsByMessage = useMemo(() => {
    const map = new Map<string, ChatReaction[]>();
    for (const r of reactions) {
      if (!map.has(r.messageId)) map.set(r.messageId, []);
      map.get(r.messageId)!.push(r);
    }
    return map;
  }, [reactions]);

  const sendMessage = useCallback(
    async (conversationId: string, body: string | null, imagePath: string | null) => {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ conversation_id: conversationId, sender_id: myProfileId, body, image_path: imagePath })
        .select()
        .single();
      if (error) throw error;
      const row = mapChatMessageRow(data as ChatMessageRow);
      setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
    },
    [myProfileId],
  );

  const createDirectConversation = useCallback(
    async (otherProfileId: string) => {
      const { data, error } = await supabase.rpc('create_chat_conversation', {
        p_type: 'dm',
        p_name: null,
        p_member_profile_ids: [otherProfileId],
      });
      if (error) throw error;
      await Promise.all([refetchConversations(), refetchMembers()]);
      return data as string;
    },
    [refetchConversations, refetchMembers],
  );

  const createGroupConversation = useCallback(
    async (name: string, memberProfileIds: string[]) => {
      const { data, error } = await supabase.rpc('create_chat_conversation', {
        p_type: 'group',
        p_name: name,
        p_member_profile_ids: memberProfileIds,
      });
      if (error) throw error;
      await Promise.all([refetchConversations(), refetchMembers()]);
      return data as string;
    },
    [refetchConversations, refetchMembers],
  );

  /** 自分が参加している会話を開いたときだけ呼ぶ想定(マネージャーが閲覧目的で他人の会話を開いたときは呼ばない)。 */
  const markConversationRead = useCallback(
    async (conversationId: string) => {
      const nowIso = new Date().toISOString();
      await supabase.from('chat_reads').upsert({ conversation_id: conversationId, profile_id: myProfileId, last_read_at: nowIso });
      setReads((prev) => [...prev.filter((r) => r.conversationId !== conversationId), { conversationId, lastReadAt: nowIso }]);
    },
    [myProfileId],
  );

  const uploadChatImage = useCallback(async (conversationId: string, file: File) => {
    const path = `${conversationId}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from('chat-images').upload(path, file);
    if (error) throw error;
    return path;
  }, []);

  const getSignedImageUrl = useCallback(async (path: string) => {
    const cached = signedUrlCache.current.get(path);
    if (cached) return cached;
    const { data, error } = await supabase.storage.from('chat-images').createSignedUrl(path, 3600);
    if (error || !data) throw error ?? new Error('画像URLの取得に失敗しました');
    signedUrlCache.current.set(path, data.signedUrl);
    return data.signedUrl;
  }, []);

  const revisionsByMessage = useMemo(() => {
    const map = new Map<string, ChatMessageRevision[]>();
    for (const r of revisions) {
      if (!map.has(r.messageId)) map.set(r.messageId, []);
      map.get(r.messageId)!.push(r);
    }
    return map;
  }, [revisions]);

  /** 自分のテキストメッセージの編集(送信から24時間以内。権限と期限はRPC側でも検査される)。 */
  const editMessage = useCallback(
    async (messageId: string, body: string) => {
      const { error } = await supabase.rpc('edit_chat_message', { p_message_id: messageId, p_body: body });
      if (error) throw error;
      const editedAt = new Date().toISOString();
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, body: body.trim(), editedAt } : m)));
      await refetchRevisions();
    },
    [refetchRevisions],
  );

  /** 自分のメッセージの取り消し(送信から24時間以内)。原文はマネージャー用の履歴にだけ残る。 */
  const deleteMessage = useCallback(
    async (messageId: string) => {
      const { error } = await supabase.rpc('delete_chat_message', { p_message_id: messageId });
      if (error) throw error;
      const deletedAt = new Date().toISOString();
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, body: null, imagePath: null, pinnedAt: null, deletedAt } : m)),
      );
      await refetchRevisions();
    },
    [refetchRevisions],
  );

  /** 業務連絡チャンネルのメッセージのピン留め切り替え(マネージャーのみ。権限はRPC側でも検査される)。 */
  const togglePinMessage = useCallback(async (messageId: string, pinned: boolean) => {
    const { error } = await supabase.rpc('set_chat_message_pinned', { p_message_id: messageId, p_pinned: pinned });
    if (error) throw error;
    const pinnedAt = pinned ? new Date().toISOString() : null;
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, pinnedAt } : m)));
  }, []);

  /** 同じスタンプを再度押すと取り消し、別のスタンプを押すと差し替える。 */
  const toggleReaction = useCallback(
    async (messageId: string, stampKey: ChatStampKey) => {
      const existing = reactions.find((r) => r.messageId === messageId && r.profileId === myProfileId);
      if (existing && existing.stampKey === stampKey) {
        await supabase.from('chat_message_reactions').delete().eq('message_id', messageId).eq('profile_id', myProfileId);
        setReactions((prev) => prev.filter((r) => !(r.messageId === messageId && r.profileId === myProfileId)));
      } else {
        await supabase
          .from('chat_message_reactions')
          .upsert({ message_id: messageId, profile_id: myProfileId, stamp_key: stampKey });
        setReactions((prev) => [
          ...prev.filter((r) => !(r.messageId === messageId && r.profileId === myProfileId)),
          { messageId, profileId: myProfileId, stampKey, createdAt: new Date().toISOString() },
        ]);
      }
    },
    [reactions, myProfileId],
  );

  return {
    loading,
    directory,
    conversations,
    myConversations,
    otherConversations,
    memberIdsByConversation,
    isParticipant,
    messagesByConversation,
    reactionsByMessage,
    unreadCounts,
    totalUnreadCount,
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
  };
}
