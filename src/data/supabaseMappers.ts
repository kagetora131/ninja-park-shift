import type {
  ChatConversation,
  ChatConversationType,
  ChatDirectoryEntry,
  ChatMessage,
  ChatReaction,
  ChatStampKey,
  Employee,
  FacilityId,
  FinanceRevenueRow,
  LabelRow,
  PostRequirements,
  ShiftEntry,
  WageSettings,
} from '../types';

// Supabase(Postgres)の行(snake_case)とアプリ内の型(camelCase)を相互変換する。

export interface EmployeeRow {
  id: string;
  name: string;
  role: string;
  main_facility: FacilityId;
  cross_trained: FacilityId[];
  avatar_base: string;
  desired_work_days_per_week: number;
  desired_days_off: string[];
  desired_off_dates: string[];
  max_consecutive_days: number;
  qualifications: string[];
  employment_type: string | null;
  cafe_kitchen_ok: boolean | null;
  is_trainee: boolean | null;
  avatar_gender: string | null;
  avatar_top: string | null;
  avatar_skin_color: string | null;
  avatar_glasses: boolean | null;
}

export function mapEmployeeRow(r: EmployeeRow): Employee {
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    mainFacility: r.main_facility,
    crossTrained: r.cross_trained ?? [],
    avatarBase: r.avatar_base,
    desiredWorkDaysPerWeek: r.desired_work_days_per_week,
    desiredDaysOff: r.desired_days_off ?? [],
    desiredOffDates: r.desired_off_dates ?? [],
    maxConsecutiveDays: r.max_consecutive_days,
    qualifications: r.qualifications ?? [],
    employmentType: r.employment_type ?? undefined,
    cafeKitchenOk: r.cafe_kitchen_ok ?? undefined,
    isTrainee: r.is_trainee ?? false,
    avatarGender: (r.avatar_gender as Employee['avatarGender']) ?? undefined,
    avatarTop: r.avatar_top ?? undefined,
    avatarSkinColor: r.avatar_skin_color ?? undefined,
    avatarGlasses: r.avatar_glasses ?? undefined,
  };
}

export interface ShiftRow {
  id: string;
  date: string;
  day: string;
  employee_id: string;
  facility: FacilityId;
  start: string;
  end: string;
  is_desired: boolean;
  break_minutes: number;
  actual_hours: number;
  note: string | null;
  updated_at: string;
}

export function mapShiftRow(r: ShiftRow): ShiftEntry {
  return {
    id: r.id,
    date: r.date,
    day: r.day,
    employeeId: r.employee_id,
    facility: r.facility,
    start: r.start,
    end: r.end,
    isDesired: r.is_desired,
    breakMinutes: r.break_minutes,
    actualHours: Number(r.actual_hours),
    note: r.note ?? undefined,
    updatedAt: r.updated_at,
  };
}

export interface FinanceRevenueRowDb {
  date: string;
  day: string;
  category: string | null;
  facility_revenue: Record<FacilityId, number>;
}

export function mapFinanceRevenueRow(r: FinanceRevenueRowDb): FinanceRevenueRow {
  return {
    date: r.date,
    day: r.day,
    category: r.category ?? '',
    facilityRevenue: r.facility_revenue,
  };
}

export interface WageSettingsRow {
  facility_rates: Record<FacilityId, number>;
  trainee_hourly_wage: number;
  fulltime_monthly_salary: number;
}

export function mapWageSettingsRow(r: WageSettingsRow): WageSettings {
  return {
    facilityRates: r.facility_rates,
    traineeHourlyWage: Number(r.trainee_hourly_wage),
    fulltimeMonthlySalary: Number(r.fulltime_monthly_salary),
  };
}

export interface PostRequirementRow {
  weekday: string;
  facility: FacilityId;
  required: number | null;
}

export function mapPostRequirementRows(rows: PostRequirementRow[]): PostRequirements {
  const result: PostRequirements = {};
  for (const row of rows) {
    result[row.weekday] = { ...result[row.weekday], [row.facility]: row.required };
  }
  return result;
}

export interface LabelRowDb {
  entity_type: string;
  entity_id: string;
  field: string;
  values: { ja: string; en?: string };
}

export function mapLabelRow(r: LabelRowDb): LabelRow {
  return {
    entityType: r.entity_type as LabelRow['entityType'],
    entityId: r.entity_id,
    field: r.field,
    values: r.values,
  };
}

export interface ChatConversationRow {
  id: string;
  type: string;
  name: string | null;
  created_by: string | null;
  created_at: string;
}

export function mapChatConversationRow(r: ChatConversationRow): ChatConversation {
  return {
    id: r.id,
    type: r.type as ChatConversationType,
    name: r.name,
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

export interface ChatMessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  image_path: string | null;
  created_at: string;
  pinned_at: string | null;
}

export function mapChatMessageRow(r: ChatMessageRow): ChatMessage {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    senderProfileId: r.sender_id,
    body: r.body,
    imagePath: r.image_path,
    createdAt: r.created_at,
    pinnedAt: r.pinned_at,
  };
}

export interface ChatReactionRow {
  message_id: string;
  profile_id: string;
  stamp_key: string;
  created_at: string;
}

export function mapChatReactionRow(r: ChatReactionRow): ChatReaction {
  return {
    messageId: r.message_id,
    profileId: r.profile_id,
    stampKey: r.stamp_key as ChatStampKey,
    createdAt: r.created_at,
  };
}

export interface ChatDirectoryRow {
  id: string;
  employee_id: string | null;
  role: string;
}

export function mapChatDirectoryRow(r: ChatDirectoryRow): ChatDirectoryEntry {
  return {
    profileId: r.id,
    employeeId: r.employee_id,
    role: r.role as ChatDirectoryEntry['role'],
  };
}
