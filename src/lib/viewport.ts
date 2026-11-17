/** スマホ幅(Tailwindのsm=640px未満)かどうか。最初に開いたときの表示を決めるために使う。 */
export function isPhoneViewport(): boolean {
  try {
    return window.matchMedia('(max-width: 639px)').matches;
  } catch {
    return false;
  }
}
