// Mother OS — Database initialisation (libSQL/SQLite)
// Run with: node scripts/init-db.mjs
import { createClient } from '@libsql/client'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const dataDir = join(process.cwd(), 'data')
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })

const db = createClient({ url: 'file:./data/mother.db' })

const SCHEMA = `
CREATE TABLE IF NOT EXISTS Task (
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
  createdAt    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updatedAt    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS EmailThread (
  id            TEXT PRIMARY KEY,
  subject       TEXT NOT NULL,
  fromEmail     TEXT NOT NULL,
  lastMessageAt TEXT NOT NULL,
  summary       TEXT,
  taskIds       TEXT NOT NULL DEFAULT '[]',
  syncedAt      TEXT NOT NULL,
  createdAt     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS Meeting (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  occurredAt TEXT NOT NULL,
  attendees  TEXT NOT NULL DEFAULT '[]',
  filePath   TEXT NOT NULL,
  taskIds    TEXT NOT NULL DEFAULT '[]',
  createdAt  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS Brief (
  id          TEXT PRIMARY KEY,
  generatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  body        TEXT NOT NULL,
  stressScore REAL NOT NULL DEFAULT 0,
  source      TEXT NOT NULL DEFAULT 'manual'
);

CREATE TABLE IF NOT EXISTS BankAccount (
  id             TEXT PRIMARY KEY,
  institution    TEXT NOT NULL,
  currentBalance TEXT NOT NULL DEFAULT '0',
  refreshedAt    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS BankTransaction (
  id               TEXT PRIMARY KEY,
  accountId        TEXT NOT NULL,
  postedAt         TEXT NOT NULL,
  amount           TEXT NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'GBP',
  merchant         TEXT,
  rawDescription   TEXT NOT NULL,
  category         TEXT,
  categoryOverride TEXT
);

CREATE TABLE IF NOT EXISTS NudgeEvent (
  id           TEXT PRIMARY KEY,
  kind         TEXT NOT NULL,
  scheduledFor TEXT NOT NULL,
  firedAt      TEXT,
  acted        INTEGER,
  createdAt    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS Speaker (
  id       TEXT PRIMARY KEY,
  alias    TEXT NOT NULL,
  realName TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS OauthToken (
  id        TEXT PRIMARY KEY,
  provider  TEXT NOT NULL,
  encrypted TEXT NOT NULL,
  expiresAt TEXT,
  updatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS QuoteSeen (
  id      TEXT PRIMARY KEY,
  source  TEXT NOT NULL,
  hash    TEXT NOT NULL,
  shownAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS CategoryOverride (
  id        TEXT PRIMARY KEY,
  merchant  TEXT NOT NULL,
  category  TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS LaraContact (
  id            TEXT PRIMARY KEY,
  lastContactAt TEXT NOT NULL,
  method        TEXT NOT NULL,
  createdAt     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS WellbeingConfig (
  id    TEXT PRIMARY KEY,
  key   TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_task_status ON Task (status, proposed);
CREATE INDEX IF NOT EXISTS idx_task_due ON Task (due);
`

async function main() {
  console.log('Initialising Mother OS database...')
  // Execute each statement separately
  const statements = SCHEMA.split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (const stmt of statements) {
    await db.execute(stmt)
  }

  const result = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  )
  console.log('Tables created:', result.rows.map((r) => r.name).join(', '))
  console.log('✓ Database ready at data/mother.db')
}

main().catch(console.error)
