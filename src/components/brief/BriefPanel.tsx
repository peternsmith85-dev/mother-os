'use client'

import * as React from 'react'
import { RefreshCw, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'

interface BriefPanelProps {
  tasks: Task[]
  isLoading?: boolean
}

function generateHeadline(tasks: Task[]): string {
  const critical = tasks.filter((t) => t.status === 'CRITICAL' && !t.proposed).length
  const today = tasks.filter((t) => t.status === 'TODAY' && !t.proposed).length
  const thisWeek = tasks.filter((t) => t.status === 'THIS_WEEK' && !t.proposed).length
  const criticalTask = tasks.find((t) => t.status === 'CRITICAL')

  const parts = []
  if (critical) parts.push(`${critical} critical`)
  if (today) parts.push(`${today} today`)
  if (thisWeek) parts.push(`${thisWeek} this week`)

  const summary = parts.join(', ') || 'Clear board'
  const hill = criticalTask ? `. ${criticalTask.title.split(' ').slice(0, 4).join(' ')} is the hill.` : '.'

  return summary + hill
}

function BriefSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[80, 60, 90, 50].map((w, i) => (
        <div key={i} className="h-3 rounded bg-navy-border" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

export function BriefPanel({ tasks, isLoading }: BriefPanelProps) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)

  const critical = tasks.filter((t) => t.status === 'CRITICAL' && !t.proposed)
  const atRisk = tasks.filter(
    (t) =>
      !t.proposed &&
      t.due &&
      new Date(t.due) < new Date() &&
      t.status !== 'DONE' &&
      t.status !== 'DISCARDED'
  )
  const blocked = tasks.filter((t) => t.status === 'BLOCKED' && !t.proposed)
  const headline = generateHeadline(tasks)

  function handleRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1200)
  }

  function handleTTS() {
    if ('speechSynthesis' in window) {
      const text = `Morning brief. ${headline}`
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.05
      speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="border-b border-navy-border bg-navy-surface flex-shrink-0">
      {/* Collapsed bar */}
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="w-full px-5 py-2.5 text-left text-xs text-white/40 hover:text-white/60"
        >
          ▸ Morning brief — {headline}
        </button>
      ) : (
        <div className="px-5 py-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/30">
              Morning Brief
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTTS}
                className="p-1 text-white/30 hover:text-white/60 transition-colors"
                title="Read aloud"
              >
                <Volume2 size={13} />
              </button>
              <button
                onClick={handleRefresh}
                className={cn(
                  'p-1 text-white/30 hover:text-white/60 transition-colors',
                  refreshing && 'animate-spin text-gold/60'
                )}
                title="Refresh brief"
              >
                <RefreshCw size={13} />
              </button>
              <button
                onClick={() => setCollapsed(true)}
                className="p-1 text-white/30 hover:text-white/60 transition-colors text-xs"
                title="Collapse"
              >
                ▾
              </button>
            </div>
          </div>

          {isLoading ? (
            <BriefSkeleton />
          ) : (
            <div className="space-y-3">
              {/* Headline */}
              <p className="text-sm font-medium text-white/90 leading-snug">{headline}</p>

              {/* Critical path */}
              {critical.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gold/60 mb-1.5">
                    Critical path
                  </p>
                  <div className="space-y-1">
                    {critical.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-xs text-white/70">
                        <span className="h-1 w-3 rounded-full bg-gold flex-shrink-0" />
                        {t.title}
                        {t.due && (
                          <span className="ml-auto text-white/30 font-mono text-[10px]">
                            {new Date(t.due).toLocaleDateString('en-GB', {
                              weekday: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* At risk */}
              {atRisk.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-status-today/70 mb-1">
                    At risk
                  </p>
                  <div className="space-y-1">
                    {atRisk.slice(0, 3).map((t) => (
                      <p key={t.id} className="text-xs text-status-today/80">
                        ⚠ {t.title}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Blocked */}
              {blocked.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-status-blocked/70 mb-1">
                    Blocked
                  </p>
                  {blocked.slice(0, 2).map((t) => (
                    <p key={t.id} className="text-xs text-white/50">
                      ⏸ {t.title}
                      {t.blockedBy && (
                        <span className="ml-1 text-white/30">— waiting on {t.blockedBy}</span>
                      )}
                    </p>
                  ))}
                </div>
              )}

              {/* Phase 0 placeholder for wellbeing + Lara */}
              <div className="flex gap-4 pt-1 border-t border-navy-border/50">
                <p className="text-[10px] text-white/30">
                  💪 Wellbeing nudges active in Phase 2
                </p>
                <p className="text-[10px] text-white/30">
                  📧 Email brief active in Phase 1
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
