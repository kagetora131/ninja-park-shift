import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import type { Options as AvataaarsOptions } from '@dicebear/avataaars';
import type { Mood } from '../types';

type EyebrowOption = NonNullable<AvataaarsOptions['eyebrows']>[number];
type EyeOption = NonNullable<AvataaarsOptions['eyes']>[number];
type MouthOption = NonNullable<AvataaarsOptions['mouth']>[number];
type TopOption = NonNullable<AvataaarsOptions['top']>[number];

interface FaceOptions {
  eyebrows: EyebrowOption[];
  eyes: EyeOption[];
  mouth: MouthOption[];
}

const MOOD_FACE: Record<Mood, FaceOptions> = {
  happy: {
    eyebrows: ['default', 'defaultNatural', 'raisedExcitedNatural'],
    eyes: ['happy', 'wink', 'default'],
    mouth: ['smile', 'twinkle'],
  },
  neutral: {
    eyebrows: ['defaultNatural', 'default'],
    eyes: ['default', 'side'],
    mouth: ['default', 'serious'],
  },
  tired: {
    eyebrows: ['sadConcernedNatural', 'flatNatural'],
    eyes: ['squint', 'side', 'closed'],
    mouth: ['grimace', 'concerned'],
  },
  unhappy: {
    eyebrows: ['angry', 'angryNatural', 'frownNatural'],
    eyes: ['cry', 'xDizzy'],
    mouth: ['sad', 'disbelief', 'vomit'],
  },
};

const HAIR_STYLES: TopOption[] = [
  'shortFlat',
  'shortRound',
  'shortWaved',
  'sides',
  'theCaesar',
  'theCaesarAndSidePart',
  'bob',
  'bun',
  'straight01',
  'straight02',
  'curly',
];

const HAIR_COLORS = ['2c1b18', '4a312c', '724133', '000000', '3a2617'];
const SKIN_COLORS = ['ffdbb4', 'edb98a', 'd08b5b', 'ae5d29', '614335'];

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pickBySeed<T>(seed: string, arr: T[]): T {
  return arr[hashString(seed) % arr.length];
}

const cache = new Map<string, string>();

/**
 * 従業員の avatarBase を「素顔」の種にして髪型・肌色は常に固定し、
 * mood によって眉・目・口だけを変化させることで、同一キャラクターの表情差分に見せる。
 */
export function generateNinjaAvatar(avatarBase: string, mood: Mood): string {
  const cacheKey = `${avatarBase}:${mood}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const face = MOOD_FACE[mood];
  const avatar = createAvatar(avataaars, {
    seed: avatarBase,
    size: 128,
    backgroundColor: ['transparent'],
    accessoriesProbability: 0,
    facialHairProbability: 0,
    top: HAIR_STYLES,
    hairColor: [pickBySeed(`${avatarBase}-hair`, HAIR_COLORS)],
    skinColor: [pickBySeed(`${avatarBase}-skin`, SKIN_COLORS)],
    clothing: ['hoodie'],
    clothesColor: ['1a1a1a'],
    eyebrows: [pickBySeed(cacheKey, face.eyebrows)],
    eyes: [pickBySeed(cacheKey, face.eyes)],
    mouth: [pickBySeed(cacheKey, face.mouth)],
  });

  const uri = avatar.toDataUri();
  cache.set(cacheKey, uri);
  return uri;
}
