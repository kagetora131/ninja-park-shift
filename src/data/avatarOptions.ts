import type { Options as AvataaarsOptions } from '@dicebear/avataaars';

type TopOption = NonNullable<AvataaarsOptions['top']>[number];

export interface HairOption {
  value: TopOption;
  label: string;
  labelEn: string;
}

export const SKIN_COLORS = ['614335', 'd08b5b', 'ae5d29', 'edb98a', 'ffdbb4', 'fd9841', 'f8d25c'];

export const HAIR_STYLES_MALE: HairOption[] = [
  { value: 'shortFlat', label: 'ショートフラット', labelEn: 'Short Flat' },
  { value: 'shortRound', label: 'ショートラウンド', labelEn: 'Short Round' },
  { value: 'shortWaved', label: 'ショートウェーブ', labelEn: 'Short Waved' },
  { value: 'shortCurly', label: 'ショートカール', labelEn: 'Short Curly' },
  { value: 'theCaesar', label: 'シーザーカット', labelEn: 'Caesar Cut' },
  { value: 'theCaesarAndSidePart', label: 'サイド分け', labelEn: 'Caesar with Side Part' },
  { value: 'sides', label: '刈り上げ', labelEn: 'Buzz Cut' },
  { value: 'shaggy', label: 'シャギー', labelEn: 'Shaggy' },
];

export const HAIR_STYLES_FEMALE: HairOption[] = [
  { value: 'bob', label: 'ボブ', labelEn: 'Bob' },
  { value: 'bun', label: 'お団子', labelEn: 'Bun' },
  { value: 'curly', label: 'カーリー', labelEn: 'Curly' },
  { value: 'curvy', label: 'ウェーブロング', labelEn: 'Long Wavy' },
  { value: 'longButNotTooLong', label: 'セミロング', labelEn: 'Medium Length' },
  { value: 'straight01', label: 'ストレート', labelEn: 'Straight' },
  { value: 'bigHair', label: 'ボリュームヘア', labelEn: 'Big Hair' },
  { value: 'frida', label: 'フリーダスタイル', labelEn: 'Frida Style' },
];

export const HAIR_STYLES_BY_GENDER = {
  male: HAIR_STYLES_MALE,
  female: HAIR_STYLES_FEMALE,
} as const;

export const GLASSES_STYLES = ['round', 'prescription01', 'prescription02', 'wayfarers'] as const;
