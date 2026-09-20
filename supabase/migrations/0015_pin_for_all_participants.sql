-- ピン留めを全員に開放する。ただし業務連絡チャンネル(broadcast)のみマネージャー限定。
-- 個人チャット・グループチャットは、その会話の参加者ならピン留め/解除できる
-- (マネージャーが閲覧のみで参加していない会話では、他の操作と同様にピン留め不可)。
create or replace function public.set_chat_message_pinned(p_message_id uuid, p_pinned boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_conversation_id uuid;
  v_type text;
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です';
  end if;
  select c.id, c.type into v_conversation_id, v_type
    from public.chat_messages m join public.chat_conversations c on c.id = m.conversation_id
    where m.id = p_message_id;
  if v_type is null then
    raise exception 'メッセージが見つかりません';
  end if;
  if v_type = 'broadcast' then
    if public.current_role() is distinct from 'manager' then
      raise exception '業務連絡チャンネルはマネージャーのみピン留めできます';
    end if;
  elsif not public.is_chat_member(v_conversation_id) then
    raise exception 'この会話の参加者のみピン留めできます';
  end if;
  update public.chat_messages
    set pinned_at = case when p_pinned then now() else null end
    where id = p_message_id;
end;
$$;
