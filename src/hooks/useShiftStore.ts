import { useCallback, useMemo, useState } from 'react';
import { loadInitialDataset } from '../data/normalize';
import { computeMoodMap } from '../lib/mood';
import { weekdayJp } from '../lib/format';
import type { Employee, MoodResult, ShiftEntry } from '../types';

const STORAGE_KEY = 'ninja-park-shift:shifts:v1';

function loadStoredShifts(): ShiftEntry[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ShiftEntry[];
  } catch {
    return null;
  }
}

function saveStoredShifts(shifts: ShiftEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shifts));
  } catch {
    // localStorage が使えない環境(プライベートモード等)では保存をあきらめる
  }
}

export interface NewShiftInput {
  date: string;
  employeeId: string;
  facility: ShiftEntry['facility'];
  start: string;
  end: string;
  breakMinutes: number;
  isDesired: boolean;
  note?: string;
}

export function useShiftStore() {
  const initial = useMemo(() => loadInitialDataset(), []);
  const [employees] = useState<Employee[]>(initial.employees);
  const [finance] = useState(initial.finance);
  const [shifts, setShifts] = useState<ShiftEntry[]>(() => loadStoredShifts() ?? initial.shifts);

  const moodMap: Map<string, MoodResult> = useMemo(
    () => computeMoodMap(employees, shifts),
    [employees, shifts],
  );

  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

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
      const merged = [...filtered, next];
      saveStoredShifts(merged);
      return merged;
    });
  }, []);

  const removeShift = useCallback((id: string) => {
    setShifts((prev) => {
      const merged = prev.filter((s) => s.id !== id);
      saveStoredShifts(merged);
      return merged;
    });
  }, []);

  const resetToDummyData = useCallback(() => {
    setShifts(initial.shifts);
    saveStoredShifts(initial.shifts);
  }, [initial.shifts]);

  return {
    employees,
    employeeMap,
    finance,
    shifts,
    moodMap,
    upsertShift,
    removeShift,
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
