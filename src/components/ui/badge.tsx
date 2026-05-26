import { cn } from '@/lib/utils'
import type { Source, TaskStatus } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'source' | 'status' | 'tag' | 'default'
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        variant === 'default' && 'bg-navy-border text-white/60',
        variant === 'tag' && 'bg-navy-subtle/50 text-white/50',
        className
      )}
    >
      {children}
    </span>
  )
}

const SOURCE_STYLES: Record<Source, string> = {
  EMAIL: 'bg-blue-900/50 text-blue-300',
  MEETING: 'bg-purple-900/50 text-purple-300',
  MANUAL: 'bg-navy-border text-white/60',
  MOTHER: 'bg-gold/20 text-gold',
  OUTLOOK_PASTE: 'bg-orange-900/50 text-orange-300',
  OTHER: 'bg-navy-border text-white/50',
}

export function SourceBadge({ source }: { source: Source }) {
  return (
    <Badge className={SOURCE_STYLES[source]} variant="source">
      {source === 'OUTLOOK_PASTE' ? 'OUTLOOK' : source}
    </Badge>
  )
}

const STATUS_DOT: Record<TaskStatus, string> = {
  CRITICAL: 'bg-gold',
  TODAY: 'bg-status-today',
  THIS_WEEK: 'bg-status-week',
  IN_PROGRESS: 'bg-blue-400',
  BLOCKED: 'bg-status-blocked',
  DONE: 'bg-status-done',
  DISCARDED: 'bg-white/20',
}

export function StatusDot({ status }: { status: TaskStatus }) {
  return <span className={cn('inline-block h-1.5 w-1.5 rounded-full', STATUS_DOT[status])} />
}
