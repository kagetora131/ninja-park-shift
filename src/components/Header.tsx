import { useEffect, useRef, useState } from 'react';
import { LogOut, MoreHorizontal, Swords } from 'lucide-react';
import { useLabelContext } from '../hooks/LabelContext';
import { useCurrentUserName } from '../hooks/CurrentUserContext';
import { formatDateJp, todayLocalIso } from '../lib/format';
import type { UserRole } from '../types';

interface HeaderProps {
  role: UserRole;
  email: string | undefined;
  onSignOut: () => void;
}

export function Header({ role, email, onSignOut }: HeaderProps) {
  const { locale, setLocale, t } = useLabelContext();
  const currentName = useCurrentUserName();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // メニューの外を押す/Escで閉じる
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // シフト表(カレンダー機能)を持つアプリなので、開くたびに「今の実際の日付」を
  // 常に確認できるよう、ヘッダーに本日の日付を表示する。
  const todayLabel = formatDateJp(todayLocalIso(), locale);

  // スマホ用の「今の立場と名前」。従業員は名前、マネージャーはメールアドレスの@より前。
  const identityName = currentName ?? (email ? email.split('@')[0] : '');
  const identity = t('header.identity', {
    role: role === 'manager' ? t('header.roleManagerShort') : t('header.roleEmployeeShort'),
    name: identityName,
  });

  const localeToggle = (
    <div className="flex rounded-full border border-paper/20 p-0.5 text-xs sm:text-[11px]">
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
  );

  return (
    <header className="border-b border-paper/10 bg-void-soft/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2 sm:flex-wrap sm:gap-4 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/60 bg-void text-gold sm:h-10 sm:w-10">
            <Swords size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-mincho text-lg font-bold tracking-wide text-paper sm:text-xl">{t('header.appName')}</h1>
            <p className="hidden text-xs sm:text-[11px] tracking-widest text-paper-dim sm:block sm:text-xs">NINJA PARK SHIFT MANAGEMENT</p>
            {/* スマホでは、英語の副題の代わりに「本日」を題名の下に小さく出す */}
            <p className="text-xs text-paper-dim sm:hidden">
              {t('header.today')}: {todayLabel}
            </p>
          </div>
          <span className="hidden rounded-full border border-gold/30 px-2.5 py-1 text-xs sm:text-[11px] text-gold sm:inline">
            {t('header.today')}: {todayLabel}
          </span>
        </div>

        {/* PC: 今までどおり(立場・メール・言語・ログアウト) */}
        <div className="hidden items-center gap-3 sm:flex">
          <div className="text-right text-xs sm:text-[11px] text-paper-dim">
            <p className="text-gold">{role === 'manager' ? t('header.roleManager') : t('header.roleEmployee')}</p>
            <p>{email}</p>
          </div>
          {localeToggle}
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center gap-1.5 rounded-full border border-paper/20 px-3 py-1.5 text-xs text-paper-dim transition hover:border-seal hover:text-seal-bright"
          >
            <LogOut size={14} />
            {t('header.logout')}
          </button>
        </div>

        {/* スマホ: 今の立場と名前+メニュー(言語・ログアウトはメニューの中) */}
        <div ref={menuRef} className="relative flex min-w-0 items-center gap-2 sm:hidden">
          <p className="min-w-0 max-w-[9.5rem] truncate text-right text-xs text-gold" title={identity}>
            {identity}
          </p>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={t('header.menu')}
            aria-expanded={menuOpen}
            className="flex shrink-0 items-center justify-center rounded-full border border-paper/20 text-paper-dim"
          >
            <MoreHorizontal size={20} />
          </button>
          {menuOpen && (
            <>
              <div className="absolute right-0 top-full z-50 mt-2 w-56 space-y-2 rounded-xl border border-gold/30 bg-void-soft p-3 shadow-2xl">
                <div className="flex justify-center">{localeToggle}</div>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onSignOut();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-paper/20 text-sm text-paper-dim"
                >
                  <LogOut size={16} />
                  {t('header.logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
