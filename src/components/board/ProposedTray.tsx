'use client'

import * as React from 'react'
import { CheckCircle2, XCircle, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SourceBadge } from '@/components/ui/badge'
import type { Task } from '@/types'

interface ProposedTrayProps {
  tasks: Task[]
  onAccept: (id: string) => void
  onReject: (id: string) => void
  onAcceptAll: () => void
}

export function ProposedTray({ tasks, onAccept, onReject, onAcceptAll }: ProposedTrayProps) {
  const [expanded, setExpanded] = React.useState(true)

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col rounded-xl border border-navy-border/40 bg-navy/60 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-navy-border/40">
          <Inbox size={12} className="text-white/20" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
            Proposed
          </span>
          <span className="text-[10px] font-mono text-white/15">0</span>
        </div>
        <div className="flex h-12 items-center justify-center">
          <span className="text-[10px] text-white/15 italic">nothing proposed</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col rounded-xl border border-navy-border bg-navy/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-navy-border">
        <div className="flex items-center gap-2">
          <Inbox size={12} className="text-white/50" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
            Proposed
          </span>
          <span className="text-[10px] font-mono text-white/30">{tasks.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {tasks.length > 1 && (
            <button
              onClick={onAcceptAll}
              className="rounded-lg px-2 py-0.5 text-[10px] font-medium text-green-400/70 hover:bg-navy-border hover:text-green-400"
            >
              Accept all
            </button>
          )}
          <button
            onClick={() => setExpanded((p) => !p)}
            className="text-[10px] text-white/20 hover:text-white/50"
          >
            {expanded ? '▾' : '▸'}
          </button>
        </div>
      </div>

      {/* Cards */}
      {expanded && (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-xl border border-navy-border/60 bg-navy-surface px-3 py-2.5 space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <SourceBadge source={task.source} />
                    {task.tags.map((tag) => (
                      <span key={tag} className="text-[10px] text-white/25 font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-white/80 leading-snug truncate">
                    {task.title}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onAccept(task.id)}
                    className="rounded-lg p-1.5 text-white/20 hover:bg-green-900/30 hover:text-green-400 transition-colors"
                    title="Accept onto board"
                  >
                    <CheckCircle2 size={14} />
                  </button>
                  <button
                    onClick={() => onReject(task.id)}
                    className="rounded-lg p-1.5 text-white/20 hover:bg-red-900/30 hover:text-red-400 transition-colors"
                    title="Reject (discard)"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              </div>
              {task.description && (
                <p className="text-[11px] text-white/35 leading-snug line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
