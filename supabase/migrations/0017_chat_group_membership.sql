-- グループのメンバー操作: 追加は参加者全員、退出は各自、他人を外すのはグループ作成者のみ。
-- 途中参加者にも参加前のメッセージは見せる(chat_messagesの既存RLSのまま)。
create or replace function public.add_chat_group_members(p_conversation_id uuid, p_member_profile_ids uuid[])
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_type text;
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です';
  end if;
  select type into v_type from public.chat_conversations where id = p_conversation_id;
  if v_type is distinct from 'group' then
    raise exception 'グループチャットのみメンバーを追加できます';
  end if;
  if not public.is_chat_member(p_conversation_id) then
    raise exception 'グループの参加者のみメンバーを追加できます';
  end if;
  if coalesce(array_length(p_member_profile_ids, 1), 0) = 0 then
    raise exception '追加するメンバーを選んでください';
  end if;
  insert into public.chat_conversation_members (conversation_id, profile_id)
    select p_conversation_id, unnest(p_member_profile_ids)
    on conflict do nothing;
end;
$$;

create or replace function public.leave_chat_group(p_conversation_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_type text;
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です';
  end if;
  select type into v_type from public.chat_conversations where id = p_conversation_id;
  if v_type is distinct from 'group' then
    raise exception 'グループチャットのみ退出できます';
  end if;
  if not public.is_chat_member(p_conversation_id) then
    raise exception 'このグループに参加していません';
  end if;
  delete from public.chat_conversation_members
    where conversation_id = p_conversation_id and profile_id = auth.uid();
end;
$$;

create or replace function public.remove_chat_group_member(p_conversation_id uuid, p_profile_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_type text;
  v_created_by uuid;
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です';
  end if;
  select type, created_by into v_type, v_created_by from public.chat_conversations where id = p_conversation_id;
  if v_type is distinct from 'group' then
    raise exception 'グループチャットのみメンバーを外せます';
  end if;
  if v_created_by is distinct from auth.uid() or not public.is_chat_member(p_conversation_id) then
    raise exception 'メンバーを外せるのはグループの作成者のみです';
  end if;
  if p_profile_id = auth.uid() then
    raise exception '自分自身は「グループを退出」から抜けてください';
  end if;
  delete from public.chat_conversation_members
    where conversation_id = p_conversation_id and profile_id = p_profile_id;
end;
$$;

revoke execute on function public.add_chat_group_members(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.add_chat_group_members(uuid, uuid[]) to authenticated;
revoke execute on function public.leave_chat_group(uuid) from public, anon, authenticated;
grant execute on function public.leave_chat_group(uuid) to authenticated;
revoke execute on function public.remove_chat_group_member(uuid, uuid) from public, anon, authenticated;
grant execute on function public.remove_chat_group_member(uuid, uuid) to authenticated;

-- 追加されたメンバーの会話一覧に、リロードなしでグループが現れるようにする。
-- クライアントはINSERTのみ購読する(DELETEイベントはRLSが適用されず全購読者に主キーが配信されるため購読しない)。
alter publication supabase_realtime add table public.chat_conversation_members;
