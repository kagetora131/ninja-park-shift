import { useMemo, useState } from 'react';
import { CalendarDays, TableProperties, Wallet } from 'lucide-react';
import { Header } from './components/Header';
import { TabNav, type TabDef } from './components/TabNav';
import { RosterView } from './components/RosterView';
import { ShiftBoard } from './components/ShiftBoard';
import { FinanceDashboard } from './components/FinanceDashboard';
import { ShiftEditModal, type ShiftDraft } from './components/ShiftEditModal';
import { useShiftStore } from './hooks/useShiftStore';
import type { FacilityId, ShiftEntry } from './types';

const TABS: TabDef[] = [
  { id: 'roster', label: '忍者名簿', icon: CalendarDays },
  { id: 'board', label: 'シフト表', icon: TableProperties },
  { id: 'finance', label: '収支', icon: Wallet },
];

export default function App() {
  const { employees, finance, shifts, moodMap, upsertShift, removeShift, resetToDummyData } = useShiftStore();
  const [activeTab, setActiveTab] = useState('roster');
  const [draft, setDraft] = useState<ShiftDraft | null>(null);

  const dates = useMemo(() => finance.map((f) => f.date), [finance]);
  const [selectedDate, setSelectedDate] = useState(dates[0] ?? '');

  const handleEditShift = (shift: ShiftEntry) => {
    setDraft({ mode: 'edit', date: shift.date, facility: shift.facility, existingShift: shift });
  };

  const handleAddShift = (date: string, facility: FacilityId) => {
    setDraft({ mode: 'create', date, facility });
  };

  const handleReset = () => {
    if (window.confirm('編集したシフトを破棄して、初期のダミーデータに戻しますか？')) {
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
            employees={employees}
            shifts={shifts}
            moodMap={moodMap}
            finance={finance}
            onEditShift={handleEditShift}
            onAddShift={handleAddShift}
          />
        )}

        {activeTab === 'finance' && <FinanceDashboard finance={finance} />}
      </main>

      {draft && (
        <ShiftEditModal
          draft={draft}
          employees={employees}
          onClose={() => setDraft(null)}
          onSave={upsertShift}
          onDelete={removeShift}
        />
      )}
    </div>
  );
}
