export type FacilityId = 'goods' | 'amuse' | 'cafe';

export interface FacilityMeta {
  id: FacilityId;
  name: string;
  shortName: string;
  description: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  mainFacility: FacilityId;
  crossTrained: FacilityId[];
  avatarBase: string;
  desiredWorkDaysPerWeek: number;
  desiredDaysOff: string[];
  maxConsecutiveDays: number;
  qualifications: string[];
  employmentType?: string;
  wage?: string;
  wageNote?: string;
  cafeKitchenOk?: boolean;
}

export interface ShiftEntry {
  id: string;
  date: string;
  day: string;
  employeeId: string;
  facility: FacilityId;
  start: string;
  end: string;
  isDesired: boolean;
  breakMinutes: number;
  actualHours: number;
  note?: string;
}

export interface FacilityFinance {
  revenue: number;
  laborCost: number;
}

export interface DailyFinance {
  date: string;
  day: string;
  category: string;
  facilities: Record<FacilityId, FacilityFinance>;
  totalRevenue: number;
  totalLaborCost: number;
  profit: number;
  isBlack: boolean;
}

export type Mood = 'happy' | 'neutral' | 'tired' | 'unhappy';

export interface MoodResult {
  mood: Mood;
  reasons: string[];
  consecutiveDays: number;
  helpCountRecent: number;
}

export interface ShiftDataset {
  employees: Employee[];
  shifts: ShiftEntry[];
  finance: DailyFinance[];
}
