import { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useLabelContext } from '../hooks/LabelContext';
import type { LabelEntityType } from '../types';

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
  const { upsertLabel, deleteLabel, t } = useLabelContext();
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
          placeholder={t('labels.enPlaceholder')}
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
            {saved ? t('labels.saved') : t('common.save')}
          </button>
          <button
            type="button"
            onClick={() => deleteLabel(entityType, entityId, field)}
            title={t('labels.deleteTitle')}
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
  const { labels, upsertLabel, t } = useLabelContext();
  const [newEntityType, setNewEntityType] = useState<LabelEntityType>('facility');
  const [newEntityId, setNewEntityId] = useState('');
  const [newField, setNewField] = useState('label');
  const [newJa, setNewJa] = useState('');
  const [newEn, setNewEn] = useState('');

  const ENTITY_TYPE_LABEL: Record<LabelEntityType, string> = {
    employee: t('labels.entityEmployee'),
    facility: t('labels.entityFacility'),
    role: t('labels.entityRole'),
    qualification: t('labels.entityQualification'),
  };

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
        <h2 className="font-mincho text-sm font-bold text-paper">{t('labels.heading')}</h2>
        <p className="mt-1 text-xs text-paper-dim">{t('labels.description')}</p>
      </div>

      {grouped.map(({ type, rows }) => (
        <section key={type} className="rounded-xl border border-paper/10 bg-void-soft/50 p-4">
          <h3 className="mb-3 font-mincho text-sm font-bold text-paper">{ENTITY_TYPE_LABEL[type]}</h3>
          {rows.length === 0 ? (
            <p className="text-xs text-paper-dim/70">{t('labels.noneRegistered')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs text-paper-dim">
                    <th className="py-1.5 pr-3 font-medium">{t('labels.idHeader')}</th>
                    <th className="px-2 py-1.5 font-medium">{t('labels.jaHeader')}</th>
                    <th className="px-2 py-1.5 font-medium">{t('labels.enHeader')}</th>
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
          {t('labels.addHeading')}
        </h3>
        <p className="mb-3 text-[11px] text-paper-dim">{t('labels.addDescription')}</p>
        <form onSubmit={handleAdd} className="grid gap-2.5 sm:grid-cols-5">
          <select
            value={newEntityType}
            onChange={(e) => setNewEntityType(e.target.value as LabelEntityType)}
            className="rounded-md border border-paper/20 bg-void px-2 py-1.5 text-sm text-paper focus:border-gold focus:outline-none"
          >
            {ENTITY_TYPE_ORDER.map((t2) => (
              <option key={t2} value={t2}>
                {ENTITY_TYPE_LABEL[t2]}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newEntityId}
            onChange={(e) => setNewEntityId(e.target.value)}
            placeholder={t('labels.idPlaceholder')}
            required
            className="rounded-md border border-paper/20 bg-void px-2 py-1.5 text-sm text-paper focus:border-gold focus:outline-none"
          />
          <input
            type="text"
            value={newField}
            onChange={(e) => setNewField(e.target.value)}
            placeholder={t('labels.fieldPlaceholder')}
            className="rounded-md border border-paper/20 bg-void px-2 py-1.5 text-sm text-paper focus:border-gold focus:outline-none"
          />
          <input
            type="text"
            value={newJa}
            onChange={(e) => setNewJa(e.target.value)}
            placeholder={t('labels.jaPlaceholder')}
            required
            className="rounded-md border border-paper/20 bg-void px-2 py-1.5 text-sm text-paper focus:border-gold focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={newEn}
              onChange={(e) => setNewEn(e.target.value)}
              placeholder={t('labels.enOptionalPlaceholder')}
              className="flex-1 rounded-md border border-paper/20 bg-void px-2 py-1.5 text-sm text-paper focus:border-gold focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-md border border-gold bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold transition hover:bg-gold/20"
            >
              {t('common.add')}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
