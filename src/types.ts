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
  /** 曜日パターンとは別に、カレンダーで個別指定する希望休み("YYYY-MM-DD"の配列)。 */
  desiredOffDates: string[];
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

/** 表情判定の理由。UI表示時に言語ごとへ翻訳できるよう、文言そのものではなくキー+パラメータで持つ。 */
export type MoodReasonKey =
  | 'offDateRequested'
  | 'offWeekdayRequested'
  | 'severeOverrun'
  | 'unfamiliarHelpUndesired'
  | 'consecutiveDays'
  | 'overrun'
  | 'unfamiliarHelpContinuing'
  | 'adjustedFromDesired'
  | 'helpOnce'
  | 'allGood';

export interface MoodReason {
  key: MoodReasonKey;
  params?: Record<string, number>;
}

export interface MoodResult {
  mood: Mood;
  reasons: MoodReason[];
  consecutiveDays: number;
  helpCountRecent: number;
}

/** ロールベース権限(RBAC)。 */
export type UserRole = 'manager' | 'employee';

export interface Profile {
  id: string;
  employeeId: string | null;
  role: UserRole;
}

/** 表示言語。表記(labels)テーブルのキーとしても使う。 */
export type Locale = 'ja' | 'en';

export interface LabelValues {
  ja: string;
  en?: string;
}

export type LabelEntityType = 'employee' | 'facility' | 'role' | 'qualification';

export interface LabelRow {
  entityType: LabelEntityType;
  entityId: string;
  field: string;
  values: LabelValues;
}
