-- デモ用ログインアカウント(マネージャー1件+従業員10件)を投入する際のテンプレート。
-- 実際に使ったSQL(本物のメールアドレス・パスワードハッシュ入り)はこのリポジトリには
-- コミットしていない(認証情報のため)。実行結果のログイン情報は開発者が別途管理する。
--
-- 使い方: <UUID>/<EMAIL>/<PASSWORD>をREPLACEし、employeesテーブル投入後に実行する。

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '<UUID>',
  'authenticated',
  'authenticated',
  '<EMAIL>',
  crypt('<PASSWORD>', gen_salt('bf')),
  now(),
  '', '', '', '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false,
  now(),
  now()
);

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(),
  '<UUID>',
  jsonb_build_object('sub', '<UUID>', 'email', '<EMAIL>'),
  'email',
  '<UUID>',
  now(), now(), now()
);

-- role='manager'の場合は employee_id を null にする
insert into public.profiles (id, employee_id, role) values ('<UUID>', '<EMPLOYEE_ID_OR_NULL>', '<manager_or_employee>');
