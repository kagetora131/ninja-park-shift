-- 送信から24時間以内に限り、自分のメッセージを編集・取り消しできるようにする。
-- 取り消し・編集前の原文はマネージャーだけが閲覧できる履歴テーブルに残す(ハラスメント発言の
-- 送信直後の証拠隠しを防ぐため)。chat_messages側の本文は取り消し時にnullにするので、
-- 他の参加者はAPIを直接叩いても原文を取得できない。
alter table public.chat_messages add column edited_at timestamptz;
alter table public.chat_messages add column deleted_at timestamptz;
alter table public.chat_messages drop constraint chat_messages_has_content;
alter table public.chat_messages add constraint chat_messages_has_content
  check (deleted_at is not null or body is not null or image_path is not null);

create table public.chat_message_revisions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  kind text not null check (kind in ('edit', 'delete')),
  previous_body text,
  previous_image_path text,
  created_at timestamptz not null default now()
);
create index chat_message_revisions_message_id_idx on public.chat_message_revisions(message_id, created_at);

alter table public.chat_message_revisions enable row level security;
create policy "chat_message_revisions_select_manager" on public.chat_message_revisions
  for select to authenticated using (public.current_role() = 'manager');
-- insertポリシーは作らない(下記RPC経由でのみ書き込む)

create or replace function public.edit_chat_message(p_message_id uuid, p_body text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_msg public.chat_messages%rowtype;
  v_body text := btrim(coalesce(p_body, ''));
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です';
  end if;
  select * into v_msg from public.chat_messages where id = p_message_id for update;
  if not found then
    raise exception 'メッセージが見つかりません';
  end if;
  if v_msg.sender_id <> auth.uid() then
    raise exception '自分のメッセージのみ編集できます';
  end if;
  if v_msg.deleted_at is not null then
    raise exception '取り消し済みのメッセージは編集できません';
  end if;
  if v_msg.body is null then
    raise exception '画像のメッセージは編集できません';
  end if;
  if v_msg.created_at < now() - interval '24 hours' then
    raise exception '送信から24時間を過ぎたメッセージは編集できません';
  end if;
  if v_body = '' then
    raise exception 'メッセージが空です';
  end if;
  if v_body = v_msg.body then
    return;
  end if;
  insert into public.chat_message_revisions (message_id, kind, previous_body)
    values (p_message_id, 'edit', v_msg.body);
  update public.chat_messages set body = v_body, edited_at = now() where id = p_message_id;
end;
$$;

create or replace function public.delete_chat_message(p_message_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_msg public.chat_messages%rowtype;
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です';
  end if;
  select * into v_msg from public.chat_messages where id = p_message_id for update;
  if not found then
    raise exception 'メッセージが見つかりません';
  end if;
  if v_msg.sender_id <> auth.uid() then
    raise exception '自分のメッセージのみ取り消せます';
  end if;
  if v_msg.deleted_at is not null then
    return;
  end if;
  if v_msg.created_at < now() - interval '24 hours' then
    raise exception '送信から24時間を過ぎたメッセージは取り消せません';
  end if;
  insert into public.chat_message_revisions (message_id, kind, previous_body, previous_image_path)
    values (p_message_id, 'delete', v_msg.body, v_msg.image_path);
  update public.chat_messages
    set body = null, image_path = null, deleted_at = now(), pinned_at = null
    where id = p_message_id;
end;
$$;

revoke execute on function public.edit_chat_message(uuid, text) from public, anon, authenticated;
grant execute on function public.edit_chat_message(uuid, text) to authenticated;
revoke execute on function public.delete_chat_message(uuid) from public, anon, authenticated;
grant execute on function public.delete_chat_message(uuid) to authenticated;
