import { LogOut, Swords } from 'lucide-react';
import { useLabelContext } from '../hooks/LabelContext';
import type { UserRole } from '../types';

interface HeaderProps {
  role: UserRole;
  email: string | undefined;
  onSignOut: () => void;
}

export function Header({ role, email, onSignOut }: HeaderProps) {
  const { locale, setLocale, t } = useLabelContext();

  return (
    <header className="border-b border-paper/10 bg-void-soft/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/60 bg-void text-gold">
            <Swords size={20} />
          </div>
          <div>
            <h1 className="font-mincho text-lg font-bold tracking-wide text-paper sm:text-xl">{t('header.appName')}</h1>
            <p className="text-[11px] tracking-widest text-paper-dim sm:text-xs">NINJA PARK SHIFT MANAGEMENT</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right text-[11px] text-paper-dim sm:block">
            <p className="text-gold">{role === 'manager' ? t('header.roleManager') : t('header.roleEmployee')}</p>
            <p>{email}</p>
          </div>

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

          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center gap-1.5 rounded-full border border-paper/20 px-3 py-1.5 text-xs text-paper-dim transition hover:border-seal hover:text-seal-bright"
          >
            <LogOut size={14} />
            {t('header.logout')}
          </button>
        </div>
      </div>
    </header>
  );
}
