/**
 * R3 — this module is the SOLE owner of the PGlite connection.
 *
 * Nothing outside src/domain/ and src/store/projection.ts may import it. PGlite has one
 * connection and no pool, so concurrent callers would serialise unpredictably; a single
 * owner solves that and, more importantly, guarantees every write passes the one place
 * that also records audit_event.
 *
 * Persistence is IndexedDB, not OPFS: OPFS SyncAccessHandle needs cross-origin isolation,
 * and a COOP/COEP requirement is one more way to die inside the ChatGPT in-app browser.
 *
 * TASK-003
 */

import { PGlite } from '@electric-sql/pglite';
import schemaSql from './schema.sql?raw';
import type { ActorKind } from './types';

/**
 * Bump in the same commit as ANY change to schema.sql. Boot used to ask only whether the `claim`
 * table existed, so a later schema edit never reached a browser that had already booted.
 */
const SCHEMA_VERSION = 2;

let instance: PGlite | null = null;
let booting: Promise<PGlite> | null = null;
let inMemoryFallback = false;
let archiveWasRebuilt = false;

/** True when IndexedDB was unavailable (private mode) and data will not survive reload. */
export function isEphemeral(): boolean {
  return inMemoryFallback;
}

/** Boot found an older schema and rebuilt from scratch. The UI must say so — data was lost. */
export function wasRebuilt(): boolean {
  return archiveWasRebuilt;
}

async function currentVersion(db: PGlite): Promise<number | null> {
  const [present] = (
    await db.query<{ ok: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables
                      WHERE table_schema = 'public' AND table_name = 'schema_meta') AS ok`,
    )
  ).rows;
  if (!present.ok) {
    // No schema_meta: either empty, or written by the pre-versioning schema.
    const [claimTable] = (
      await db.query<{ ok: boolean }>(
        `SELECT EXISTS (SELECT 1 FROM information_schema.tables
                        WHERE table_schema = 'public' AND table_name = 'claim') AS ok`,
      )
    ).rows;
    return claimTable.ok ? 1 : null;
  }
  const rows = (
    await db.query<{ version: number }>(
      'SELECT version FROM schema_meta ORDER BY applied_at DESC LIMIT 1',
    )
  ).rows;
  return rows.length > 0 ? rows[0].version : 1;
}

async function applySchema(db: PGlite): Promise<void> {
  await db.exec(schemaSql);
  await db.query('INSERT INTO schema_meta (version) VALUES ($1)', [SCHEMA_VERSION]);
}

async function boot(): Promise<PGlite> {
  let db: PGlite;
  try {
    db = await PGlite.create('idb://memoir-canvas');
  } catch {
    // NFR-REL-03: private browsing blocks IndexedDB. Run in memory and let the UI say so
    // rather than showing a white screen.
    inMemoryFallback = true;
    db = await PGlite.create();
  }

  const version = await currentVersion(db);

  if (version === null) {
    await applySchema(db);
  } else if (version !== SCHEMA_VERSION) {
    // No migration path: rebuild, and flag it so the UI can say so rather than quietly emptying.
    await db.exec('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await applySchema(db);
    archiveWasRebuilt = true;
  }

  return db;
}

/** Lazy — the first frame must render before we pay for ~5.3 MB gz of wasm (NFR-PERF-02). */
export function getDb(): Promise<PGlite> {
  if (instance) return Promise.resolve(instance);
  if (!booting) {
    booting = boot().then(
      (db) => ((instance = db), db),
      (err) => {
        booting = null; // NFR-REL-04: one transient failure must not poison the memo forever
        throw err;
      },
    );
  }
  return booting;
}

/** Serialises everything: one connection, so queue rather than race. */
let tail: Promise<unknown> = Promise.resolve();

export function serialize<T>(work: () => Promise<T>): Promise<T> {
  const next = tail.then(work, work);
  tail = next.catch(() => undefined);
  return next;
}

/**
 * NFR-REL-02 — reads share the write queue. One connection means a query issued mid-transaction
 * runs inside it, seeing uncommitted rows under whatever role is currently set.
 */
export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const db = await getDb();
  return serialize(async () => (await db.query<T>(sql, params)).rows);
}

export interface Tx {
  query: <R>(sql: string, params?: unknown[]) => Promise<R[]>;
  exec: (sql: string, params?: unknown[]) => Promise<void>;
}

/**
 * One transaction, as `actor`: the write and its audit_event go in together or not at all.
 *
 * `SET LOCAL ROLE` is what makes NFR-TRUST-01 real — the agent's role holds no UPDATE on
 * claim.confirmed_by, so a bug in commands.ts cannot manufacture a fact. LOCAL, so it reverts at
 * COMMIT or ROLLBACK without a RESET a failure path could skip.
 */
export async function transaction<T>(actor: ActorKind, work: (tx: Tx) => Promise<T>): Promise<T> {
  const db = await getDb();
  const role = actor === 'agent' ? 'app_agent' : 'app_human';

  return serialize(async () => {
    await db.exec('BEGIN');
    try {
      await db.exec(`SET LOCAL ROLE ${role}`);
      const result = await work({
        query: async <R>(sql: string, params: unknown[] = []) =>
          (await db.query<R>(sql, params)).rows,
        exec: async (sql: string, params: unknown[] = []) => {
          await db.query(sql, params);
        },
      });
      await db.exec('COMMIT');
      return result;
    } catch (err) {
      // A connection left aborted would wedge every later caller (25P02), and a throwing
      // ROLLBACK must not mask the original error.
      try {
        await db.exec('ROLLBACK');
      } catch {
        /* already gone */
      }
      throw err;
    }
  });
}
