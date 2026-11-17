import { useSyncExternalStore } from 'react';

const QUERY = '(max-width: 639px)';

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/** スマホ幅(Tailwindのsm=640px未満)かどうか。画面の幅が変わったら追従する。 */
export function useIsPhone(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
