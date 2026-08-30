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
import { useStore } from '../store/store';
import type { Lang } from '../store/store';
import type { ActorKind, AuditEvent } from '../domain/types';

const ACTOR: Record<ActorKind, Record<Lang, string>> = {
  agent: { vi: 'Tác nhân AI', en: 'The agent' },
  human: { vi: 'Một người', en: 'A person' },
};

/** What each tool did, in a sentence. Deliberately not the tool name. */
const DID: Record<string, Record<Lang, string>> = {
  add_person: { vi: 'thêm một người vào kho', en: 'added someone to the archive' },
  add_place: { vi: 'thêm một địa danh', en: 'added a place' },
  add_memory_claim: { vi: 'ghi lại một lời kể', en: 'recorded a recollection' },
  link_claim_to_source: { vi: 'gắn một nguồn vào lời kể', en: 'attached a source to a claim' },
  flag_conflict: { vi: 'đánh dấu một mâu thuẫn', en: 'flagged a contradiction' },
  propose_followup_question: { vi: 'đề xuất một câu hỏi', en: 'proposed a question to ask' },
  resolve_claim: { vi: 'chốt một mâu thuẫn', en: 'settled a contradiction' },
  generate_story_card: { vi: 'soạn một thẻ chuyện', en: 'composed a story card' },
  read_memory_graph: { vi: 'đọc kho ký ức', en: 'read the archive' },
  reset_archive: { vi: 'dựng lại kho từ đầu', en: 'rebuilt the archive from scratch' },
};

const COPY = {
  heading: { vi: 'Nhật ký', en: 'Audit trail' },
  intro: {
    vi: 'Mọi thao tác đều để lại một dòng — kể cả những lần bị từ chối.',
    en: 'Every operation leaves a line, including the ones that were refused.',
  },
  tried: { vi: 'đã thử', en: 'tried to' },
  refused: { vi: 'BỊ TỪ CHỐI', en: 'REFUSED' },
  because: { vi: 'vì', en: 'because' },
  allActors: { vi: 'Tất cả', en: 'Everyone' },
  allTools: { vi: 'Mọi thao tác', en: 'All operations' },
  onlyRefused: { vi: 'Chỉ những lần bị chặn', en: 'Only what was blocked' },
  context: { vi: 'Có được thao tác này vì', en: 'This was available because' },
  empty: { vi: 'Chưa có gì xảy ra.', en: 'Nothing has happened yet.' },
  count: { vi: 'dòng', en: 'entries' },
} satisfies Record<string, Record<Lang, string>>;

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
  const refusal = refusalOf(row);
  const did = DID[row.tool_name]?.[lang] ?? row.tool_name;

  return (
    <li className={`entry${refusal ? ' entry-refused' : ''}`}>
      <time dateTime={row.occurred_at}>{when(row.occurred_at, lang)}</time>

      <p className="what">
        <span className={`who who-${row.actor}`}>{ACTOR[row.actor][lang]}</span>{' '}
        {refusal ? (
          <>
            {COPY.tried[lang]} {did} — <b className="refused">{COPY.refused[lang]}</b>{' '}
            {COPY.because[lang]} {refusal.reason}
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
        {COPY.context[lang]}: {row.registered_because}
      </p>
    </li>
  );
}

export function AuditTrail(): JSX.Element {
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
      <h2 id="audit-heading">{COPY.heading[lang]}</h2>
      <p className="hint">{COPY.intro[lang]}</p>

      <div className="audit-filters">
        <select value={actor} onChange={(e) => setActor(e.target.value as ActorKind | 'all')}>
          <option value="all">{COPY.allActors[lang]}</option>
          <option value="agent">{ACTOR.agent[lang]}</option>
          <option value="human">{ACTOR.human[lang]}</option>
        </select>

        <select value={tool} onChange={(e) => setTool(e.target.value)}>
          <option value="all">{COPY.allTools[lang]}</option>
          {tools.map((t) => (
            <option key={t} value={t}>
              {DID[t]?.[lang] ?? t}
            </option>
          ))}
        </select>

        <label className="refused-only">
          <input
            type="checkbox"
            checked={refusedOnly}
            onChange={(e) => setRefusedOnly(e.target.checked)}
          />
          {COPY.onlyRefused[lang]} ({blocked})
        </label>

        <span className="hint">
          {rows.length} {COPY.count[lang]}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="hint">{COPY.empty[lang]}</p>
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
