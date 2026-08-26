import raw from './rawData';
import type { DailyFinance, Employee, FacilityId, ShiftDataset, ShiftEntry } from '../types';

interface RawEmployee {
  id: string;
  name: string;
  role: string;
  main_facility: FacilityId;
  cross_trained: FacilityId[];
  avatar_base: string;
  希望勤務日数_目安: number;
  希望休み曜日: string[];
  連勤上限: number;
  資格?: string[];
  求人反映_雇用形態?: string;
  求人反映_給与?: string;
  求人反映_給与備考?: string;
  カフェ厨房対応可否?: boolean;
}

interface RawShift {
  date: string;
  day: string;
  employee_id: string;
  facility: FacilityId;
  start: string;
  end: string;
  希望通りか?: boolean;
  休憩分: number;
  実働時間: number;
  備考?: string;
}

interface RawFinance {
  date: string;
  day: string;
  category: string;
  facilities: Record<FacilityId, { revenue: number; labor_cost: number }>;
  total_revenue: number;
  total_labor_cost: number;
  profit: number;
  is_black: boolean;
}

interface RawDataset {
  employees: RawEmployee[];
  shifts: RawShift[];
  daily_finance: RawFinance[];
}

function normalizeEmployee(e: RawEmployee): Employee {
  return {
    id: e.id,
    name: e.name,
    role: e.role,
    mainFacility: e.main_facility,
    crossTrained: e.cross_trained ?? [],
    avatarBase: e.avatar_base,
    desiredWorkDaysPerWeek: e.希望勤務日数_目安,
    desiredDaysOff: e.希望休み曜日 ?? [],
    maxConsecutiveDays: e.連勤上限,
    qualifications: e.資格 ?? [],
    employmentType: e.求人反映_雇用形態,
    wage: e.求人反映_給与,
    wageNote: e.求人反映_給与備考,
    cafeKitchenOk: e.カフェ厨房対応可否,
  };
}

function normalizeShift(s: RawShift): ShiftEntry {
  return {
    id: `${s.date}_${s.employee_id}`,
    date: s.date,
    day: s.day,
    employeeId: s.employee_id,
    facility: s.facility,
    start: s.start,
    end: s.end,
    isDesired: s.希望通りか ?? true,
    breakMinutes: s.休憩分,
    actualHours: s.実働時間,
    note: s.備考,
  };
}

function normalizeFinance(f: RawFinance): DailyFinance {
  const facilities = Object.fromEntries(
    (Object.entries(f.facilities) as [FacilityId, { revenue: number; labor_cost: number }][]).map(
      ([id, v]) => [id, { revenue: v.revenue, laborCost: v.labor_cost }],
    ),
  ) as DailyFinance['facilities'];

  return {
    date: f.date,
    day: f.day,
    category: f.category,
    facilities,
    totalRevenue: f.total_revenue,
    totalLaborCost: f.total_labor_cost,
    profit: f.profit,
    isBlack: f.is_black,
  };
}

export function loadInitialDataset(): ShiftDataset {
  const data = raw as unknown as RawDataset;
  return {
    employees: data.employees.map(normalizeEmployee),
    shifts: data.shifts.map(normalizeShift),
    finance: data.daily_finance.map(normalizeFinance),
  };
}
