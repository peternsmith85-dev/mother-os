'use client'

import * as React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TaskCard } from './Card'
import type { Task, TaskStatus } from '@/types'
import { COLUMN_LABELS, COLUMN_CAPS } from '@/types'

const COLUMN_HEADER_STYLE: Record<TaskStatus, string> = {
  CRITICAL: 'text-gold border-gold/30',
  TODAY: 'text-status-today border-status-today/30',
  THIS_WEEK: 'text-status-week border-status-week/30',
  IN_PROGRESS: 'text-blue-400 border-blue-400/20',
  BLOCKED: 'text-status-blocked border-status-blocked/20',
  DONE: 'text-status-done border-status-done/20',
  DISCARDED: 'text-white/20 border-white/10',
}

interface ColumnProps {
  status: TaskStatus
  tasks: Task[]
  selectedTaskId?: string | null
  onTaskClick?: (task: Task) => void
  onTaskDone?: (id: string) => void
  onTaskBlock?: (id: string) => void
  onTaskDefer?: (id: string) => void
  onTaskDiscard?: (id: string) => void
  onTaskDraftEmail?: (id: string) => void
  onAddCard?: (status: TaskStatus) => void
}

export function Column({
  status,
  tasks,
  selectedTaskId,
  onTaskClick,
  onTaskDone,
  onTaskBlock,
  onTaskDefer,
  onTaskDiscard,
  onTaskDraftEmail,
  onAddCard,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const cap = COLUMN_CAPS[status]
  const atCap = cap !== undefined && tasks.length >= cap
  const label = COLUMN_LABELS[status]

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border border-navy-border/40 bg-navy/60 overflow-hidden',
        'transition-colors duration-150',
        isOver && 'border-gold/30 bg-navy-surface'
      )}
    >
      {/* Column header */}
      <div
        className={cn(
          'flex items-center justify-between border-b px-3 py-2.5',
          COLUMN_HEADER_STYLE[status]
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
          <span className="text-[10px] font-mono opacity-60">
            {tasks.length}
            {cap ? `/${cap}` : ''}
          </span>
        </div>
        <button
          onClick={() => onAddCard?.(status)}
          disabled={atCap}
          title={atCap ? `Cap reached (${cap})` : `Add to ${label}`}
          className={cn(
            'rounded-lg p-1 transition-colors',
            atCap
              ? 'cursor-not-allowed opacity-20'
              : 'text-white/20 hover:bg-navy-border hover:text-white/60'
          )}
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Cards area */}
      <div ref={setNodeRef} className="flex-1 min-h-[60px] overflow-y-auto p-2 space-y-2">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={task.id === selectedTaskId}
              onClick={() => onTaskClick?.(task)}
              onDone={onTaskDone}
              onBlock={onTaskBlock}
              onDefer={onTaskDefer}
              onDiscard={onTaskDiscard}
              onDraftEmail={onTaskDraftEmail}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex h-12 items-center justify-center">
            <span className="text-[10px] text-white/15 italic">empty</span>
          </div>
        )}
      </div>
    </div>
  )
}
