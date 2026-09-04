import type { FacilityId } from '../types';

export interface ShiftPattern {
  /** 「通し」パターンを自動配置等で機械的に特定するための安定した識別子(表示文言の変更に影響されない)。 */
  kind: 'early' | 'full' | 'short' | 'morning' | 'evening';
  label: string;
  labelEn: string;
  start: string;
  end: string;
  breakMinutes: number;
}

export const SHIFT_PATTERNS: Record<FacilityId, ShiftPattern[]> = {
  goods: [
    { kind: 'early', label: '早番 8:30-17:30', labelEn: 'Early 8:30-17:30', start: '08:30', end: '17:30', breakMinutes: 60 },
    { kind: 'full', label: '通し 9:00-18:00', labelEn: 'Full day 9:00-18:00', start: '09:00', end: '18:00', breakMinutes: 60 },
    { kind: 'short', label: '短時間 17:00-21:00', labelEn: 'Short 17:00-21:00', start: '17:00', end: '21:00', breakMinutes: 0 },
  ],
  amuse: [
    { kind: 'full', label: '通し 9:00-18:00', labelEn: 'Full day 9:00-18:00', start: '09:00', end: '18:00', breakMinutes: 60 },
  ],
  cafe: [
    { kind: 'morning', label: '午前 10:30-14:30', labelEn: 'Morning 10:30-14:30', start: '10:30', end: '14:30', breakMinutes: 0 },
    { kind: 'evening', label: '夕方 17:00-21:00', labelEn: 'Evening 17:00-21:00', start: '17:00', end: '21:00', breakMinutes: 0 },
    { kind: 'full', label: '通し 10:30-20:30', labelEn: 'Full day 10:30-20:30', start: '10:30', end: '20:30', breakMinutes: 120 },
  ],
};
