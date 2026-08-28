export type FacilityId = 'goods' | 'amuse' | 'cafe';

export interface FacilityMeta {
  id: FacilityId;
  name: string;
  shortName: string;
  description: string;
}

export type AvatarGender = 'male' | 'female';

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
  cafeKitchenOk?: boolean;
  /** 研修中スタッフ。人件費は「研修中時給」が優先適用される。 */
  isTrainee?: boolean;
  /** アバターのカスタマイズ(未指定ならavatarBaseから決定論的に自動選択)。 */
  avatarGender?: AvatarGender;
  avatarTop?: string;
  avatarSkinColor?: string;
  avatarGlasses?: boolean;
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

/** 永続化される売上データ(人件費はシフト+給与設定から自動計算するため保存しない)。 */
export interface FinanceRevenueRow {
  date: string;
  day: string;
  category: string;
  facilityRevenue: Record<FacilityId, number>;
}

/** ポジション別の給与設定。従業員個別ではなく施設・雇用形態単位で設定する。 */
export interface WageSettings {
  facilityRates: Record<FacilityId, number>;
  traineeHourlyWage: number;
  fulltimeMonthlySalary: number;
}

/** 曜日×施設の必要人数(未設定=null)。 */
export type PostRequirements = Record<string, Partial<Record<FacilityId, number | null>>>;

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
  financeRevenue: FinanceRevenueRow[];
}
