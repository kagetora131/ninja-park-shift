-- PostgreSQLは関数作成時にデフォルトでPUBLIC(anon含む)にEXECUTE権限を付与するため、
-- authenticated以外から明示的に剥奪する。
revoke execute on function public.current_role() from public;
revoke execute on function public.current_employee_id() from public;
revoke execute on function public.update_my_shift_preferences(integer, text[]) from public;
revoke execute on function public.update_my_avatar(text, text, text, boolean) from public;

grant execute on function public.current_role() to authenticated;
grant execute on function public.current_employee_id() to authenticated;
grant execute on function public.update_my_shift_preferences(integer, text[]) to authenticated;
grant execute on function public.update_my_avatar(text, text, text, boolean) to authenticated;
