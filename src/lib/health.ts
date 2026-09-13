import type { Mood, MoodResult } from '../types';

/** 表情ごとの健全性ポイント(0〜100)。スコアはこれらの単純平均。 */
export const MOOD_POINTS: Record<Mood, number> = { happy: 100, neutral: 70, tired: 35, unhappy: 0 };

export interface MoodCounts {
  happy: number;
  neutral: number;
  tired: number;
  unhappy: number;
  total: number;
}

export function emptyMoodCounts(): MoodCounts {
  return { happy: 0, neutral: 0, tired: 0, unhappy: 0, total: 0 };
}

/** シフトIDの配列を、moodMapを引きながら表情ごとに集計する(moodMapに無いIDは無視)。 */
export function tallyMoods(shiftIds: string[], moodMap: Map<string, MoodResult>): MoodCounts {
  const counts = emptyMoodCounts();
  for (const id of shiftIds) {
    const mood = moodMap.get(id)?.mood;
    if (!mood) continue;
    counts[mood] += 1;
    counts.total += 1;
  }
  return counts;
}

/** 集計から0〜100の健全性スコアを算出する。シフトが1件も無い場合はnull。 */
export function scoreFromCounts(counts: MoodCounts): number | null {
  if (counts.total === 0) return null;
  const sum =
    counts.happy * MOOD_POINTS.happy +
    counts.neutral * MOOD_POINTS.neutral +
    counts.tired * MOOD_POINTS.tired +
    counts.unhappy * MOOD_POINTS.unhappy;
  return Math.round(sum / counts.total);
}

export type HealthLabel = 'good' | 'ok' | 'warning';

export function healthLabelForScore(score: number): HealthLabel {
  if (score >= 85) return 'good';
  if (score >= 60) return 'ok';
  return 'warning';
}

/** 「現在最も注意が必要な表情」。要注意リストのアバター表示に使う。 */
export function worstMood(counts: MoodCounts): Mood {
  if (counts.unhappy > 0) return 'unhappy';
  if (counts.tired > 0) return 'tired';
  if (counts.neutral > 0) return 'neutral';
  return 'happy';
}
