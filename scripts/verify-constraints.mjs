/**
 * npm run db:verify
 *
 * The most important command in the repo. It proves the three core constraints actually
 * bite — rather than us promising that they do.
 *
 * Runs src/domain/schema.sql on PGlite (PostgreSQL compiled to wasm32), then attempts ten
 * operations. Seven MUST be refused, three MUST pass. One wrong result means the architecture
 * has sprung a leak.
 *
 * Must be green on every commit. If you just relaxed a constraint to make this pass again,
 * you are fixing the wrong thing.
 *
 * TASK-002 · NFR-TRUST-05
 */
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const P1 = '11111111-1111-1111-1111-111111111111'; // Grandma
const P2 = '22222222-2222-2222-2222-222222222222'; // Uncle Ba
const PL = '33333333-3333-3333-3333-333333333333'; // Đà Nẵng
const C1 = 'aaaaaaaa-0000-0000-0000-000000000001'; // the 1972 claim
const C2 = 'aaaaaaaa-0000-0000-0000-000000000002'; // the 1974 claim
const S1 = '55555555-5555-5555-5555-555555555555'; // the photograph
const K1 = '66666666-6666-6666-6666-666666666666'; // the conflict

const db = await PGlite.create();
const version = (await db.query('select version()')).rows[0].version.split(',')[0];
console.log(`engine: ${version}\n`);

try {
  await db.exec(readFileSync('src/domain/schema.sql', 'utf8'));
} catch (e) {
  console.error('FAIL  schema.sql did not run:', e.message);
  process.exit(1);
}

const enums = (await db.query(`select count(*)::int n from pg_type where typtype='e'`)).rows[0].n;
const trg = (
  await db.query(
    `select count(*)::int n from pg_trigger
      where tgconstraint <> 0 and tgname = 'claim_evidence_backed'`,
  )
).rows[0].n;
console.log(`schema applied · ${enums} enum types · constraint trigger: ${trg === 1 ? 'present' : 'MISSING'}\n`);

let pass = 0;
let total = 0;

async function expect(label, sql, mustPass) {
  total += 1;
  let got;
  try {
    await db.exec(sql);
    got = 'allowed';
  } catch (e) {
    got = `refused (${e.message.split('\n')[0].slice(0, 62)})`;
  }
  const ok = mustPass ? got === 'allowed' : got.startsWith('refused');
  if (ok) pass += 1;
  console.log(`  ${ok ? 'PASS' : '** WRONG **'}  ${label}\n            → ${got}`);
}

await db.exec(`
  INSERT INTO person (id, display_name, created_by)
  VALUES ('${P1}', 'Bà ngoại', 'human'), ('${P2}', 'Cậu Ba', 'human');
  INSERT INTO place (id, name, created_by) VALUES ('${PL}', 'Đà Nẵng', 'agent');
`);

console.log('constraint 1 — an agent cannot declare something a fact');
await expect(
  'agent writes certainty=confirmed with nobody signing for it',
  `INSERT INTO claim (subject_kind, subject_id, predicate, object_place_id, year_value,
                      year_precision, certainty, asserted_by)
   VALUES ('person','${P1}','moved_to','${PL}',1972,'circa','confirmed','agent')`,
  false,
);
await expect(
  'agent writes a claim labelled oral',
  `INSERT INTO claim (id, subject_kind, subject_id, predicate, object_place_id, year_value,
                      year_precision, certainty, asserted_by)
   VALUES ('${C1}','person','${P1}','moved_to','${PL}',1972,'circa','oral','agent')`,
  true,
);

console.log('\nconstraint 2 — a document-supported label needs a document');
await expect(
  'write document_supported with no evidence at all',
  `INSERT INTO claim (subject_kind, subject_id, predicate, object_place_id, year_value,
                      year_precision, certainty, asserted_by)
   VALUES ('person','${P1}','moved_to','${PL}',1974,'exact','document_supported','agent')`,
  false,
);
await expect(
  'DEFERRABLE — claim and evidence in one transaction',
  `BEGIN;
   INSERT INTO source (id, kind, title, verbatim, created_by)
     VALUES ('${S1}','photo','Ảnh tiệm may','mặt sau ghi 1974','human');
   INSERT INTO claim (id, subject_kind, subject_id, predicate, object_place_id, year_value,
                      year_precision, certainty, asserted_by)
     VALUES ('${C2}','person','${P1}','moved_to','${PL}',1974,'exact','document_supported','agent');
   INSERT INTO evidence (claim_id, source_id, stance, excerpt, linked_by)
     VALUES ('${C2}','${S1}','supports','mặt sau ghi 1974','agent');
   COMMIT;`,
  true,
);
await expect(
  'an oral account with nobody to attribute it to',
  `INSERT INTO source (kind, title, created_by) VALUES ('oral_account','Anonymous','human')`,
  false,
);

console.log('\nthe disagreement detector — a view, not an inference engine');
const dis = (await db.query('SELECT predicate, distinct_years FROM v_open_disagreement')).rows;
total += 1;
if (dis.length === 1 && dis[0].distinct_years === 2) {
  pass += 1;
  console.log(`  PASS  v_open_disagreement found ${dis[0].distinct_years} years for "${dis[0].predicate}"`);
} else {
  console.log(`  ** WRONG **  v_open_disagreement returned ${JSON.stringify(dis)}`);
}

console.log('\nconstraint 3 — only a person can close a conflict');
await expect(
  'agent closes a conflict with nobody named as deciding',
  `INSERT INTO conflict (id, subject_kind, subject_id, predicate, status, detected_by, winning_claim_id)
   VALUES ('${K1}','person','${P1}','moved_to','resolved','agent','${C2}')`,
  false,
);
await expect(
  'conflict closed with a named person confirming',
  `INSERT INTO conflict (id, subject_kind, subject_id, predicate, status, detected_by,
                         winning_claim_id, resolved_by, resolved_at, resolution_note)
   VALUES ('${K1}','person','${P1}','moved_to','resolved','agent','${C2}','${P2}',now(),
           'Uncle Ba confirmed it from the back of the photograph');
   UPDATE claim SET certainty='confirmed', confirmed_by='${P2}', confirmed_at=now()
    WHERE id='${C2}';`,
  true,
);

console.log('\nsupporting constraints');
await expect(
  'a story card standing on no claims',
  `INSERT INTO story_card (subject_person_id, title_vi, title_en, body_vi, body_en,
                           claim_ids, floor_certainty, generated_by)
   VALUES ('${P1}','Tiệm may','The tailor shop','x','y','{}','confirmed','agent')`,
  false,
);
await expect(
  'an invalid enum value',
  `INSERT INTO person (display_name, created_by) VALUES ('X','robot')`,
  false,
);

const final = (
  await db.query(`
    SELECT year_value, certainty::text AS certainty,
           coalesce((SELECT display_name FROM person WHERE id = c.confirmed_by), '—') AS who
      FROM claim c WHERE status = 'active' ORDER BY year_value`)
).rows;

console.log('\nfinal state:');
for (const r of final) console.log(`  ${r.year_value} · ${r.certainty} · confirmed by ${r.who}`);

console.log(`\n==> ${pass}/${total} behaving as designed`);
if (pass !== total) {
  console.error('\nThe project argument has sprung a leak. Read .agent/rules/invariants.md before continuing.');
  process.exit(1);
}
