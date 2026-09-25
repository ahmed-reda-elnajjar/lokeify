// Lokeify's database: one async API over two drivers.
//   • local  SQLite through Node's built-in node:sqlite (Node 22.13+), in data/lokeify.db.
//            No native packages to install.
//   • turso  A hosted libSQL / Turso database over HTTP (the Hrana protocol), picked
//            when TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN) is set, e.g. on Vercel.
// On Vercel with no database connected the local driver writes to /tmp, which is fine
// for a quick look but doesn't survive a cold start ("ephemeral"; the admin warns).
// Same SQL on both, so moving from a laptop to production is just two env vars.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";

export type Value = string | number | bigint | boolean | null | undefined | Uint8Array;
export type Row = Record<string, unknown>;
export type StorageMode = "local" | "turso" | "ephemeral";

interface Executor {
  all(sql: string, params: Value[]): Promise<Row[]>;
  run(sql: string, params: Value[]): Promise<{ changes: number }>;
}
interface Driver extends Executor {
  /** Parameterless statements, in order (one round trip on Turso). */
  script(sqls: string[]): Promise<void>;
  /** Runs `fn` in a write transaction; rolls back if it throws. */
  tx<T>(fn: (x: Executor) => Promise<T>): Promise<T>;
}

export class DbError extends Error {}

// ── Configuration ───────────────────────────────────────────────────────────

function tursoConfig(): { url: string; token: string } | null {
  const env = process.env;
  const url =
    env.TURSO_DATABASE_URL || env.LIBSQL_URL || env.TURSO_URL || (env.DATABASE_URL?.startsWith("libsql://") ? env.DATABASE_URL : "");
  return url ? { url, token: env.TURSO_AUTH_TOKEN || env.LIBSQL_AUTH_TOKEN || "" } : null;
}

export function storageMode(): StorageMode {
  if (tursoConfig()) return "turso";
  return process.env.VERCEL ? "ephemeral" : "local";
}

/** Local database (and any files from older versions). Vercel only lets functions write to /tmp. */
export const DATA_DIR = process.env.VERCEL ? "/tmp/lokeify" : path.join(process.cwd(), "data");

// ── Local driver: node:sqlite ───────────────────────────────────────────────

interface SqliteStatement {
  run(...p: unknown[]): { changes: number | bigint };
  all(...p: unknown[]): Row[];
}
interface SqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
}

const toLocal = (v: Value) => (v === undefined ? null : typeof v === "boolean" ? (v ? 1 : 0) : v);

function localDriver(file: string): Driver {
  // Loaded at runtime so the bundler never tries to resolve node:sqlite.
  const getBuiltin = (process as unknown as { getBuiltinModule?: (id: string) => unknown }).getBuiltinModule;
  const mod = getBuiltin?.("node:sqlite") as { DatabaseSync?: new (file: string) => SqliteDatabase } | undefined;
  if (!mod?.DatabaseSync) throw new DbError("Lokeify needs Node.js 22.13 or newer (node:sqlite), or a Turso database (TURSO_DATABASE_URL).");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new mod.DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");

  const statements = new Map<string, SqliteStatement>();
  const prepare = (sql: string) => {
    let s = statements.get(sql);
    if (!s) statements.set(sql, (s = db.prepare(sql)));
    return s;
  };
  const direct: Executor = {
    all: async (sql, p) => prepare(sql).all(...p.map(toLocal)),
    run: async (sql, p) => ({ changes: Number(prepare(sql).run(...p.map(toLocal)).changes) }),
  };

  // One connection, so a transaction must not interleave with other requests' queries:
  // everything queues behind a lock (queries are synchronous, so the wait is tiny).
  let lock: Promise<void> = Promise.resolve();
  const exclusive = <T>(fn: () => Promise<T>): Promise<T> => {
    const prev = lock;
    let release!: () => void;
    lock = new Promise<void>((r) => (release = r));
    return prev.then(fn).finally(release);
  };

  return {
    all: (sql, p) => exclusive(() => direct.all(sql, p)),
    run: (sql, p) => exclusive(() => direct.run(sql, p)),
    script: (sqls) => exclusive(async () => sqls.forEach((s) => db.exec(s))),
    tx: (fn) =>
      exclusive(async () => {
        db.exec("BEGIN IMMEDIATE");
        try {
          const out = await fn(direct);
          db.exec("COMMIT");
          return out;
        } catch (e) {
          try {
            db.exec("ROLLBACK");
          } catch {
            // already rolled back
          }
          throw e;
        }
      }),
  };
}

// ── Turso driver: Hrana over HTTP ───────────────────────────────────────────

type HValue =
  | { type: "null" }
  | { type: "integer"; value: string }
  | { type: "float"; value: number }
  | { type: "text"; value: string }
  | { type: "blob"; base64: string };
interface HStmtResult { cols: { name: string | null }[]; rows: HValue[][]; affected_row_count: number }
type HResult = { type: "ok"; response: { type: string; result?: HStmtResult } } | { type: "error"; error: { message: string; code?: string } };
interface Stream { baton: string | null; baseUrl: string | null }

function toHrana(v: Value): HValue {
  if (v === null || v === undefined) return { type: "null" };
  if (typeof v === "boolean") return { type: "integer", value: v ? "1" : "0" };
  if (typeof v === "bigint") return { type: "integer", value: v.toString() };
  if (typeof v === "number") return Number.isSafeInteger(v) ? { type: "integer", value: String(v) } : { type: "float", value: v };
  if (typeof v === "string") return { type: "text", value: v };
  return { type: "blob", base64: Buffer.from(v.buffer, v.byteOffset, v.byteLength).toString("base64") };
}

function fromHrana(v: HValue | undefined): unknown {
  switch (v?.type) {
    case "integer": {
      const n = Number(v.value);
      return Number.isSafeInteger(n) ? n : BigInt(v.value);
    }
    case "float":
      return Number(v.value);
    case "text":
      return v.value;
    case "blob":
      return new Uint8Array(Buffer.from(v.base64, "base64"));
    default:
      return null;
  }
}

function tursoDriver(cfg: { url: string; token: string }): Driver {
  const u = new URL(cfg.url);
  const token = cfg.token || u.searchParams.get("authToken") || "";
  const insecure = u.searchParams.get("tls") === "0";
  const proto = u.protocol.toLowerCase();
  const scheme = proto === "http:" || proto === "ws:" || insecure ? "http:" : "https:";
  const base = `${scheme}//${u.host}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  async function pipeline(stream: Stream | null, requests: object[]): Promise<HResult[]> {
    const url = new URL("/v2/pipeline", stream?.baseUrl ?? base);
    let res: Response;
    try {
      res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ baton: stream?.baton ?? null, requests }), cache: "no-store" });
    } catch (e) {
      throw new DbError(`Can't reach the database at ${u.host}: ${e instanceof Error ? e.message : e}`);
    }
    const text = await res.text();
    if (!res.ok) throw new DbError(`Database request failed (HTTP ${res.status}): ${text.slice(0, 300)}`);
    const out = JSON.parse(text) as { baton: string | null; base_url: string | null; results: HResult[] };
    if (stream) {
      stream.baton = out.baton;
      if (out.base_url) stream.baseUrl = out.base_url;
    }
    return out.results;
  }

  const execute = (sql: string, params: Value[] = []) => ({ type: "execute", stmt: { sql, args: params.map(toHrana), want_rows: true } });
  const close = { type: "close" };
  const ok = (r: HResult | undefined): HStmtResult => {
    if (!r) throw new DbError("No reply from the database.");
    if (r.type === "error") throw new DbError(r.error?.message || "Database error.");
    return r.response.result ?? { cols: [], rows: [], affected_row_count: 0 };
  };
  const rowsOf = (r: HStmtResult): Row[] => {
    const cols = r.cols.map((c, i) => c.name ?? String(i));
    return r.rows.map((row) => {
      const o: Row = {};
      cols.forEach((c, i) => (o[c] = fromHrana(row[i])));
      return o;
    });
  };

  // Another writer holding the database: wait a little and try again (up to ~5 s).
  const busy = (e: unknown) => e instanceof DbError && /\b(busy|locked)\b|SQLITE_BUSY/i.test(e.message);
  async function retry<T>(f: () => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await f();
      } catch (e) {
        if (!busy(e) || attempt >= 8) throw e;
        await new Promise((r) => setTimeout(r, Math.min(1000, 25 * 2 ** attempt) * (0.5 + Math.random())));
      }
    }
  }

  return {
    all: (sql, p) => retry(async () => rowsOf(ok((await pipeline(null, [execute(sql, p), close]))[0]))),
    run: (sql, p) => retry(async () => ({ changes: Number(ok((await pipeline(null, [execute(sql, p), close]))[0]).affected_row_count) })),
    script: async (sqls) => {
      const results = await pipeline(null, [...sqls.map((s) => execute(s)), close]);
      sqls.forEach((_, i) => ok(results[i]));
    },
    tx: async (fn) => {
      // An interactive transaction: one server-side stream, kept alive by its baton.
      const s: Stream = { baton: null, baseUrl: null };
      await retry(async () => {
        s.baton = null;
        s.baseUrl = null;
        const [begin] = await pipeline(s, [execute("BEGIN IMMEDIATE")]);
        if (begin?.type === "error" && s.baton) await pipeline(s, [close]).catch(() => undefined);
        ok(begin);
      });
      let queue: Promise<unknown> = Promise.resolve();
      const serial = <T>(f: () => Promise<T>): Promise<T> => {
        const p = queue.then(f);
        queue = p.catch(() => undefined);
        return p;
      };
      const x: Executor = {
        all: (sql, p) => serial(async () => rowsOf(ok((await pipeline(s, [execute(sql, p)]))[0]))),
        run: (sql, p) => serial(async () => ({ changes: Number(ok((await pipeline(s, [execute(sql, p)]))[0]).affected_row_count) })),
      };
      try {
        const out = await fn(x);
        await queue;
        ok((await pipeline(s, [execute("COMMIT"), close]))[0]);
        return out;
      } catch (e) {
        await queue;
        if (s.baton) await pipeline(s, [execute("ROLLBACK"), close]).catch(() => undefined);
        throw e;
      }
    },
  };
}

// ── Schema ──────────────────────────────────────────────────────────────────

const SCHEMA: string[][] = [
  // v1
  [
    `CREATE TABLE IF NOT EXISTS merchants (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password TEXT NOT NULL, created_at INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS shops (
      id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      owner_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
      settings TEXT NOT NULL, theme_draft TEXT NOT NULL, theme_published TEXT NOT NULL,
      secrets TEXT NOT NULL DEFAULT '', order_seq INTEGER NOT NULL DEFAULT 1000, created_at INTEGER NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS shops_owner ON shops(owner_id)`,
    `CREATE TABLE IF NOT EXISTS products (
      shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE, id TEXT NOT NULL, data TEXT NOT NULL, status TEXT NOT NULL,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (shop_id, id))`,
    `CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY, shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE, email TEXT NOT NULL, name TEXT NOT NULL,
      password TEXT NOT NULL, fit TEXT, created_at INTEGER NOT NULL, UNIQUE (shop_id, email))`,
    `CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE, no TEXT NOT NULL, customer_id TEXT,
      email TEXT NOT NULL, name TEXT NOT NULL DEFAULT '', lines TEXT NOT NULL, item_count INTEGER NOT NULL,
      subtotal REAL NOT NULL, shipping REAL NOT NULL, tax REAL NOT NULL, total REAL NOT NULL,
      ship_method TEXT NOT NULL, pay_method TEXT NOT NULL, address TEXT, status TEXT NOT NULL, payment_status TEXT NOT NULL,
      created_at INTEGER NOT NULL, UNIQUE (shop_id, no))`,
    `CREATE INDEX IF NOT EXISTS orders_shop ON orders(shop_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS orders_customer ON orders(customer_id)`,
    `CREATE TABLE IF NOT EXISTS files (
      shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE, slot TEXT NOT NULL, path TEXT NOT NULL, mime TEXT NOT NULL,
      size INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (shop_id, slot))`,
    `CREATE TABLE IF NOT EXISTS subscribers (
      shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE, email TEXT NOT NULL, created_at INTEGER NOT NULL,
      PRIMARY KEY (shop_id, email))`,
  ],
  // v2: file contents live in the database (serverless hosts have no lasting disk).
  [
    `ALTER TABLE files ADD COLUMN chunks INTEGER NOT NULL DEFAULT 0`,
    `CREATE TABLE IF NOT EXISTS file_chunks (
      shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE, name TEXT NOT NULL, idx INTEGER NOT NULL,
      data BLOB NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY (shop_id, name, idx))`,
  ],
];

const versionOf = async (x: Executor) => Number((await x.all(`SELECT value FROM meta WHERE key = 'schema'`, []))[0]?.value ?? 0);

async function migrate(d: Driver) {
  await d.script([`CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`]);
  if ((await versionOf(d)) >= SCHEMA.length) return;
  await d.tx(async (x) => {
    const v = await versionOf(x); // another server may have just done it
    for (let i = v; i < SCHEMA.length; i++) for (const sql of SCHEMA[i]) await x.run(sql, []);
    await x.run(`INSERT INTO meta (key, value) VALUES ('schema', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [String(SCHEMA.length)]);
  });
}

// ── Connection and public API ───────────────────────────────────────────────

interface Opened { driver: Driver; secret: string }
// Kept on globalThis so dev reloads reuse the connection.
const g = globalThis as unknown as { __lokeifyDb?: Promise<Opened> };

async function open(): Promise<Opened> {
  const t = tursoConfig();
  const driver = t ? tursoDriver(t) : localDriver(path.join(DATA_DIR, "lokeify.db"));
  await migrate(driver);
  // A per-install random secret, used when LOKEIFY_SECRET isn't set. The first server to start wins.
  await driver.run(`INSERT INTO meta (key, value) VALUES ('secret', ?) ON CONFLICT(key) DO NOTHING`, [crypto.randomBytes(32).toString("hex")]);
  const secret = String((await driver.all(`SELECT value FROM meta WHERE key = 'secret'`, []))[0]?.value ?? "");
  if (!secret) throw new DbError("Couldn't set up the server secret.");
  return { driver, secret };
}

function opened(): Promise<Opened> {
  if (!g.__lokeifyDb) {
    g.__lokeifyDb = open().catch((e) => {
      g.__lokeifyDb = undefined;
      throw e;
    });
  }
  return g.__lokeifyDb;
}

/** The random secret stored in the database (see crypto.ts). */
export const storedSecret = async () => (await opened()).secret;

// Queries inside tx() run on the transaction; everything else on the shared connection.
const current = new AsyncLocalStorage<Executor>();
const executor = async (): Promise<Executor> => current.getStore() ?? (await opened()).driver;

export async function all<T = Row>(sql: string, ...params: Value[]): Promise<T[]> {
  return (await (await executor()).all(sql, params)) as T[];
}
export async function one<T = Row>(sql: string, ...params: Value[]): Promise<T | undefined> {
  return (await all<T>(sql, ...params))[0];
}
export async function run(sql: string, ...params: Value[]): Promise<{ changes: number }> {
  return (await executor()).run(sql, params);
}

/** Runs `fn` in a transaction; rolls back if it throws. Nested calls join the outer one. */
export async function tx<T>(fn: () => Promise<T>): Promise<T> {
  if (current.getStore()) return fn();
  const { driver } = await opened();
  return driver.tx((x) => current.run(x, fn));
}
