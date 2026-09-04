import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useLocale } from './useLocale';
import { useLabels } from './useLabel';
import { FACILITIES } from '../data/facilities';
import { t, type StringKey } from '../lib/i18n';
import type { Employee, FacilityId, LabelEntityType, LabelRow, LabelValues, Locale } from '../types';

interface LabelContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  labels: LabelRow[];
  labelsLoading: boolean;
  employeeName: (employee: Employee) => string;
  facilityName: (facilityId: FacilityId) => string;
  roleName: (role: string) => string;
  qualificationName: (qualification: string) => string;
  /** 静的なUI文言辞書(src/lib/i18n.ts)を現在の言語で引く。 */
  t: (key: StringKey, params?: Record<string, string | number>) => string;
  upsertLabel: (entityType: LabelEntityType, entityId: string, field: string, values: LabelValues) => Promise<void>;
  deleteLabel: (entityType: LabelEntityType, entityId: string, field: string) => Promise<void>;
}

const LabelContext = createContext<LabelContextValue | null>(null);

export function LabelProvider({ children }: { children: ReactNode }) {
  const { locale, setLocale } = useLocale();
  const { labels, loading, getLabel, upsertLabel, deleteLabel } = useLabels();

  const value = useMemo<LabelContextValue>(
    () => ({
      locale,
      setLocale,
      labels,
      labelsLoading: loading,
      employeeName: (employee) => getLabel('employee', employee.id, 'name', employee.name, locale),
      facilityName: (facilityId) => getLabel('facility', facilityId, 'label', FACILITIES[facilityId].name, locale),
      roleName: (role) => getLabel('role', role, 'label', role, locale),
      qualificationName: (q) => getLabel('qualification', q, 'label', q, locale),
      t: (key, params) => t(key, locale, params),
      upsertLabel,
      deleteLabel,
    }),
    [locale, setLocale, labels, loading, getLabel, upsertLabel, deleteLabel],
  );

  return <LabelContext.Provider value={value}>{children}</LabelContext.Provider>;
}

export function useLabelContext(): LabelContextValue {
  const ctx = useContext(LabelContext);
  if (!ctx) throw new Error('useLabelContext must be used within a LabelProvider');
  return ctx;
}
