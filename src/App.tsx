import { useMemo, useState } from 'react';
import { CalendarDays, TableProperties, Users, Wallet } from 'lucide-react';
import { Header } from './components/Header';
import { TabNav, type TabDef } from './components/TabNav';
import { RosterView } from './components/RosterView';
import { ShiftBoard } from './components/ShiftBoard';
import { StaffView } from './components/StaffView';
import { FinanceDashboard } from './components/FinanceDashboard';
import { ShiftEditModal, type ShiftDraft } from './components/ShiftEditModal';
import { EmployeeEditModal, type EmployeeDraft } from './components/EmployeeEditModal';
import { FinanceEditModal, type FinanceDraft } from './components/FinanceEditModal';
import { useShiftStore } from './hooks/useShiftStore';
import type { Employee, FacilityId, ShiftEntry } from './types';

const TABS: TabDef[] = [
  { id: 'roster', label: '忍者名簿', icon: CalendarDays },
  { id: 'board', label: 'シフト表', icon: TableProperties },
  { id: 'staff', label: 'スタッフ管理', icon: Users },
  { id: 'finance', label: '収支', icon: Wallet },
];

export default function App() {
  const {
    employees,
    finance,
    shifts,
    moodMap,
    upsertShift,
    removeShift,
    upsertEmployee,
    removeEmployee,
    updateFacilityFinance,
    resetToDummyData,
  } = useShiftStore();
  const [activeTab, setActiveTab] = useState('roster');
  const [shiftDraft, setShiftDraft] = useState<ShiftDraft | null>(null);
  const [employeeDraft, setEmployeeDraft] = useState<EmployeeDraft | null>(null);
  const [financeDraft, setFinanceDraft] = useState<FinanceDraft | null>(null);

  const dates = useMemo(() => finance.map((f) => f.date), [finance]);
  const [selectedDate, setSelectedDate] = useState(dates[0] ?? '');

  const handleEditShift = (shift: ShiftEntry) => {
    setShiftDraft({ mode: 'edit', date: shift.date, facility: shift.facility, existingShift: shift });
  };

  const handleAddShift = (date: string, facility: FacilityId) => {
    setShiftDraft({ mode: 'create', date, facility });
  };

  const handleEditEmployee = (employee: Employee) => {
    setEmployeeDraft({ mode: 'edit', employee });
  };

  const handleCreateEmployee = () => {
    setEmployeeDraft({ mode: 'create' });
  };

  const handleDeleteEmployee = (id: string) => {
    const shiftCount = shifts.filter((s) => s.employeeId === id).length;
    const message =
      shiftCount > 0
        ? `この忍者を退職させますか？割り当て済みのシフト${shiftCount}件も一緒に削除されます。`
        : 'この忍者を退職させますか？';
    if (window.confirm(message)) {
      removeEmployee(id);
    }
  };

  const handleReset = () => {
    if (window.confirm('編集した内容(シフト・スタッフ・売上)をすべて破棄して、初期のダミーデータに戻しますか？')) {
      resetToDummyData();
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <Header onReset={handleReset} />
      <TabNav tabs={TABS} active={activeTab} onChange={setActiveTab} />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {activeTab === 'roster' && (
          <RosterView
            dates={dates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            employees={employees}
            shifts={shifts}
            moodMap={moodMap}
            finance={finance}
            onEditShift={handleEditShift}
            onAddShift={handleAddShift}
          />
        )}

        {activeTab === 'board' && (
          <ShiftBoard
            dates={dates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            employees={employees}
            shifts={shifts}
            moodMap={moodMap}
            finance={finance}
            onEditShift={handleEditShift}
            onAssignShift={upsertShift}
            onRemoveShift={removeShift}
          />
        )}

        {activeTab === 'staff' && (
          <StaffView employees={employees} onEdit={handleEditEmployee} onCreate={handleCreateEmployee} />
        )}

        {activeTab === 'finance' && (
          <FinanceDashboard finance={finance} onEditFacility={setFinanceDraft} />
        )}
      </main>

      {shiftDraft && (
        <ShiftEditModal
          draft={shiftDraft}
          employees={employees}
          onClose={() => setShiftDraft(null)}
          onSave={upsertShift}
          onDelete={removeShift}
        />
      )}

      {employeeDraft && (
        <EmployeeEditModal
          draft={employeeDraft}
          onClose={() => setEmployeeDraft(null)}
          onSave={upsertEmployee}
          onDelete={handleDeleteEmployee}
        />
      )}

      {financeDraft && (
        <FinanceEditModal
          draft={financeDraft}
          onClose={() => setFinanceDraft(null)}
          onSave={updateFacilityFinance}
        />
      )}
    </div>
  );
}
