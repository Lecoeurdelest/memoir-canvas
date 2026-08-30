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
import type { Claim, Conflict, OpenDisagreement, Person, Place, Source } from '../domain/types';

export interface ReadModel {
  people: Person[];
  places: Place[];
  claims: Claim[];
  sources: Source[];
  conflicts: Conflict[];
  disagreements: OpenDisagreement[];
  /** Derived, and what the registry (R4) consumes. */
  subjectsWithDisagreement: Set<string>;
  openConflictIds: Set<string>;
}

export async function buildReadModel(): Promise<ReadModel> {
  const [people, places, claims, sources, conflicts, disagreements] = await Promise.all([
    query<Person>('SELECT * FROM person ORDER BY created_at'),
    query<Place>('SELECT * FROM place ORDER BY created_at'),
    query<Claim>("SELECT * FROM claim WHERE status = 'active' ORDER BY created_at"),
    query<Source>('SELECT * FROM source ORDER BY created_at'),
    query<Conflict>('SELECT * FROM conflict ORDER BY detected_at'),
    query<OpenDisagreement>('SELECT * FROM v_open_disagreement'),
  ]);

  return {
    people,
    places,
    claims,
    sources,
    conflicts,
    disagreements,
    subjectsWithDisagreement: new Set(disagreements.map((d) => d.subject_id)),
    openConflictIds: new Set(conflicts.filter((c) => c.status === 'open').map((c) => c.id)),
  };
}
