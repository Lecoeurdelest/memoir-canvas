CREATE TYPE actor_kind      AS ENUM ('human','agent');
CREATE TYPE source_kind     AS ENUM ('oral_account','photo','document','external_record');
CREATE TYPE subject_kind    AS ENUM ('person','place','claim');
CREATE TYPE certainty       AS ENUM ('uncertain','oral','document_supported','conflicting','confirmed');
CREATE TYPE claim_status    AS ENUM ('active','superseded','retracted');
CREATE TYPE stance          AS ENUM ('supports','contradicts','mentions');
CREATE TYPE conflict_status AS ENUM ('open','resolved','dismissed');
CREATE TYPE question_status AS ENUM ('open','asked','answered','dropped');

CREATE TABLE person (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  aka          text[] NOT NULL DEFAULT '{}',
  note         text,
  created_by   actor_kind  NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE place (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  admin_area text,
  country    text NOT NULL DEFAULT 'VN',
  created_by actor_kind  NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE source (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind           source_kind NOT NULL,
  title          text NOT NULL,
  uri            text,
  verbatim       text,
  recorded_at    timestamptz,
  contributor_id uuid REFERENCES person(id),
  created_by     actor_kind  NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT source_oral_needs_a_voice
    CHECK (kind <> 'oral_account' OR contributor_id IS NOT NULL)
);

CREATE TABLE claim (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_kind     subject_kind NOT NULL,
  subject_id       uuid NOT NULL,
  predicate        text NOT NULL,
  object_person_id uuid REFERENCES person(id),
  object_place_id  uuid REFERENCES place(id),
  object_text      text,
  year_value       int,
  year_min         int,
  year_max         int,
  year_precision   text CHECK (year_precision IN ('exact','circa','decade','range')),
  certainty        certainty    NOT NULL DEFAULT 'uncertain',
  status           claim_status NOT NULL DEFAULT 'active',
  asserted_by      actor_kind   NOT NULL,
  confirmed_by     uuid REFERENCES person(id),
  confirmed_at     timestamptz,
  created_at       timestamptz  NOT NULL DEFAULT now(),

  CONSTRAINT claim_says_something CHECK (
    num_nonnulls(object_person_id, object_place_id, object_text, year_value) >= 1),

  CONSTRAINT claim_year_range_sane CHECK (
    year_min IS NULL OR year_max IS NULL OR year_min <= year_max),

  CONSTRAINT claim_confirmed_needs_a_human CHECK (
    certainty <> 'confirmed'
    OR (confirmed_by IS NOT NULL AND confirmed_at IS NOT NULL))
);

CREATE TABLE evidence (
  claim_id   uuid NOT NULL REFERENCES claim(id)  ON DELETE CASCADE,
  source_id  uuid NOT NULL REFERENCES source(id) ON DELETE CASCADE,
  stance     stance NOT NULL,
  excerpt    text,
  linked_by  actor_kind  NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (claim_id, source_id, stance)
);

CREATE TABLE conflict (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_kind     subject_kind NOT NULL,
  subject_id       uuid NOT NULL,
  predicate        text NOT NULL,
  status           conflict_status NOT NULL DEFAULT 'open',
  detected_by      actor_kind  NOT NULL,
  detected_at      timestamptz NOT NULL DEFAULT now(),
  winning_claim_id uuid REFERENCES claim(id),
  resolved_by      uuid REFERENCES person(id),
  resolution_note  text,
  resolved_at      timestamptz,
  CONSTRAINT conflict_resolution_needs_a_human CHECK (
    status <> 'resolved'
    OR (winning_claim_id IS NOT NULL
        AND resolved_by IS NOT NULL
        AND resolved_at IS NOT NULL))
);

CREATE TABLE conflict_member (
  conflict_id uuid NOT NULL REFERENCES conflict(id) ON DELETE CASCADE,
  claim_id    uuid NOT NULL REFERENCES claim(id)    ON DELETE CASCADE,
  PRIMARY KEY (conflict_id, claim_id)
);

CREATE TABLE followup_question (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id   uuid REFERENCES conflict(id) ON DELETE CASCADE,
  claim_id      uuid REFERENCES claim(id)    ON DELETE CASCADE,
  question_vi   text NOT NULL,
  question_en   text,
  ask_person_id uuid REFERENCES person(id),
  status        question_status NOT NULL DEFAULT 'open',
  answer_text   text,
  answered_at   timestamptz,
  proposed_by   actor_kind  NOT NULL DEFAULT 'agent',
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT question_points_at_a_doubt CHECK (
    num_nonnulls(conflict_id, claim_id) >= 1)
);

CREATE TABLE story_card (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_person_id uuid NOT NULL REFERENCES person(id),
  title_vi          text NOT NULL,
  title_en          text NOT NULL,
  body_vi           text NOT NULL,
  body_en           text NOT NULL,
  claim_ids         uuid[] NOT NULL,
  floor_certainty   certainty NOT NULL,
  generated_by      actor_kind  NOT NULL,
  generated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT card_stands_on_claims CHECK (cardinality(claim_ids) > 0)
);

CREATE TABLE audit_event (
  id                 bigserial PRIMARY KEY,
  occurred_at        timestamptz NOT NULL DEFAULT now(),
  actor              actor_kind NOT NULL,
  tool_name          text NOT NULL,
  args               jsonb NOT NULL,
  target_table       text,
  target_id          uuid,
  before             jsonb,
  after              jsonb,
  registered_because text NOT NULL
);

CREATE FUNCTION assert_evidence_backed() RETURNS trigger AS $$
BEGIN
  IF NEW.certainty = 'document_supported' AND NOT EXISTS (
       SELECT 1 FROM evidence e
       WHERE  e.claim_id = NEW.id AND e.stance = 'supports') THEN
    RAISE EXCEPTION 'claim % claims document support with no supporting evidence', NEW.id;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER claim_evidence_backed
  AFTER INSERT OR UPDATE OF certainty ON claim
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION assert_evidence_backed();

CREATE INDEX claim_subject_idx
  ON claim (subject_kind, subject_id, predicate)
  WHERE status = 'active';

CREATE INDEX evidence_claim_idx ON evidence (claim_id);
CREATE INDEX audit_tool_idx     ON audit_event (tool_name, occurred_at DESC);

CREATE VIEW v_open_disagreement AS
SELECT subject_kind,
       subject_id,
       predicate,
       array_agg(id ORDER BY created_at) AS claim_ids,
       count(DISTINCT year_value)        AS distinct_years
FROM   claim
WHERE  status = 'active' AND year_value IS NOT NULL
GROUP  BY subject_kind, subject_id, predicate
HAVING count(DISTINCT year_value) > 1;
