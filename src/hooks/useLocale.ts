import { useCallback, useState } from 'react';
import type { Locale } from '../types';

const STORAGE_KEY = 'ninja-park-shift:locale';

function loadInitialLocale(): Locale {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === 'en' ? 'en' : 'ja';
  } catch {
    return 'ja';
  }
}

/**
 * 表示言語(ja/en)。個人の閲覧設定であり、アプリのデータではないため
 * (他の状態と違い)ブラウザのlocalStorageに保持する。
 */
export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(loadInitialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 保存できない環境では表示のみ切り替える
    }
  }, []);

  return { locale, setLocale };
}
