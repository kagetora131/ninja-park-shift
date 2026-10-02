import type { FacilityId, Locale } from '../types';

/**
 * ログイン画面の「ワンタップログイン」用デモアカウント。
 * ポートフォリオ公開用の架空アカウントで、パスワードはサイト(app-list.md)にも掲載している共通値。
 * 立場(雇用形態・所属施設・研修の修了有無)でシフト表の見え方・配置可否が変わることを
 * 試しやすいよう、ログイン前に表示する。従業員の属性はシード(supabase/seed_data.sql)と同じ値。
 * 属性を変更した場合はここも合わせること(DBとは同期しない)。
 */
export const DEMO_PASSWORD = 'NinjaDemo2026';
export const DEMO_MANAGER_EMAIL = 'manager@ninja-park-shift.demo';

export interface DemoEmployee {
  email: string;
  name: Record<Locale, string>;
  /** 雇用形態(従業員の「立場」)。 */
  role: 'staff' | 'parttime' | 'arubaito';
  mainFacility: FacilityId;
  crossTrained: FacilityId[];
  /** 「手裏剣・忍具取り扱い研修」修了済みか。未修了だと修行アトラクションには配置できない。 */
  shurikenTrained: boolean;
}

export const DEMO_EMPLOYEES: DemoEmployee[] = [
  { email: 'emp001@ninja-park-shift.demo', name: { ja: '佐藤 美咲', en: 'Misaki Sato' }, role: 'staff', mainFacility: 'goods', crossTrained: ['cafe'], shurikenTrained: false },
  { email: 'emp002@ninja-park-shift.demo', name: { ja: '田中 翔太', en: 'Shota Tanaka' }, role: 'arubaito', mainFacility: 'amuse', crossTrained: ['cafe', 'goods'], shurikenTrained: true },
  { email: 'emp003@ninja-park-shift.demo', name: { ja: '中村 彩', en: 'Aya Nakamura' }, role: 'arubaito', mainFacility: 'cafe', crossTrained: ['goods'], shurikenTrained: false },
  { email: 'emp004@ninja-park-shift.demo', name: { ja: '高橋 陸', en: 'Riku Takahashi' }, role: 'arubaito', mainFacility: 'goods', crossTrained: [], shurikenTrained: false },
  { email: 'emp005@ninja-park-shift.demo', name: { ja: '伊藤 花', en: 'Hana Ito' }, role: 'parttime', mainFacility: 'cafe', crossTrained: [], shurikenTrained: false },
  { email: 'emp006@ninja-park-shift.demo', name: { ja: '渡辺 蓮', en: 'Ren Watanabe' }, role: 'staff', mainFacility: 'amuse', crossTrained: ['cafe', 'goods'], shurikenTrained: true },
  { email: 'emp007@ninja-park-shift.demo', name: { ja: '小林 葵', en: 'Aoi Kobayashi' }, role: 'arubaito', mainFacility: 'amuse', crossTrained: ['cafe', 'goods'], shurikenTrained: true },
  { email: 'emp008@ninja-park-shift.demo', name: { ja: '加藤 優斗', en: 'Yuto Kato' }, role: 'arubaito', mainFacility: 'goods', crossTrained: ['cafe'], shurikenTrained: false },
  { email: 'emp009@ninja-park-shift.demo', name: { ja: '阿部 楓', en: 'Kaede Abe' }, role: 'arubaito', mainFacility: 'goods', crossTrained: ['cafe'], shurikenTrained: false },
  { email: 'emp010@ninja-park-shift.demo', name: { ja: '山本 隼人', en: 'Hayato Yamamoto' }, role: 'arubaito', mainFacility: 'cafe', crossTrained: ['goods'], shurikenTrained: false },
];
