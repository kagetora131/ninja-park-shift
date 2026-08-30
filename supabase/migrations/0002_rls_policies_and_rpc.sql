-- ヘルパー関数(RLSポリシー内でのSELECT再帰を避けるためsecurity definer)
create or replace function public.current_role()
returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_employee_id()
returns text
language sql stable security definer set search_path = public as $$
  select employee_id from public.profiles where id = auth.uid();
$$;

-- profiles
alter table public.profiles enable row level security;
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.current_role() = 'manager');

-- employees
alter table public.employees enable row level security;
create policy "employees_select_all" on public.employees
  for select to authenticated using (true);
create policy "employees_insert_manager" on public.employees
  for insert to authenticated with check (public.current_role() = 'manager');
create policy "employees_update_manager" on public.employees
  for update to authenticated using (public.current_role() = 'manager') with check (public.current_role() = 'manager');
create policy "employees_delete_manager" on public.employees
  for delete to authenticated using (public.current_role() = 'manager');

-- shifts
alter table public.shifts enable row level security;
create policy "shifts_select" on public.shifts
  for select to authenticated
  using (public.current_role() = 'manager' or employee_id = public.current_employee_id());
create policy "shifts_insert_manager" on public.shifts
  for insert to authenticated with check (public.current_role() = 'manager');
create policy "shifts_update_manager" on public.shifts
  for update to authenticated using (public.current_role() = 'manager') with check (public.current_role() = 'manager');
create policy "shifts_delete_manager" on public.shifts
  for delete to authenticated using (public.current_role() = 'manager');

-- finance_revenue / wage_settings / post_requirements: マネージャーのみ閲覧・編集
alter table public.finance_revenue enable row level security;
create policy "finance_revenue_manager_all" on public.finance_revenue
  for all to authenticated using (public.current_role() = 'manager') with check (public.current_role() = 'manager');

alter table public.wage_settings enable row level security;
create policy "wage_settings_manager_all" on public.wage_settings
  for all to authenticated using (public.current_role() = 'manager') with check (public.current_role() = 'manager');

alter table public.post_requirements enable row level security;
create policy "post_requirements_manager_all" on public.post_requirements
  for all to authenticated using (public.current_role() = 'manager') with check (public.current_role() = 'manager');

-- labels: 全員閲覧可、マネージャーのみ編集
alter table public.labels enable row level security;
create policy "labels_select_all" on public.labels
  for select to authenticated using (true);
create policy "labels_insert_manager" on public.labels
  for insert to authenticated with check (public.current_role() = 'manager');
create policy "labels_update_manager" on public.labels
  for update to authenticated using (public.current_role() = 'manager') with check (public.current_role() = 'manager');
create policy "labels_delete_manager" on public.labels
  for delete to authenticated using (public.current_role() = 'manager');

-- 従業員の自己編集用RPC(希望シフト・アバター)。テーブルへの直接UPDATE権限は与えず、
-- この関数経由でのみ自分の行の特定カラムだけ更新できるようにする。
create or replace function public.update_my_shift_preferences(
  p_desired_work_days_per_week integer,
  p_desired_days_off text[]
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_employee_id text := public.current_employee_id();
begin
  if v_employee_id is null then
    raise exception 'この操作にはログイン中アカウントに紐づく従業員データが必要です';
  end if;
  update public.employees
    set desired_work_days_per_week = p_desired_work_days_per_week,
        desired_days_off = p_desired_days_off
    where id = v_employee_id;
end;
$$;

create or replace function public.update_my_avatar(
  p_avatar_gender text,
  p_avatar_top text,
  p_avatar_skin_color text,
  p_avatar_glasses boolean
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_employee_id text := public.current_employee_id();
begin
  if v_employee_id is null then
    raise exception 'この操作にはログイン中アカウントに紐づく従業員データが必要です';
  end if;
  update public.employees
    set avatar_gender = p_avatar_gender,
        avatar_top = p_avatar_top,
        avatar_skin_color = p_avatar_skin_color,
        avatar_glasses = p_avatar_glasses
    where id = v_employee_id;
end;
$$;

grant execute on function public.update_my_shift_preferences(integer, text[]) to authenticated;
grant execute on function public.update_my_avatar(text, text, text, boolean) to authenticated;
