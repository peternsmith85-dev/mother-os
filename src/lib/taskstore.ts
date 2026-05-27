// Mother OS — Task store abstraction
// • StackBlitz (STACKBLITZ=true): pure JS in-memory Map (no native modules)
// • Local: @libsql/client file-based SQLite

import type { Task, TaskStatus, Source } from '@/types'
import { DEMO_TASKS, computeStressScore } from './utils'

export { computeStressScore }

// ── Shared types ──────────────────────────────────────────────────────────────

export interface TaskFilters {
  status?: string
  proposed?: boolean
  excludeDiscarded?: boolean
}

export interface CreateTaskData {
  title: string
  description?: string | null
  status?: TaskStatus
  priority?: Task['priority']
  due?: string | null
  source?: Source
  sourceRef?: string | null
  tags?: string[]
  proposed?: boolean
  parentId?: string | null
  sortOrder?: number
}

export interface UpdateTaskData {
  title?: string
  description?: string | null
  status?: TaskStatus
  priority?: Task['priority']
  due?: string | null
  tags?: string[]
  proposed?: boolean
  blockedBy?: string | null
  blockedSince?: string | null
  closedAt?: string | null
  reflection?: string | null
  sortOrder?: number
}

export interface TaskStore {
  list(filters?: TaskFilters): Promise<Task[]>
  get(id: string): Promise<Task | null>
  create(data: CreateTaskData): Promise<Task>
  update(id: string, data: UpdateTaskData): Promise<Task | null>
  softDelete(id: string): Promise<void>
  count(): Promise<number>
}

// ── ID generator (no dependencies) ───────────────────────────────────────────

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function now(): string {
  return new Date().toISOString()
}

// ── In-memory store (StackBlitz) ──────────────────────────────────────────────

const g = globalThis as unknown as { _memTasks: Map<string, Task> | undefined }

function getMemTasks(): Map<string, Task> {
  if (!g._memTasks) {
    g._memTasks = new Map()
    // Seed demo tasks immediately
    for (const t of DEMO_TASKS) {
      const id = newId()
      const ts = now()
      g._memTasks.set(id, {
        ...t,
        id,
        createdAt: ts,
        updatedAt: ts,
      })
    }
  }
  return g._memTasks
}

class MemTaskStore implements TaskStore {
  private get tasks() {
    return getMemTasks()
  }

  async list(filters: TaskFilters = {}): Promise<Task[]> {
    let items = Array.from(this.tasks.values())
    if (filters.status) {
      items = items.filter((t) => t.status === filters.status)
    } else if (filters.excludeDiscarded !== false) {
      items = items.filter((t) => t.status !== 'DISCARDED')
    }
    if (filters.proposed !== undefined) {
      items = items.filter((t) => t.proposed === filters.proposed)
    }
    return items.sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt))
  }

  async get(id: string): Promise<Task | null> {
    return this.tasks.get(id) ?? null
  }

  async create(data: CreateTaskData): Promise<Task> {
    const colItems = Array.from(this.tasks.values()).filter(
      (t) => t.status === (data.status ?? 'THIS_WEEK')
    )
    const task: Task = {
      id: newId(),
      title: data.title,
      description: data.description ?? null,
      status: data.status ?? 'THIS_WEEK',
      priority: data.priority ?? 'THIS_WEEK',
      due: data.due ?? null,
      source: data.source ?? 'MANUAL',
      sourceRef: data.sourceRef ?? null,
      tags: data.tags ?? [],
      proposed: data.proposed ?? false,
      parentId: data.parentId ?? null,
      blockedBy: null,
      blockedSince: null,
      closedAt: null,
      reflection: null,
      sortOrder: data.sortOrder ?? colItems.length,
      createdAt: now(),
      updatedAt: now(),
    }
    this.tasks.set(task.id, task)
    return task
  }

  async update(id: string, data: UpdateTaskData): Promise<Task | null> {
    const existing = this.tasks.get(id)
    if (!existing) return null
    const updated: Task = {
      ...existing,
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.due !== undefined && { due: data.due }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.proposed !== undefined && { proposed: data.proposed }),
      ...(data.blockedBy !== undefined && { blockedBy: data.blockedBy }),
      ...(data.blockedSince !== undefined && { blockedSince: data.blockedSince }),
      ...(data.closedAt !== undefined && { closedAt: data.closedAt }),
      ...(data.reflection !== undefined && { reflection: data.reflection }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      updatedAt: now(),
    }
    this.tasks.set(id, updated)
    return updated
  }

  async softDelete(id: string): Promise<void> {
    const t = this.tasks.get(id)
    if (t) this.tasks.set(id, { ...t, status: 'DISCARDED', updatedAt: now() })
  }

  async count(): Promise<number> {
    return this.tasks.size
  }
}

// ── SQLite store (local) ──────────────────────────────────────────────────────

class SqliteTaskStore implements TaskStore {
  private ready = false

  private async db() {
    const { db, ensureSchema } = await import('./db')
    if (!this.ready) {
      await ensureSchema()
      this.ready = true
    }
    return db
  }

  private row(r: Record<string, unknown>): Task {
    const str = (v: unknown) => (v == null ? null : String(v))
    return {
      id: String(r.id),
      title: String(r.title),
      description: str(r.description),
      status: String(r.status) as TaskStatus,
      priority: String(r.priority) as Task['priority'],
      source: String(r.source) as Source,
      sourceRef: str(r.sourceRef),
      tags: (() => { try { return JSON.parse(String(r.tags ?? '[]')) } catch { return [] } })(),
      proposed: r.proposed === 1 || r.proposed === '1' || r.proposed === true,
      parentId: str(r.parentId),
      blockedBy: str(r.blockedBy),
      blockedSince: str(r.blockedSince),
      due: str(r.due),
      closedAt: str(r.closedAt),
      reflection: str(r.reflection),
      sortOrder: Number(r.sortOrder ?? 0),
      createdAt: String(r.createdAt ?? new Date().toISOString()),
      updatedAt: String(r.updatedAt ?? new Date().toISOString()),
    }
  }

  async list(filters: TaskFilters = {}): Promise<Task[]> {
    const client = await this.db()
    let sql = 'SELECT * FROM Task WHERE 1=1'
    const args: (string | number | null)[] = []
    if (filters.status) {
      sql += ' AND status = ?'; args.push(filters.status)
    } else {
      sql += " AND status != 'DISCARDED'"
    }
    if (filters.proposed !== undefined) {
      sql += ' AND proposed = ?'; args.push(filters.proposed ? 1 : 0)
    }
    sql += ' ORDER BY sortOrder ASC, createdAt ASC'
    const r = await client.execute({ sql, args })
    return r.rows.map((row) => this.row(row as Record<string, unknown>))
  }

  async get(id: string): Promise<Task | null> {
    const client = await this.db()
    const r = await client.execute({ sql: 'SELECT * FROM Task WHERE id = ?', args: [id] })
    return r.rows.length ? this.row(r.rows[0] as Record<string, unknown>) : null
  }

  async create(data: CreateTaskData): Promise<Task> {
    const client = await this.db()
    const id = newId()
    const countR = await client.execute({
      sql: 'SELECT COUNT(*) as cnt FROM Task WHERE status = ? AND proposed = ?',
      args: [data.status ?? 'THIS_WEEK', data.proposed ? 1 : 0],
    })
    const sortOrder = data.sortOrder ?? Number((countR.rows[0] as Record<string, unknown>).cnt ?? 0)
    await client.execute({
      sql: `INSERT INTO Task (id,title,description,status,priority,due,source,sourceRef,tags,proposed,parentId,sortOrder)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [id, data.title, data.description ?? null, data.status ?? 'THIS_WEEK',
             data.priority ?? 'THIS_WEEK', data.due ?? null, data.source ?? 'MANUAL',
             data.sourceRef ?? null, JSON.stringify(data.tags ?? []),
             data.proposed ? 1 : 0, data.parentId ?? null, sortOrder],
    })
    return (await this.get(id))!
  }

  async update(id: string, data: UpdateTaskData): Promise<Task | null> {
    const client = await this.db()
    const sets: string[] = ["updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ','now')"]
    const args: (string | number | null)[] = []
    const map: Record<string, unknown> = {
      ...data,
      tags: data.tags !== undefined ? JSON.stringify(data.tags) : undefined,
      proposed: data.proposed !== undefined ? (data.proposed ? 1 : 0) : undefined,
    }
    for (const [k, v] of Object.entries(map)) {
      if (v !== undefined) { sets.push(`${k} = ?`); args.push(v as string | number | null) }
    }
    args.push(id)
    await client.execute({ sql: `UPDATE Task SET ${sets.join(', ')} WHERE id = ?`, args })
    return this.get(id)
  }

  async softDelete(id: string): Promise<void> {
    const client = await this.db()
    await client.execute({ sql: "UPDATE Task SET status = 'DISCARDED' WHERE id = ?", args: [id] })
  }

  async count(): Promise<number> {
    const client = await this.db()
    const r = await client.execute('SELECT COUNT(*) as cnt FROM Task')
    return Number((r.rows[0] as Record<string, unknown>).cnt ?? 0)
  }
}

// ── Export singleton ──────────────────────────────────────────────────────────

const gStore = globalThis as unknown as { _store: TaskStore | undefined }

export const store: TaskStore =
  gStore._store ??
  (gStore._store =
    process.env.STACKBLITZ === 'true' ? new MemTaskStore() : new SqliteTaskStore())
