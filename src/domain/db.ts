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

let instance: PGlite | null = null;
let booting: Promise<PGlite> | null = null;
let inMemoryFallback = false;

/** True when IndexedDB was unavailable (private mode) and data will not survive reload. */
export function isEphemeral(): boolean {
  return inMemoryFallback;
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

  const [{ ready }] = (
    await db.query<{ ready: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables
                      WHERE table_name = 'claim') AS ready`,
    )
  ).rows;

  if (!ready) await db.exec(schemaSql);
  return db;
}

/** Lazy — the first frame must render before we pay for ~3 MB of wasm (NFR-PERF-02). */
export function getDb(): Promise<PGlite> {
  if (instance) return Promise.resolve(instance);
  if (!booting) booting = boot().then((db) => ((instance = db), db));
  return booting;
}

/** Serialises writes: one connection, so queue rather than race. */
let tail: Promise<unknown> = Promise.resolve();

export function serialize<T>(work: () => Promise<T>): Promise<T> {
  const next = tail.then(work, work);
  tail = next.catch(() => undefined);
  return next;
}

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const db = await getDb();
  return (await db.query<T>(sql, params)).rows;
}

/**
 * Runs `work` inside one transaction. The command and its audit_event go in together or
 * not at all — see src/domain/audit.ts.
 */
export async function transaction<T>(
  work: (tx: {
    query: <R>(sql: string, params?: unknown[]) => Promise<R[]>;
    exec: (sql: string, params?: unknown[]) => Promise<void>;
  }) => Promise<T>,
): Promise<T> {
  const db = await getDb();
  return serialize(async () => {
    await db.exec('BEGIN');
    try {
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
      await db.exec('ROLLBACK');
      throw err;
    }
  });
}
