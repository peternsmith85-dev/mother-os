// Mother OS — Shared Types

// ── Enums ────────────────────────────────────────────────────────────────────

export type TaskStatus =
  | 'CRITICAL'
  | 'TODAY'
  | 'THIS_WEEK'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'DONE'
  | 'DISCARDED'

export type Priority = 'CRITICAL' | 'TODAY' | 'THIS_WEEK' | 'LATER'

export type Source = 'EMAIL' | 'MEETING' | 'MANUAL' | 'MOTHER' | 'OUTLOOK_PASTE' | 'OTHER'

export type NudgeKind =
  | 'GYM'
  | 'WALK'
  | 'COFFEE'
  | 'LARA'
  | 'BAND_PRACTICE'
  | 'GIG'
  | 'QUOTE'
  | 'EMAIL_NUDGE'

// ── Task ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: string
  title: string
  description?: string | null
  status: TaskStatus
  priority: Priority
  due?: string | null // ISO date string
  source: Source
  sourceRef?: string | null
  tags: string[] // parsed from JSON
  proposed: boolean
  parentId?: string | null
  blockedBy?: string | null
  blockedSince?: string | null
  closedAt?: string | null
  reflection?: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  children?: Task[]
}

export type TaskCreateInput = {
  title: string
  description?: string
  status?: TaskStatus
  priority?: Priority
  due?: string
  source?: Source
  sourceRef?: string
  tags?: string[]
  proposed?: boolean
  parentId?: string
}

export type TaskUpdateInput = Partial<Omit<TaskCreateInput, 'source'>> & {
  status?: TaskStatus
  blockedBy?: string | null
  sortOrder?: number
  reflection?: string
}

// ── Kanban ───────────────────────────────────────────────────────────────────

export const COLUMN_ORDER: TaskStatus[] = [
  'CRITICAL',
  'TODAY',
  'THIS_WEEK',
  'IN_PROGRESS',
  'BLOCKED',
  'DONE',
]

export const COLUMN_LABELS: Record<TaskStatus, string> = {
  CRITICAL: 'CRITICAL PATH',
  TODAY: 'TODAY',
  THIS_WEEK: 'THIS WEEK',
  IN_PROGRESS: 'IN PROGRESS',
  BLOCKED: 'BLOCKED',
  DONE: 'DONE',
  DISCARDED: 'DISCARDED',
}

export const COLUMN_CAPS: Partial<Record<TaskStatus, number>> = {
  CRITICAL: 3,
}

// ── Brief ────────────────────────────────────────────────────────────────────

export interface Brief {
  id: string
  generatedAt: string
  body: string
  stressScore: number
  source: 'morning' | 'manual' | 'hourly'
}

// ── Stress Score ─────────────────────────────────────────────────────────────

export interface StressInputs {
  openTodayCount: number
  criticalCount: number
  meetingMinutesToday: number
  unreadInbox: number
  overdueCount: number
  lastBreakMinutes: number
}

// ── API ──────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T
  error?: string
}
