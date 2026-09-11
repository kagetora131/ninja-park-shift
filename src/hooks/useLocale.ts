import { useCallback, useState } from 'react';
import type { Locale } from '../types';

const STORAGE_KEY = 'ninja-park-shift:locale';

function loadInitialLocale(): Locale {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'ja' || saved === 'en') return saved;
  } catch {
    // localStorageが使えない環境では端末の言語設定にフォールバックする
  }
  // 保存済みの選択が無い初回訪問時は、端末の言語設定から自動判定する。
  // 日本語系(ja, ja-JP等)以外は全て英語をデフォルトにする
  // (フランス語・スペイン語など未対応言語の訪問者にも英語を表示するため)。
  try {
    return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en';
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
