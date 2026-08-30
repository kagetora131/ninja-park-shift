import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react';
import { NinjaAvatar } from './NinjaAvatar';
import { PostCoveragePanel } from './PostCoveragePanel';
import { FACILITIES, FACILITY_COLOR, FACILITY_ORDER, capableFacilities } from '../data/facilities';
import { WEEKDAYS } from '../data/constants';
import { SHIFT_PATTERNS } from '../data/shiftPatterns';
import { formatDateJp, weekdayJp } from '../lib/format';
import { MOOD_COLOR } from '../lib/mood';
import { readShiftDragPayload, setShiftDragPayload } from '../lib/dragDrop';
import { useAutoScrollOnDrag } from '../hooks/useAutoScrollOnDrag';
import {
  CALENDAR_END_MONTH,
  CALENDAR_END_YEAR,
  CALENDAR_START_MONTH,
  CALENDAR_START_YEAR,
  addMonths,
  datesInMonth,
} from '../lib/monthGrid';
import { useLabelContext } from '../hooks/LabelContext';
import type { ShiftDraft } from './ShiftEditModal';
import type { NewShiftInput } from '../hooks/useShiftStore';
import type { AutoAssignResult } from '../lib/autoAssign';
import type { DailyFinance, Employee, MoodResult, PostRequirements, ShiftEntry } from '../types';

interface ShiftBoardProps {
  employees: Employee[];
  shifts: ShiftEntry[];
  moodMap: Map<string, MoodResult>;
  finance: DailyFinance[];
  postRequirements: PostRequirements;
  onEditShift: (shift: ShiftEntry) => void;
  onCreateShift: (draft: ShiftDraft) => void;
  onAssignShift: (input: NewShiftInput) => Promise<void> | void;
  onRemoveShift: (id: string) => Promise<void> | void;
  onAutoAssign: (dates: string[]) => Promise<AutoAssignResult>;
}

export function ShiftBoard({
  employees,
  shifts,
  moodMap,
  finance,
  postRequirements,
  onEditShift,
  onCreateShift,
  onAssignShift,
  onRemoveShift,
  onAutoAssign,
}: ShiftBoardProps) {
  useAutoScrollOnDrag();
  const { employeeName, facilityName } = useLabelContext();
  const [view, setView] = useState({ year: CALENDAR_START_YEAR, month: CALENDAR_START_MONTH });
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [highlightDate, setHighlightDate] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const columnRefs = useRef(new Map<string, HTMLTableCellElement>());

  const dates = datesInMonth(view.year, view.month);

  const sortedEmployees = [...employees].sort((a, b) => {
    const fa = FACILITY_ORDER.indexOf(a.mainFacility);
    const fb = FACILITY_ORDER.indexOf(b.mainFacility);
    return fa - fb || a.name.localeCompare(b.name, 'ja');
  });

  const employeeMap = new Map(employees.map((e) => [e.id, e]));
  const shiftByKey = new Map<string, ShiftEntry>();
  for (const s of shifts) shiftByKey.set(`${s.date}_${s.employeeId}`, s);

  const financeByDate = new Map(finance.map((f) => [f.date, f]));
  const blackDaysInView = dates.filter((d) => financeByDate.get(d)?.isBlack).length;

  const goMonth = (delta: number) => setView((v) => addMonths(v.year, v.month, delta));

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((n) => (n === message ? null : n)), 4000);
  };

  const handleSelectCoverageDate = (date: string) => {
    setHighlightDate(date);
    columnRefs.current.get(date)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    window.setTimeout(() => setHighlightDate((d) => (d === date ? null : d)), 2500);
  };

  const handleDropOnCell = async (targetEmployee: Employee, targetDate: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCell(null);
    const payload = readShiftDragPayload(e);
    if (!payload) return;

    if (payload.kind === 'facility') {
      if (payload.employeeId !== targetEmployee.id) return;
      const existing = shiftByKey.get(`${targetDate}_${targetEmployee.id}`);
      const pattern = SHIFT_PATTERNS[payload.facility][0];
      await onAssignShift({
        date: targetDate,
        employeeId: targetEmployee.id,
        facility: payload.facility,
        start: existing?.start ?? pattern.start,
        end: existing?.end ?? pattern.end,
        breakMinutes: existing?.breakMinutes ?? pattern.breakMinutes,
        isDesired: existing?.isDesired ?? true,
        note: existing?.facility === payload.facility ? existing.note : undefined,
      });
      if (!capableFacilities(targetEmployee).includes(payload.facility)) {
        showNotice(`${employeeName(targetEmployee)}は${facilityName(payload.facility)}が未経験です。無理のないシフトか確認しましょう。`);
      }
      return;
    }

    const source = shifts.find((s) => s.id === payload.shiftId);
    if (!source) return;
    if (source.employeeId === targetEmployee.id && source.date === targetDate) return;

    const target = shiftByKey.get(`${targetDate}_${targetEmployee.id}`);
    if (target) {
      await Promise.all([
        onAssignShift({
          date: target.date,
          employeeId: target.employeeId,
          facility: source.facility,
          start: source.start,
          end: source.end,
          breakMinutes: source.breakMinutes,
          isDesired: source.isDesired,
          note: source.note,
        }),
        onAssignShift({
          date: source.date,
          employeeId: source.employeeId,
          facility: target.facility,
          start: target.start,
          end: target.end,
          breakMinutes: target.breakMinutes,
          isDesired: target.isDesired,
          note: target.note,
        }),
      ]);
      const sourceEmployee = employeeMap.get(source.employeeId);
      showNotice(
        `${sourceEmployee ? employeeName(sourceEmployee) : ''}と${employeeName(targetEmployee)}の配置を入れ替えました`,
      );
    } else {
      await onRemoveShift(source.id);
      await onAssignShift({
        date: targetDate,
        employeeId: targetEmployee.id,
        facility: source.facility,
        start: source.start,
        end: source.end,
        breakMinutes: source.breakMinutes,
        isDesired: source.isDesired,
        note: source.note,
      });
    }
  };

  const handleAutoAssign = async () => {
    setAutoAssigning(true);
    try {
      const result = await onAutoAssign(dates);
      if (result.created.length === 0 && result.shortfalls.length === 0) {
        showNotice('この月はすでにポスト設定の必要人数を満たしています');
      } else if (result.shortfalls.length === 0) {
        showNotice(`${result.created.length}件のシフトを自動配置しました`);
      } else {
        showNotice(
          `${result.created.length}件を自動配置しましたが、${result.shortfalls.length}件は対応可能な忍者が見つかりませんでした`,
        );
      }
    } finally {
      setAutoAssigning(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goMonth(-1)}
            disabled={view.year === CALENDAR_START_YEAR && view.month === CALENDAR_START_MONTH}
            className="rounded-full border border-paper/20 p-1.5 text-paper-dim transition hover:border-gold hover:text-gold disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="font-mincho text-base font-bold text-paper">
            {view.year}年{view.month}月
          </p>
          <button
            type="button"
            onClick={() => goMonth(1)}
            disabled={view.year === CALENDAR_END_YEAR && view.month === CALENDAR_END_MONTH}
            className="rounded-full border border-paper/20 p-1.5 text-paper-dim transition hover:border-gold hover:text-gold disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAutoAssign}
            disabled={autoAssigning}
            className="flex items-center gap-1.5 rounded-full border border-gold/50 px-3 py-1.5 text-xs text-gold transition hover:bg-gold/10 disabled:opacity-50"
          >
            <Sparkles size={13} />
            {autoAssigning ? '自動配置中...' : 'スタッフの自動配置'}
          </button>
          <div className="flex items-center gap-2 rounded-full border border-jade/40 bg-jade/10 px-3 py-1.5 text-xs text-jade">
            今月の黒字日数：{blackDaysInView} / {dates.length}日
          </div>
        </div>
      </div>

      {notice && (
        <div className="animate-rise rounded-lg border border-gold/50 bg-gold/10 px-4 py-2 text-xs text-gold">
          {notice}
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="max-h-[70vh] flex-1 overflow-auto rounded-xl border border-paper/10">
          <table className="border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-30 min-w-[210px] border-b border-r border-paper/10 bg-void-soft px-2 py-2 text-left font-medium text-paper-dim">
                  スタッフ
                </th>
                {dates.map((date) => {
                  const dayFinance = financeByDate.get(date);
                  return (
                    <th
                      key={date}
                      ref={(el) => {
                        if (el) columnRefs.current.set(date, el);
                        else columnRefs.current.delete(date);
                      }}
                      className={`sticky top-0 z-20 min-w-[64px] border-b border-r border-paper/10 px-1 py-2 text-center font-medium text-paper transition-colors ${
                        highlightDate === date ? 'bg-gold/20' : 'bg-void-soft'
                      }`}
                    >
                      <span
                        className={`mx-auto mb-0.5 block h-1.5 w-1.5 rounded-full ${
                          dayFinance?.isBlack ? 'bg-jade' : 'bg-seal'
                        }`}
                      />
                      {formatDateJp(date, weekdayJp(date))}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedEmployees.map((emp) => {
                const capable = capableFacilities(emp);
                return (
                  <tr key={emp.id} className="odd:bg-void/30">
                    <td
                      className="sticky left-0 z-10 border-b border-r border-paper/10 bg-void-soft p-2 align-top"
                      style={{ borderLeft: `3px solid ${FACILITY_COLOR[emp.mainFacility]}` }}
                    >
                      <div className="flex items-center gap-2">
                        <NinjaAvatar employee={emp} mood="neutral" size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-paper">{employeeName(emp)}</p>
                          <p className="text-[10px] text-paper-dim">
                            週{emp.desiredWorkDaysPerWeek}日希望・連勤上限{emp.maxConsecutiveDays}日
                          </p>
                        </div>
                      </div>

                      <div className="mt-1.5 flex gap-[3px]">
                        {WEEKDAYS.map((day) => {
                          const isOff = emp.desiredDaysOff.includes(day);
                          return (
                            <span
                              key={day}
                              title={isOff ? `${day}曜は希望休み` : day}
                              className={`flex h-4 w-4 items-center justify-center rounded-sm text-[9px] ${
                                isOff ? 'bg-seal/25 text-seal-bright' : 'bg-void text-paper-dim/60'
                              }`}
                            >
                              {day}
                            </span>
                          );
                        })}
                      </div>

                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {capable.map((f) => {
                          const isMain = f === emp.mainFacility;
                          return (
                            <span
                              key={f}
                              draggable
                              onDragStart={(e) => setShiftDragPayload(e, { kind: 'facility', employeeId: emp.id, facility: f })}
                              title={isMain ? `所属：${facilityName(f)}(ドラッグして配置)` : `応援可：${facilityName(f)}(ドラッグして配置)`}
                              className={`cursor-grab select-none rounded-full px-1.5 py-[1px] text-[9px] transition active:cursor-grabbing ${
                                isMain ? 'text-void' : 'border border-dashed text-paper-dim'
                              }`}
                              style={
                                isMain
                                  ? { background: FACILITY_COLOR[f] }
                                  : { borderColor: FACILITY_COLOR[f], color: FACILITY_COLOR[f] }
                              }
                            >
                              {FACILITIES[f].shortName}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {dates.map((date) => {
                      const shift = shiftByKey.get(`${date}_${emp.id}`);
                      const cellKey = `${emp.id}_${date}`;
                      const isDragOver = dragOverCell === cellKey;
                      const isHighlighted = highlightDate === date;
                      const baseClass = `border-b border-r border-paper/5 p-0.5 transition-colors ${
                        isHighlighted ? 'bg-gold/10' : ''
                      } ${isDragOver ? 'bg-gold/20 shadow-[inset_0_0_0_2px_var(--color-gold)]' : ''}`;

                      if (!shift) {
                        return (
                          <td
                            key={date}
                            className={baseClass}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOverCell(cellKey);
                            }}
                            onDragLeave={() => setDragOverCell((c) => (c === cellKey ? null : c))}
                            onDrop={(e) => handleDropOnCell(emp, date, e)}
                          >
                            <button
                              type="button"
                              onClick={() => onCreateShift({ mode: 'create', date, facility: emp.mainFacility, employeeId: emp.id })}
                              className="flex h-9 w-full items-center justify-center rounded-sm border border-dashed border-paper/10 text-paper-dim/0 transition hover:border-gold/50 hover:text-gold"
                            >
                              <Plus size={11} />
                            </button>
                          </td>
                        );
                      }

                      const mood = moodMap.get(shift.id);
                      return (
                        <td
                          key={date}
                          className={baseClass}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverCell(cellKey);
                          }}
                          onDragLeave={() => setDragOverCell((c) => (c === cellKey ? null : c))}
                          onDrop={(e) => handleDropOnCell(emp, date, e)}
                        >
                          <button
                            type="button"
                            draggable
                            onDragStart={(e) => setShiftDragPayload(e, { kind: 'shift', shiftId: shift.id })}
                            onClick={() => onEditShift(shift)}
                            title={`${facilityName(shift.facility)} ${shift.start}–${shift.end}${
                              mood ? ` / ${mood.reasons.join(' / ')}` : ''
                            }`}
                            className="relative flex h-9 w-full cursor-grab flex-col items-center justify-center gap-0.5 rounded-sm border-l-4 bg-void/60 transition active:cursor-grabbing hover:brightness-125"
                            style={{ borderLeftColor: FACILITY_COLOR[shift.facility] }}
                          >
                            <span className="leading-none text-paper">{shift.start}</span>
                            <span className="leading-none text-paper-dim">{shift.end}</span>
                            {mood && (
                              <span
                                className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full"
                                style={{ background: MOOD_COLOR[mood.mood] }}
                              />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <PostCoveragePanel dates={dates} shifts={shifts} postRequirements={postRequirements} onSelectDate={handleSelectCoverageDate} />
      </div>

      <p className="text-[11px] text-paper-dim">
        施設バッジをセルへドラッグして新規配置、配置済みセルをドラッグすると別の日付・従業員へ移動(空きセル)または入れ替え(配置済みセル)ができます。クリックで詳細編集。右上のドットは表情(緑=上機嫌／灰=普通／金=疲れ気味／朱=不満)。
      </p>
    </div>
  );
}
