-- get_advisorsで、anon/authenticatedへのEXECUTE権限がpublicからのrevokeだけでは
-- 剥奪しきれていない(Supabaseのデフォルト権限設定によりanon/authenticatedへ直接付与されている)
-- ことが判明したため、新規関数・既存関数とも明示的にanon/authenticatedからrevokeし直す。
revoke execute on function public.is_chat_member(uuid) from public, anon, authenticated;
grant execute on function public.is_chat_member(uuid) to authenticated;

revoke execute on function public.create_chat_conversation(text, text, text[]) from public, anon, authenticated;
grant execute on function public.create_chat_conversation(text, text, text[]) to authenticated;

revoke execute on function public.current_role() from public, anon, authenticated;
grant execute on function public.current_role() to authenticated;

revoke execute on function public.current_employee_id() from public, anon, authenticated;
grant execute on function public.current_employee_id() to authenticated;

revoke execute on function public.update_my_shift_preferences(integer, text[], date[]) from public, anon, authenticated;
grant execute on function public.update_my_shift_preferences(integer, text[], date[]) to authenticated;

revoke execute on function public.update_my_avatar(text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.update_my_avatar(text, text, text, boolean) to authenticated;

-- 新規チャットテーブルの外部キーに索引を追加(get_advisorsのunindexed_foreign_keys対応)
create index chat_conversation_members_employee_id_idx on public.chat_conversation_members(employee_id);
create index chat_conversations_created_by_idx on public.chat_conversations(created_by);
create index chat_message_reactions_employee_id_idx on public.chat_message_reactions(employee_id);
create index chat_messages_sender_id_idx on public.chat_messages(sender_id);
create index chat_reads_employee_id_idx on public.chat_reads(employee_id);

-- 注: 上記の索引・チャット関連のrevoke/grantは0012のテーブル作り直しに伴い再作成されている。
