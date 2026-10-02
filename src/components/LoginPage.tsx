import { useState } from 'react';
import { GraduationCap, LogIn, ShieldHalf, Swords } from 'lucide-react';
import { useLocale } from '../hooks/useLocale';
import { t } from '../lib/i18n';
import { FACILITY_COLOR } from '../data/facilities';
import { DEMO_EMPLOYEES, DEMO_MANAGER_EMAIL, DEMO_PASSWORD } from '../data/demoAccounts';
import type { DemoEmployee } from '../data/demoAccounts';

interface LoginPageProps {
  onSignIn: (email: string, password: string) => Promise<boolean>;
  error: string | null;
}

const ROLE_KEY = {
  staff: 'login.roleStaff',
  parttime: 'login.roleParttime',
  arubaito: 'login.roleArubaito',
} as const;

export function LoginPage({ onSignIn, error }: LoginPageProps) {
  const { locale, setLocale } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // ログイン処理中のアカウント(メール)。ワンタップ・手入力のどちらでも、処理中は他のボタンを押せなくする。
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const submitting = pendingEmail !== null;

  const signInAs = async (targetEmail: string, targetPassword: string) => {
    if (submitting) return;
    setPendingEmail(targetEmail);
    await onSignIn(targetEmail, targetPassword);
    setPendingEmail(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void signInAs(email.trim(), password);
  };

  const facilityLabel = (id: DemoEmployee['mainFacility']) => t(`login.facility.${id}`, locale);

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-8">
      <div className="my-auto w-full max-w-md rounded-xl border border-gold/30 bg-void-soft p-5 shadow-2xl sm:p-6">
        <div className="mb-2 flex justify-end">
          <div className="flex rounded-full border border-paper/20 p-0.5 text-[11px]">
            {(['ja', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                className={`rounded-full px-2.5 py-1 transition ${
                  locale === l ? 'bg-gold/20 text-gold' : 'text-paper-dim hover:text-paper'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 bg-void text-gold">
            <Swords size={22} />
          </div>
          <h1 className="font-mincho text-lg font-bold text-paper">{t('header.appName', locale)}</h1>
          <p className="text-[11px] tracking-widest text-paper-dim">{t('login.quickHeading', locale)}</p>
        </div>

        <p className="mb-3 text-xs leading-relaxed text-paper-dim">{t('login.quickHint', locale)}</p>

        {/* マネージャー(忍者頭領) */}
        <button
          type="button"
          disabled={submitting}
          onClick={() => void signInAs(DEMO_MANAGER_EMAIL, DEMO_PASSWORD)}
          className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-gold bg-gold/10 px-4 py-3 text-left transition hover:bg-gold/20 active:bg-gold/30 disabled:opacity-50"
        >
          <ShieldHalf size={22} className="shrink-0 text-gold" />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-gold">
              {pendingEmail === DEMO_MANAGER_EMAIL ? t('login.submitting', locale) : t('header.roleManager', locale)}
            </span>
            <span className="block text-[11px] leading-snug text-paper-dim">{t('login.managerCaption', locale)}</span>
          </span>
        </button>

        {/* 従業員(立場・所属・研修状況つき) */}
        <h2 className="mb-1 mt-5 text-xs font-bold tracking-wider text-paper">{t('login.employeesHeading', locale)}</h2>
        <p className="mb-2 text-[11px] leading-relaxed text-paper-dim">{t('login.shurikenNote', locale)}</p>
        <ul className="space-y-2">
          {DEMO_EMPLOYEES.map((emp) => (
            <li key={emp.email}>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void signInAs(emp.email, DEMO_PASSWORD)}
                style={{ borderLeftColor: FACILITY_COLOR[emp.mainFacility] }}
                className="w-full rounded-lg border border-paper/20 border-l-4 bg-void px-3 py-2.5 text-left transition hover:border-gold/60 active:bg-gold/10 disabled:opacity-50"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-paper">
                    {pendingEmail === emp.email ? t('login.submitting', locale) : emp.name[locale]}
                  </span>
                  <span className="shrink-0 rounded-full border border-paper/25 px-2 py-0.5 text-[10px] text-paper-dim">
                    {t(ROLE_KEY[emp.role], locale)}
                  </span>
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-paper-dim">
                  {t('login.homeFacility', locale)}: {facilityLabel(emp.mainFacility)}
                  {' / '}
                  {emp.crossTrained.length > 0
                    ? `${t('login.canHelp', locale)}: ${emp.crossTrained.map(facilityLabel).join('・')}`
                    : t('login.noHelp', locale)}
                </span>
                <span
                  className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                    emp.shurikenTrained ? 'bg-jade/50 text-paper' : 'bg-paper/10 text-paper-dim'
                  }`}
                >
                  <GraduationCap size={11} />
                  {t(emp.shurikenTrained ? 'login.shurikenDone' : 'login.shurikenNotDone', locale)}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {error && <p className="mt-3 text-xs text-seal-bright">{error}</p>}

        {/* 従来のメールアドレス+パスワード入力(手入力でログインしたいとき用) */}
        <details className="mt-5 border-t border-paper/10 pt-3">
          <summary className="cursor-pointer py-1 text-xs text-paper-dim hover:text-paper">
            {t('login.manualToggle', locale)}
          </summary>
          <form onSubmit={handleSubmit} className="mt-3 space-y-4">
            <div>
              <label className="mb-1 block text-xs text-paper-dim">{t('login.email', locale)}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-md border border-paper/20 bg-void px-3 py-2 text-sm text-paper focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-paper-dim">{t('login.password', locale)}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-md border border-paper/20 bg-void px-3 py-2 text-sm text-paper focus:border-gold focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gold bg-gold/10 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/20 disabled:opacity-50"
            >
              <LogIn size={14} />
              {submitting ? t('login.submitting', locale) : t('login.submit', locale)}
            </button>
          </form>
        </details>
      </div>
    </div>
  );
}
