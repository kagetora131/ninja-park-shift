import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { mapLabelRow, type LabelRowDb } from '../data/supabaseMappers';
import type { LabelEntityType, LabelRow, LabelValues, Locale } from '../types';

function labelKey(entityType: string, entityId: string, field: string): string {
  return `${entityType}:${entityId}:${field}`;
}

/**
 * 表記(labels)テーブルを一括ロードし、(entityType, entityId, field)から
 * 現在の言語での表記を引くgetLabelを提供する。未登録・未翻訳ならjaへフォールバックする。
 * 「翻訳」ではなくローマ字化・並び替えなどの「表記」を持たせる、という方針のテーブル。
 */
export function useLabels() {
  const [labels, setLabels] = useState<LabelRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const { data } = await supabase.from('labels').select('*');
    setLabels(((data as LabelRowDb[]) ?? []).map(mapLabelRow));
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refetch();
      setLoading(false);
    })();
  }, [refetch]);

  const map = useMemo(() => {
    const m = new Map<string, LabelValues>();
    for (const l of labels) m.set(labelKey(l.entityType, l.entityId, l.field), l.values);
    return m;
  }, [labels]);

  const getLabel = useCallback(
    (entityType: LabelEntityType, entityId: string, field: string, fallbackJa: string, locale: Locale): string => {
      const values = map.get(labelKey(entityType, entityId, field));
      if (!values) return fallbackJa;
      if (locale === 'ja') return values.ja || fallbackJa;
      return values.en || values.ja || fallbackJa;
    },
    [map],
  );

  const upsertLabel = useCallback(
    async (entityType: LabelEntityType, entityId: string, field: string, values: LabelValues) => {
      await supabase.from('labels').upsert({ entity_type: entityType, entity_id: entityId, field, values });
      await refetch();
    },
    [refetch],
  );

  const deleteLabel = useCallback(
    async (entityType: LabelEntityType, entityId: string, field: string) => {
      await supabase.from('labels').delete().match({ entity_type: entityType, entity_id: entityId, field });
      await refetch();
    },
    [refetch],
  );

  return { labels, loading, getLabel, upsertLabel, deleteLabel };
}
