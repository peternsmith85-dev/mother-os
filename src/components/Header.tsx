'use client'

import { format } from 'date-fns'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  stressScore?: number
  onLiftMe?: () => void
}

function StressBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const colour =
    score >= 0.8
      ? 'text-red-400'
      : score >= 0.6
        ? 'text-amber-400'
        : 'text-green-400'

  return (
    <div className="flex items-center gap-1.5 font-mono text-xs">
      <span className="text-white/30">load</span>
      <span className={cn('font-semibold', colour)}>{pct}%</span>
      <div className="h-1.5 w-16 rounded-full bg-navy-border overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            score >= 0.8 ? 'bg-red-500' : score >= 0.6 ? 'bg-amber-400' : 'bg-green-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function Header({ stressScore = 0.3, onLiftMe }: HeaderProps) {
  const now = new Date()

  return (
    <header className="flex h-16 items-center justify-between border-b border-navy-border bg-navy px-5 flex-shrink-0">
      {/* Left: wordmark + date */}
      <div className="flex items-center gap-4">
        <span className="font-mono text-base font-bold tracking-tight text-gold">Mother OS</span>
        <span className="text-sm text-white/40">
          {format(now, 'EEEE d MMMM')}
        </span>
      </div>

      {/* Right: stress + lift me */}
      <div className="flex items-center gap-4">
        <StressBadge score={stressScore} />
        <button
          onClick={onLiftMe}
          className="flex items-center gap-1.5 rounded-xl border border-gold/30 px-3 py-1.5 text-xs font-medium text-gold/80 transition-colors hover:border-gold/60 hover:text-gold"
          title="Lift me (random quote)"
        >
          <Zap size={12} />
          Lift me
        </button>
        <button className="text-white/30 hover:text-white/60 transition-colors" title="Settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        </button>
      </div>
    </header>
  )
}
