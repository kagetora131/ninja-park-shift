import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { computeMoodMap } from '../lib/mood';
import { dateRange, todayLocalIso, weekdayJp } from '../lib/format';
import { computeDailyFinance } from '../lib/finance';
import { autoAssignShifts } from '../lib/autoAssign';
import {
  mapEmployeeRow,
  mapFinanceRevenueRow,
  mapPostRequirementRows,
  mapShiftRow,
  mapWageSettingsRow,
  type EmployeeRow,
  type FinanceRevenueRowDb,
  type PostRequirementRow,
  type ShiftRow,
  type WageSettingsRow,
} from '../data/supabaseMappers';
import type {
  AvatarGender,
  Employee,
  FacilityId,
  FinanceRevenueRow,
  MoodResult,
  PostRequirements,
  ShiftEntry,
  WageSettings,
} from '../types';

export interface NewShiftInput {
  date: string;
  employeeId: string;
  facility: FacilityId;
  start: string;
  end: string;
  breakMinutes: number;
  isDesired: boolean;
  note?: string;
}

export interface EmployeeInput {
  id?: string;
  avatarBase?: string;
  name: string;
  role: string;
  mainFacility: FacilityId;
  crossTrained: FacilityId[];
  desiredWorkDaysPerWeek: number;
  desiredDaysOff: string[];
  maxConsecutiveDays: number;
  qualifications: string[];
  employmentType?: string;
  cafeKitchenOk?: boolean;
  isTrainee?: boolean;
  avatarGender?: AvatarGender;
  avatarTop?: string;
  avatarSkinColor?: string;
  avatarGlasses?: boolean;
}

export interface FinanceInput {
  date: string;
  facility: FacilityId;
  revenue: number;
}

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_WAGE_SETTINGS: WageSettings = {
  facilityRates: { goods: 1200, amuse: 2200, cafe: 1200 },
  traineeHourlyWage: 1500,
  fulltimeMonthlySalary: 280000,
};

/**
 * Supabase(共有DB)を情報源とするシフト・従業員・売上・給与設定・ポスト設定のストア。
 * どのテーブルもRLSで行が絞られるため、ロールに応じたフィルタリングはDB側に任せ、
 * ここでは「取得できたものをそのまま state にする」だけでよい。
 */
/** この日(毎月25日)以降にログインすると、翌月分が未作成なら自動でシフトを組む。 */
const AUTO_SCHEDULE_FROM_DAY_OF_MONTH = 25;

/** `today` の翌月の初日・末日を返す(UTC基準、月またぎの年繰り上げも Date に任せる)。 */
function nextMonthRange(today: string): { start: string; end: string } {
  const [y, m] = today.split('-').map(Number);
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 0));
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toIso(start), end: toIso(end) };
}

export function useShiftStore(options?: { autoScheduleNextMonth?: boolean }) {
  const autoScheduleNextMonth = options?.autoScheduleNextMonth ?? false;
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<ShiftEntry[]>([]);
  const [financeRevenue, setFinanceRevenue] = useState<FinanceRevenueRow[]>([]);
  const [wageSettings, setWageSettings] = useState<WageSettings>(DEFAULT_WAGE_SETTINGS);
  const [postRequirements, setPostRequirements] = useState<PostRequirements>({});

  const refetchEmployees = useCallback(async () => {
    const { data } = await supabase.from('employees').select('*').order('id');
    setEmployees(((data as EmployeeRow[]) ?? []).map(mapEmployeeRow));
  }, []);

  const refetchShifts = useCallback(async () => {
    const { data } = await supabase.from('shifts').select('*').order('date');
    setShifts(((data as ShiftRow[]) ?? []).map(mapShiftRow));
  }, []);

  const refetchFinance = useCallback(async () => {
    const { data } = await supabase.from('finance_revenue').select('*').order('date');
    setFinanceRevenue(((data as FinanceRevenueRowDb[]) ?? []).map(mapFinanceRevenueRow));
  }, []);

  const refetchWageSettings = useCallback(async () => {
    const { data } = await supabase.from('wage_settings').select('*').eq('id', 1).maybeSingle();
    if (data) setWageSettings(mapWageSettingsRow(data as WageSettingsRow));
  }, []);

  const refetchPostRequirements = useCallback(async () => {
    const { data } = await supabase.from('post_requirements').select('*');
    setPostRequirements(mapPostRequirementRows((data as PostRequirementRow[]) ?? []));
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([
        refetchEmployees(),
        refetchShifts(),
        refetchFinance(),
        refetchWageSettings(),
        refetchPostRequirements(),
      ]);
      setLoading(false);
    })();
  }, [refetchEmployees, refetchShifts, refetchFinance, refetchWageSettings, refetchPostRequirements]);

  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const moodMap: Map<string, MoodResult> = useMemo(
    () => computeMoodMap(employees, shifts),
    [employees, shifts],
  );

  const finance = useMemo(
    () => financeRevenue.map((row) => computeDailyFinance(row, shifts, employeeMap, wageSettings)),
    [financeRevenue, shifts, employeeMap, wageSettings],
  );

  const upsertShift = useCallback(
    async (input: NewShiftInput) => {
      const id = `${input.date}_${input.employeeId}`;
      const [sh, sm] = input.start.split(':').map(Number);
      const [eh, em] = input.end.split(':').map(Number);
      const worked = Math.max(0, eh * 60 + em - (sh * 60 + sm) - input.breakMinutes);
      const actualHours = Math.round((worked / 60) * 10) / 10;

      await supabase.from('shifts').upsert({
        id,
        date: input.date,
        day: weekdayJp(input.date),
        employee_id: input.employeeId,
        facility: input.facility,
        start: input.start,
        end: input.end,
        break_minutes: input.breakMinutes,
        actual_hours: actualHours,
        is_desired: input.isDesired,
        note: input.note ?? null,
      });
      await refetchShifts();
    },
    [refetchShifts],
  );

  const removeShift = useCallback(
    async (id: string) => {
      await supabase.from('shifts').delete().eq('id', id);
      await refetchShifts();
    },
    [refetchShifts],
  );

  /** 自動配置などでまとめて複数件を作成する際に使う一括upsert(refetchは最後に1回だけ)。 */
  const bulkUpsertShifts = useCallback(
    async (inputs: NewShiftInput[]) => {
      if (inputs.length === 0) return [];
      const rows = inputs.map((input) => {
        const id = `${input.date}_${input.employeeId}`;
        const [sh, sm] = input.start.split(':').map(Number);
        const [eh, em] = input.end.split(':').map(Number);
        const worked = Math.max(0, eh * 60 + em - (sh * 60 + sm) - input.breakMinutes);
        const actualHours = Math.round((worked / 60) * 10) / 10;
        return {
          id,
          date: input.date,
          day: weekdayJp(input.date),
          employee_id: input.employeeId,
          facility: input.facility,
          start: input.start,
          end: input.end,
          break_minutes: input.breakMinutes,
          actual_hours: actualHours,
          is_desired: input.isDesired,
          note: input.note ?? null,
        };
      });
      await supabase.from('shifts').upsert(rows);
      await refetchShifts();
      return rows.map((r) => r.id);
    },
    [refetchShifts],
  );

  /** 自動配置の「元に戻す」で使う一括削除(refetchは最後に1回だけ)。 */
  const bulkDeleteShifts = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      await supabase.from('shifts').delete().in('id', ids);
      await refetchShifts();
    },
    [refetchShifts],
  );

  /**
   * マネージャーログイン時、毎月 AUTO_SCHEDULE_FROM_DAY_OF_MONTH 日以降で翌月分のシフトが
   * まだ1件も無ければ、実際のシフト作成業務と同じく「月末に来月分を組む」形で自動配置する
   * (既存データは一切変更しない)。翌月分が既にあれば何もしない(重複作成の防止)。
   */
  const hasAutoScheduledRef = useRef(false);
  useEffect(() => {
    if (!autoScheduleNextMonth) return;
    if (loading || hasAutoScheduledRef.current) return;
    if (employees.length === 0 || Object.keys(postRequirements).length === 0) return;

    const today = todayLocalIso();
    const dayOfMonth = Number(today.slice(8, 10));
    if (dayOfMonth < AUTO_SCHEDULE_FROM_DAY_OF_MONTH) return;

    const { start, end } = nextMonthRange(today);
    const targetDates = dateRange(start, end);
    const datesWithShift = new Set(shifts.map((s) => s.date));
    if (targetDates.some((d) => datesWithShift.has(d))) return;

    hasAutoScheduledRef.current = true;
    const { created } = autoAssignShifts(employees, shifts, postRequirements, targetDates);
    if (created.length > 0) {
      void bulkUpsertShifts(created);
    }
  }, [autoScheduleNextMonth, loading, employees, shifts, postRequirements, bulkUpsertShifts]);

  const upsertEmployee = useCallback(
    async (input: EmployeeInput) => {
      const existing = input.id ? employeeMap.get(input.id) : undefined;
      const id = existing?.id ?? input.id ?? generateId('emp');
      const avatarBase = existing?.avatarBase ?? input.avatarBase ?? generateId('avatar');

      await supabase.from('employees').upsert({
        id,
        name: input.name,
        role: input.role,
        main_facility: input.mainFacility,
        cross_trained: input.crossTrained,
        avatar_base: avatarBase,
        desired_work_days_per_week: input.desiredWorkDaysPerWeek,
        desired_days_off: input.desiredDaysOff,
        desired_off_dates: existing?.desiredOffDates ?? [],
        max_consecutive_days: input.maxConsecutiveDays,
        qualifications: input.qualifications,
        employment_type: input.employmentType ?? null,
        cafe_kitchen_ok: input.cafeKitchenOk ?? null,
        is_trainee: input.isTrainee ?? false,
        avatar_gender: input.avatarGender ?? null,
        avatar_top: input.avatarTop ?? null,
        avatar_skin_color: input.avatarSkinColor ?? null,
        avatar_glasses: input.avatarGlasses ?? null,
      });
      await refetchEmployees();
    },
    [employeeMap, refetchEmployees],
  );

  const removeEmployee = useCallback(
    async (id: string) => {
      await supabase.from('employees').delete().eq('id', id);
      await Promise.all([refetchEmployees(), refetchShifts()]);
    },
    [refetchEmployees, refetchShifts],
  );

  const updateFacilityRevenue = useCallback(
    async (input: FinanceInput) => {
      const row = financeRevenue.find((f) => f.date === input.date);
      if (!row) return;
      const facilityRevenue = { ...row.facilityRevenue, [input.facility]: input.revenue };
      await supabase.from('finance_revenue').update({ facility_revenue: facilityRevenue }).eq('date', input.date);
      await refetchFinance();
    },
    [financeRevenue, refetchFinance],
  );

  const updateFacilityRate = useCallback(
    async (facility: FacilityId, value: number) => {
      const facilityRates = { ...wageSettings.facilityRates, [facility]: value };
      await supabase.from('wage_settings').update({ facility_rates: facilityRates }).eq('id', 1);
      await refetchWageSettings();
    },
    [wageSettings, refetchWageSettings],
  );

  const updateTraineeHourlyWage = useCallback(
    async (value: number) => {
      await supabase.from('wage_settings').update({ trainee_hourly_wage: value }).eq('id', 1);
      await refetchWageSettings();
    },
    [refetchWageSettings],
  );

  const updateFulltimeMonthlySalary = useCallback(
    async (value: number) => {
      await supabase.from('wage_settings').update({ fulltime_monthly_salary: value }).eq('id', 1);
      await refetchWageSettings();
    },
    [refetchWageSettings],
  );

  const updatePostRequirement = useCallback(
    async (weekday: string, facility: FacilityId, value: number | null) => {
      await supabase.from('post_requirements').upsert({ weekday, facility, required: value });
      await refetchPostRequirements();
    },
    [refetchPostRequirements],
  );

  return {
    loading,
    employees,
    employeeMap,
    refetchEmployees,
    finance,
    shifts,
    moodMap,
    wageSettings,
    postRequirements,
    upsertShift,
    removeShift,
    bulkUpsertShifts,
    bulkDeleteShifts,
    upsertEmployee,
    removeEmployee,
    updateFacilityRevenue,
    updateFacilityRate,
    updateTraineeHourlyWage,
    updateFulltimeMonthlySalary,
    updatePostRequirement,
  };
}
