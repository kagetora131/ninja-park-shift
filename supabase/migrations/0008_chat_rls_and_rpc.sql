create or replace function public.is_chat_member(p_conversation_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.chat_conversation_members
    where conversation_id = p_conversation_id and employee_id = public.current_employee_id()
  );
$$;

alter table public.chat_conversations enable row level security;
create policy "chat_conversations_select" on public.chat_conversations
  for select to authenticated
  using (type = 'broadcast' or public.current_role() = 'manager' or public.is_chat_member(id));
-- insertポリシーはあえて作らない(直接INSERTは常に拒否、下記RPC経由のみ許可)

alter table public.chat_conversation_members enable row level security;
create policy "chat_conversation_members_select" on public.chat_conversation_members
  for select to authenticated
  using (public.current_role() = 'manager' or public.is_chat_member(conversation_id));

alter table public.chat_messages enable row level security;
create policy "chat_messages_select" on public.chat_messages
  for select to authenticated
  using (
    public.current_role() = 'manager'
    or exists (select 1 from public.chat_conversations c where c.id = conversation_id and c.type = 'broadcast')
    or public.is_chat_member(conversation_id)
  );
create policy "chat_messages_insert" on public.chat_messages
  for insert to authenticated
  with check (
    sender_id = public.current_employee_id()
    and (
      (public.current_role() = 'manager'
        and exists (select 1 from public.chat_conversations c where c.id = conversation_id and c.type = 'broadcast'))
      or (public.is_chat_member(conversation_id)
        and exists (select 1 from public.chat_conversations c where c.id = conversation_id and c.type in ('dm','group')))
    )
  );
-- 編集・削除ポリシーはv1では作らない(メッセージの編集・削除機能自体を持たせない)

alter table public.chat_reads enable row level security;
create policy "chat_reads_select" on public.chat_reads for select to authenticated
  using (employee_id = public.current_employee_id());
create policy "chat_reads_insert" on public.chat_reads for insert to authenticated
  with check (employee_id = public.current_employee_id());
create policy "chat_reads_update" on public.chat_reads for update to authenticated
  using (employee_id = public.current_employee_id()) with check (employee_id = public.current_employee_id());

alter table public.chat_message_reactions enable row level security;
create policy "chat_message_reactions_select" on public.chat_message_reactions
  for select to authenticated
  using (
    exists (
      select 1 from public.chat_messages m join public.chat_conversations c on c.id = m.conversation_id
      where m.id = message_id
        and (public.current_role() = 'manager' or c.type = 'broadcast' or public.is_chat_member(c.id))
    )
  );
create policy "chat_message_reactions_insert" on public.chat_message_reactions
  for insert to authenticated
  with check (
    employee_id = public.current_employee_id()
    and exists (
      select 1 from public.chat_messages m join public.chat_conversations c on c.id = m.conversation_id
      where m.id = message_id and (c.type = 'broadcast' or public.is_chat_member(c.id))
    )
  );
create policy "chat_message_reactions_update" on public.chat_message_reactions
  for update to authenticated
  using (employee_id = public.current_employee_id()) with check (employee_id = public.current_employee_id());
create policy "chat_message_reactions_delete" on public.chat_message_reactions
  for delete to authenticated using (employee_id = public.current_employee_id());

-- 会話作成(DM/グループ)は会話行+全メンバー行のアトミックな挿入とDM重複防止が必要なため、
-- update_my_shift_preferencesと同じsecurity definer RPC方式にする。
create or replace function public.create_chat_conversation(
  p_type text,
  p_name text,
  p_member_employee_ids text[]
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me text := public.current_employee_id();
  v_conversation_id uuid;
  v_existing_dm uuid;
begin
  if auth.uid() is null or v_me is null then
    raise exception 'ログインが必要です';
  end if;
  if p_type not in ('dm', 'group') then
    raise exception '不正な会話種別です';
  end if;

  if p_type = 'dm' then
    if coalesce(array_length(p_member_employee_ids, 1), 0) <> 1 then
      raise exception '個人チャットの相手は1人指定してください';
    end if;
    select cm1.conversation_id into v_existing_dm
      from public.chat_conversation_members cm1
      join public.chat_conversation_members cm2 on cm1.conversation_id = cm2.conversation_id
      join public.chat_conversations c on c.id = cm1.conversation_id
      where c.type = 'dm' and cm1.employee_id = v_me and cm2.employee_id = p_member_employee_ids[1]
      limit 1;
    if v_existing_dm is not null then
      return v_existing_dm;
    end if;
  end if;

  insert into public.chat_conversations (type, name, created_by)
    values (p_type, p_name, v_me) returning id into v_conversation_id;
  insert into public.chat_conversation_members (conversation_id, employee_id)
    select v_conversation_id, unnest(array_append(p_member_employee_ids, v_me))
    on conflict do nothing;
  return v_conversation_id;
end;
$$;

revoke execute on function public.create_chat_conversation(text, text, text[]) from public;
grant execute on function public.create_chat_conversation(text, text, text[]) to authenticated;

-- 注: このRPC・RLS(employee_idベース)は0012で profiles.id ベースに作り直されている(0007の注記参照)。
