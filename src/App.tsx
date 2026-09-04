import { useState } from 'react';
import { CalendarDays, ClipboardList, Languages, TableProperties, UserCog, Users, Wallet } from 'lucide-react';
import { Header } from './components/Header';
import { TabNav, type TabDef } from './components/TabNav';
import { ShiftBoard } from './components/ShiftBoard';
import { StaffView } from './components/StaffView';
import { FinanceDashboard } from './components/FinanceDashboard';
import { PostRequirementEditor } from './components/PostRequirementEditor';
import { LabelManagerView } from './components/LabelManagerView';
import { MyShiftsView } from './components/MyShiftsView';
import { MyPreferencesView } from './components/MyPreferencesView';
import { LoginPage } from './components/LoginPage';
import { ShiftEditModal, type ShiftDraft } from './components/ShiftEditModal';
import { EmployeeEditModal, type EmployeeDraft } from './components/EmployeeEditModal';
import { FinanceEditModal, type FinanceDraft } from './components/FinanceEditModal';
import { useShiftStore } from './hooks/useShiftStore';
import { useAuth } from './hooks/useAuth';
import { LabelProvider, useLabelContext } from './hooks/LabelContext';
import { autoAssignShifts } from './lib/autoAssign';
import { useLocale } from './hooks/useLocale';
import { t } from './lib/i18n';
import type { Employee, Profile, ShiftEntry } from './types';

function useManagerTabs(): TabDef[] {
  const { t } = useLabelContext();
  return [
    { id: 'board', label: t('tab.board'), icon: TableProperties },
    { id: 'staff', label: t('tab.staff'), icon: Users },
    { id: 'finance', label: t('tab.finance'), icon: Wallet },
    { id: 'posts', label: t('tab.posts'), icon: ClipboardList },
    { id: 'labels', label: t('tab.labels'), icon: Languages },
  ];
}

function useEmployeeTabs(): TabDef[] {
  const { t } = useLabelContext();
  return [
    { id: 'myShifts', label: t('tab.myShifts'), icon: CalendarDays },
    { id: 'myPreferences', label: t('tab.myPreferences'), icon: UserCog },
  ];
}

function ManagerApp() {
  const {
    employees,
    finance,
    shifts,
    moodMap,
    wageSettings,
    postRequirements,
    upsertShift,
    removeShift,
    bulkUpsertShifts,
    upsertEmployee,
    removeEmployee,
    updateFacilityRevenue,
    updateFacilityRate,
    updateTraineeHourlyWage,
    updateFulltimeMonthlySalary,
    updatePostRequirement,
  } = useShiftStore();
  const { t } = useLabelContext();
  const managerTabs = useManagerTabs();
  const [activeTab, setActiveTab] = useState('board');
  const [shiftDraft, setShiftDraft] = useState<ShiftDraft | null>(null);
  const [employeeDraft, setEmployeeDraft] = useState<EmployeeDraft | null>(null);
  const [financeDraft, setFinanceDraft] = useState<FinanceDraft | null>(null);

  const handleEditShift = (shift: ShiftEntry) => {
    setShiftDraft({ mode: 'edit', date: shift.date, facility: shift.facility, existingShift: shift });
  };

  const handleAutoAssign = async (dates: string[]) => {
    const result = autoAssignShifts(employees, shifts, postRequirements, dates);
    await bulkUpsertShifts(result.created);
    return result;
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
        ? t('employeeModal.confirmDeleteWithShifts', { count: shiftCount })
        : t('employeeModal.confirmDelete');
    if (window.confirm(message)) {
      removeEmployee(id);
    }
  };

  return (
    <>
      <TabNav tabs={managerTabs} active={activeTab} onChange={setActiveTab} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {activeTab === 'board' && (
          <ShiftBoard
            employees={employees}
            shifts={shifts}
            moodMap={moodMap}
            finance={finance}
            postRequirements={postRequirements}
            onEditShift={handleEditShift}
            onCreateShift={setShiftDraft}
            onAssignShift={upsertShift}
            onRemoveShift={removeShift}
            onAutoAssign={handleAutoAssign}
          />
        )}

        {activeTab === 'staff' && (
          <StaffView employees={employees} onEdit={handleEditEmployee} onCreate={handleCreateEmployee} />
        )}

        {activeTab === 'finance' && <FinanceDashboard finance={finance} onEditFacility={setFinanceDraft} />}

        {activeTab === 'posts' && (
          <PostRequirementEditor
            wageSettings={wageSettings}
            postRequirements={postRequirements}
            onChangeFacilityRate={updateFacilityRate}
            onChangeTraineeHourlyWage={updateTraineeHourlyWage}
            onChangeFulltimeMonthlySalary={updateFulltimeMonthlySalary}
            onChangePostRequirement={updatePostRequirement}
          />
        )}

        {activeTab === 'labels' && <LabelManagerView />}
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
        <FinanceEditModal draft={financeDraft} onClose={() => setFinanceDraft(null)} onSave={updateFacilityRevenue} />
      )}
    </>
  );
}

function EmployeeApp({ profile }: { profile: Profile }) {
  const { employees, employeeMap, shifts, moodMap, refetchEmployees } = useShiftStore();
  const { t } = useLabelContext();
  const employeeTabs = useEmployeeTabs();
  const [activeTab, setActiveTab] = useState('myShifts');
  const employee = profile.employeeId ? employeeMap.get(profile.employeeId) : undefined;

  if (!employee) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 text-center text-sm text-paper-dim">
        {t('app.noEmployeeLinked')}
      </main>
    );
  }

  return (
    <>
      <TabNav tabs={employeeTabs} active={activeTab} onChange={setActiveTab} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {activeTab === 'myShifts' && (
          <MyShiftsView employee={employee} employees={employees} shifts={shifts} moodMap={moodMap} />
        )}
        {activeTab === 'myPreferences' && (
          <MyPreferencesView employee={employee} onSaved={refetchEmployees} />
        )}
      </main>
    </>
  );
}

export default function App() {
  const { loading, isAuthenticated, session, profile, error, signIn, signOut } = useAuth();

  return (
    <AppShell
      loading={loading}
      isAuthenticated={isAuthenticated}
      email={session?.user.email}
      profile={profile}
      error={error}
      onSignIn={signIn}
      onSignOut={signOut}
    />
  );
}

interface AppShellProps {
  loading: boolean;
  isAuthenticated: boolean;
  email: string | undefined;
  profile: Profile | null;
  error: string | null;
  onSignIn: (email: string, password: string) => Promise<boolean>;
  onSignOut: () => void;
}

function AppShell({ loading, isAuthenticated, email, profile, error, onSignIn, onSignOut }: AppShellProps) {
  const { locale } = useLocale();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-paper-dim">
        {t('app.loading', locale)}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onSignIn={onSignIn} error={error} />;
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-paper-dim">
        {t('app.profileFetchFailed', locale)}
      </div>
    );
  }

  return (
    <LabelProvider>
      <div className="min-h-screen pb-16">
        <Header role={profile.role} email={email} onSignOut={onSignOut} />
        {profile.role === 'manager' ? <ManagerApp /> : <EmployeeApp profile={profile} />}
      </div>
    </LabelProvider>
  );
}
