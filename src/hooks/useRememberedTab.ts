import { useCallback, useState } from 'react';

/**
 * 選択中のタブをこのブラウザタブのsessionStorageに覚え、ページを再読み込みしても
 * 直前に見ていたタブがそのまま開くようにする(新しく開き直したときは既定のタブから)。
 * 保存できない環境(プライベートブラウズ等)では通常のuseStateとして動く。
 */
export function useRememberedTab(storageKey: string, defaultTab: string, validTabs: readonly string[]) {
  const [tab, setTabState] = useState<string>(() => {
    try {
      const saved = window.sessionStorage.getItem(storageKey);
      if (saved && validTabs.includes(saved)) return saved;
    } catch {
      // 読み出せなければ既定のタブ
    }
    return defaultTab;
  });

  const setTab = useCallback(
    (next: string) => {
      setTabState(next);
      try {
        window.sessionStorage.setItem(storageKey, next);
      } catch {
        // 保存できなくても表示の切り替えは続ける
      }
    },
    [storageKey],
  );

  return [tab, setTab] as const;
}
