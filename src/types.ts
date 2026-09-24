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
  /** DBで自動更新される最終更新日時(ISO文字列)。従業員側の「シフトが更新された」通知に使う。 */
  updatedAt: string;
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

/** チャットの種別。業務連絡は常に1件だけ存在し、マネージャーのみ投稿できる。 */
export type ChatConversationType = 'broadcast' | 'dm' | 'group';

export interface ChatConversation {
  id: string;
  type: ChatConversationType;
  /** グループチャットの名前(DM・業務連絡ではnull)。 */
  name: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  /** 送信者の`profiles.id`(認証ユーザーID)。マネージャーはemployees行を持たないため、employees.idではなくこちらを使う。 */
  senderProfileId: string;
  body: string | null;
  /** Supabase Storage(`chat-images`バケット)内のパス。表示には署名付きURLへの変換が必要。 */
  imagePath: string | null;
  createdAt: string;
  /** マネージャーが業務連絡チャンネルでピン留めした日時(未ピン留めならnull)。 */
  pinnedAt: string | null;
  editedAt: string | null;
  /** 取り消し日時。取り消し済みならbody/imagePathはnull(原文はマネージャーだけが履歴から見られる)。 */
  deletedAt: string | null;
}

/** 編集・取り消し前の原文(マネージャーのみ取得可能)。 */
export interface ChatMessageRevision {
  id: string;
  messageId: string;
  kind: 'edit' | 'delete';
  previousBody: string | null;
  previousImagePath: string | null;
  createdAt: string;
}

/** メッセージへのスタンプ。ネガティブな用途を防ぐため固定6種類のみ。 */
export type ChatStampKey = 'ninja' | 'thumbs_up' | 'cheer' | 'muscle' | 'fire' | 'thanks';

export interface ChatReaction {
  messageId: string;
  profileId: string;
  stampKey: ChatStampKey;
  createdAt: string;
}

/** チャットの参加者ディレクトリ(profiles全件)。DM/グループの相手選択や表示名解決に使う。 */
export interface ChatDirectoryEntry {
  profileId: string;
  employeeId: string | null;
  role: UserRole;
}
