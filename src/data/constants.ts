import type { WageSettings } from '../types';

export const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];

/** 社員の月給を日割りする際に割る、月あたりの想定稼働日数。 */
export const SALARY_WORKING_DAYS_PER_MONTH = 21;

export const DEFAULT_WAGE_SETTINGS: WageSettings = {
  facilityRates: { goods: 1200, amuse: 2200, cafe: 1200 },
  traineeHourlyWage: 1500,
  fulltimeMonthlySalary: 280000,
};
