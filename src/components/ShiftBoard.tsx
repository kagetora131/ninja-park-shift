import { useState } from 'react';
import { TrendingDown, TrendingUp, X } from 'lucide-react';
import { NinjaAvatar } from './NinjaAvatar';
import { DateTabs } from './DateTabs';
import { CoverageStrip } from './CoverageStrip';
import { ShiftRosterPanel } from './ShiftRosterPanel';
import { FACILITY_ORDER, capableFacilities } from '../data/facilities';
import { SHIFT_PATTERNS } from '../data/shiftPatterns';
import { formatYen, weekdayJp } from '../lib/format';
import { MOOD_LABEL } from '../lib/mood';
import { EMPLOYEE_DRAG_MIME } from '../lib/dragDrop';
import { useAutoScrollOnDrag } from '../hooks/useAutoScrollOnDrag';
import { useLabelContext } from '../hooks/LabelContext';
import type { NewShiftInput } from '../hooks/useShiftStore';
import type { DailyFinance, Employee, FacilityId, MoodResult, PostRequirements, ShiftEntry } from '../types';

interface ShiftBoardProps {
  dates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  employees: Employee[];
  shifts: ShiftEntry[];
  moodMap: Map<string, MoodResult>;
  finance: DailyFinance[];
  postRequirements: PostRequirements;
  onEditShift: (shift: ShiftEntry) => void;
  onAssignShift: (input: NewShiftInput) => void;
  onRemoveShift: (id: string) => void;
}

export function ShiftBoard({
  dates,
  selectedDate,
  onSelectDate,
  employees,
  shifts,
  moodMap,
  finance,
  postRequirements,
  onEditShift,
  onAssignShift,
  onRemoveShift,
}: ShiftBoardProps) {
  useAutoScrollOnDrag();
  const { employeeName, facilityName } = useLabelContext();
  const [draggingEmployeeId, setDraggingEmployeeId] = useState<string | null>(null);
  const [dragOverFacility, setDragOverFacility] = useState<FacilityId | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const employeeMap = new Map(employees.map((e) => [e.id, e]));
  const shiftsForDate = shifts.filter((s) => s.date === selectedDate);
  const selectedDay = weekdayJp(selectedDate);
  const todayFinance = finance.find((f) => f.date === selectedDate);
  const draggingEmployee = draggingEmployeeId ? employeeMap.get(draggingEmployeeId) : null;

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((n) => (n === message ? null : n)), 3200);
  };

  const handleDrop = (facility: FacilityId, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverFacility(null);
    const employeeId = e.dataTransfer.getData(EMPLOYEE_DRAG_MIME);
    setDraggingEmployeeId(null);
    const employee = employeeMap.get(employeeId);
    if (!employee) return;

    const existing = shifts.find((s) => s.employeeId === employeeId && s.date === selectedDate);
    const pattern = SHIFT_PATTERNS[facility][0];
    onAssignShift({
      date: selectedDate,
      employeeId,
      facility,
      start: existing?.start ?? pattern.start,
      end: existing?.end ?? pattern.end,
      breakMinutes: existing?.breakMinutes ?? pattern.breakMinutes,
      isDesired: existing?.isDesired ?? true,
      note: existing?.facility === facility ? existing.note : undefined,
    });

    if (!capableFacilities(employee).includes(facility)) {
      showNotice(`${employeeName(employee)}は${facilityName(facility)}が未経験です。無理のないシフトか確認しましょう。`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateTabs
          dates={dates}
          value={selectedDate}
          onChange={onSelectDate}
          dotColorFor={(date) => {
            const f = finance.find((day) => day.date === date);
            return f?.isBlack ? 'var(--color-jade)' : 'var(--color-seal)';
          }}
        />
        {todayFinance && (
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
              todayFinance.isBlack
                ? 'border-jade/60 bg-jade/10 text-jade'
                : 'border-seal/60 bg-seal/10 text-seal-bright'
            }`}
          >
            {todayFinance.isBlack ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            本日{todayFinance.isBlack ? '黒字' : '赤字'}見込み：{formatYen(todayFinance.profit)}
          </div>
        )}
      </div>

      {notice && (
        <div className="animate-rise rounded-lg border border-gold/50 bg-gold/10 px-4 py-2 text-xs text-gold">
          {notice}
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <ShiftRosterPanel
          employees={employees}
          day={selectedDay}
          shiftsToday={shiftsForDate}
          onDragStartEmployee={setDraggingEmployeeId}
          onDragEndEmployee={() => {
            setDraggingEmployeeId(null);
            setDragOverFacility(null);
          }}
        />

        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          {FACILITY_ORDER.map((facility) => {
            const facilityShifts = shiftsForDate
              .filter((s) => s.facility === facility)
              .sort((a, b) => a.start.localeCompare(b.start));
            const required = postRequirements[selectedDay]?.[facility];
            const isUnderStaffed = required != null && facilityShifts.length < required;

            const isDropTargetKnown = !!draggingEmployee;
            const isMain = draggingEmployee?.mainFacility === facility;
            const isCrossTrained = draggingEmployee?.crossTrained.includes(facility) ?? false;
            const isUnfamiliar = isDropTargetKnown && !isMain && !isCrossTrained;

            let ringClass = 'border-paper/10';
            if (isDropTargetKnown) {
              if (isMain) ringClass = 'border-gold';
              else if (isCrossTrained) ringClass = 'border-jade';
              else if (isUnfamiliar) ringClass = 'border-seal/70 border-dashed';
            }
            if (dragOverFacility === facility) ringClass += ' bg-void/60 shadow-[0_0_0_2px_var(--color-gold)]';

            return (
              <div
                key={facility}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverFacility(facility);
                }}
                onDragLeave={() => setDragOverFacility((f) => (f === facility ? null : f))}
                onDrop={(e) => handleDrop(facility, e)}
                className={`flex flex-col rounded-xl border-2 bg-void-soft/50 p-3 transition-colors ${ringClass}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-mincho text-sm font-bold text-paper">{facilityName(facility)}</h3>
                  <span className={`text-[11px] ${isUnderStaffed ? 'font-medium text-seal-bright' : 'text-paper-dim'}`}>
                    {facilityShifts.length}
                    {required != null ? ` / ${required}` : ''}名
                  </span>
                </div>

                <CoverageStrip facilityShifts={facilityShifts} required={required} />

                <div className="min-h-[80px] flex-1 space-y-2">
                  {facilityShifts.length === 0 && (
                    <p className="rounded-lg border border-dashed border-paper/15 py-6 text-center text-xs text-paper-dim/70">
                      ここに忍者をドロップ
                    </p>
                  )}
                  {facilityShifts.map((shift) => {
                    const employee = employeeMap.get(shift.employeeId);
                    if (!employee) return null;
                    const mood = moodMap.get(shift.id);
                    return (
                      <div
                        key={shift.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(EMPLOYEE_DRAG_MIME, employee.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggingEmployeeId(employee.id);
                        }}
                        onDragEnd={() => {
                          setDraggingEmployeeId(null);
                          setDragOverFacility(null);
                        }}
                        onClick={() => onEditShift(shift)}
                        title={mood?.reasons.join(' / ')}
                        className="flex cursor-grab items-center gap-2 rounded-lg border border-paper/15 bg-void/50 p-1.5 pr-2 text-left transition active:cursor-grabbing hover:border-gold"
                      >
                        <NinjaAvatar employee={employee} mood={mood?.mood ?? 'neutral'} facility={facility} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-paper">{employeeName(employee)}</p>
                          <p className="text-[10px] text-paper-dim">
                            {shift.start}–{shift.end} ・{mood ? MOOD_LABEL[mood.mood] : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveShift(shift.id);
                          }}
                          title="配置を解除"
                          className="shrink-0 rounded-full p-1 text-paper-dim transition hover:bg-seal/20 hover:text-seal-bright"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
