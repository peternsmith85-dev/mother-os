'use client'

import * as React from 'react'
import { Music, Users, Heart, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RailSection {
  id: string
  icon: React.ReactNode
  label: string
  content: React.ReactNode
}

function MusicWidget() {
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-white/30">Daily recs arrive in Phase 4</p>
      <div className="space-y-1.5">
        {['Sounds like you', 'Adjacent pick', 'Stretch'].map((label, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg bg-navy-border/30 px-2.5 py-2"
          >
            <div className="h-7 w-7 rounded bg-navy-border flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-white/30 truncate">{label}</p>
              <p className="text-[10px] text-white/15 truncate">Connecting Tidal in Phase 4</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BandWidget() {
  return (
    <div className="space-y-2 text-xs text-white/40">
      <div className="rounded-lg bg-navy-border/30 p-2.5">
        <p className="text-[10px] uppercase tracking-widest text-white/20 mb-1">Next practice</p>
        <p className="text-white/50">Add via calendar in Phase 3</p>
      </div>
      <div className="rounded-lg bg-navy-border/30 p-2.5">
        <p className="text-[10px] uppercase tracking-widest text-white/20 mb-1">
          Prey + Thumbsucker
        </p>
        <p className="text-white/50">Gig tracker in Phase 3</p>
      </div>
    </div>
  )
}

function LaraWidget() {
  const [clicked, setClicked] = React.useState(false)
  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-navy-border/30 p-2.5 space-y-2">
        <p className="text-[10px] text-white/30">
          Lara nudge logic arrives in Phase 2. This button works now.
        </p>
        <button
          onClick={() => setClicked(true)}
          className={cn(
            'w-full rounded-lg py-1.5 text-xs font-medium transition-colors',
            clicked
              ? 'bg-green-900/30 text-green-400'
              : 'bg-navy-border text-white/50 hover:bg-navy-subtle hover:text-white/70'
          )}
        >
          {clicked ? '✓ Logged contact with Lara' : 'I messaged Lara'}
        </button>
      </div>
    </div>
  )
}

function FinanceWidget() {
  return (
    <div className="space-y-2 text-xs text-white/40">
      <p className="text-[10px] text-white/20">
        GoCardless Open Banking connects in Phase 6
      </p>
      <div className="space-y-1.5">
        {['Rent', 'Bouldering', 'Eating out', 'Band', 'Coffee'].map((cat, i) => (
          <div key={cat} className="flex items-center gap-2">
            <span className="w-20 text-[10px] text-white/30 truncate">{cat}</span>
            <div className="flex-1 h-1.5 rounded-full bg-navy-border overflow-hidden">
              <div
                className="h-full rounded-full bg-navy-subtle"
                style={{ width: `${[40, 20, 65, 30, 55][i]}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const SECTIONS: RailSection[] = [
  {
    id: 'music',
    icon: <Music size={13} />,
    label: 'Music',
    content: <MusicWidget />,
  },
  {
    id: 'band',
    icon: <Users size={13} />,
    label: 'Band',
    content: <BandWidget />,
  },
  {
    id: 'lara',
    icon: <Heart size={13} />,
    label: 'Lara',
    content: <LaraWidget />,
  },
  {
    id: 'finance',
    icon: <CreditCard size={13} />,
    label: 'Finance',
    content: <FinanceWidget />,
  },
]

export function RightRail() {
  const [collapsed, setCollapsed] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState('music')

  const section = SECTIONS.find((s) => s.id === activeSection)!

  if (collapsed) {
    return (
      <div className="flex flex-col items-center border-l border-navy-border bg-navy-surface w-10 flex-shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2.5 text-white/20 hover:text-white/60"
        >
          <ChevronLeft size={14} />
        </button>
        <div className="flex flex-col gap-3 mt-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveSection(s.id)
                setCollapsed(false)
              }}
              className={cn(
                'p-2 rounded-lg transition-colors',
                s.id === activeSection ? 'text-gold' : 'text-white/20 hover:text-white/50'
              )}
              title={s.label}
            >
              {s.icon}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-52 flex-shrink-0 border-l border-navy-border bg-navy-surface overflow-hidden">
      {/* Tab row */}
      <div className="flex items-center border-b border-navy-border">
        <div className="flex flex-1 overflow-x-auto">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-2.5 text-[10px] font-semibold uppercase tracking-wide transition-colors whitespace-nowrap',
                s.id === activeSection
                  ? 'border-b-2 border-gold text-gold'
                  : 'text-white/25 hover:text-white/50'
              )}
            >
              {s.icon}
              <span>{s.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="px-2 text-white/20 hover:text-white/50"
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Section content */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-2.5">
          {section.label}
        </p>
        {section.content}
      </div>
    </div>
  )
}
