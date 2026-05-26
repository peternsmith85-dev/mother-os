'use client'

import * as React from 'react'
import { format } from 'date-fns'
import {
  X,
  CheckCircle2,
  Mail,
  PauseCircle,
  RotateCcw,
  Trash2,
  Tag,
  CalendarDays,
  AlignLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SourceBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Task, TaskStatus } from '@/types'
import { COLUMN_LABELS } from '@/types'

interface CardDetailProps {
  task: Task | null
  onClose: () => void
  onDone?: (id: string) => void
  onBlock?: (id: string) => void
  onDefer?: (id: string) => void
  onDiscard?: (id: string) => void
  onDraftEmail?: (id: string) => void
  onUpdate?: (id: string, changes: { title?: string; description?: string }) => void
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  CRITICAL: 'bg-gold/20 text-gold',
  TODAY: 'bg-status-today/20 text-status-today',
  THIS_WEEK: 'bg-status-week/20 text-status-week',
  IN_PROGRESS: 'bg-blue-900/30 text-blue-400',
  BLOCKED: 'bg-status-blocked/20 text-status-blocked',
  DONE: 'bg-status-done/20 text-status-done',
  DISCARDED: 'bg-white/5 text-white/30',
}

export function CardDetail({
  task,
  onClose,
  onDone,
  onBlock,
  onDefer,
  onDiscard,
  onDraftEmail,
  onUpdate,
}: CardDetailProps) {
  const [editingTitle, setEditingTitle] = React.useState(false)
  const [titleDraft, setTitleDraft] = React.useState('')
  const [editingDesc, setEditingDesc] = React.useState(false)
  const [descDraft, setDescDraft] = React.useState('')

  React.useEffect(() => {
    if (task) {
      setTitleDraft(task.title)
      setDescDraft(task.description ?? '')
    }
  }, [task])

  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!task) return null

  function saveTitle() {
    if (task && titleDraft.trim() && titleDraft !== task.title) {
      onUpdate?.(task.id, { title: titleDraft.trim() })
    }
    setEditingTitle(false)
  }

  function saveDesc() {
    if (task && descDraft !== task.description) {
      onUpdate?.(task.id, { description: descDraft })
    }
    setEditingDesc(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-[480px] max-w-[95vw] flex-col bg-navy-surface border-l border-navy-border shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-navy-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <SourceBadge source={task.source} />
            <span
              className={cn(
                'rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                STATUS_COLORS[task.status]
              )}
            >
              {COLUMN_LABELS[task.status]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/30 hover:bg-navy-border hover:text-white/70"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Title */}
          <div>
            {editingTitle ? (
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTitle()
                  if (e.key === 'Escape') setEditingTitle(false)
                }}
                className="w-full rounded-xl border border-navy-border bg-navy px-3 py-2 text-base font-semibold text-white outline-none focus:border-gold/40"
              />
            ) : (
              <h2
                className="text-base font-semibold text-white/90 cursor-text hover:text-white"
                onClick={() => setEditingTitle(true)}
                title="Click to edit"
              >
                {task.title}
              </h2>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {task.due && (
              <div className="flex items-center gap-1.5 text-white/50">
                <CalendarDays size={12} />
                <span>{format(new Date(task.due), 'EEE d MMM, HH:mm')}</span>
              </div>
            )}
            {task.tags.length > 0 && (
              <div className="flex items-center gap-1.5 text-white/40 flex-wrap">
                <Tag size={12} />
                {task.tags.map((tag) => (
                  <span key={tag} className="font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {task.blockedBy && (
              <div className="col-span-2 text-status-blocked/80">
                ⏸ Waiting on {task.blockedBy}
                {task.blockedSince && (
                  <span className="text-white/30 ml-1">
                    since {format(new Date(task.blockedSince), 'd MMM')}
                  </span>
                )}
              </div>
            )}
            <div className="text-white/25 font-mono text-[10px] col-span-2">
              Created {format(new Date(task.createdAt), 'd MMM yyyy')} · id:{' '}
              {task.id.slice(-8)}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-widest text-white/30">
              <AlignLeft size={10} />
              Description
            </div>
            {editingDesc ? (
              <textarea
                autoFocus
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                onBlur={saveDesc}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setEditingDesc(false)
                }}
                rows={5}
                className="w-full resize-none rounded-xl border border-navy-border bg-navy px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40"
                placeholder="Add a description..."
              />
            ) : (
              <div
                onClick={() => setEditingDesc(true)}
                className="min-h-[60px] cursor-text rounded-xl border border-navy-border/0 px-2 py-1.5 text-sm text-white/50 hover:border-navy-border hover:text-white/70"
              >
                {task.description || (
                  <span className="text-white/20 italic">No description — click to add</span>
                )}
              </div>
            )}
          </div>

          {/* Source ref */}
          {task.sourceRef && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/20 mb-1">
                Source
              </p>
              <a
                href={`https://mail.google.com/mail/u/0/#all/${task.sourceRef}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gold/60 hover:text-gold underline-offset-2 hover:underline"
              >
                Open in Gmail ↗
              </a>
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="border-t border-navy-border px-5 py-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => { onDone?.(task.id); onClose() }}
            className="gap-1.5 bg-green-900/40 text-green-300 hover:bg-green-900/60"
          >
            <CheckCircle2 size={13} /> Done
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { onDraftEmail?.(task.id) }}
            className="gap-1.5"
          >
            <Mail size={13} /> Draft email
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { onBlock?.(task.id); onClose() }}
            className="gap-1.5"
          >
            <PauseCircle size={13} /> Block
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { onDefer?.(task.id); onClose() }}
            className="gap-1.5"
          >
            <RotateCcw size={13} /> Defer
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => { onDiscard?.(task.id); onClose() }}
            className="gap-1.5 ml-auto"
          >
            <Trash2 size={13} /> Discard
          </Button>
        </div>
      </div>
    </>
  )
}
