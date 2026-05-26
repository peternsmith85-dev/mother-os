// Mother OS — Database client
// Uses @libsql/client directly (no Prisma adapter) for StackBlitz compatibility.
// • StackBlitz (STACKBLITZ=true): in-memory SQLite (:memory:)
// • Local: file-based SQLite (file:./data/mother.db)

import { createClient, type Client } from '@libsql/client'
import path from 'path'
import fs from 'fs'

function getDbUrl(): string {
  if (process.env.STACKBLITZ === 'true') return ':memory:'
  const url = process.env.DATABASE_URL || 'file:./data/mother.db'
  if (url.startsWith('file:')) {
    const filePath = url.replace(/^file:/, '')
    const dir = path.dirname(path.resolve(filePath))
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  }
  return url
}

// Singleton — survives Next.js hot-reload in dev
const g = globalThis as unknown as {
  _db: Client | undefined
  _dbReady: boolean
}

export const db: Client = g._db ?? createClient({ url: getDbUrl() })
if (process.env.NODE_ENV !== 'production') g._db = db

// ── Schema ────────────────────────────────────────────────────────────────────

const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS Task (
    id           TEXT PRIMARY KEY,
    title        TEXT NOT NULL,
    description  TEXT,
    status       TEXT NOT NULL DEFAULT 'THIS_WEEK',
    priority     TEXT NOT NULL DEFAULT 'THIS_WEEK',
    due          TEXT,
    source       TEXT NOT NULL DEFAULT 'MANUAL',
    sourceRef    TEXT,
    tags         TEXT NOT NULL DEFAULT '[]',
    proposed     INTEGER NOT NULL DEFAULT 0,
    parentId     TEXT,
    blockedBy    TEXT,
    blockedSince TEXT,
    closedAt     TEXT,
    reflection   TEXT,
    sortOrder    INTEGER NOT NULL DEFAULT 0,
    createdAt    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updatedAt    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_task_status ON Task (status, proposed)`,
  `CREATE INDEX IF NOT EXISTS idx_task_due ON Task (due)`,
  `CREATE TABLE IF NOT EXISTS Brief (
    id          TEXT PRIMARY KEY,
    generatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    body        TEXT NOT NULL,
    stressScore REAL NOT NULL DEFAULT 0,
    source      TEXT NOT NULL DEFAULT 'manual'
  )`,
  `CREATE TABLE IF NOT EXISTS OauthToken (
    id        TEXT PRIMARY KEY,
    provider  TEXT NOT NULL,
    encrypted TEXT NOT NULL,
    expiresAt TEXT,
    updatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`,
  `CREATE TABLE IF NOT EXISTS QuoteSeen (
    id      TEXT PRIMARY KEY,
    source  TEXT NOT NULL,
    hash    TEXT NOT NULL,
    shownAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`,
  `CREATE TABLE IF NOT EXISTS NudgeEvent (
    id           TEXT PRIMARY KEY,
    kind         TEXT NOT NULL,
    scheduledFor TEXT NOT NULL,
    firedAt      TEXT,
    acted        INTEGER,
    createdAt    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`,
  `CREATE TABLE IF NOT EXISTS LaraContact (
    id            TEXT PRIMARY KEY,
    lastContactAt TEXT NOT NULL,
    method        TEXT NOT NULL,
    createdAt     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`,
]

let schemaReady = g._dbReady ?? false

export async function ensureSchema(): Promise<void> {
  if (schemaReady) return
  for (const sql of SCHEMA_SQL) {
    await db.execute(sql)
  }
  schemaReady = true
  if (process.env.NODE_ENV !== 'production') g._dbReady = true
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function newId(): string {
  // URL-safe random ID (~cuid length)
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

/** Convert a libsql Row to a plain object */
export function rowToObj(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row))
}
