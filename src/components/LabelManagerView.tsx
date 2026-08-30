import { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useLabelContext } from '../hooks/LabelContext';
import type { LabelEntityType } from '../types';

const ENTITY_TYPE_LABEL: Record<LabelEntityType, string> = {
  employee: '従業員名',
  facility: '施設名',
  role: '役割名',
  qualification: '資格名',
};

const ENTITY_TYPE_ORDER: LabelEntityType[] = ['employee', 'facility', 'role', 'qualification'];

function LabelRowEditor({
  entityType,
  entityId,
  field,
  ja,
  en,
}: {
  entityType: LabelEntityType;
  entityId: string;
  field: string;
  ja: string;
  en?: string;
}) {
  const { upsertLabel, deleteLabel } = useLabelContext();
  const [jaValue, setJaValue] = useState(ja);
  const [enValue, setEnValue] = useState(en ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await upsertLabel(entityType, entityId, field, { ja: jaValue, en: enValue || undefined });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  return (
    <tr className="border-t border-paper/10">
      <td className="py-1.5 pr-3 text-xs text-paper-dim">{entityId}</td>
      <td className="px-2 py-1.5">
        <input
          type="text"
          value={jaValue}
          onChange={(e) => setJaValue(e.target.value)}
          className="w-full rounded-md border border-paper/20 bg-void px-2 py-1 text-sm text-paper focus:border-gold focus:outline-none"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          type="text"
          value={enValue}
          onChange={(e) => setEnValue(e.target.value)}
          placeholder="(未設定→日本語表記にフォールバック)"
          className="w-full rounded-md border border-paper/20 bg-void px-2 py-1 text-sm text-paper focus:border-gold focus:outline-none"
        />
      </td>
      <td className="py-1.5 pl-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1 rounded-md border border-gold/50 px-2 py-1 text-[11px] text-gold transition hover:bg-gold/10"
          >
            <Save size={11} />
            {saved ? '保存済み' : '保存'}
          </button>
          <button
            type="button"
            onClick={() => deleteLabel(entityType, entityId, field)}
            title="この表記を削除"
            className="rounded-md p-1 text-paper-dim transition hover:text-seal-bright"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function LabelManagerView() {
  const { labels } = useLabelContext();
  const [newEntityType, setNewEntityType] = useState<LabelEntityType>('facility');
  const [newEntityId, setNewEntityId] = useState('');
  const [newField, setNewField] = useState('label');
  const [newJa, setNewJa] = useState('');
  const [newEn, setNewEn] = useState('');
  const { upsertLabel } = useLabelContext();

  const grouped = ENTITY_TYPE_ORDER.map((type) => ({
    type,
    rows: labels.filter((l) => l.entityType === type),
  }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityId.trim() || !newJa.trim()) return;
    await upsertLabel(newEntityType, newEntityId.trim(), newField.trim() || 'label', {
      ja: newJa.trim(),
      en: newEn.trim() || undefined,
    });
    setNewEntityId('');
    setNewJa('');
    setNewEn('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-mincho text-sm font-bold text-paper">用語管理(表記)</h2>
        <p className="mt-1 text-xs text-paper-dim">
          従業員名・施設名などの「表記」を言語ごとに管理します。「翻訳」ではなくローマ字化・呼称の切り替えという位置づけです。
          英語(en)を空欄のまま保存すると、表示時は日本語(ja)にフォールバックします。
        </p>
      </div>

      {grouped.map(({ type, rows }) => (
        <section key={type} className="rounded-xl border border-paper/10 bg-void-soft/50 p-4">
          <h3 className="mb-3 font-mincho text-sm font-bold text-paper">{ENTITY_TYPE_LABEL[type]}</h3>
          {rows.length === 0 ? (
            <p className="text-xs text-paper-dim/70">登録された表記はありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs text-paper-dim">
                    <th className="py-1.5 pr-3 font-medium">ID</th>
                    <th className="px-2 py-1.5 font-medium">日本語(ja)</th>
                    <th className="px-2 py-1.5 font-medium">英語(en)</th>
                    <th className="py-1.5 pl-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <LabelRowEditor
                      key={`${r.entityType}:${r.entityId}:${r.field}`}
                      entityType={r.entityType}
                      entityId={r.entityId}
                      field={r.field}
                      ja={r.values.ja}
                      en={r.values.en}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}

      <section className="rounded-xl border border-dashed border-gold/40 bg-void-soft/30 p-4">
        <h3 className="mb-3 flex items-center gap-1.5 font-mincho text-sm font-bold text-gold">
          <Plus size={14} />
          新しい表記を追加
        </h3>
        <p className="mb-3 text-[11px] text-paper-dim">
          将来、施設や役職が増えた場合もここから表記を追加できます(コード変更不要)。
        </p>
        <form onSubmit={handleAdd} className="grid gap-2.5 sm:grid-cols-5">
          <select
            value={newEntityType}
            onChange={(e) => setNewEntityType(e.target.value as LabelEntityType)}
            className="rounded-md border border-paper/20 bg-void px-2 py-1.5 text-sm text-paper focus:border-gold focus:outline-none"
          >
            {ENTITY_TYPE_ORDER.map((t) => (
              <option key={t} value={t}>
                {ENTITY_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newEntityId}
            onChange={(e) => setNewEntityId(e.target.value)}
            placeholder="ID(例: kitchen)"
            required
            className="rounded-md border border-paper/20 bg-void px-2 py-1.5 text-sm text-paper focus:border-gold focus:outline-none"
          />
          <input
            type="text"
            value={newField}
            onChange={(e) => setNewField(e.target.value)}
            placeholder="項目(既定: label)"
            className="rounded-md border border-paper/20 bg-void px-2 py-1.5 text-sm text-paper focus:border-gold focus:outline-none"
          />
          <input
            type="text"
            value={newJa}
            onChange={(e) => setNewJa(e.target.value)}
            placeholder="日本語表記"
            required
            className="rounded-md border border-paper/20 bg-void px-2 py-1.5 text-sm text-paper focus:border-gold focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={newEn}
              onChange={(e) => setNewEn(e.target.value)}
              placeholder="英語表記(任意)"
              className="flex-1 rounded-md border border-paper/20 bg-void px-2 py-1.5 text-sm text-paper focus:border-gold focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-md border border-gold bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold transition hover:bg-gold/20"
            >
              追加
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
