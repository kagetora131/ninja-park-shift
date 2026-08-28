import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadInitialDataset } from '../data/normalize';
import { DEFAULT_WAGE_SETTINGS } from '../data/constants';
import { computeMoodMap } from '../lib/mood';
import { weekdayJp } from '../lib/format';
import { computeDailyFinance } from '../lib/finance';
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

const SHIFT_KEY = 'ninja-park-shift:shifts:v1';
const EMPLOYEE_KEY = 'ninja-park-shift:employees:v1';
const FINANCE_REVENUE_KEY = 'ninja-park-shift:finance-revenue:v1';
const WAGE_SETTINGS_KEY = 'ninja-park-shift:wage-settings:v1';
const POST_REQUIREMENTS_KEY = 'ninja-park-shift:post-requirements:v1';

function loadStored<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function saveStored<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage が使えない環境(プライベートモード等)では保存をあきらめる
  }
}

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

export function useShiftStore() {
  const initial = useMemo(() => loadInitialDataset(), []);
  const [employees, setEmployees] = useState<Employee[]>(
    () => loadStored<Employee[]>(EMPLOYEE_KEY) ?? initial.employees,
  );
  const [financeRevenue, setFinanceRevenue] = useState<FinanceRevenueRow[]>(
    () => loadStored<FinanceRevenueRow[]>(FINANCE_REVENUE_KEY) ?? initial.financeRevenue,
  );
  const [shifts, setShifts] = useState<ShiftEntry[]>(
    () => loadStored<ShiftEntry[]>(SHIFT_KEY) ?? initial.shifts,
  );
  const [wageSettings, setWageSettings] = useState<WageSettings>(
    () => loadStored<WageSettings>(WAGE_SETTINGS_KEY) ?? DEFAULT_WAGE_SETTINGS,
  );
  const [postRequirements, setPostRequirements] = useState<PostRequirements>(
    () => loadStored<PostRequirements>(POST_REQUIREMENTS_KEY) ?? {},
  );

  // 永続化はstateの変化を監視するeffectだけで行う(state更新関数の中でI/Oをすると、
  // React StrictModeの二重呼び出しでID生成などの非純粋な処理が2回走り、
  // localStorageとReact stateが食い違う不具合になるため)。
  useEffect(() => saveStored(SHIFT_KEY, shifts), [shifts]);
  useEffect(() => saveStored(EMPLOYEE_KEY, employees), [employees]);
  useEffect(() => saveStored(FINANCE_REVENUE_KEY, financeRevenue), [financeRevenue]);
  useEffect(() => saveStored(WAGE_SETTINGS_KEY, wageSettings), [wageSettings]);
  useEffect(() => saveStored(POST_REQUIREMENTS_KEY, postRequirements), [postRequirements]);

  const moodMap: Map<string, MoodResult> = useMemo(
    () => computeMoodMap(employees, shifts),
    [employees, shifts],
  );

  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  // 人件費はシフト+給与設定から自動計算するため、売上データを保存するたびに再計算する。
  const finance = useMemo(
    () => financeRevenue.map((row) => computeDailyFinance(row, shifts, employeeMap, wageSettings)),
    [financeRevenue, shifts, employeeMap, wageSettings],
  );

  const upsertShift = useCallback((input: NewShiftInput) => {
    setShifts((prev) => {
      const id = `${input.date}_${input.employeeId}`;
      const actualHours = computeActualHours(input.start, input.end, input.breakMinutes);
      const next: ShiftEntry = {
        id,
        date: input.date,
        day: weekdayJp(input.date),
        employeeId: input.employeeId,
        facility: input.facility,
        start: input.start,
        end: input.end,
        breakMinutes: input.breakMinutes,
        actualHours,
        isDesired: input.isDesired,
        note: input.note,
      };
      const filtered = prev.filter((s) => s.id !== id);
      return [...filtered, next];
    });
  }, []);

  const removeShift = useCallback((id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const upsertEmployee = useCallback((input: EmployeeInput) => {
    setEmployees((prev) => {
      const existing = input.id ? prev.find((e) => e.id === input.id) : undefined;
      const employee: Employee = {
        id: existing?.id ?? generateId('emp'),
        name: input.name,
        role: input.role,
        mainFacility: input.mainFacility,
        crossTrained: input.crossTrained,
        avatarBase: existing?.avatarBase ?? input.avatarBase ?? generateId('avatar'),
        desiredWorkDaysPerWeek: input.desiredWorkDaysPerWeek,
        desiredDaysOff: input.desiredDaysOff,
        maxConsecutiveDays: input.maxConsecutiveDays,
        qualifications: input.qualifications,
        employmentType: input.employmentType,
        cafeKitchenOk: input.cafeKitchenOk,
        isTrainee: input.isTrainee,
        avatarGender: input.avatarGender,
        avatarTop: input.avatarTop,
        avatarSkinColor: input.avatarSkinColor,
        avatarGlasses: input.avatarGlasses,
      };
      return existing
        ? prev.map((e) => (e.id === employee.id ? employee : e))
        : [...prev, employee];
    });
  }, []);

  const removeEmployee = useCallback((id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setShifts((prev) => prev.filter((s) => s.employeeId !== id));
  }, []);

  const updateFacilityRevenue = useCallback((input: FinanceInput) => {
    setFinanceRevenue((prev) =>
      prev.map((row) =>
        row.date === input.date
          ? { ...row, facilityRevenue: { ...row.facilityRevenue, [input.facility]: input.revenue } }
          : row,
      ),
    );
  }, []);

  const updateFacilityRate = useCallback((facility: FacilityId, value: number) => {
    setWageSettings((prev) => ({ ...prev, facilityRates: { ...prev.facilityRates, [facility]: value } }));
  }, []);

  const updateTraineeHourlyWage = useCallback((value: number) => {
    setWageSettings((prev) => ({ ...prev, traineeHourlyWage: value }));
  }, []);

  const updateFulltimeMonthlySalary = useCallback((value: number) => {
    setWageSettings((prev) => ({ ...prev, fulltimeMonthlySalary: value }));
  }, []);

  const updatePostRequirement = useCallback((weekday: string, facility: FacilityId, value: number | null) => {
    setPostRequirements((prev) => ({
      ...prev,
      [weekday]: { ...prev[weekday], [facility]: value },
    }));
  }, []);

  const resetToDummyData = useCallback(() => {
    setShifts(initial.shifts);
    setEmployees(initial.employees);
    setFinanceRevenue(initial.financeRevenue);
    setWageSettings(DEFAULT_WAGE_SETTINGS);
    setPostRequirements({});
  }, [initial.shifts, initial.employees, initial.financeRevenue]);

  return {
    employees,
    employeeMap,
    finance,
    shifts,
    moodMap,
    wageSettings,
    postRequirements,
    upsertShift,
    removeShift,
    upsertEmployee,
    removeEmployee,
    updateFacilityRevenue,
    updateFacilityRate,
    updateTraineeHourlyWage,
    updateFulltimeMonthlySalary,
    updatePostRequirement,
    resetToDummyData,
  };
}

function computeActualHours(start: string, end: string, breakMinutes: number): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  const worked = Math.max(0, endMinutes - startMinutes - breakMinutes);
  return Math.round((worked / 60) * 10) / 10;
}
