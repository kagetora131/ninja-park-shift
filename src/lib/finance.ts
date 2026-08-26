import type { DailyFinance } from '../types';

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
