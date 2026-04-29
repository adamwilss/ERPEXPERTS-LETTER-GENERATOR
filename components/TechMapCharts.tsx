'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'
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

// ── Integration Architecture Diagram ────────────────────────────────────────────

const RELATIONSHIP_COLORS: Record<string, string> = {
  Integrate: '#2563eb',
  Replace: '#d97706',
  Eliminate: '#dc2626',
  Native: '#059669',
}

function polarPosition(index: number, total: number, radius: number, cx: number, cy: number, startAngle = -Math.PI / 2) {
  const angle = startAngle + (index / Math.max(total, 1)) * 2 * Math.PI
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
    angle,
  }
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
  const integrate = rows.filter((r) => rel(r.relationship) === 'Integrate')
  const replace = rows.filter((r) => rel(r.relationship) === 'Replace')
  const eliminate = rows.filter((r) => rel(r.relationship) === 'Eliminate')
  const native = rows.filter((r) => rel(r.relationship) === 'Native')

  const allSystems = [...integrate, ...native, ...replace, ...eliminate]
  if (allSystems.length === 0) return null

  const svgW = 600
  const svgH = 420
  const cx = 300
  const cy = 210
  const hubR = 48
  const orbitR = 155

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="rounded-xl border border-gray-200 dark:border-[#1e1e1e] bg-white dark:bg-[#111] p-5 overflow-hidden"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#555] mb-2">
        Integration architecture
      </p>

      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
        <defs>
          <filter id="nsShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#2563eb" floodOpacity="0.1" />
          </filter>
          <filter id="nodeShadow" x="-10%" y="-10%" width="130%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.05" />
          </filter>
          {allSystems.map((s) => (
            <linearGradient key={`grad-${s.system}`} id={`grad-${s.system.replace(/\s/g, '')}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={RELATIONSHIP_COLORS[s.relationship] ?? '#94a3b8'} stopOpacity="0.08" />
              <stop offset="100%" stopColor={RELATIONSHIP_COLORS[s.relationship] ?? '#94a3b8'} stopOpacity="0.03" />
            </linearGradient>
          ))}
        </defs>

        {/* Faint orbit ring */}
        <circle cx={cx} cy={cy} r={orbitR} fill="none" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 6" />

        {/* Connection lines + system nodes */}
        {allSystems.map((s, i) => {
          const pos = polarPosition(i, allSystems.length, orbitR, cx, cy)
          const color = RELATIONSHIP_COLORS[s.relationship] ?? '#94a3b8'
          const labelW = Math.min(130, Math.max(80, s.system.length * 8))
          const isRight = pos.x > cx
          const labelX = pos.x + (isRight ? 75 : -75)

          // Position the label to avoid overlap
          const lineEndX = pos.x + (isRight ? 25 : -25)

          return (
            <motion.g
              key={s.system}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.06 }}
            >
              {/* Dashed connection line from hub edge to system */}
              <motion.line
                x1={cx + (pos.x - cx) / orbitR * hubR}
                y1={cy + (pos.y - cy) / orbitR * hubR}
                x2={pos.x}
                y2={pos.y}
                stroke={color}
                strokeWidth={1.2}
                strokeDasharray="3 4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.5 + i * 0.06, duration: 0.5 }}
                style={{ strokeLinecap: 'round' }}
              />

              {/* System dot on the orbit */}
              <circle cx={pos.x} cy={pos.y} r={4} fill="white" stroke={color} strokeWidth={1.5} />

              {/* Label card */}
              <motion.g
                initial={{ opacity: 0, x: isRight ? 5 : -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.06 }}
              >
                <rect
                  x={labelX - labelW / 2}
                  y={pos.y - 16}
                  width={labelW}
                  height={32}
                  rx={7}
                  fill="white"
                  stroke={color}
                  strokeWidth={1}
                  strokeOpacity={0.4}
                  filter="url(#nodeShadow)"
                />
                {/* Color dot indicator */}
                <circle cx={labelX - labelW / 2 + 12} cy={pos.y} r={3.5} fill={color} />
                <text
                  x={labelX - labelW / 2 + 22}
                  y={pos.y + 0.5}
                  dominantBaseline="central"
                  style={{ fontFamily: 'system-ui', fontSize: '11.5px', fontWeight: 600, fill: '#1e293b' }}
                >
                  {s.system}
                </text>
              </motion.g>

              {/* Connector from orbit dot to label */}
              <line
                x1={pos.x} y1={pos.y}
                x2={labelX + (isRight ? -labelW / 2 : labelW / 2)}
                y2={pos.y}
                stroke={color}
                strokeWidth={0.8}
                strokeOpacity={0.3}
                strokeDasharray="2 3"
              />
            </motion.g>
          )
        })}

        {/* Central Hub - NetSuite (clean, light) */}
        <motion.g
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
        >
          <circle cx={cx} cy={cy} r={hubR} fill="white" stroke="#e2e8f0" strokeWidth={1.5} filter="url(#nsShadow)" />
          <circle cx={cx} cy={cy} r={hubR - 6} fill="#f8fafc" stroke="#e2e8f0" strokeWidth={0.5} />
          <text
            x={cx} y={cy - 5}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontFamily: 'system-ui', fontSize: '14px', fontWeight: 700, fill: '#0f172a' }}
          >
            NetSuite
          </text>
          <text
            x={cx} y={cy + 13}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontFamily: 'system-ui', fontSize: '9.5px', fontWeight: 500, fill: '#94a3b8' }}
          >
            Unified Platform
          </text>
        </motion.g>
      </svg>

      {/* Color legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-[#1a1a1a]">
        {['Integrate', 'Replace', 'Eliminate', 'Native'].map((relForCount) => {
          const count = rows.filter((r) => rel(r.relationship) === relForCount).length
          if (count === 0) return null
          return (
            <div key={relForCount} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: RELATIONSHIP_COLORS[relForCount] }}
              />
              <span className="text-[11px] font-medium text-gray-500 dark:text-[#888]">{relForCount}</span>
              <span className="text-[10px] text-gray-400 dark:text-[#555]">{count}</span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
