'use client'

import * as React from 'react'
import { SendHorizonal, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MotherChatProps {
  onSend?: (message: string) => void
  isLoading?: boolean
}

export function MotherChat({ onSend, isLoading }: MotherChatProps) {
  const [message, setMessage] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  // / key focuses the input
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.key === '/' && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || isLoading) return
    onSend?.(message.trim())
    setMessage('')
  }

  return (
    <div className="border-t border-navy-border bg-navy flex-shrink-0">
      <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3">
        <Sparkles size={14} className="text-gold/40 flex-shrink-0" />
        <input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask Mother anything… (press / to focus)"
          className={cn(
            'flex-1 bg-transparent text-sm text-white/80 outline-none',
            'placeholder:text-white/20',
          )}
        />
        <button
          type="submit"
          disabled={!message.trim() || isLoading}
          className={cn(
            'flex-shrink-0 rounded-lg p-1.5 transition-colors',
            message.trim() && !isLoading
              ? 'text-gold hover:bg-gold/10'
              : 'text-white/15 cursor-not-allowed'
          )}
        >
          <SendHorizonal size={14} />
        </button>
      </form>
      {/* Phase 1 placeholder */}
      <div className="px-4 pb-2">
        <p className="text-[10px] text-white/15">
          Full Mother agent active in Phase 1 · Phase 0 skeleton
        </p>
      </div>
    </div>
  )
}
