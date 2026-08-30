/**
 * The read path. One direction only: PGlite -> read model -> React.
 *
 * Rebuilds everything after each write. At the scale of one family archive — a few hundred
 * rows — that is far cheaper than maintaining an incremental update path. Do not optimise
 * this early (NFR-PERF-06).
 *
 * TASK-010
 */

import { query } from '../domain/db';
import type {
  AuditEvent,
  Claim,
  Conflict,
  OpenDisagreement,
  Person,
  Place,
  Evidence,
  Source,
  StoryCard,
} from '../domain/types';

/**
 * A spread is one assertion about one subject: normally a single claim, but two or more when
 * the archive disagrees with itself. `conflict` is set only while that disagreement is open, so
 * the tear is a consequence of state and can never be spontaneous (FR-BOOK-06).
 */
export interface Spread {
  key: string;
  subjectId: string;
  predicate: string;
  claims: Claim[];
  conflict: Conflict | null;
  /** Present once a person has settled it — TASK-019 puts their name on the page. */
  resolvedBy: Person | null;
}

export interface ReadModel {
  people: Person[];
  places: Place[];
  claims: Claim[];
  sources: Source[];
  conflicts: Conflict[];
  disagreements: OpenDisagreement[];
  cards: StoryCard[];
  evidence: Evidence[];
  /** Newest first, capped: the panel is a timeline to read, not an export. */
  audit: AuditEvent[];
  /** One spread per thing-being-said-about-someone. The spine is these, in time order. */
  spreads: Spread[];
  /** Derived, and what the registry (R4) consumes. */
  subjectsWithDisagreement: Set<string>;
  openConflictIds: Set<string>;
}

export async function buildReadModel(): Promise<ReadModel> {
  const [people, places, claims, sources, conflicts, disagreements, cards, evidence, audit] =
    await Promise.all([
    query<Person>('SELECT * FROM person ORDER BY created_at'),
    query<Place>('SELECT * FROM place ORDER BY created_at'),
    query<Claim>("SELECT * FROM claim WHERE status = 'active' ORDER BY created_at"),
    query<Source>('SELECT * FROM source ORDER BY created_at'),
    query<Conflict>('SELECT * FROM conflict ORDER BY detected_at'),
    query<OpenDisagreement>('SELECT * FROM v_open_disagreement'),
    query<StoryCard>('SELECT * FROM story_card ORDER BY generated_at DESC'),
    query<Evidence>('SELECT * FROM evidence ORDER BY created_at'),
    query<AuditEvent>('SELECT * FROM audit_event ORDER BY id DESC LIMIT 200'),
  ]);

  const spreads = buildSpreads(claims, conflicts, people);

  return {
    spreads,
    people,
    places,
    claims,
    sources,
    conflicts,
    disagreements,
    cards,
    evidence,
    audit,
    subjectsWithDisagreement: new Set(disagreements.map((d) => d.subject_id)),
    openConflictIds: new Set(conflicts.filter((c) => c.status === 'open').map((c) => c.id)),
  };
}

/**
 * Claims about the same subject, predicate and object belong on one page — that is what makes
 * two years for one move a torn page rather than two unrelated ones. Same grouping key as
 * v_open_disagreement, deliberately: the book and the detector must never disagree about what
 * counts as the same assertion.
 */
function buildSpreads(claims: Claim[], conflicts: Conflict[], people: Person[]): Spread[] {
  const groups = new Map<string, Claim[]>();

  for (const c of claims) {
    const key = [c.subject_kind, c.subject_id, c.predicate,
                 c.object_person_id, c.object_place_id, c.object_text].join('|');
    const existing = groups.get(key);
    if (existing) existing.push(c);
    else groups.set(key, [c]);
  }

  return [...groups.entries()]
    .map(([key, group]) => {
      const first = group[0];
      const open = conflicts.find(
        (k) =>
          k.status === 'open' &&
          k.subject_id === first.subject_id &&
          k.predicate === first.predicate,
      );
      const settled = conflicts.find(
        (k) =>
          k.status === 'resolved' &&
          k.subject_id === first.subject_id &&
          k.predicate === first.predicate,
      );
      return {
        key,
        subjectId: first.subject_id,
        predicate: first.predicate,
        claims: [...group].sort((a, b) => (a.year_value ?? 0) - (b.year_value ?? 0)),
        conflict: open ?? null,
        resolvedBy: settled ? (people.find((p) => p.id === settled.resolved_by) ?? null) : null,
      };
    })
    .sort((a, b) => (a.claims[0].year_value ?? 0) - (b.claims[0].year_value ?? 0));
}
