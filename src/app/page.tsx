'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/Header'
import { BriefPanel } from '@/components/brief/BriefPanel'
import { Board } from '@/components/board/Board'
import { RightRail } from '@/components/rail/RightRail'
import { MotherChat } from '@/components/chat/MotherChat'
import { useToast } from '@/components/ui/toast'
import { computeStressScore } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types'

// ── API helpers ───────────────────────────────────────────────────────────────

async function fetchTasks(): Promise<Task[]> {
  const res = await fetch('/api/tasks')
  if (!res.ok) throw new Error('Failed to fetch tasks')
  const json = await res.json()
  return json.data
}

async function createTask(data: {
  title: string
  status: TaskStatus
  source?: Task['source']
}): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to create task')
  }
  return (await res.json()).data
}

async function updateTask(id: string, changes: Partial<Task>): Promise<Task> {
  // Serialise tags back to array if present
  const body = { ...changes }
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to update task')
  }
  return (await res.json()).data
}

async function seedTasks(): Promise<void> {
  await fetch('/api/seed', { method: 'POST' })
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const qc = useQueryClient()
  const { addToast } = useToast()
  const [seeded, setSeeded] = React.useState(false)

  // Tasks
  const {
    data: tasks = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  // Auto-seed demo tasks on first load
  React.useEffect(() => {
    if (!isLoading && tasks.length === 0 && !seeded) {
      setSeeded(true)
      seedTasks().then(() => refetch())
    }
  }, [isLoading, tasks.length, seeded, refetch])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: { title: string; status: TaskStatus; source?: Task['source'] }) =>
      createTask(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
    onError: (err: Error) => addToast(err.message, 'error'),
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<Task> }) =>
      updateTask(id, changes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
    onError: (err: Error) => addToast(err.message, 'error'),
  })

  // Stress score (deterministic)
  const stressScore = React.useMemo(() => {
    const boardTasks = tasks.filter((t) => !t.proposed)
    return computeStressScore({
      openTodayCount: boardTasks.filter((t) => t.status === 'TODAY').length,
      criticalCount: boardTasks.filter((t) => t.status === 'CRITICAL').length,
      meetingMinutesToday: 0, // Phase 2: pull from calendar
      unreadInbox: 0, // Phase 1: pull from Gmail
      overdueCount: boardTasks.filter(
        (t) =>
          t.due && new Date(t.due) < new Date() && !['DONE', 'DISCARDED'].includes(t.status)
      ).length,
      lastBreakMinutes: 0, // Phase 2: wellbeing engine
    })
  }, [tasks])

  return (
    <div
      className="flex h-full flex-col bg-navy overflow-hidden"
      style={{ contain: 'strict' }}
    >
      {/* ── Header ─────────────────────────────────────────────── 64px */}
      <Header
        stressScore={stressScore}
        onLiftMe={() => addToast('"Would I rather be feared or loved? Both. I want people to be afraid of how much they love me." — Michael Scott', 'default', 8000)}
      />

      {/* ── Morning Brief ──────────────────────────────────────── ~22% */}
      <BriefPanel tasks={tasks} isLoading={isLoading} />

      {/* ── Board + Rail ───────────────────────────────────────── flex */}
      <div className="flex flex-1 overflow-hidden">
        <Board
          tasks={tasks}
          onUpdateTask={async (id, changes) => {
            await updateMutation.mutateAsync({ id, changes })
          }}
          onCreateTask={async (data) => {
            await createMutation.mutateAsync(data)
          }}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['tasks'] })}
        />
        <RightRail />
      </div>

      {/* ── Mother chat input ──────────────────────────────────── ~5% */}
      <MotherChat
        onSend={(msg) =>
          addToast(`Mother hears you: "${msg}" — full agent arrives in Phase 1`, 'default', 5000)
        }
      />
    </div>
  )
}
