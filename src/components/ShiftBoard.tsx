import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, History, Plus, Sparkles } from 'lucide-react';
import { NinjaAvatar } from './NinjaAvatar';
import { PostCoveragePanel } from './PostCoveragePanel';
import { AutoAssignPreviewModal } from './AutoAssignPreviewModal';
import { ShiftOverviewGrid } from './ShiftOverviewGrid';
import { BottomSheet } from './BottomSheet';
import { StaffInfoSheet } from './StaffInfoSheet';
import { FacilityLegend } from './FacilityLegend';
import { PersonalSummaryTable } from './PersonalSummaryTable';
import { FACILITY_COLOR, FACILITIES, capableFacilities, sortEmployeesByFacility } from '../data/facilities';
import { WEEKDAYS } from '../data/constants';
import { SHIFT_PATTERNS } from '../data/shiftPatterns';
import { formatDateJp, todayLocalIso } from '../lib/format';
import { readShiftDragPayload, setShiftDragPayload, type ShiftDragPayload } from '../lib/dragDrop';
import { facilityShortLabel, formatMonthLabel, translateReason, weekdayLabel } from '../lib/i18n';
import { autoAssignShifts } from '../lib/autoAssign';
import { computeCoverageRows } from '../lib/postCoverage';
import { isPhoneViewport } from '../lib/viewport';
import { useAutoScrollOnDrag } from '../hooks/useAutoScrollOnDrag';
import { useTouchDragDrop } from '../hooks/useTouchDragDrop';
import {
  CALENDAR_END_MONTH,
  CALENDAR_END_YEAR,
  CALENDAR_START_MONTH,
  CALENDAR_START_YEAR,
  addMonths,
  datesInMonth,
  defaultView,
} from '../lib/monthGrid';
import { useLabelContext } from '../hooks/LabelContext';
import type { ShiftDraft } from './ShiftEditModal';
import type { NewShiftInput } from '../hooks/useShiftStore';
import type { AutoAssignCandidate, AutoAssignResult } from '../lib/autoAssign';
import type { DailyFinance, Employee, MoodResult, PostRequirements, ShiftEntry } from '../types';

type ViewMode = 'edit' | 'overview' | 'personal';

interface AutoAssignHistoryEntry {
  id: string;
  appliedAt: Date;
  ids: string[];
  count: number;
  undone: boolean;
  undoing: boolean;
}

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
  onApplyAutoAssign: (created: AutoAssignCandidate[]) => Promise<string[]>;
  onUndoAutoAssign: (ids: string[]) => Promise<void>;
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
  onApplyAutoAssign,
  onUndoAutoAssign,
}: ShiftBoardProps) {
  useAutoScrollOnDrag();
  const { locale, employeeName, facilityName, t } = useLabelContext();
  const [view, setView] = useState(defaultView);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [highlightDate, setHighlightDate] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<AutoAssignResult | null>(null);
  const [applying, setApplying] = useState(false);
  const [history, setHistory] = useState<AutoAssignHistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  // スマホは全体が見渡せる俯瞰モードから始める(編集モードは日付が2日分しか見えないため)
  const [viewMode, setViewMode] = useState<ViewMode>(() => (isPhoneViewport() ? 'overview' : 'edit'));
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [infoEmployee, setInfoEmployee] = useState<Employee | null>(null);
  const columnRefs = useRef(new Map<string, HTMLTableCellElement>());
  const boardRef = useRef<HTMLDivElement>(null);

  const dates = datesInMonth(view.year, view.month);

  const sortedEmployees = sortEmployeesByFacility(employees);

  const employeeMap = new Map(employees.map((e) => [e.id, e]));
  const shiftByKey = new Map<string, ShiftEntry>();
  for (const s of shifts) shiftByKey.set(`${s.date}_${s.employeeId}`, s);

  const financeByDate = new Map(finance.map((f) => [f.date, f]));
  const blackDaysInView = dates.filter((d) => financeByDate.get(d)?.isBlack).length;

  // スマホの「ポスト充足状況」1行要約用(この月のシフトが1件も無いときは集計しない)
  const dateSet = new Set(dates);
  const monthHasShifts = shifts.some((s) => dateSet.has(s.date));
  const coverageRows = monthHasShifts ? computeCoverageRows(dates, shifts, postRequirements) : [];
  const coverageCounts = {
    empty: coverageRows.filter((r) => r.status === 'empty').length,
    short: coverageRows.filter((r) => r.status === 'understaffed').length,
    over: coverageRows.filter((r) => r.status === 'overstaffed').length,
  };

  const goMonth = (delta: number) => setView((v) => addMonths(v.year, v.month, delta));

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((n) => (n === message ? null : n)), 4000);
  };

  // 開いた瞬間は月の1日から表示されており、今日の列が右の方に隠れて見えないことがあった。
  // タブを開くたび(このコンポーネントは表示中のタブに応じてマウント/アンマウントされる)、
  // 今日の列が横スクロールの中央に来るよう自動で合わせる。今月が対象期間外にクリップされて
  // いる場合(defaultView参照)は今日の列自体が無いので何もしない。
  useEffect(() => {
    const today = todayLocalIso();
    if (!dates.includes(today)) return;
    columnRefs.current.get(today)?.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectCoverageDate = (date: string) => {
    setHighlightDate(date);
    columnRefs.current.get(date)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    window.setTimeout(() => setHighlightDate((d) => (d === date ? null : d)), 2500);
  };

  // ドラッグで配置・移動・入れ替えをする本体(PCのHTML5ドラッグと、スマホの長押しドラッグの両方から呼ぶ)
  const performDrop = async (payload: ShiftDragPayload, targetEmployee: Employee, targetDate: string) => {
    // スタッフの顔をセルへ: そのスタッフを、セルの日付に所属施設で配置する(セルが誰の行でもよい)
    if (payload.kind === 'staff') {
      const staff = employeeMap.get(payload.employeeId);
      if (!staff) return;
      const existing = shiftByKey.get(`${targetDate}_${staff.id}`);
      const pattern = SHIFT_PATTERNS[staff.mainFacility][0];
      await onAssignShift({
        date: targetDate,
        employeeId: staff.id,
        facility: staff.mainFacility,
        start: existing?.start ?? pattern.start,
        end: existing?.end ?? pattern.end,
        breakMinutes: existing?.breakMinutes ?? pattern.breakMinutes,
        isDesired: existing?.isDesired ?? true,
        note: existing?.facility === staff.mainFacility ? existing.note : undefined,
      });
      showNotice(
        t('shiftBoard.staffDroppedNotice', {
          employee: employeeName(staff),
          date: formatDateJp(targetDate, locale),
          facility: facilityName(staff.mainFacility),
        }),
      );
      return;
    }

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
        showNotice(
          t('shiftBoard.unfamiliarNotice', {
            employee: employeeName(targetEmployee),
            facility: facilityName(payload.facility),
          }),
        );
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
        t('shiftBoard.swapNotice', {
          a: sourceEmployee ? employeeName(sourceEmployee) : '',
          b: employeeName(targetEmployee),
        }),
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

  const handleDropOnCell = async (targetEmployee: Employee, targetDate: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCell(null);
    const payload = readShiftDragPayload(e);
    if (!payload) return;
    await performDrop(payload, targetEmployee, targetDate);
  };

  // スマホ: スタッフの顔や配置済みのマスを、長押ししてからドラッグ
  const { ghost } = useTouchDragDrop({
    containerRef: boardRef,
    onHover: setDragOverCell,
    onDrop: (payload, target) => {
      const targetEmployee = employeeMap.get(target.employeeId);
      if (targetEmployee) void performDrop(payload, targetEmployee, target.date);
    },
  });

  const handleOpenAutoAssignPreview = () => {
    const result = autoAssignShifts(employees, shifts, postRequirements, dates);
    setPreviewResult(result);
  };

  const handleConfirmAutoAssign = async () => {
    if (!previewResult) return;
    setApplying(true);
    try {
      const ids = await onApplyAutoAssign(previewResult.created);
      setHistory((prev) => [
        { id: `${Date.now()}`, appliedAt: new Date(), ids, count: previewResult.created.length, undone: false, undoing: false },
        ...prev,
      ]);
      showNotice(t('autoAssign.appliedNotice', { n: previewResult.created.length }));
      setPreviewResult(null);
    } finally {
      setApplying(false);
    }
  };

  const handleUndoAutoAssign = async (entryId: string) => {
    const entry = history.find((h) => h.id === entryId);
    if (!entry || entry.undone || entry.undoing) return;
    setHistory((prev) => prev.map((h) => (h.id === entryId ? { ...h, undoing: true } : h)));
    await onUndoAutoAssign(entry.ids);
    setHistory((prev) => prev.map((h) => (h.id === entryId ? { ...h, undone: true, undoing: false } : h)));
    showNotice(t('autoAssign.undoneNotice', { n: entry.count }));
  };

  return (
    <div ref={boardRef} className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <div className="flex items-center justify-between gap-2 sm:justify-start">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goMonth(-1)}
            disabled={view.year === CALENDAR_START_YEAR && view.month === CALENDAR_START_MONTH}
            className="rounded-full border border-paper/20 p-1.5 text-paper-dim transition hover:border-gold hover:text-gold disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="font-mincho text-base font-bold text-paper">{formatMonthLabel(view.year, view.month, locale)}</p>
          <button
            type="button"
            onClick={() => goMonth(1)}
            disabled={view.year === CALENDAR_END_YEAR && view.month === CALENDAR_END_MONTH}
            className="rounded-full border border-paper/20 p-1.5 text-paper-dim transition hover:border-gold hover:text-gold disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="rounded-full border border-jade/40 bg-jade/10 px-3 py-1.5 text-xs text-jade sm:hidden">
          {t('shiftBoard.blackDaysShort', { black: blackDaysInView, total: dates.length })}
        </div>
        </div>
        <div className="relative flex items-center gap-2 sm:flex-wrap">
          <div className="flex flex-1 items-center gap-1 rounded-full border border-paper/15 bg-void/40 p-0.5 text-xs sm:text-[11px] sm:flex-none">
            {(
              [
                ['edit', t('viewMode.edit')],
                ['overview', t('viewMode.overview')],
                ['personal', t('viewMode.personal')],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`flex-1 rounded-full px-2.5 py-1 transition sm:flex-none ${
                  viewMode === mode ? 'bg-gold/20 text-gold' : 'text-paper-dim hover:text-paper'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {viewMode === 'edit' && (
            <button
              type="button"
              onClick={handleOpenAutoAssignPreview}
              aria-label={t('shiftBoard.autoAssign')}
              title={t('shiftBoard.autoAssign')}
              className="flex items-center justify-center gap-1.5 rounded-full border border-gold/50 px-3 py-1.5 text-xs text-gold transition hover:bg-gold/10"
            >
              <Sparkles size={13} />
              <span className="hidden sm:inline">{t('shiftBoard.autoAssign')}</span>
            </button>
          )}
          {viewMode === 'edit' && history.length > 0 && (
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              aria-label={t('autoAssign.historyHeading')}
              title={t('autoAssign.historyHeading')}
              className="flex items-center justify-center gap-1.5 rounded-full border border-paper/20 px-3 py-1.5 text-xs text-paper-dim transition hover:border-gold hover:text-gold"
            >
              <History size={13} />
              <span className="hidden sm:inline">{t('autoAssign.historyHeading')}</span>
            </button>
          )}
          {viewMode === 'edit' && historyOpen && history.length > 0 && (
            <div className="absolute right-0 top-full z-30 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl sm:w-72 border border-paper/15 bg-void-soft p-3 shadow-2xl">
              <p className="mb-2 text-xs font-medium text-paper">{t('autoAssign.historyHeading')}</p>
              <div className="space-y-1.5">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-paper/10 bg-void/40 px-2.5 py-1.5 text-xs sm:text-[11px]"
                  >
                    <span className={entry.undone ? 'text-paper-dim/50 line-through' : 'text-paper-dim'}>
                      {t('autoAssign.historyEntry', {
                        time: entry.appliedAt.toLocaleTimeString(locale === 'ja' ? 'ja-JP' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        }),
                        n: entry.count,
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUndoAutoAssign(entry.id)}
                      disabled={entry.undone || entry.undoing}
                      className="shrink-0 rounded-md border border-seal/40 px-2 py-0.5 text-seal-bright transition hover:bg-seal/10 disabled:opacity-40"
                    >
                      {entry.undone ? t('autoAssign.undone') : entry.undoing ? t('autoAssign.undoing') : t('autoAssign.undo')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="hidden items-center gap-2 rounded-full border border-jade/40 bg-jade/10 px-3 py-1.5 text-xs text-jade sm:flex">
            {t('shiftBoard.blackDays', { black: blackDaysInView, total: dates.length })}
          </div>
        </div>
      </div>

      {viewMode !== 'personal' && notice && (
        // スマホでは画面の下(下タブの上)に浮かせる。表の上に挟むと、出入りのたびに表が上下にずれて、
        // 続けてドラッグ・タップするときに位置がずれるため。PCは今までどおり表の上
        <div
          role="status"
          className="animate-rise rounded-lg border border-gold/50 px-4 py-2 text-xs text-gold shadow-2xl max-sm:fixed max-sm:inset-x-4 max-sm:bottom-[calc(4.5rem+env(safe-area-inset-bottom))] max-sm:z-40 max-sm:bg-void-soft sm:bg-gold/10 sm:shadow-none"
        >
          {notice}
        </div>
      )}

      {(viewMode === 'overview' || viewMode === 'edit') && <FacilityLegend />}

      {viewMode === 'edit' && (
        <button
          type="button"
          onClick={() => setCoverageOpen(true)}
          aria-haspopup="dialog"
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-paper/15 bg-void-soft/50 px-3 text-left text-xs text-paper sm:hidden"
        >
          <span>
            {!monthHasShifts
              ? t('coverage.noShiftsThisMonth')
              : coverageCounts.empty + coverageCounts.short + coverageCounts.over === 0
                ? t('coverage.mobileSummaryOk')
                : t('coverage.mobileSummary', coverageCounts)}
          </span>
          <ChevronRight size={16} className="shrink-0 text-paper-dim" />
        </button>
      )}

      {viewMode === 'overview' && (
        <ShiftOverviewGrid
          highlightCell={dragOverCell}
          employees={employees}
          shifts={shifts}
          postRequirements={postRequirements}
          dates={dates}
          onEditShift={onEditShift}
          onCreateShift={onCreateShift}
        />
      )}

      {viewMode === 'personal' && <PersonalSummaryTable employees={employees} shifts={shifts} dates={dates} />}

      {viewMode === 'edit' && (
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div data-dnd-scroll className="max-h-[70vh] flex-1 overflow-auto rounded-xl border border-paper/10">
          <table className="border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-30 min-w-[96px] border-b border-r border-paper/10 bg-void-soft px-2 py-2 text-left font-medium text-paper-dim sm:min-w-[210px]">
                  {t('shiftBoard.staffHeader')}
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
                      className={`sticky top-0 z-20 min-w-[76px] border-b border-r border-paper/10 px-1 py-2 text-center font-medium text-paper transition-colors ${
                        highlightDate === date ? 'bg-gold/20' : 'bg-void-soft'
                      }`}
                    >
                      <span
                        className={`mx-auto mb-0.5 block h-1.5 w-1.5 rounded-full ${
                          dayFinance?.isBlack ? 'bg-jade' : 'bg-seal'
                        }`}
                      />
                      {formatDateJp(date, locale)}
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
                      {/* スマホ: 顔+名前だけの細い列。名前を押すと、希望・対応施設の窓が出る */}
                      <button
                        type="button"
                        data-compact
                        data-dnd="staff"
                        data-employee-id={emp.id}
                        data-dnd-label={employeeName(emp)}
                        onClick={() => setInfoEmployee(emp)}
                        aria-label={t('staffInfo.heading', { name: employeeName(emp) })}
                        className="flex w-full flex-col items-center gap-0.5 text-center sm:hidden"
                      >
                        <NinjaAvatar employee={emp} mood="neutral" size="xs" />
                        <span className="max-w-full truncate text-xs font-medium text-paper">{employeeName(emp)}</span>
                      </button>
                      <div
                        className="hidden items-center gap-2 sm:flex"
                        draggable
                        onDragStart={(e) => setShiftDragPayload(e, { kind: 'staff', employeeId: emp.id })}
                      >
                        <NinjaAvatar employee={emp} mood="neutral" size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-paper">{employeeName(emp)}</p>
                          <p className="text-xs sm:text-[10px] text-paper-dim">
                            {t('shiftBoard.desiredWorkAndMax', { days: emp.desiredWorkDaysPerWeek, max: emp.maxConsecutiveDays })}
                          </p>
                        </div>
                      </div>

                      <div className="mt-1.5 hidden gap-[3px] sm:flex">
                        {WEEKDAYS.map((day) => {
                          const isOff = emp.desiredDaysOff.includes(day);
                          const dayLabel = weekdayLabel(day, locale);
                          return (
                            <span
                              key={day}
                              title={isOff ? t('shiftBoard.offWeekdayTitle', { day: dayLabel }) : dayLabel}
                              className={`flex h-4 w-4 items-center justify-center rounded-sm text-xs sm:text-[9px] ${
                                isOff ? 'bg-seal/25 text-seal-bright' : 'bg-void text-paper-dim/60'
                              }`}
                            >
                              {locale === 'ja' ? day : dayLabel.slice(0, 1)}
                            </span>
                          );
                        })}
                      </div>

                      <div className="mt-1.5 hidden flex-wrap gap-1 sm:flex">
                        {capable.map((f) => {
                          const isMain = f === emp.mainFacility;
                          return (
                            <span
                              key={f}
                              draggable
                              onDragStart={(e) => setShiftDragPayload(e, { kind: 'facility', employeeId: emp.id, facility: f })}
                              title={
                                isMain
                                  ? t('shiftBoard.mainFacilityBadge', { facility: facilityName(f) })
                                  : t('shiftBoard.helpFacilityBadge', { facility: facilityName(f) })
                              }
                              className={`cursor-grab select-none rounded-full px-1.5 py-[1px] text-xs sm:text-[9px] transition active:cursor-grabbing ${
                                isMain ? 'text-void' : 'border border-dashed text-paper-dim'
                              }`}
                              style={
                                isMain
                                  ? { background: FACILITY_COLOR[f] }
                                  : { borderColor: FACILITY_COLOR[f], color: FACILITY_COLOR[f] }
                              }
                            >
                              {facilityShortLabel(f, FACILITIES[f].shortName, locale)}
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
                            data-drop-cell
                            data-employee-id={emp.id}
                            data-date={date}
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
                              data-compact
                              onClick={() => onCreateShift({ mode: 'create', date, facility: emp.mainFacility, employeeId: emp.id })}
                              className="flex h-[92px] sm:h-[76px] w-full items-center justify-center rounded-sm border border-dashed border-paper/10 text-paper-dim/0 transition hover:border-gold/50 hover:text-gold"
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
                          data-drop-cell
                          data-employee-id={emp.id}
                          data-date={date}
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
                            data-compact
                            data-dnd="shift"
                            data-shift-id={shift.id}
                            data-dnd-label={`${employeeName(emp)} ${shift.start}–${shift.end}`}
                            draggable
                            onDragStart={(e) => setShiftDragPayload(e, { kind: 'shift', shiftId: shift.id })}
                            onClick={() => onEditShift(shift)}
                            title={`${facilityName(shift.facility)} ${shift.start}–${shift.end}${
                              mood ? ` / ${mood.reasons.map((r) => translateReason(r, locale)).join(' / ')}` : ''
                            }`}
                            className="relative flex h-[92px] sm:h-[76px] w-full cursor-grab flex-col items-center justify-between rounded-sm border-l-4 bg-void/60 px-0.5 py-1 transition active:cursor-grabbing hover:brightness-125"
                            style={{ borderLeftColor: FACILITY_COLOR[shift.facility] }}
                          >
                            {/* 上: 顔(表情・応援バッジつき) / 中: 勤務時間 / 下: 配置した施設 */}
                            <NinjaAvatar employee={emp} mood={mood?.mood ?? 'neutral'} facility={shift.facility} size="xs" />
                            {/* PCは1行、スマホは2行(12px以上を保つため) */}
                            <span className="flex flex-col items-center whitespace-nowrap text-xs leading-tight text-paper-dim sm:block sm:text-[10px] sm:leading-none">
                              <span>{shift.start}</span>
                              <span className="hidden sm:inline">–</span>
                              <span>{shift.end}</span>
                            </span>
                            <span
                              className="max-w-full truncate rounded-full px-1.5 py-[1px] text-[10px] font-medium leading-tight text-void max-sm:text-xs"
                              style={{ background: FACILITY_COLOR[shift.facility] }}
                            >
                              {facilityShortLabel(shift.facility, FACILITIES[shift.facility].shortName, locale)}
                            </span>
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

        <div className="hidden sm:contents">
          <PostCoveragePanel dates={dates} shifts={shifts} postRequirements={postRequirements} onSelectDate={handleSelectCoverageDate} />
        </div>
      </div>
      )}

      {viewMode === 'edit' && <p className="hidden text-xs sm:text-[11px] text-paper-dim sm:block">{t('shiftBoard.legend')}</p>}
      {viewMode !== 'personal' && <p className="text-xs text-paper-dim sm:hidden">{t('shiftBoard.legendMobile')}</p>}

      {coverageOpen && (
        <BottomSheet title={t('coverage.heading')} onClose={() => setCoverageOpen(false)}>
          <PostCoveragePanel
            hideHeading
            dates={dates}
            shifts={shifts}
            postRequirements={postRequirements}
            onSelectDate={(date) => {
              setCoverageOpen(false);
              handleSelectCoverageDate(date);
            }}
          />
        </BottomSheet>
      )}

      {infoEmployee && <StaffInfoSheet employee={infoEmployee} onClose={() => setInfoEmployee(null)} />}

      {/* ドラッグ中(スマホ)に、指のそばに出す名前 */}
      {ghost && (
        <div
          className="pointer-events-none fixed z-[70] -translate-x-1/2 -translate-y-[140%] whitespace-nowrap rounded-full border border-gold bg-void-soft px-3 py-1 text-xs font-medium text-gold shadow-2xl"
          style={{ left: ghost.x, top: ghost.y }}
        >
          {ghost.label}
        </div>
      )}

      {previewResult && (
        <AutoAssignPreviewModal
          result={previewResult}
          employees={employees}
          applying={applying}
          onConfirm={handleConfirmAutoAssign}
          onCancel={() => setPreviewResult(null)}
        />
      )}
    </div>
  );
}
