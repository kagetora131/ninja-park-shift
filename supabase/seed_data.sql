-- ninja_park_shift_dummy_data_updated.json のダミーデータをSupabaseへ投入する一回限りのシードSQL。
-- 個人情報は含まない架空データ。認証アカウント(auth.users)はここには含めない
-- (パスワードを含むため。別途 supabase/seed_accounts.example.sql を参照)。

insert into public.employees (id, name, role, main_facility, cross_trained, avatar_base, desired_work_days_per_week, desired_days_off, max_consecutive_days, qualifications, employment_type, cafe_kitchen_ok, is_trainee) values
  ('emp001', '佐藤 美咲', '社員', 'goods', '{"cafe"}', 'default_female_01', 5, '{"水"}', 5, '{}', '契約社員', false, false),
  ('emp002', '田中 翔太', 'アルバイト', 'amuse', '{"cafe","goods"}', 'default_male_01', 3, '{"月","火"}', 3, '{"手裏剣・忍具取り扱い研修修了"}', '契約社員', false, false),
  ('emp003', '中村 彩', 'アルバイト', 'cafe', '{"goods"}', 'default_female_02', 4, '{"日"}', 4, '{}', '契約社員', true, false),
  ('emp004', '高橋 陸', 'アルバイト', 'goods', '{}', 'default_male_02', 2, '{"土","日"}', 2, '{}', '契約社員', NULL, false),
  ('emp005', '伊藤 花', 'パート', 'cafe', '{}', 'default_female_03', 4, '{"木"}', 4, '{}', '契約社員', false, false),
  ('emp006', '渡辺 蓮', '社員', 'amuse', '{"cafe","goods"}', 'default_male_03', 6, '{}', 6, '{"手裏剣・忍具取り扱い研修修了"}', '契約社員', false, false),
  ('emp007', '小林 葵', 'アルバイト', 'amuse', '{"cafe","goods"}', 'default_female_04', 3, '{"水","木"}', 3, '{"手裏剣・忍具取り扱い研修修了"}', '契約社員', false, false),
  ('emp008', '加藤 優斗', 'アルバイト', 'goods', '{"cafe"}', 'default_male_04', 4, '{"火"}', 4, '{}', '契約社員', false, false),
  ('emp009', '阿部 楓', 'アルバイト', 'goods', '{"cafe"}', 'default_female_05', 3, '{"月"}', 3, '{}', '契約社員', false, false),
  ('emp010', '山本 隼人', 'アルバイト', 'cafe', '{"goods"}', 'default_male_05', 3, '{"火"}', 3, '{}', '契約社員', true, false);

insert into public.shifts (id, date, day, employee_id, facility, start, "end", is_desired, break_minutes, actual_hours, note) values
  ('2026-08-01_emp001', '2026-08-01', '土', 'emp001', 'goods', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-01_emp002', '2026-08-01', '土', 'emp002', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-01_emp003', '2026-08-01', '土', 'emp003', 'cafe', '10:30', '20:30', true, 120, 8, NULL),
  ('2026-08-01_emp006', '2026-08-01', '土', 'emp006', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-01_emp007', '2026-08-01', '土', 'emp007', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-01_emp008', '2026-08-01', '土', 'emp008', 'goods', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-01_emp009', '2026-08-01', '土', 'emp009', 'goods', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-01_emp010', '2026-08-01', '土', 'emp010', 'cafe', '10:30', '14:30', true, 0, 4, NULL),
  ('2026-08-02_emp001', '2026-08-02', '日', 'emp001', 'cafe', '10:30', '20:30', false, 120, 8, '本来goods所属だが繁忙のためcafeへ応援'),
  ('2026-08-02_emp002', '2026-08-02', '日', 'emp002', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-02_emp003', '2026-08-02', '日', 'emp003', 'cafe', '10:30', '20:30', false, 120, 8, '希望休みだったが繁忙期のため出勤'),
  ('2026-08-02_emp006', '2026-08-02', '日', 'emp006', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-02_emp007', '2026-08-02', '日', 'emp007', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-03_emp005', '2026-08-03', '月', 'emp005', 'cafe', '10:30', '14:30', true, 0, 4, NULL),
  ('2026-08-03_emp006', '2026-08-03', '月', 'emp006', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-03_emp008', '2026-08-03', '月', 'emp008', 'goods', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-03_emp010', '2026-08-03', '月', 'emp010', 'cafe', '10:30', '14:30', true, 0, 4, NULL),
  ('2026-08-04_emp001', '2026-08-04', '火', 'emp001', 'goods', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-04_emp005', '2026-08-04', '火', 'emp005', 'cafe', '10:30', '14:30', true, 0, 4, NULL),
  ('2026-08-04_emp006', '2026-08-04', '火', 'emp006', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-04_emp009', '2026-08-04', '火', 'emp009', 'goods', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-05_emp002', '2026-08-05', '水', 'emp002', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-05_emp004', '2026-08-05', '水', 'emp004', 'goods', '17:00', '21:00', true, 0, 4, NULL),
  ('2026-08-05_emp006', '2026-08-05', '水', 'emp006', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-05_emp008', '2026-08-05', '水', 'emp008', 'cafe', '10:30', '20:30', false, 120, 8, '本来goods所属だがcafeへ応援、不慣れな業務'),
  ('2026-08-06_emp001', '2026-08-06', '木', 'emp001', 'goods', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-06_emp002', '2026-08-06', '木', 'emp002', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-06_emp006', '2026-08-06', '木', 'emp006', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-06_emp010', '2026-08-06', '木', 'emp010', 'cafe', '10:30', '14:30', true, 0, 4, NULL),
  ('2026-08-07_emp001', '2026-08-07', '金', 'emp001', 'goods', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-07_emp003', '2026-08-07', '金', 'emp003', 'cafe', '10:30', '20:30', true, 120, 8, NULL),
  ('2026-08-07_emp006', '2026-08-07', '金', 'emp006', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-07_emp007', '2026-08-07', '金', 'emp007', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-07_emp009', '2026-08-07', '金', 'emp009', 'goods', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-08_emp001', '2026-08-08', '土', 'emp001', 'goods', '09:00', '18:00', true, 60, 8, '6連勤目'),
  ('2026-08-08_emp002', '2026-08-08', '土', 'emp002', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-08_emp003', '2026-08-08', '土', 'emp003', 'cafe', '10:30', '20:30', true, 120, 8, NULL),
  ('2026-08-08_emp006', '2026-08-08', '土', 'emp006', 'amuse', '09:00', '18:00', true, 60, 8, '8連勤目'),
  ('2026-08-08_emp007', '2026-08-08', '土', 'emp007', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-08_emp008', '2026-08-08', '土', 'emp008', 'goods', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-08_emp009', '2026-08-08', '土', 'emp009', 'goods', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-08_emp010', '2026-08-08', '土', 'emp010', 'cafe', '10:30', '14:30', true, 0, 4, NULL),
  ('2026-08-09_emp001', '2026-08-09', '日', 'emp001', 'goods', '09:00', '18:00', false, 60, 8, '7連勤目、連勤上限(5)超過'),
  ('2026-08-09_emp002', '2026-08-09', '日', 'emp002', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-09_emp006', '2026-08-09', '日', 'emp006', 'amuse', '09:00', '18:00', true, 60, 8, '9連勤目、連勤上限(6)大幅超過'),
  ('2026-08-09_emp007', '2026-08-09', '日', 'emp007', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-10_emp005', '2026-08-10', '月', 'emp005', 'cafe', '10:30', '14:30', true, 0, 4, NULL),
  ('2026-08-10_emp006', '2026-08-10', '月', 'emp006', 'amuse', '09:00', '18:00', false, 60, 8, '10連勤目、休みなし継続'),
  ('2026-08-10_emp008', '2026-08-10', '月', 'emp008', 'goods', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-10_emp010', '2026-08-10', '月', 'emp010', 'cafe', '10:30', '14:30', true, 0, 4, NULL),
  ('2026-08-11_emp001', '2026-08-11', '火', 'emp001', 'goods', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-11_emp004', '2026-08-11', '火', 'emp004', 'goods', '17:00', '21:00', true, 0, 4, NULL),
  ('2026-08-11_emp006', '2026-08-11', '火', 'emp006', 'amuse', '09:00', '18:00', true, 60, 8, 'ようやく休み明け1日目'),
  ('2026-08-11_emp009', '2026-08-11', '火', 'emp009', 'goods', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-12_emp002', '2026-08-12', '水', 'emp002', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-12_emp005', '2026-08-12', '水', 'emp005', 'cafe', '10:30', '14:30', false, 0, 4, '希望休みだが出勤'),
  ('2026-08-12_emp006', '2026-08-12', '水', 'emp006', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-12_emp008', '2026-08-12', '水', 'emp008', 'cafe', '10:30', '20:30', false, 120, 8, 'goods所属だが2回目のcafe応援、不慣れが続く'),
  ('2026-08-13_emp001', '2026-08-13', '木', 'emp001', 'goods', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-13_emp003', '2026-08-13', '木', 'emp003', 'cafe', '10:30', '20:30', true, 120, 8, NULL),
  ('2026-08-13_emp006', '2026-08-13', '木', 'emp006', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-13_emp009', '2026-08-13', '木', 'emp009', 'goods', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-14_emp001', '2026-08-14', '金', 'emp001', 'goods', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-14_emp002', '2026-08-14', '金', 'emp002', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-14_emp004', '2026-08-14', '金', 'emp004', 'goods', '17:00', '21:00', true, 0, 4, NULL),
  ('2026-08-14_emp006', '2026-08-14', '金', 'emp006', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-14_emp007', '2026-08-14', '金', 'emp007', 'amuse', '09:00', '18:00', true, 60, 8, NULL),
  ('2026-08-14_emp010', '2026-08-14', '金', 'emp010', 'cafe', '10:30', '14:30', true, 0, 4, NULL);

insert into public.finance_revenue (date, day, category, facility_revenue) values
  ('2026-08-01', '土', '黒字想定', '{"goods":285000,"amuse":427500,"cafe":237500}'::jsonb),
  ('2026-08-02', '日', '黒字想定', '{"goods":306000,"amuse":459000,"cafe":255000}'::jsonb),
  ('2026-08-03', '月', '黒字想定', '{"goods":210000,"amuse":315000,"cafe":175000}'::jsonb),
  ('2026-08-04', '火', '赤字想定', '{"goods":84000,"amuse":126000,"cafe":70000}'::jsonb),
  ('2026-08-05', '水', '赤字想定', '{"goods":78000,"amuse":117000,"cafe":65000}'::jsonb),
  ('2026-08-06', '木', '赤字想定', '{"goods":90000,"amuse":135000,"cafe":75000}'::jsonb),
  ('2026-08-07', '金', '黒字想定', '{"goods":195000,"amuse":292500,"cafe":162500}'::jsonb),
  ('2026-08-08', '土', '黒字想定', '{"goods":330000,"amuse":495000,"cafe":275000}'::jsonb),
  ('2026-08-09', '日', '黒字想定', '{"goods":315000,"amuse":472500,"cafe":262500}'::jsonb),
  ('2026-08-10', '月', '黒字想定', '{"goods":204000,"amuse":306000,"cafe":170000}'::jsonb),
  ('2026-08-11', '火', '赤字想定', '{"goods":81000,"amuse":121500,"cafe":67500}'::jsonb),
  ('2026-08-12', '水', '赤字想定', '{"goods":75000,"amuse":112500,"cafe":62500}'::jsonb),
  ('2026-08-13', '木', '赤字想定', '{"goods":87000,"amuse":130500,"cafe":72500}'::jsonb),
  ('2026-08-14', '金', '黒字想定', '{"goods":210000,"amuse":315000,"cafe":175000}'::jsonb);

insert into public.wage_settings (id, facility_rates, trainee_hourly_wage, fulltime_monthly_salary) values (1, '{"goods":1200,"amuse":2200,"cafe":1200}'::jsonb, 1500, 280000);

insert into public.labels (entity_type, entity_id, field, values) values ('employee', 'emp001', 'name', '{"ja":"佐藤 美咲","en":"Misaki Sato"}'::jsonb);
insert into public.labels (entity_type, entity_id, field, values) values ('employee', 'emp002', 'name', '{"ja":"田中 翔太","en":"Shota Tanaka"}'::jsonb);
insert into public.labels (entity_type, entity_id, field, values) values ('employee', 'emp003', 'name', '{"ja":"中村 彩","en":"Aya Nakamura"}'::jsonb);
insert into public.labels (entity_type, entity_id, field, values) values ('employee', 'emp004', 'name', '{"ja":"高橋 陸","en":"Riku Takahashi"}'::jsonb);
insert into public.labels (entity_type, entity_id, field, values) values ('employee', 'emp005', 'name', '{"ja":"伊藤 花","en":"Hana Ito"}'::jsonb);
insert into public.labels (entity_type, entity_id, field, values) values ('employee', 'emp006', 'name', '{"ja":"渡辺 蓮","en":"Ren Watanabe"}'::jsonb);
insert into public.labels (entity_type, entity_id, field, values) values ('employee', 'emp007', 'name', '{"ja":"小林 葵","en":"Aoi Kobayashi"}'::jsonb);
insert into public.labels (entity_type, entity_id, field, values) values ('employee', 'emp008', 'name', '{"ja":"加藤 優斗","en":"Yuto Kato"}'::jsonb);
insert into public.labels (entity_type, entity_id, field, values) values ('employee', 'emp009', 'name', '{"ja":"阿部 楓","en":"Kaede Abe"}'::jsonb);
insert into public.labels (entity_type, entity_id, field, values) values ('employee', 'emp010', 'name', '{"ja":"山本 隼人","en":"Hayato Yamamoto"}'::jsonb);

insert into public.labels (entity_type, entity_id, field, values) values ('facility', 'goods', 'label', '{"ja":"忍具屋","en":"Ninja Goods Shop"}'::jsonb);
insert into public.labels (entity_type, entity_id, field, values) values ('facility', 'amuse', 'label', '{"ja":"修行アトラクション","en":"Training Attraction"}'::jsonb);
insert into public.labels (entity_type, entity_id, field, values) values ('facility', 'cafe', 'label', '{"ja":"忍者茶屋","en":"Ninja Tea House"}'::jsonb);

insert into public.labels (entity_type, entity_id, field, values) values ('role', '社員', 'label', '{"ja":"社員","en":"Full-time Staff"}'::jsonb);
insert into public.labels (entity_type, entity_id, field, values) values ('role', 'アルバイト', 'label', '{"ja":"アルバイト","en":"Part-time Staff"}'::jsonb);
insert into public.labels (entity_type, entity_id, field, values) values ('role', 'パート', 'label', '{"ja":"パート","en":"Part-timer"}'::jsonb);

insert into public.labels (entity_type, entity_id, field, values) values ('qualification', '手裏剣・忍具取り扱い研修修了', 'label', '{"ja":"手裏剣・忍具取り扱い研修修了","en":"Shuriken & Ninja Tool Handling Certified"}'::jsonb);