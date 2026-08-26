import type { FacilityId } from '../types';

export interface ShiftPattern {
  label: string;
  start: string;
  end: string;
  breakMinutes: number;
}

export const SHIFT_PATTERNS: Record<FacilityId, ShiftPattern[]> = {
  goods: [
    { label: '早番 8:30-17:30', start: '08:30', end: '17:30', breakMinutes: 60 },
    { label: '通し 9:00-18:00', start: '09:00', end: '18:00', breakMinutes: 60 },
    { label: '短時間 17:00-21:00', start: '17:00', end: '21:00', breakMinutes: 0 },
  ],
  amuse: [{ label: '通し 9:00-18:00', start: '09:00', end: '18:00', breakMinutes: 60 }],
  cafe: [
    { label: '午前 10:30-14:30', start: '10:30', end: '14:30', breakMinutes: 0 },
    { label: '夕方 17:00-21:00', start: '17:00', end: '21:00', breakMinutes: 0 },
    { label: '通し 10:30-20:30', start: '10:30', end: '20:30', breakMinutes: 120 },
  ],
};
