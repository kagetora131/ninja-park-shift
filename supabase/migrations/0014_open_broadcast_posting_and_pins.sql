-- 業務連絡チャンネル(broadcast)への投稿を全員に開放する(従来はマネージャーのみ)。
-- マネージャーの連絡が埋もれないよう、マネージャーが手動でピン留めできるようにする。
alter table public.chat_messages add column pinned_at timestamptz;

drop policy "chat_messages_insert" on public.chat_messages;
create policy "chat_messages_insert" on public.chat_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chat_conversations c
      where c.id = conversation_id
        and (c.type = 'broadcast' or (c.type in ('dm','group') and public.is_chat_member(c.id)))
    )
  );

drop policy "chat_images_insert" on storage.objects;
create policy "chat_images_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat-images' and exists (
      select 1 from public.chat_conversations c
      where c.id::text = (storage.foldername(objects.name))[1]
        and (c.type = 'broadcast' or (c.type in ('dm','group') and public.is_chat_member(c.id)))
    )
  );

-- ピン留めの切り替えはマネージャー限定・業務連絡チャンネルのメッセージのみ。
-- 直接UPDATE権限は与えず、他の自己編集系と同じsecurity definer RPC経由にする。
create or replace function public.set_chat_message_pinned(p_message_id uuid, p_pinned boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_type text;
begin
  if auth.uid() is null or public.current_role() is distinct from 'manager' then
    raise exception 'マネージャーのみピン留めできます';
  end if;
  select c.type into v_type
    from public.chat_messages m join public.chat_conversations c on c.id = m.conversation_id
    where m.id = p_message_id;
  if v_type is null then
    raise exception 'メッセージが見つかりません';
  end if;
  if v_type <> 'broadcast' then
    raise exception '業務連絡チャンネルのメッセージのみピン留めできます';
  end if;
  update public.chat_messages
    set pinned_at = case when p_pinned then now() else null end
    where id = p_message_id;
end;
$$;
revoke execute on function public.set_chat_message_pinned(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_chat_message_pinned(uuid, boolean) to authenticated;
