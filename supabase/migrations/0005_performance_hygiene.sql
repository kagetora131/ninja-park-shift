-- auth.uid()の呼び出しをサブクエリ化し、行ごとの再評価を避ける(Supabase推奨パターン)
drop policy "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.current_role() = 'manager');

-- profiles.employee_id の外部キーに索引を追加
create index profiles_employee_id_idx on public.profiles(employee_id);
