'use client'

import * as React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format, isAfter } from 'date-fns'
import {
  CheckCircle2,
  Mail,
  CalendarDays,
  PauseCircle,
  RotateCcw,
  Trash2,
  GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SourceBadge } from '@/components/ui/badge'
import type { Task, TaskStatus } from '@/types'

interface CardProps {
  task: Task
  isSelected?: boolean
  onClick?: () => void
  onDone?: (id: string) => void
  onBlock?: (id: string) => void
  onDefer?: (id: string) => void
  onDiscard?: (id: string) => void
  onDraftEmail?: (id: string) => void
}

const PRIORITY_BORDER: Record<TaskStatus, string> = {
  CRITICAL: 'border-l-gold',
  TODAY: 'border-l-status-today',
  THIS_WEEK: 'border-l-status-week',
  IN_PROGRESS: 'border-l-blue-400',
  BLOCKED: 'border-l-status-blocked',
  DONE: 'border-l-status-done',
  DISCARDED: 'border-l-white/10',
}

export function TaskCard({
  task,
  isSelected,
  onClick,
  onDone,
  onBlock,
  onDefer,
  onDiscard,
  onDraftEmail,
}: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isPastDue = task.due && isAfter(new Date(), new Date(task.due)) && task.status !== 'DONE'
  const [actionsVisible, setActionsVisible] = React.useState(false)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex flex-col gap-1.5 rounded-xl border-l-[3px] bg-navy-surface px-3 py-2.5',
        'border border-navy-border/60 cursor-pointer',
        'transition-all duration-150',
        PRIORITY_BORDER[task.status],
        isDragging && 'opacity-40 shadow-2xl scale-[0.98]',
        isSelected && 'ring-1 ring-gold/40',
        task.status === 'DONE' && 'opacity-50',
        'hover:border-navy-subtle'
      )}
      onClick={onClick}
      onMouseEnter={() => setActionsVisible(true)}
      onMouseLeave={() => setActionsVisible(false)}
      data-task-id={task.id}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-grab text-white/10 hover:text-white/30 active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={14} />
      </button>

      {/* Source + tags row */}
      <div className="flex items-center gap-1.5 flex-wrap pr-5">
        <SourceBadge source={task.source} />
        {task.tags.map((tag) => (
          <span key={tag} className="text-[10px] text-white/30 font-mono">
            {tag}
          </span>
        ))}
      </div>

      {/* Title */}
      <p
        className={cn(
          'text-sm font-medium leading-snug text-white/90 pr-5',
          task.status === 'DONE' && 'line-through text-white/40'
        )}
      >
        {task.title}
      </p>

      {/* Due date + blocked */}
      <div className="flex items-center gap-2 text-[10px] font-mono">
        {task.due && (
          <span
            className={cn(
              'flex items-center gap-1',
              isPastDue ? 'text-status-today' : 'text-white/30'
            )}
          >
            <CalendarDays size={10} />
            {isPastDue ? '⚠ ' : ''}
            {format(new Date(task.due), 'EEE d MMM HH:mm')}
          </span>
        )}
        {task.blockedBy && (
          <span className="text-status-blocked/80">⏸ {task.blockedBy}</span>
        )}
      </div>

      {/* Action buttons — appear on hover */}
      <div
        className={cn(
          'flex items-center gap-1 pt-1 transition-opacity duration-100',
          actionsVisible ? 'opacity-100' : 'opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <ActionBtn
          icon={<CheckCircle2 size={12} />}
          label="Done (D)"
          onClick={() => onDone?.(task.id)}
          className="hover:text-green-400"
        />
        <ActionBtn
          icon={<Mail size={12} />}
          label="Draft email (E)"
          onClick={() => onDraftEmail?.(task.id)}
          className="hover:text-blue-400"
        />
        <ActionBtn
          icon={<PauseCircle size={12} />}
          label="Block (B)"
          onClick={() => onBlock?.(task.id)}
          className="hover:text-status-blocked"
        />
        <ActionBtn
          icon={<RotateCcw size={12} />}
          label="Defer"
          onClick={() => onDefer?.(task.id)}
          className="hover:text-status-week"
        />
        <ActionBtn
          icon={<Trash2 size={12} />}
          label="Discard"
          onClick={() => onDiscard?.(task.id)}
          className="hover:text-red-400"
        />
      </div>
    </div>
  )
}

function ActionBtn({
  icon,
  label,
  onClick,
  className,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'flex items-center justify-center rounded-lg p-1.5 text-white/30 transition-colors hover:bg-navy-border',
        className
      )}
    >
      {icon}
    </button>
  )
}

// Drag overlay version (simplified)
export function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 rounded-xl border-l-[3px] bg-navy-subtle px-3 py-2.5',
        'border border-navy-border shadow-2xl rotate-1',
        PRIORITY_BORDER[task.status]
      )}
    >
      <p className="text-sm font-medium text-white/90">{task.title}</p>
    </div>
  )
}
