import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Task, TaskStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parse tags JSON string to array
export function parseTags(tags: string): string[] {
  try {
    return JSON.parse(tags)
  } catch {
    return []
  }
}

// Serialise task from a raw libsql row (all values are strings/numbers/null)
export function serialiseTask(raw: Record<string, unknown>): Task {
  const str = (v: unknown): string | null =>
    v === null || v === undefined ? null : String(v)

  return {
    id: String(raw.id),
    title: String(raw.title),
    description: str(raw.description),
    status: String(raw.status) as TaskStatus,
    priority: String(raw.priority) as Task['priority'],
    source: String(raw.source) as Task['source'],
    sourceRef: str(raw.sourceRef),
    tags: parseTags(String(raw.tags ?? '[]')),
    proposed: raw.proposed === 1 || raw.proposed === true || raw.proposed === '1',
    parentId: str(raw.parentId),
    blockedBy: str(raw.blockedBy),
    blockedSince: str(raw.blockedSince),
    due: str(raw.due),
    closedAt: str(raw.closedAt),
    reflection: str(raw.reflection),
    sortOrder: Number(raw.sortOrder ?? 0),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  }
}

// Relative date string ("in 2 days", "yesterday", etc.)
export function relativeDate(isoDate: string): string {
  const diff = Math.round(
    (new Date(isoDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff === -1) return 'yesterday'
  if (diff > 0) return `in ${diff} days`
  return `${Math.abs(diff)} days ago`
}

// Stress score (deterministic — no LLM call)
export function computeStressScore(inputs: {
  openTodayCount: number
  criticalCount: number
  meetingMinutesToday: number
  unreadInbox: number
  overdueCount: number
  lastBreakMinutes: number
}): number {
  const norm = (v: number, min: number, max: number) =>
    Math.max(0, Math.min(1, (v - min) / (max - min)))

  const score =
    0.3 * norm(inputs.openTodayCount, 0, 12) +
    0.2 * norm(inputs.criticalCount, 0, 3) +
    0.2 * norm(inputs.meetingMinutesToday, 0, 360) +
    0.1 * norm(inputs.unreadInbox, 0, 50) +
    0.1 * (inputs.overdueCount > 0 ? 1 : 0) +
    0.1 * (inputs.lastBreakMinutes > 120 ? 1 : 0)

  return Math.max(0, Math.min(1, score))
}

// Seed tasks for Phase 0 demo
export const DEMO_TASKS: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'RAD customer reassurance email — JLR timeline',
    status: 'CRITICAL',
    priority: 'CRITICAL',
    source: 'EMAIL',
    sourceRef: null,
    tags: ['#JLR', '#RAD'],
    description: 'Mike flagged this needs to go today. Draft covers timeline slip + mitigation.',
    proposed: false,
    parentId: null,
    blockedBy: null,
    blockedSince: null,
    due: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
    closedAt: null,
    reflection: null,
    sortOrder: 0,
  },
  {
    title: 'Review NHS procurement scope doc',
    status: 'TODAY',
    priority: 'TODAY',
    source: 'EMAIL',
    sourceRef: null,
    tags: ['#NHS'],
    description: 'Sarah sent v3. Need sign-off before 17:00.',
    proposed: false,
    parentId: null,
    blockedBy: null,
    blockedSince: null,
    due: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    closedAt: null,
    reflection: null,
    sortOrder: 0,
  },
  {
    title: 'Prepare 21kWh CAPEX summary for board',
    status: 'THIS_WEEK',
    priority: 'THIS_WEEK',
    source: 'MEETING',
    sourceRef: null,
    tags: ['#21kWh', '#CAPEX'],
    description: 'Pulled from Monday all-hands. Board pack due Friday.',
    proposed: false,
    parentId: null,
    blockedBy: null,
    blockedSince: null,
    due: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
    closedAt: null,
    reflection: null,
    sortOrder: 0,
  },
  {
    title: 'Prey setlist for Bristol Exchange gig',
    status: 'THIS_WEEK',
    priority: 'THIS_WEEK',
    source: 'MANUAL',
    sourceRef: null,
    tags: ['#band'],
    description: 'Gig Saturday. Confirm running order with Tom.',
    proposed: false,
    parentId: null,
    blockedBy: null,
    blockedSince: null,
    due: new Date(Date.now() + 1000 * 60 * 60 * 96).toISOString(),
    closedAt: null,
    reflection: null,
    sortOrder: 1,
  },
  {
    title: 'IP royalty rate — follow up Alex (Fellten legal)',
    status: 'BLOCKED',
    priority: 'THIS_WEEK',
    source: 'EMAIL',
    sourceRef: null,
    tags: ['#JLR'],
    description: 'Waiting on Alex to confirm the rate before we respond to JLR.',
    proposed: false,
    parentId: null,
    blockedBy: 'Alex (legal)',
    blockedSince: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    due: null,
    closedAt: null,
    reflection: null,
    sortOrder: 0,
  },
  {
    title: 'Vendor RFI — EV charger supplier shortlist',
    status: 'IN_PROGRESS',
    priority: 'THIS_WEEK',
    source: 'MANUAL',
    sourceRef: null,
    tags: ['#admin'],
    description: 'Comparing three suppliers. Matrix 60% done.',
    proposed: false,
    parentId: null,
    blockedBy: null,
    blockedSince: null,
    due: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(),
    closedAt: null,
    reflection: null,
    sortOrder: 0,
  },
]
