import { FACILITY_ORDER } from '../data/facilities';
import { computeFacilityLaborCost } from './wage';
import type { DailyFinance, Employee, FinanceRevenueRow, ShiftEntry, WageSettings } from '../types';

/**
 * 保存された売上(FinanceRevenueRow)と、その日のシフト+給与設定から人件費を自動計算し、
 * 画面表示用の完全なDailyFinance(施設別内訳・合計・損益・黒字判定)を組み立てる。
 */
export function computeDailyFinance(
  row: FinanceRevenueRow,
  shifts: ShiftEntry[],
  employeeMap: Map<string, Employee>,
  wageSettings: WageSettings,
): DailyFinance {
  const facilities = Object.fromEntries(
    FACILITY_ORDER.map((f) => [
      f,
      {
        revenue: row.facilityRevenue[f] ?? 0,
        laborCost: Math.round(computeFacilityLaborCost(shifts, employeeMap, row.date, f, wageSettings)),
      },
    ]),
  ) as DailyFinance['facilities'];

  const totalRevenue = FACILITY_ORDER.reduce((sum, f) => sum + facilities[f].revenue, 0);
  const totalLaborCost = FACILITY_ORDER.reduce((sum, f) => sum + facilities[f].laborCost, 0);
  const profit = totalRevenue - totalLaborCost;

  return {
    date: row.date,
    day: row.day,
    category: row.category,
    facilities,
    totalRevenue,
    totalLaborCost,
    profit,
    isBlack: profit >= 0,
  };
}

export interface RedStreak {
  length: number;
  endDate: string;
}

export function longestRedStreak(finance: DailyFinance[]): RedStreak {
  let best: RedStreak = { length: 0, endDate: '' };
  let current = 0;
  let currentEnd = '';

  for (const day of finance) {
    if (!day.isBlack) {
      current += 1;
      currentEnd = day.date;
      if (current > best.length) best = { length: current, endDate: currentEnd };
    } else {
      current = 0;
    }
  }
  return best;
}

export function bestProfitDay(finance: DailyFinance[]): DailyFinance | undefined {
  return finance.reduce<DailyFinance | undefined>((best, day) => {
    if (!best || day.profit > best.profit) return day;
    return best;
  }, undefined);
}

export function totalsOf(finance: DailyFinance[]) {
  return finance.reduce(
    (acc, day) => ({
      revenue: acc.revenue + day.totalRevenue,
      laborCost: acc.laborCost + day.totalLaborCost,
      profit: acc.profit + day.profit,
    }),
    { revenue: 0, laborCost: 0, profit: 0 },
  );
}
