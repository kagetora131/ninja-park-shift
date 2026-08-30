-- ロールが未ログイン(anon)の場合にRPCを呼んでも安全なよう、auth.uid()チェックを追加する
-- (grantはauthenticatedのみだが、念のための多層防御)。
create or replace function public.update_my_shift_preferences(
  p_desired_work_days_per_week integer,
  p_desired_days_off text[]
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
    set avatar_gender = p_avatar_gender,
        avatar_top = p_avatar_top,
        avatar_skin_color = p_avatar_skin_color,
        avatar_glasses = p_avatar_glasses
    where id = v_employee_id;
end;
$$;
