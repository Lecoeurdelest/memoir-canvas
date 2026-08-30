/**
 * Single source of truth for domain types. Mirrors src/domain/schema.sql 1:1.
 * Never re-declare these shapes anywhere else — see .agent/rules/code-style.md.
 */

export type ActorKind = 'human' | 'agent';
export type SourceKind = 'oral_account' | 'photo' | 'document' | 'external_record';
export type SubjectKind = 'person' | 'place' | 'claim';
export type Certainty = 'uncertain' | 'oral' | 'document_supported' | 'conflicting' | 'confirmed';
export type ClaimStatus = 'active' | 'superseded' | 'retracted';
export type Stance = 'supports' | 'contradicts' | 'mentions';
export type ConflictStatus = 'open' | 'resolved' | 'dismissed';
export type QuestionStatus = 'open' | 'asked' | 'answered' | 'dropped';
export type YearPrecision = 'exact' | 'circa' | 'decade' | 'range';

/**
 * Ordered ladder. The enum order in schema.sql is deliberate so Postgres can compare
 * certainties with `<`; keep this array in the same order so floor_certainty can be
 * computed the same way on the client.
 */
export const CERTAINTY_ORDER: readonly Certainty[] = [
  'uncertain',
  'oral',
  'document_supported',
  'conflicting',
  'confirmed',
] as const;

export function floorCertainty(values: readonly Certainty[]): Certainty {
  if (values.length === 0) throw new Error('a story card must stand on at least one claim');
  return values.reduce((lowest, c) =>
    CERTAINTY_ORDER.indexOf(c) < CERTAINTY_ORDER.indexOf(lowest) ? c : lowest,
  );
}

export interface Person {
  id: string;
  display_name: string;
  aka: string[];
  note: string | null;
  created_by: ActorKind;
  created_at: string;
}

export interface Place {
  id: string;
  name: string;
  admin_area: string | null;
  country: string;
  created_by: ActorKind;
  created_at: string;
}

export interface Source {
  id: string;
  kind: SourceKind;
  title: string;
  uri: string | null;
  verbatim: string | null;
  recorded_at: string | null;
  contributor_id: string | null;
  created_by: ActorKind;
  created_at: string;
}

export interface Claim {
  id: string;
  subject_kind: SubjectKind;
  subject_id: string;
  predicate: string;
  object_person_id: string | null;
  object_place_id: string | null;
  object_text: string | null;
  year_value: number | null;
  year_min: number | null;
  year_max: number | null;
  year_precision: YearPrecision | null;
  certainty: Certainty;
  status: ClaimStatus;
  asserted_by: ActorKind;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
}

export interface Evidence {
  claim_id: string;
  source_id: string;
  stance: Stance;
  excerpt: string | null;
  linked_by: ActorKind;
  created_at: string;
}

export interface Conflict {
  id: string;
  subject_kind: SubjectKind;
  subject_id: string;
  predicate: string;
  status: ConflictStatus;
  detected_by: ActorKind;
  detected_at: string;
  winning_claim_id: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
}

export interface FollowupQuestion {
  id: string;
  conflict_id: string | null;
  claim_id: string | null;
  question_vi: string;
  question_en: string | null;
  ask_person_id: string | null;
  status: QuestionStatus;
  answer_text: string | null;
  answered_at: string | null;
  proposed_by: ActorKind;
  created_at: string;
}

export interface StoryCard {
  id: string;
  subject_person_id: string;
  title_vi: string;
  title_en: string;
  body_vi: string;
  body_en: string;
  claim_ids: string[];
  floor_certainty: Certainty;
  generated_by: ActorKind;
  generated_at: string;
}

export interface AuditEvent {
  id: number;
  occurred_at: string;
  actor: ActorKind;
  tool_name: string;
  args: unknown;
  target_table: string | null;
  target_id: string | null;
  before: unknown;
  after: unknown;
  registered_because: string;
}

/** One row of v_open_disagreement. */
export interface OpenDisagreement {
  subject_kind: SubjectKind;
  subject_id: string;
  predicate: string;
  claim_ids: string[];
  distinct_years: number;
}
