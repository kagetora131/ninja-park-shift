-- 拡張(auth.usersのパスワードハッシュ生成に使う)
create extension if not exists pgcrypto with schema extensions;

-- 従業員マスタ
create table public.employees (
  id text primary key,
  name text not null,
  role text not null,
  main_facility text not null,
  cross_trained text[] not null default '{}',
  avatar_base text not null,
  desired_work_days_per_week integer not null default 3,
  desired_days_off text[] not null default '{}',
  max_consecutive_days integer not null default 5,
  qualifications text[] not null default '{}',
  employment_type text,
  cafe_kitchen_ok boolean,
  is_trainee boolean not null default false,
  avatar_gender text,
  avatar_top text,
  avatar_skin_color text,
  avatar_glasses boolean,
  created_at timestamptz not null default now()
);

-- auth.users を拡張するプロフィール(ロールと従業員の紐付け)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_id text references public.employees(id) on delete set null,
  role text not null check (role in ('manager', 'employee')),
  created_at timestamptz not null default now()
);

create table public.shifts (
  id text primary key,
  date date not null,
  day text not null,
  employee_id text not null references public.employees(id) on delete cascade,
  facility text not null,
  start text not null,
  "end" text not null,
  is_desired boolean not null default true,
  break_minutes integer not null default 0,
  actual_hours numeric not null default 0,
  note text
);
create index shifts_employee_id_idx on public.shifts(employee_id);
create index shifts_date_idx on public.shifts(date);

create table public.finance_revenue (
  date date primary key,
  day text not null,
  category text,
  facility_revenue jsonb not null default '{}'::jsonb
);

create table public.wage_settings (
  id integer primary key default 1,
  facility_rates jsonb not null,
  trainee_hourly_wage numeric not null,
  fulltime_monthly_salary numeric not null,
  constraint wage_settings_singleton check (id = 1)
);

create table public.post_requirements (
  weekday text not null,
  facility text not null,
  required integer,
  primary key (weekday, facility)
);

-- 表記(i18n)辞書テーブル。例: entity_type='employee', entity_id='emp001', field='name',
-- values='{"ja":"佐藤 美咲","en":"Misaki Sato"}'
create table public.labels (
  entity_type text not null,
  entity_id text not null,
  field text not null,
  values jsonb not null default '{}'::jsonb,
  primary key (entity_type, entity_id, field)
);
