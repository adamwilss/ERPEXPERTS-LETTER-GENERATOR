'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion'
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

  const categories = Object.entries(counts)
  let cumulative = 0

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
        {categories.map(([cat, count]) => {
          const pct = count / total
          const dash = pct * 251.2
          const offset = -cumulative * 251.2
          cumulative += pct
          const color = COLORS[cat] ?? '#9ca3af'
          return (
            <motion.circle
              key={cat}
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeDasharray={`${dash} ${251.2 - dash}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 251.2` }}
              animate={{ strokeDasharray: `${dash} ${251.2 - dash}` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            />
          )
        })}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          className="text-[22px] font-bold fill-gray-900 dark:fill-white"
          style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
        >
          {total}
        </text>
      </svg>
      <div className="space-y-1.5">
        {categories.map(([cat, count]) => (
          <div key={cat} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[cat] ?? '#9ca3af' }}
            />
            <span className="text-[12px] font-medium text-gray-700 dark:text-[#ccc]">
              {cat}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-[#555] ml-auto">
              {count}
            </span>
          </div>
        ))}
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
  const replaced = rows.filter((r) => r.relationship === 'Replace' || r.relationship === 'Eliminate').length
  const integrated = rows.filter((r) => r.relationship === 'Integrate').length
  const native = rows.filter((r) => r.relationship === 'Native').length

  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 p-4"
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1">
          Current State
        </p>
        <p className="text-[24px] font-bold text-gray-900 dark:text-white leading-none">
          <AnimatedNumber target={current} />
        </p>
        <p className="text-[12px] text-gray-500 dark:text-[#777] mt-1">
          disconnected systems
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 p-4"
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
          Future State
        </p>
        <p className="text-[24px] font-bold text-gray-900 dark:text-white leading-none">
          1
        </p>
        <p className="text-[12px] text-gray-500 dark:text-[#777] mt-1">
          unified platform
        </p>
      </motion.div>
    </div>
  )
}

// ── Cost Implication Callout ───────────────────────────────────────────────────

export function CostCallout({ systemCount }: { systemCount: number }) {
  if (systemCount < 5) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6 }}
      className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 p-4 flex items-start gap-3"
    >
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
    </motion.div>
  )
}

// ── Integration Flow Diagram ───────────────────────────────────────────────────

export function IntegrationFlow({ rows }: { rows: TableRow[] }) {
  const integrate = rows.filter((r) => r.relationship === 'Integrate')
  const native = rows.filter((r) => r.relationship === 'Native')

  // Pick up to 3 integrate systems for the diagram
  const leftSystems = integrate.slice(0, 3)
  const rightSystems = native.slice(0, 2)

  if (leftSystems.length === 0 && rightSystems.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="rounded-xl border border-gray-200 dark:border-[#1e1e1e] bg-white dark:bg-[#111] p-5"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#555] mb-4">
        Integration architecture
      </p>

      <div className="flex items-center justify-center gap-2 flex-wrap">
        {/* Left side systems */}
        <div className="flex flex-col gap-2">
          {leftSystems.map((s) => (
            <div
              key={s.system}
              className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-[11px] font-medium text-blue-700 dark:text-blue-400"
            >
              {s.system}
            </div>
          ))}
        </div>

        {/* Arrows to centre */}
        <div className="flex flex-col items-center gap-3">
          {leftSystems.map((_, i) => (
            <div key={i} className="flex items-center">
              <div className="w-6 h-px bg-gray-300 dark:bg-[#333]" />
              <svg className="w-3 h-3 text-gray-300 dark:text-[#444] -ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" />
              </svg>
            </div>
          ))}
        </div>

        {/* NetSuite centre */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, type: 'spring' }}
          className="px-5 py-3 rounded-xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-[13px] font-bold shadow-lg"
        >
          NetSuite
        </motion.div>

        {/* Arrows from centre */}
        <div className="flex flex-col items-center gap-3">
          {rightSystems.map((_, i) => (
            <div key={i} className="flex items-center">
              <svg className="w-3 h-3 text-gray-300 dark:text-[#444] -mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" />
              </svg>
              <div className="w-6 h-px bg-gray-300 dark:bg-[#333]" />
            </div>
          ))}
        </div>

        {/* Right side systems */}
        <div className="flex flex-col gap-2">
          {rightSystems.map((s) => (
            <div
              key={s.system}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
            >
              {s.system}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
