'use client'

import { useEffect, useState } from 'react'
import { useSpring, useMotionValue } from 'framer-motion'
import { TableRow } from '@/lib/parse'

// ── Donut Chart ────────────────────────────────────────────────────────────────

interface DonutProps {
  rows: TableRow[]
}

const COLORS: Record<string, string> = {
  Integrate: '#3b82f6',
  Replace: '#f59e0b',
  Eliminate: '#ef4444',
  Native: '#10b981',
}

export function DonutChart({ rows }: DonutProps) {
  const counts: Record<string, number> = {}
  rows.forEach((r) => {
    counts[r.relationship] = (counts[r.relationship] || 0) + 1
  })

  const total = rows.length
  if (total === 0) return null

  const order = ['Integrate', 'Replace', 'Eliminate', 'Native']

  return (
    <div className="w-full">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
        System breakdown
      </p>
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
        {order.map((cat) => {
          const count = counts[cat]
          if (!count) return null
          const pct = (count / total) * 100
          return (
            <div
              key={cat}
              style={{ width: `${pct}%`, backgroundColor: COLORS[cat] ?? '#9ca3af' }}
              className="h-full first:rounded-l-full last:rounded-r-full"
            />
          )
        })}
      </div>
      <div className="flex flex-wrap gap-4 mt-2">
        {order.map((cat) => {
          const count = counts[cat]
          if (!count) return null
          return (
            <div key={cat} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[cat] ?? '#9ca3af' }} />
              <span className="text-[12px] font-medium text-gray-700">{cat}</span>
              <span className="text-[11px] text-gray-400">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Animated Counter ───────────────────────────────────────────────────────────

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { stiffness: 60, damping: 20 })
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    const unsubscribe = springValue.on('change', (v) => {
      setDisplay(Math.round(v).toString())
    })
    motionValue.set(target)
    return unsubscribe
  }, [target, motionValue, springValue])

  return <span>{display}{suffix}</span>
}

// ── Before/After Cards ───────────────────────────────────────────────────────

export function BeforeAfterCards({ rows }: { rows: TableRow[] }) {
  const current = rows.length
  const replaced = rows.filter((r) => /replace|eliminat/i.test(r.relationship)).length

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="border border-gray-300 bg-white p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
          Current State
        </p>
        <p className="text-[28px] font-bold text-gray-900 leading-none">
          <AnimatedNumber target={current} />
        </p>
        <p className="text-[12px] text-gray-500 mt-1">
          disconnected systems
        </p>
        <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
          {replaced} can be replaced or eliminated
        </p>
      </div>

      <div className="border border-gray-900 bg-gray-900 text-white p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
          Future State
        </p>
        <p className="text-[28px] font-bold text-white leading-none">1</p>
        <p className="text-[12px] text-gray-300 mt-1">unified platform</p>
        <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
          NetSuite at the centre
        </p>
      </div>
    </div>
  )
}

// ── Cost Implication Callout ───────────────────────────────────────────────────

export function CostCallout({ systemCount }: { systemCount: number }) {
  if (systemCount < 5) return null

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 p-4 flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <div>
        <p className="text-[13px] font-semibold text-gray-800 dark:text-[#ddd]">
          Cost implication
        </p>
        <p className="text-[12px] text-gray-600 dark:text-[#999] mt-0.5 leading-relaxed">
          Mid-market companies with {systemCount}+ disconnected systems typically lose{' '}
          <span className="font-bold text-amber-700 dark:text-amber-400">12–18%</span>{' '}
          of finance team capacity to reconciliation and data assembly.
        </p>
      </div>
    </div>
  )
}

// ── Integration Architecture ──────────────────────────────────────────────────

const RELATIONSHIP_COLORS: Record<string, string> = {
  Integrate: '#2563eb',
  Replace: '#d97706',
  Eliminate: '#dc2626',
  Native: '#059669',
}

function rel(r: string): string {
  const l = r.toLowerCase()
  if (l.includes('integrat') || l.includes('connect') || l.includes('sync')) return 'Integrate'
  if (l.includes('replac') || l.includes('substitut') || l.includes('migrat')) return 'Replace'
  if (l.includes('eliminat') || l.includes('remov') || l.includes('retir')) return 'Eliminate'
  if (l.includes('nativ') || l.includes('built-in') || l.includes('internal')) return 'Native'
  return 'Other'
}

export function IntegrationFlow({ rows }: { rows: TableRow[] }) {
  if (rows.length === 0) return null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-4">
        Integration architecture — NetSuite at the centre
      </p>

      <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
        {rows.map((s, i) => {
          const color = RELATIONSHIP_COLORS[rel(s.relationship)] ?? '#94a3b8'
          return (
            <div key={i} className="flex items-start gap-4 px-4 py-3 first:rounded-t-lg last:rounded-b-lg">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: color }} />
              <div className="w-36 flex-shrink-0">
                <p className="text-[13px] font-semibold text-gray-900">{s.system}</p>
              </div>
              <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">
                {rel(s.relationship)}
              </span>
              <p className="flex-1 text-[12px] text-gray-600 leading-relaxed min-w-0">
                {s.meaning}
              </p>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        {['Integrate', 'Replace', 'Eliminate', 'Native'].map((relType) => {
          const count = rows.filter((r) => rel(r.relationship) === relType).length
          if (count === 0) return null
          return (
            <div key={relType} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RELATIONSHIP_COLORS[relType] }} />
              <span className="text-[11px] font-medium text-gray-500">{relType}</span>
              <span className="text-[10px] text-gray-400">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
