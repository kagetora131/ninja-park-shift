-- テーブル設計を employees.id ベースから profiles.id(auth.users.id)ベースに変更する。
-- 理由: マネージャーアカウントは employees テーブルに対応行を持たない(頭領は「従業員」ではないため)。
-- チャットの参加者は「アカウント」であるべきで、シフト管理対象の「従業員」とは独立した概念にする。

drop policy if exists "chat_images_select" on storage.objects;
drop policy if exists "chat_images_insert" on storage.objects;

drop table if exists public.chat_message_reactions cascade;
drop table if exists public.chat_reads cascade;
drop table if exists public.chat_messages cascade;
drop table if exists public.chat_conversation_members cascade;
drop table if exists public.chat_conversations cascade;
drop function if exists public.is_chat_member(uuid);
drop function if exists public.create_chat_conversation(text, text, text[]);

-- 全員が全アカウントのid/role/employee_idを見られるようにする(チャット相手を選ぶ・表示名解決のため)。
-- profilesにメール等の機微情報はなく、employeesテーブルは既にusing(true)で全員閲覧可なため実害はない。
drop policy "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated using (true);

create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('broadcast', 'dm', 'group')),
  name text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index chat_conversations_single_broadcast
  on public.chat_conversations(type) where type = 'broadcast';
insert into public.chat_conversations (type, name, created_by) values ('broadcast', null, null);

create table public.chat_conversation_members (
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text,
  image_path text,
  created_at timestamptz not null default now(),
  constraint chat_messages_has_content check (body is not null or image_path is not null)
);
create index chat_messages_conversation_id_idx on public.chat_messages(conversation_id, created_at);
create index chat_messages_sender_id_idx on public.chat_messages(sender_id);

create table public.chat_reads (
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create table public.chat_message_reactions (
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  stamp_key text not null check (stamp_key in ('ninja','thumbs_up','cheer','muscle','fire','thanks')),
  created_at timestamptz not null default now(),
  primary key (message_id, profile_id)
);
create index chat_message_reactions_profile_id_idx on public.chat_message_reactions(profile_id);
create index chat_conversation_members_profile_id_idx on public.chat_conversation_members(profile_id);
create index chat_conversations_created_by_idx on public.chat_conversations(created_by);

create or replace function public.is_chat_member(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.chat_conversation_members
    where conversation_id = p_conversation_id and profile_id = auth.uid()
  );
$$;
revoke execute on function public.is_chat_member(uuid) from public, anon, authenticated;
grant execute on function public.is_chat_member(uuid) to authenticated;

alter table public.chat_conversations enable row level security;
create policy "chat_conversations_select" on public.chat_conversations for select to authenticated
  using (type = 'broadcast' or public.current_role() = 'manager' or public.is_chat_member(id));

alter table public.chat_conversation_members enable row level security;
create policy "chat_conversation_members_select" on public.chat_conversation_members for select to authenticated
  using (public.current_role() = 'manager' or public.is_chat_member(conversation_id));

alter table public.chat_messages enable row level security;
create policy "chat_messages_select" on public.chat_messages for select to authenticated
  using (
    public.current_role() = 'manager'
    or exists (select 1 from public.chat_conversations c where c.id = conversation_id and c.type = 'broadcast')
    or public.is_chat_member(conversation_id)
  );
create policy "chat_messages_insert" on public.chat_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and (
      (public.current_role() = 'manager'
        and exists (select 1 from public.chat_conversations c where c.id = conversation_id and c.type = 'broadcast'))
      or (public.is_chat_member(conversation_id)
        and exists (select 1 from public.chat_conversations c where c.id = conversation_id and c.type in ('dm','group')))
    )
  );

alter table public.chat_reads enable row level security;
create policy "chat_reads_select" on public.chat_reads for select to authenticated using (profile_id = auth.uid());
create policy "chat_reads_insert" on public.chat_reads for insert to authenticated with check (profile_id = auth.uid());
create policy "chat_reads_update" on public.chat_reads for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

alter table public.chat_message_reactions enable row level security;
create policy "chat_message_reactions_select" on public.chat_message_reactions for select to authenticated
  using (
    exists (
      select 1 from public.chat_messages m join public.chat_conversations c on c.id = m.conversation_id
      where m.id = message_id
        and (public.current_role() = 'manager' or c.type = 'broadcast' or public.is_chat_member(c.id))
    )
  );
create policy "chat_message_reactions_insert" on public.chat_message_reactions for insert to authenticated
  with check (
    profile_id = auth.uid()
    and exists (
      select 1 from public.chat_messages m join public.chat_conversations c on c.id = m.conversation_id
      where m.id = message_id and (c.type = 'broadcast' or public.is_chat_member(c.id))
    )
  );
create policy "chat_message_reactions_update" on public.chat_message_reactions for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "chat_message_reactions_delete" on public.chat_message_reactions for delete to authenticated
  using (profile_id = auth.uid());

create or replace function public.create_chat_conversation(
  p_type text, p_name text, p_member_profile_ids uuid[]
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_conversation_id uuid;
  v_existing_dm uuid;
begin
  if v_me is null then
    raise exception 'ログインが必要です';
  end if;
  if p_type not in ('dm', 'group') then
    raise exception '不正な会話種別です';
  end if;

  if p_type = 'dm' then
    if coalesce(array_length(p_member_profile_ids, 1), 0) <> 1 then
      raise exception '個人チャットの相手は1人指定してください';
    end if;
    select cm1.conversation_id into v_existing_dm
      from public.chat_conversation_members cm1
      join public.chat_conversation_members cm2 on cm1.conversation_id = cm2.conversation_id
      join public.chat_conversations c on c.id = cm1.conversation_id
      where c.type = 'dm' and cm1.profile_id = v_me and cm2.profile_id = p_member_profile_ids[1]
      limit 1;
    if v_existing_dm is not null then
      return v_existing_dm;
    end if;
  end if;

  insert into public.chat_conversations (type, name, created_by)
    values (p_type, p_name, v_me) returning id into v_conversation_id;
  insert into public.chat_conversation_members (conversation_id, profile_id)
    select v_conversation_id, unnest(array_append(p_member_profile_ids, v_me))
    on conflict do nothing;
  return v_conversation_id;
end;
$$;
revoke execute on function public.create_chat_conversation(text, text, uuid[]) from public, anon, authenticated;
grant execute on function public.create_chat_conversation(text, text, uuid[]) to authenticated;

alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.chat_message_reactions;

insert into storage.buckets (id, name, public) values ('chat-images', 'chat-images', false) on conflict (id) do nothing;
create policy "chat_images_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'chat-images' and (
      public.current_role() = 'manager'
      or exists (
        select 1 from public.chat_conversations c
        where c.id::text = (storage.foldername(name))[1]
          and (c.type = 'broadcast' or public.is_chat_member(c.id))
      )
    )
  );
create policy "chat_images_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat-images' and exists (
      select 1 from public.chat_conversations c
      where c.id::text = (storage.foldername(name))[1]
        and (
          (c.type = 'broadcast' and public.current_role() = 'manager')
          or (c.type in ('dm','group') and public.is_chat_member(c.id))
        )
    )
  );

-- 注: 上記storageポリシーの`storage.foldername(name)`には0013で修正するバグが残っている
-- (`name`が`chat_conversations.name`に束縛されてしまい常にRLS拒否になる)。
