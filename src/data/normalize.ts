import raw from './rawData';
import type { Employee, FacilityId, FinanceRevenueRow, ShiftDataset, ShiftEntry } from '../types';

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
    cafeKitchenOk: e.カフェ厨房対応可否,
    isTrainee: false,
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

/** ダミーデータの人件費(labor_cost)は初期値としては使わず、売上のみを取り出す。
 *  人件費はシフト+給与設定から自動計算する([[src/lib/wage.ts]])。 */
function normalizeFinanceRevenue(f: RawFinance): FinanceRevenueRow {
  const facilityRevenue = Object.fromEntries(
    (Object.entries(f.facilities) as [FacilityId, { revenue: number }][]).map(([id, v]) => [id, v.revenue]),
  ) as Record<FacilityId, number>;

  return {
    date: f.date,
    day: f.day,
    category: f.category,
    facilityRevenue,
  };
}

export function loadInitialDataset(): ShiftDataset {
  const data = raw as unknown as RawDataset;
  return {
    employees: data.employees.map(normalizeEmployee),
    shifts: data.shifts.map(normalizeShift),
    financeRevenue: data.daily_finance.map(normalizeFinanceRevenue),
  };
}
