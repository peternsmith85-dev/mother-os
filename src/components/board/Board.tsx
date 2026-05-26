'use client'

import * as React from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  closestCenter,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Column } from './Column'
import { CardDetail } from './CardDetail'
import { AddCardInput } from './AddCardInput'
import { ProposedTray } from './ProposedTray'
import { TaskCardOverlay } from './Card'
import { useToast } from '@/components/ui/toast'
import type { Task, TaskStatus } from '@/types'
import { COLUMN_ORDER, COLUMN_CAPS } from '@/types'

interface BoardProps {
  tasks: Task[]
  onUpdateTask: (id: string, changes: Partial<Task>) => Promise<void>
  onCreateTask: (data: { title: string; status: TaskStatus; source?: Task['source'] }) => Promise<void>
  onRefresh: () => void
}

export function Board({ tasks, onUpdateTask, onCreateTask, onRefresh }: BoardProps) {
  const { addToast } = useToast()

  // Selected card (URL-driven in a real app; local state in Phase 0)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const selectedTask = tasks.find((t) => t.id === selectedId) ?? null

  // Active drag
  const [activeDragId, setActiveDragId] = React.useState<string | null>(null)
  const activeDragTask = tasks.find((t) => t.id === activeDragId) ?? null

  // Which column has the add-card input open
  const [addingToStatus, setAddingToStatus] = React.useState<TaskStatus | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // Group tasks by status
  const boardTasks = tasks.filter((t) => !t.proposed && t.status !== 'DISCARDED')
  const proposedTasks = tasks.filter((t) => t.proposed)

  const columns = COLUMN_ORDER.reduce(
    (acc, status) => {
      acc[status] = boardTasks
        .filter((t) => t.status === status)
        .sort((a, b) => a.sortOrder - b.sortOrder)
      return acc
    },
    {} as Record<TaskStatus, Task[]>
  )

  // ── Keyboard navigation ──────────────────────────────────────────────────

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't hijack when typing in an input
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      )
        return

      const allVisible = boardTasks.sort((a, b) => {
        const colA = COLUMN_ORDER.indexOf(a.status as TaskStatus)
        const colB = COLUMN_ORDER.indexOf(b.status as TaskStatus)
        if (colA !== colB) return colA - colB
        return a.sortOrder - b.sortOrder
      })

      const currentIdx = allVisible.findIndex((t) => t.id === selectedId)

      switch (e.key) {
        case 'j':
        case 'ArrowDown': {
          e.preventDefault()
          const next = allVisible[currentIdx + 1]
          if (next) setSelectedId(next.id)
          else if (allVisible.length > 0) setSelectedId(allVisible[0].id)
          break
        }
        case 'k':
        case 'ArrowUp': {
          e.preventDefault()
          const prev = allVisible[currentIdx - 1]
          if (prev) setSelectedId(prev.id)
          else if (allVisible.length > 0) setSelectedId(allVisible[allVisible.length - 1].id)
          break
        }
        case 'Enter': {
          if (selectedId) {
            // Detail is already open if selectedId is set — toggle
            if (selectedTask) setSelectedId(null)
          }
          break
        }
        case 'd':
        case 'D': {
          if (selectedId) {
            handleDone(selectedId)
          }
          break
        }
        case 'b':
        case 'B': {
          if (selectedId) {
            handleBlock(selectedId)
          }
          break
        }
        case 'e':
        case 'E': {
          if (selectedId) {
            addToast('Email drafting active in Phase 5', 'default')
          }
          break
        }
        case 'Escape': {
          setSelectedId(null)
          break
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedId, boardTasks, selectedTask])

  // ── Drag handlers ────────────────────────────────────────────────────────

  function handleDragStart({ active }: DragStartEvent) {
    setActiveDragId(active.id as string)
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveDragId(null)
    if (!over || active.id === over.id) return

    const draggedTask = tasks.find((t) => t.id === active.id)
    if (!draggedTask) return

    // Determine drop target: column id or another task id
    const overIsColumn = COLUMN_ORDER.includes(over.id as TaskStatus)
    const targetStatus: TaskStatus = overIsColumn
      ? (over.id as TaskStatus)
      : (tasks.find((t) => t.id === over.id)?.status as TaskStatus)

    if (!targetStatus) return

    // Check cap
    const cap = COLUMN_CAPS[targetStatus]
    const colTasks = columns[targetStatus]
    if (cap !== undefined && colTasks.length >= cap && draggedTask.status !== targetStatus) {
      addToast(
        `CRITICAL PATH is capped at ${cap}. Move something out first.`,
        'error'
      )
      return
    }

    // Reorder within column or move to new column
    if (draggedTask.status === targetStatus) {
      // Same column reorder
      const colArr = columns[targetStatus]
      const oldIdx = colArr.findIndex((t) => t.id === active.id)
      const newIdx = colArr.findIndex((t) => t.id === over.id)
      const reordered = arrayMove(colArr, oldIdx, newIdx)
      // Persist sort orders
      await Promise.all(
        reordered.map((t, i) => onUpdateTask(t.id, { sortOrder: i }))
      )
    } else {
      // Cross-column move
      await onUpdateTask(draggedTask.id, {
        status: targetStatus,
        priority: statusToPriority(targetStatus),
        sortOrder: columns[targetStatus].length,
      })
      addToast(`Moved to ${targetStatus.replace('_', ' ')}`, 'default')
    }

    onRefresh()
  }

  // ── Task actions ─────────────────────────────────────────────────────────

  async function handleDone(id: string) {
    await onUpdateTask(id, { status: 'DONE', closedAt: new Date().toISOString() } as Partial<Task>)
    addToast('✓ Done', 'success')
    setSelectedId(null)
    onRefresh()
  }

  async function handleBlock(id: string) {
    await onUpdateTask(id, {
      status: 'BLOCKED',
      blockedSince: new Date().toISOString(),
    } as Partial<Task>)
    addToast('⏸ Blocked', 'default')
    onRefresh()
  }

  async function handleDefer(id: string) {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const nextStatus: TaskStatus =
      task.status === 'TODAY' ? 'THIS_WEEK' : task.status === 'CRITICAL' ? 'TODAY' : 'THIS_WEEK'
    await onUpdateTask(id, { status: nextStatus })
    addToast(`Deferred to ${nextStatus.replace('_', ' ')}`, 'default')
    onRefresh()
  }

  async function handleDiscard(id: string) {
    await onUpdateTask(id, { status: 'DISCARDED' } as Partial<Task>)
    addToast('Discarded', 'default')
    setSelectedId(null)
    onRefresh()
  }

  async function handleAcceptProposed(id: string) {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    await onUpdateTask(id, { proposed: false })
    addToast('Card added to board', 'success')
    onRefresh()
  }

  async function handleAcceptAllProposed() {
    await Promise.all(proposedTasks.map((t) => onUpdateTask(t.id, { proposed: false })))
    addToast(`${proposedTasks.length} cards added to board`, 'success')
    onRefresh()
  }

  async function handleRejectProposed(id: string) {
    await onUpdateTask(id, { status: 'DISCARDED', proposed: false } as Partial<Task>)
    addToast('Rejected', 'default')
    onRefresh()
  }

  async function handleUpdateTask(id: string, changes: { title?: string; description?: string }) {
    await onUpdateTask(id, changes)
    onRefresh()
  }

  async function handleAddCard(title: string, status: TaskStatus) {
    await onCreateTask({ title, status, source: 'MANUAL' })
    setAddingToStatus(null)
    addToast('Card added', 'success')
    onRefresh()
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Main board columns */}
        <div className="flex flex-1 gap-2 p-3 overflow-x-auto">
          {COLUMN_ORDER.map((status) => (
            <div key={status} className="flex flex-col min-w-[180px] flex-1 gap-2">
              <Column
                status={status}
                tasks={columns[status]}
                selectedTaskId={selectedId}
                onTaskClick={(task) =>
                  setSelectedId((prev) => (prev === task.id ? null : task.id))
                }
                onTaskDone={handleDone}
                onTaskBlock={handleBlock}
                onTaskDefer={handleDefer}
                onTaskDiscard={handleDiscard}
                onTaskDraftEmail={() =>
                  addToast('Email drafting arrives in Phase 5', 'default')
                }
                onAddCard={(s) => setAddingToStatus(s)}
              />
              {/* Inline add card input */}
              {addingToStatus === status && (
                <AddCardInput
                  status={status}
                  onAdd={handleAddCard}
                  onCancel={() => setAddingToStatus(null)}
                />
              )}
            </div>
          ))}

          {/* Proposed tray */}
          <div className="flex flex-col min-w-[180px] flex-1">
            <ProposedTray
              tasks={proposedTasks}
              onAccept={handleAcceptProposed}
              onReject={handleRejectProposed}
              onAcceptAll={handleAcceptAllProposed}
            />
          </div>
        </div>

        <DragOverlay>
          {activeDragTask ? <TaskCardOverlay task={activeDragTask} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Card detail panel */}
      {selectedTask && (
        <CardDetail
          task={selectedTask}
          onClose={() => setSelectedId(null)}
          onDone={handleDone}
          onBlock={handleBlock}
          onDefer={handleDefer}
          onDiscard={handleDiscard}
          onDraftEmail={() =>
            addToast('Email drafting arrives in Phase 5', 'default')
          }
          onUpdate={handleUpdateTask}
        />
      )}
    </div>
  )
}

// Map column status to priority
function statusToPriority(status: TaskStatus): Task['priority'] {
  const map: Record<TaskStatus, Task['priority']> = {
    CRITICAL: 'CRITICAL',
    TODAY: 'TODAY',
    THIS_WEEK: 'THIS_WEEK',
    IN_PROGRESS: 'THIS_WEEK',
    BLOCKED: 'THIS_WEEK',
    DONE: 'LATER',
    DISCARDED: 'LATER',
  }
  return map[status]
}
