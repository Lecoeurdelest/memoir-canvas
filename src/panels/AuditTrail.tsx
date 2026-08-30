/**
 * TASK-024 — a log readable by a non-technical person. A judge will open this panel.
 *
 * Every row is a sentence, not a JSON blob: "the agent recorded a recollection", "the agent
 * tried to close a conflict — refused, because…". The refused rows are the point. They are the
 * evidence that the constraints are real, so they are marked and never collapsed away.
 *
 * R5: read from src/store/, never mutate.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/store';
import type { Lang } from '../store/store';
import type { ActorKind, AuditEvent } from '../domain/types';

interface Refusal {
  outcome: 'refused';
  reason: string;
  constraint: string | null;
}

function refusalOf(row: AuditEvent): Refusal | null {
  const after = row.after as Refusal | null;
  return after && typeof after === 'object' && after.outcome === 'refused' ? after : null;
}

function when(iso: string, lang: Lang): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function Row({ row, lang }: { row: AuditEvent; lang: Lang }): JSX.Element {
  const { t } = useTranslation();
  const refusal = refusalOf(row);
  // A tool with no sentence falls back to its raw name — tests/panels.spec.ts forbids that
  // reaching production, but rendering the name beats rendering an empty cell.
  const did = t(`audit.did.${row.tool_name}`, row.tool_name);

  return (
    <li className={`entry${refusal ? ' entry-refused' : ''}`}>
      <time dateTime={row.occurred_at}>{when(row.occurred_at, lang)}</time>

      <p className="what">
        <span className={`who who-${row.actor}`}>{t(`audit.actor.${row.actor}`)}</span>{' '}
        {refusal ? (
          <>
            {t('audit.tried')} {did} — <b className="refused">{t('audit.refused')}</b>{' '}
            {t('audit.because')} {refusal.reason}
          </>
        ) : (
          did
        )}
      </p>

      {refusal?.constraint && (
        // Constraint names are written as sentences precisely so they can be shown here.
        <p className="constraint">
          <code>{refusal.constraint}</code>
        </p>
      )}

      <p className="context">
        {t('audit.context')}: {row.registered_because}
      </p>
    </li>
  );
}

export function AuditTrail(): JSX.Element {
  const { t } = useTranslation();
  const lang = useStore((s) => s.lang);
  const audit = useStore((s) => s.model?.audit) ?? [];

  const [actor, setActor] = useState<ActorKind | 'all'>('all');
  const [tool, setTool] = useState<string>('all');
  const [refusedOnly, setRefusedOnly] = useState(false);

  const tools = [...new Set(audit.map((r) => r.tool_name))].sort();
  const rows = audit.filter(
    (r) =>
      (actor === 'all' || r.actor === actor) &&
      (tool === 'all' || r.tool_name === tool) &&
      (!refusedOnly || refusalOf(r) !== null),
  );
  const blocked = audit.filter((r) => refusalOf(r) !== null).length;

  return (
    <section className="panel audit" aria-labelledby="audit-heading">
      <h2 id="audit-heading">{t('audit.heading')}</h2>
      <p className="hint">{t('audit.intro')}</p>

      <div className="audit-filters">
        <select value={actor} onChange={(e) => setActor(e.target.value as ActorKind | 'all')}>
          <option value="all">{t('audit.allActors')}</option>
          <option value="agent">{t('audit.actor.agent')}</option>
          <option value="human">{t('audit.actor.human')}</option>
        </select>

        <select value={tool} onChange={(e) => setTool(e.target.value)}>
          <option value="all">{t('audit.allTools')}</option>
          {tools.map((name) => (
            <option key={name} value={name}>
              {t(`audit.did.${name}`, name)}
            </option>
          ))}
        </select>

        <label className="refused-only">
          <input
            type="checkbox"
            checked={refusedOnly}
            onChange={(e) => setRefusedOnly(e.target.checked)}
          />
          {t('audit.onlyRefused')} ({blocked})
        </label>

        <span className="hint">
          {rows.length} {t('audit.count')}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="hint">{t('audit.empty')}</p>
      ) : (
        <ol className="entries">
          {rows.map((r) => (
            <Row key={r.id} row={r} lang={lang} />
          ))}
        </ol>
      )}
    </section>
  );
}
