/**
 * SQLite access layer built on Node's built-in `node:sqlite` (Node >= 22.5).
 *
 * Deliberately dependency-free: no native modules to compile, no engine downloads, so the
 * whole stack installs and runs anywhere Node runs. The API below is a thin typed wrapper
 * (all / get / run / insert / update / tx) and is used by `src/server/queries.ts`.
 */
import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { BOOLEAN_FIELDS, SCHEMA_SQL } from "./schema";

export type SqlParam = string | number | bigint | null | undefined | boolean | Date;

const globalForDb = globalThis as unknown as { __3dsDb?: DatabaseSync };

function resolveDbPath() {
  const raw = (process.env.DATABASE_URL || "./data/app.db").replace(/^file:/, "");
  return path.resolve(process.cwd(), raw);
}

function connect(): DatabaseSync {
  const file = resolveDbPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA_SQL);
  return db;
}

export function getDb(): DatabaseSync {
  if (!globalForDb.__3dsDb) globalForDb.__3dsDb = connect();
  return globalForDb.__3dsDb;
}

function normalizeParams(params: SqlParam[]): (string | number | bigint | null)[] {
  return params.map((p) => {
    if (p === undefined) return null;
    if (p instanceof Date) return p.toISOString();
    if (typeof p === "boolean") return p ? 1 : 0;
    return p;
  });
}

const camel = (key: string) => key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

function normalizeRow<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    const value = row[key];
    const target = key === "id" ? key : camel(key);
    out[target] = BOOLEAN_FIELDS.has(key) || BOOLEAN_FIELDS.has(target) ? Number(value ?? 0) === 1 : value;
  }
  return out as T;
}

export function all<T = Record<string, any>>(sql: string, params: SqlParam[] = []): T[] {
  return getDb()
    .prepare(sql)
    .all(...normalizeParams(params))
    .map((r) => normalizeRow<T>(r as Record<string, unknown>));
}

export function get<T = Record<string, any>>(sql: string, params: SqlParam[] = []): T | null {
  const row = getDb().prepare(sql).get(...normalizeParams(params));
  return row ? normalizeRow<T>(row as Record<string, unknown>) : null;
}

export function firstValue<T = number>(sql: string, params: SqlParam[] = []): T | null {
  const row = get<{ v: T }>(sql, params);
  return row ? row.v : null;
}

export function run(sql: string, params: SqlParam[] = []) {
  const res = getDb().prepare(sql).run(...normalizeParams(params));
  return { changes: Number(res.changes), lastInsertRowid: Number(res.lastInsertRowid) };
}

export function exec(sql: string) {
  getDb().exec(sql);
}

/** Insert an object whose keys already match column names. Returns the id. */
export function insert(table: string, values: Record<string, SqlParam>): string {
  const entries = Object.entries(values).filter(([, v]) => v !== undefined);
  const cols = entries.map(([k]) => `"${k}"`);
  const marks = entries.map(() => "?");
  run(
    `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${marks.join(", ")})`,
    entries.map(([, v]) => v as SqlParam),
  );
  return String(values.id ?? "");
}

const NO_TOUCH = new Set(["id", "created_at"]);

/** Update by id, ignoring undefined values. Returns number of changed rows. */
export function update(table: string, id: string, values: Record<string, SqlParam>) {
  const entries = Object.entries(values).filter(([k, v]) => v !== undefined && !NO_TOUCH.has(k));
  if (!entries.length) return 0;
  const sets = entries.map(([k]) => `"${k}" = ?`).join(", ");
  return run(`UPDATE ${table} SET ${sets} WHERE id = ?`, [...entries.map(([, v]) => v as SqlParam), id]).changes;
}

export function tx<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const out = fn();
    db.exec("COMMIT");
    return out;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 24);
export const nowIso = () => new Date().toISOString();

export function credentialId(prefix = "3DSA") {
  return `${prefix}-${crypto.randomBytes(3).toString("hex").toUpperCase()}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
}

export function dbFile() {
  return resolveDbPath();
}
