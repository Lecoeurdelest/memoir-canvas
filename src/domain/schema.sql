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

-- Grouped on the object too: "moved_to Đà Nẵng 1972" and "moved_to Sài Gòn 1980" are both true.
-- Costs a false negative (same meaning stored as object_place_id vs object_text won't group) and
-- buys no false positives — the safer direction when the alternative is inventing a conflict.
CREATE VIEW v_open_disagreement AS
SELECT subject_kind,
       subject_id,
       predicate,
       object_person_id,
       object_place_id,
       object_text,
       array_agg(id ORDER BY created_at) AS claim_ids,
       count(DISTINCT year_value)        AS distinct_years
FROM   claim
WHERE  status = 'active' AND year_value IS NOT NULL
GROUP  BY subject_kind, subject_id, predicate,
          object_person_id, object_place_id, object_text
HAVING count(DISTINCT year_value) > 1;

-- ── NFR-TRUST-01 — privilege, not logic ────────────────────────────────────────────────────
--
-- The constraints above catch a malformed write. They do not catch a well-formed dishonest one:
-- resolveClaim once confirmed a claim that was never in the conflict, satisfying every check at
-- every step. Roles close that: the command layer assumes one per transaction (db.ts), and the
-- agent's role holds no UPDATE on the columns a fact is made of.

-- Cluster-wide, so DROP SCHEMA leaves them behind: create conditionally to stay idempotent.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_agent') THEN
    CREATE ROLE app_agent NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_human') THEN
    CREATE ROLE app_human NOLOGIN NOINHERIT;
  END IF;
END $$;

GRANT app_agent, app_human TO CURRENT_USER;

GRANT USAGE ON SCHEMA public TO app_agent, app_human;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_agent, app_human;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_agent, app_human;

-- A person may do anything the UI offers, including resetting the archive (TRUNCATE).
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public TO app_human;

-- An agent may record, and may mark a disagreement — nothing more.
GRANT INSERT ON person, place, source, claim, evidence, conflict, conflict_member,
                followup_question, story_card, audit_event TO app_agent;

-- The load-bearing line: confirmed_by/confirmed_at are absent, so no agent statement sets them.
GRANT UPDATE (certainty, status) ON claim TO app_agent;

-- status, winning_claim_id, resolved_by and resolved_at are withheld: the agent cannot close one.
GRANT UPDATE (predicate) ON conflict TO app_agent;
GRANT UPDATE (status, answer_text, answered_at) ON followup_question TO app_human;

-- ── the actor is stamped from current_user, never supplied by the caller ────────────────────
--
-- An agent that wrote 'human' into these used to be believed. This is what makes the audit trail
-- evidence rather than testimony.

CREATE FUNCTION stamp_actor() RETURNS trigger AS $$
BEGIN
  NEW := jsonb_populate_record(NEW, jsonb_build_object(
    TG_ARGV[0],
    CASE current_user WHEN 'app_agent' THEN 'agent' ELSE 'human' END));
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER stamp_person   BEFORE INSERT ON person
  FOR EACH ROW EXECUTE FUNCTION stamp_actor('created_by');
CREATE TRIGGER stamp_place    BEFORE INSERT ON place
  FOR EACH ROW EXECUTE FUNCTION stamp_actor('created_by');
CREATE TRIGGER stamp_source   BEFORE INSERT ON source
  FOR EACH ROW EXECUTE FUNCTION stamp_actor('created_by');
CREATE TRIGGER stamp_claim    BEFORE INSERT ON claim
  FOR EACH ROW EXECUTE FUNCTION stamp_actor('asserted_by');
CREATE TRIGGER stamp_evidence BEFORE INSERT ON evidence
  FOR EACH ROW EXECUTE FUNCTION stamp_actor('linked_by');
CREATE TRIGGER stamp_conflict BEFORE INSERT ON conflict
  FOR EACH ROW EXECUTE FUNCTION stamp_actor('detected_by');
CREATE TRIGGER stamp_card     BEFORE INSERT ON story_card
  FOR EACH ROW EXECUTE FUNCTION stamp_actor('generated_by');
CREATE TRIGGER stamp_audit    BEFORE INSERT ON audit_event
  FOR EACH ROW EXECUTE FUNCTION stamp_actor('actor');

-- ── NFR-TRUST-02 — the agent cannot mint the human who signs for its guess ──────────────────
--
-- claim_confirmed_needs_a_human only requires confirmed_by to be non-null, and add_person is a
-- base tool. A CHECK cannot look at another table, so the signer rule has to be a trigger.

CREATE FUNCTION assert_confirmed_by_a_human() RETURNS trigger AS $$
BEGIN
  IF NEW.certainty = 'confirmed' THEN
    IF current_user = 'app_agent' THEN
      RAISE EXCEPTION 'an agent cannot mark a claim confirmed';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM person p
                   WHERE p.id = NEW.confirmed_by AND p.created_by = 'human') THEN
      RAISE EXCEPTION
        'claim % names % as confirming it, but that person was not entered by a human',
        NEW.id, NEW.confirmed_by;
    END IF;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER claim_confirmed_by_a_human
  AFTER INSERT OR UPDATE OF certainty, confirmed_by ON claim
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION assert_confirmed_by_a_human();

-- ── NFR-TRUST-04 — the winner must be one of the claims in dispute ──────────────────────────
--
-- DEFERRABLE so conflict, members and resolution can go in one transaction in any order.

CREATE FUNCTION assert_resolution_coherent() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'resolved' AND NOT EXISTS (
       SELECT 1 FROM conflict_member m
       WHERE  m.conflict_id = NEW.id AND m.claim_id = NEW.winning_claim_id) THEN
    RAISE EXCEPTION
      'claim % is not one of the claims in conflict % — it cannot be the winner',
      NEW.winning_claim_id, NEW.id;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER conflict_resolution_coherent
  AFTER INSERT OR UPDATE OF status, winning_claim_id ON conflict
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION assert_resolution_coherent();

-- ── FR-CARD — a story card cannot claim more certainty than the claims under it ─────────────

CREATE FUNCTION assert_card_floor_honest() RETURNS trigger AS $$
DECLARE actual certainty;
BEGIN
  SELECT min(c.certainty) INTO actual FROM claim c WHERE c.id = ANY(NEW.claim_ids);
  IF actual IS NULL THEN
    RAISE EXCEPTION 'story card % cites claims that do not exist', NEW.id;
  END IF;
  IF NEW.floor_certainty <> actual THEN
    RAISE EXCEPTION
      'story card % claims certainty % but the weakest claim it stands on is %',
      NEW.id, NEW.floor_certainty, actual;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER card_floor_is_honest
  AFTER INSERT OR UPDATE OF floor_certainty, claim_ids ON story_card
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION assert_card_floor_honest();

-- ── schema version ─────────────────────────────────────────────────────────────────────────
--
-- Bump SCHEMA_VERSION in src/domain/db.ts in the same commit as any change to this file.
-- Without it an edit here is a silent no-op for any browser that already booted once.

CREATE TABLE schema_meta (
  version    int         NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON schema_meta TO app_agent, app_human;
