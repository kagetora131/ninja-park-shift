import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * スマホのヘッダーに「今の立場と名前」を出すための、ログイン中の表示名。
 * 従業員の名前は、従業員データを読み込む画面(EmployeeApp)でしか分からないため、
 * そこから useReportCurrentUserName() で渡し、ヘッダーが useCurrentUserName() で読む。
 */
interface CurrentUserValue {
  name: string | null;
  setName: (name: string | null) => void;
}

const CurrentUserContext = createContext<CurrentUserValue>({ name: null, setName: () => {} });

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState<string | null>(null);
  const value = useMemo(() => ({ name, setName }), [name]);
  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUserName(): string | null {
  return useContext(CurrentUserContext).name;
}

export function useReportCurrentUserName(name: string | null): void {
  const { setName } = useContext(CurrentUserContext);
  useEffect(() => {
    setName(name);
    return () => setName(null);
  }, [name, setName]);
}
