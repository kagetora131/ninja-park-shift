-- 従業員も「誰と一緒に働くか」「交代候補」がわかるよう、シフトの閲覧を全従業員に開放する。
-- (書き込みは引き続きマネージャーのみ。shifts_insert/update/delete_managerポリシーは変更しない)
drop policy "shifts_select" on public.shifts;
create policy "shifts_select" on public.shifts
  for select to authenticated using (true);

-- 特定日付を指定した希望休み(曜日パターンとは別に、カレンダーで個別に指定する休み希望)
alter table public.employees
  add column desired_off_dates date[] not null default '{}';

-- 自己編集RPCを拡張(希望勤務日数・希望休み曜日・特定日の希望休みをまとめて更新)
drop function if exists public.update_my_shift_preferences(integer, text[]);
create or replace function public.update_my_shift_preferences(
  p_desired_work_days_per_week integer,
  p_desired_days_off text[],
  p_desired_off_dates date[]
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_employee_id text;
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です';
  end if;
  v_employee_id := public.current_employee_id();
  if v_employee_id is null then
    raise exception 'この操作にはログイン中アカウントに紐づく従業員データが必要です';
  end if;
  update public.employees
    set desired_work_days_per_week = p_desired_work_days_per_week,
        desired_days_off = p_desired_days_off,
        desired_off_dates = p_desired_off_dates
    where id = v_employee_id;
end;
$$;

revoke execute on function public.update_my_shift_preferences(integer, text[], date[]) from public;
grant execute on function public.update_my_shift_preferences(integer, text[], date[]) to authenticated;
