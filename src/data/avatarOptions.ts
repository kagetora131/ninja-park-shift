import type { Options as AvataaarsOptions } from '@dicebear/avataaars';

type TopOption = NonNullable<AvataaarsOptions['top']>[number];

export interface HairOption {
  value: TopOption;
  label: string;
}

export const SKIN_COLORS = ['614335', 'd08b5b', 'ae5d29', 'edb98a', 'ffdbb4', 'fd9841', 'f8d25c'];

export const HAIR_STYLES_MALE: HairOption[] = [
  { value: 'shortFlat', label: 'ショートフラット' },
  { value: 'shortRound', label: 'ショートラウンド' },
  { value: 'shortWaved', label: 'ショートウェーブ' },
  { value: 'shortCurly', label: 'ショートカール' },
  { value: 'theCaesar', label: 'シーザーカット' },
  { value: 'theCaesarAndSidePart', label: 'サイド分け' },
  { value: 'sides', label: '刈り上げ' },
  { value: 'shaggy', label: 'シャギー' },
];

export const HAIR_STYLES_FEMALE: HairOption[] = [
  { value: 'bob', label: 'ボブ' },
  { value: 'bun', label: 'お団子' },
  { value: 'curly', label: 'カーリー' },
  { value: 'curvy', label: 'ウェーブロング' },
  { value: 'longButNotTooLong', label: 'セミロング' },
  { value: 'straight01', label: 'ストレート' },
  { value: 'bigHair', label: 'ボリュームヘア' },
  { value: 'frida', label: 'フリーダスタイル' },
];

export const HAIR_STYLES_BY_GENDER = {
  male: HAIR_STYLES_MALE,
  female: HAIR_STYLES_FEMALE,
} as const;

export const GLASSES_STYLES = ['round', 'prescription01', 'prescription02', 'wayfarers'] as const;
