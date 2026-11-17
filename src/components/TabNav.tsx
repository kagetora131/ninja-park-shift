import { useState } from 'react';
import { MoreHorizontal, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLabelContext } from '../hooks/LabelContext';

export interface TabDef {
  id: string;
  label: string;
  /** スマホの下タブ用の短い名前(省略すると label を使う) */
  shortLabel?: string;
  icon: LucideIcon;
  badgeCount?: number;
}

interface TabNavProps {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
  /** スマホの下タブに並べるタブのid。ここに無いタブは「その他」の窓にまとめる。省略すると全部並べる。 */
  mobilePrimaryIds?: string[];
}

function Badge({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-seal-bright px-1.5 py-[1px] text-xs sm:text-[10px] font-semibold text-void">
      {count > 9 ? '9+' : count}
    </span>
  );
}

export function TabNav({ tabs, active, onChange, mobilePrimaryIds }: TabNavProps) {
  const { t } = useLabelContext();
  const [moreOpen, setMoreOpen] = useState(false);

  const primary = mobilePrimaryIds ? tabs.filter((tab) => mobilePrimaryIds.includes(tab.id)) : tabs;
  const others = mobilePrimaryIds ? tabs.filter((tab) => !mobilePrimaryIds.includes(tab.id)) : [];
  const activeInOthers = others.some((tab) => tab.id === active);
  const othersBadge = others.reduce((sum, tab) => sum + (tab.badgeCount ?? 0), 0);
  const columns = primary.length + (others.length > 0 ? 1 : 0);

  return (
    <>
      {/* PC: 今までどおりの上のタブ */}
      <nav className="mx-auto hidden max-w-6xl gap-1 overflow-x-auto px-4 pt-4 sm:flex sm:px-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? 'border-seal-bright bg-void-soft text-paper'
                  : 'border-transparent text-paper-dim hover:text-paper'
              }`}
            >
              <Icon size={15} />
              {tab.label}
              {!!tab.badgeCount && <Badge count={tab.badgeCount} />}
            </button>
          );
        })}
      </nav>

      {/* スマホ: 画面の下に固定のタブ */}
      <nav
        aria-label={t('tab.mainMenuLabel')}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-paper/15 bg-void-soft/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {primary.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === active;
            return (
              <li key={tab.id}>
                <button
                  type="button"
                  onClick={() => onChange(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex h-14 w-full min-w-0 flex-col items-center justify-center gap-0.5 border-t-2 px-0.5 text-xs font-medium ${
                    isActive ? 'border-seal-bright text-paper' : 'border-transparent text-paper-dim'
                  }`}
                >
                  <span className="relative">
                    <Icon size={20} />
                    {!!tab.badgeCount && (
                      <span className="absolute -right-3 -top-2">
                        <Badge count={tab.badgeCount} />
                      </span>
                    )}
                  </span>
                  <span className="max-w-full truncate">{tab.shortLabel ?? tab.label}</span>
                </button>
              </li>
            );
          })}
          {others.length > 0 && (
            <li>
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                aria-haspopup="dialog"
                aria-current={activeInOthers ? 'page' : undefined}
                className={`relative flex h-14 w-full min-w-0 flex-col items-center justify-center gap-0.5 border-t-2 px-0.5 text-xs font-medium ${
                  activeInOthers ? 'border-seal-bright text-paper' : 'border-transparent text-paper-dim'
                }`}
              >
                <span className="relative">
                  <MoreHorizontal size={20} />
                  {othersBadge > 0 && (
                    <span className="absolute -right-3 -top-2">
                      <Badge count={othersBadge} />
                    </span>
                  )}
                </span>
                <span className="max-w-full truncate">{t('tab.more')}</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* 「その他」の窓(収支・給与とポスト設定・用語管理など) */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/70 sm:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('tab.moreMenuLabel')}
            className="animate-rise w-full rounded-t-2xl border-t border-gold/30 bg-void-soft p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-mincho text-base font-bold text-paper">{t('tab.moreMenuLabel')}</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label={t('common.close')}
                className="flex items-center justify-center text-paper-dim"
              >
                <X size={20} />
              </button>
            </div>
            <ul className="space-y-1">
              {others.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.id === active;
                return (
                  <li key={tab.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(tab.id);
                        setMoreOpen(false);
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 text-left text-sm ${
                        isActive ? 'bg-gold/15 text-gold' : 'text-paper hover:bg-paper/5'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="flex-1">{tab.label}</span>
                      {!!tab.badgeCount && <Badge count={tab.badgeCount} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
