'use client'

import * as React from 'react'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/types'

interface AddCardInputProps {
  status: TaskStatus
  onAdd: (title: string, status: TaskStatus) => void
  onCancel: () => void
}

export function AddCardInput({ status, onAdd, onCancel }: AddCardInputProps) {
  const [value, setValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value.trim()) {
      onAdd(value.trim(), status)
      setValue('')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gold/30 bg-navy-surface p-2 space-y-2"
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel()
        }}
        placeholder="What needs doing?"
        maxLength={80}
        className={cn(
          'w-full bg-transparent text-sm text-white/90 outline-none placeholder:text-white/20',
          'border-b border-navy-border pb-1 focus:border-gold/40'
        )}
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!value.trim()}
          className={cn(
            'flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
            value.trim()
              ? 'bg-gold/20 text-gold hover:bg-gold/30'
              : 'bg-navy-border text-white/20 cursor-not-allowed'
          )}
        >
          <Plus size={11} /> Add card
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-1 text-white/20 hover:text-white/50"
        >
          <X size={13} />
        </button>
        <span className="ml-auto font-mono text-[10px] text-white/20">{80 - value.length}</span>
      </div>
    </form>
  )
}
