import { supabase } from './supabaseClient';

// 公開サイト(app-list.md)にも掲載している共有デモアカウント。
// ホームページのカードの「マネージャーとしてログイン」「従業員としてログイン」ボタンが、
// URLに ?demo=manager または ?demo=emp001〜emp010 を付けてこのアプリを開く。
const DEMO_PASSWORD = 'NinjaDemo2026';

function demoEmailFor(target: string | null): string | null {
  if (target === 'manager') return 'manager@ninja-park-shift.demo';
  if (target && /^emp\d{3}$/.test(target)) return `${target}@ninja-park-shift.demo`;
  return null;
}

/**
 * URLに ?demo=... があれば、そのデモアカウントでログインする(ログイン済みでも切り替える)。
 * パラメータは読んだ直後にURLから消すので、再読み込みで再ログインすることはない。
 * ReactのStrictModeで複数回呼ばれても、ログイン処理は1回だけ実行して同じPromiseを返す。
 */
let pending: Promise<void> | null = null;

export function runDemoLoginFromUrl(): Promise<void> {
  if (pending) return pending;
  let email: string | null = null;
  try {
    const url = new URL(window.location.href);
    email = demoEmailFor(url.searchParams.get('demo'));
    if (url.searchParams.has('demo')) {
      url.searchParams.delete('demo');
      window.history.replaceState(null, '', url.toString());
    }
  } catch {
    // URLを解釈できない環境では何もしない(通常のログイン画面になる)
  }
  pending = email
    ? supabase.auth
        .signInWithPassword({ email, password: DEMO_PASSWORD })
        .then(() => undefined)
        .catch(() => undefined)
    : Promise.resolve();
  return pending;
}
