create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('broadcast', 'dm', 'group')),
  name text,
  created_by text references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);
-- 業務連絡チャンネルは常に1件だけ存在する
create unique index chat_conversations_single_broadcast
  on public.chat_conversations(type) where type = 'broadcast';
insert into public.chat_conversations (type, name, created_by)
  values ('broadcast', null, null) on conflict do nothing;

create table public.chat_conversation_members (
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, employee_id)
);
-- broadcastは全員暗黙メンバーなのでこのテーブルには行を持たない

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender_id text not null references public.employees(id),
  body text,
  image_path text,
  created_at timestamptz not null default now(),
  constraint chat_messages_has_content check (body is not null or image_path is not null)
);
create index chat_messages_conversation_id_idx on public.chat_messages(conversation_id, created_at);

create table public.chat_reads (
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, employee_id)
);

-- メッセージへのスタンプ(リアクション)。ネガティブな用途を防ぐため固定の6種類のみ許可する。
-- 1人1メッセージにつき1スタンプ(別のスタンプを押すと差し替え、同じものをもう一度押すと取り消し)。
create table public.chat_message_reactions (
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  stamp_key text not null check (stamp_key in ('ninja','thumbs_up','cheer','muscle','fire','thanks')),
  created_at timestamptz not null default now(),
  primary key (message_id, employee_id)
);

-- 注: このテーブル定義(employee_idベース)は0012で profiles.id ベースに作り直されている。
-- マネージャーアカウントはemployeesテーブルに対応行を持たないため、チャット参加者の識別子として
-- employees.idを使うと投稿・DM送受信ができなくなることが判明したための修正(0012参照)。
