'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Unplug, Layers } from 'lucide-react'

// ── Before/After Cards ───────────────────────────────────────────────────────

function BeforeAfterCards() {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* Current State */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
        className="relative overflow-hidden rounded-2xl border border-red-200/80 bg-gradient-to-br from-red-50 via-red-50/80 to-orange-50/50 p-5 shadow-sm"
      >
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-100/80 flex items-center justify-center">
          <Unplug className="w-4 h-4 text-red-500" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-red-500 mb-2">
          Current State
        </p>
        <p className="text-[32px] font-bold text-gray-900 leading-none tracking-tight">
          5<span className="text-red-400 text-[24px]">+</span>
        </p>
        <p className="text-[13px] font-medium text-gray-600 mt-2">
          disconnected tools
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['Shopify', 'Xero', 'Spreadsheets', '3PL', 'CRM'].map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-red-100/60 text-red-700 font-medium">
              {tag}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Future State */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 120 }}
        className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-teal-50/50 p-5 shadow-sm"
      >
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-emerald-100/80 flex items-center justify-center">
          <Layers className="w-4 h-4 text-emerald-600" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600 mb-2">
          Future State
        </p>
        <p className="text-[32px] font-bold text-gray-900 leading-none tracking-tight">
          1
        </p>
        <p className="text-[13px] font-medium text-gray-600 mt-2">
          unified platform
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['NetSuite'].map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100/60 text-emerald-800 font-semibold">
              {tag}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// ── Integration Architecture Diagram ────────────────────────────────────────────

const HUB_SYSTEMS = [
  { name: 'Ecommerce', examples: 'Shopify, Magento, WooCommerce', relationship: 'Integrate', color: '#2563eb' },
  { name: 'CRM', examples: 'Salesforce, HubSpot, Pipedrive', relationship: 'Integrate', color: '#6366f1' },
  { name: 'Warehouse / 3PL', examples: 'ShipStation, Peoplevox, Mintsoft', relationship: 'Integrate', color: '#0284c7' },
  { name: 'Accounting', examples: 'Xero, Sage, QuickBooks', relationship: 'Replace', color: '#d97706' },
  { name: 'Spreadsheets', examples: 'Stock tracking, month-end, reporting', relationship: 'Eliminate', color: '#dc2626' },
  { name: 'Multi-Currency / VAT', examples: 'International orders, entities', relationship: 'Native', color: '#059669' },
]

function SystemNode({ system, index, total }: { system: typeof HUB_SYSTEMS[number]; index: number; total: number }) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2
  const radius = 180
  const cx = 220
  const cy = 220
  const x = cx + Math.cos(angle) * radius
  const y = cy + Math.sin(angle) * radius

  // Calculate position for the label relative to center
  const labelOffset = 70
  const lx = cx + Math.cos(angle) * labelOffset
  const ly = cy + Math.sin(angle) * labelOffset

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 + index * 0.08, type: 'spring', stiffness: 200 }}
    >
      {/* Connection line from hub to system */}
      <motion.line
        x1={cx} y1={cy} x2={x} y2={y}
        stroke={system.color}
        strokeWidth={1.5}
        strokeDasharray="4 3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.5 + index * 0.08, duration: 0.6 }}
        style={{ strokeLinecap: 'round' }}
      />

      {/* Animated dot along the connection */}
      <circle
        r={3}
        fill={system.color}
        opacity={0.7}
      >
        <animateMotion dur="3s" repeatCount="indefinite" path={`M${cx},${cy} L${x},${y}`} />
      </circle>

      {/* System node */}
      <rect
        x={x - 62} y={y - 19}
        width={124} height={38}
        rx={10}
        fill="white"
        stroke={system.color}
        strokeWidth={1.5}
        filter="url(#cardShadow)"
      />
      <text
        x={x} y={y - 1}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontFamily: 'system-ui', fontSize: '12px', fontWeight: 600, fill: '#111827' }}
      >
        {system.name}
      </text>
      <text
        x={x} y={y + 12}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontFamily: 'system-ui', fontSize: '9px', fontWeight: 500, fill: '#9ca3af' }}
      >
        {system.relationship}
      </text>
    </motion.g>
  )
}

function IntegrationFlow() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-2xl border border-gray-200/80 bg-white p-6 mb-6 shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-4 rounded-full bg-blue-600" />
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500">
          How NetSuite connects your operation
        </p>
      </div>

      <div className="flex justify-center">
        <svg viewBox="0 0 440 440" className="w-full max-w-[440px] h-auto">
          <defs>
            <filter id="cardShadow" x="-10%" y="-10%" width="130%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.06" />
            </filter>
            <filter id="hubShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#2563eb" floodOpacity="0.12" />
            </filter>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" />
            </filter>
          </defs>

          {/* Subtle outer ring */}
          <circle cx="220" cy="220" r="195" fill="none" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 5" />

          {/* Hub - NetSuite */}
          <motion.g
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
          >
            <circle cx="220" cy="220" r="50" fill="white" stroke="#e2e8f0" strokeWidth="1.5" filter="url(#hubShadow)" />
            <circle cx="220" cy="220" r="44" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" />
            <text
              x="220" y="214"
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fontFamily: 'system-ui', fontSize: '15px', fontWeight: 700, fill: '#0f172a' }}
            >
              NetSuite
            </text>
            <text
              x="220" y="232"
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fontFamily: 'system-ui', fontSize: '10px', fontWeight: 500, fill: '#94a3b8' }}
            >
              Unified Platform
            </text>
          </motion.g>

          {/* System nodes around the hub */}
          {HUB_SYSTEMS.map((s, i) => (
            <SystemNode key={s.name} system={s} index={i} total={HUB_SYSTEMS.length} />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-5 pt-4 border-t border-gray-100">
        {[
          { label: 'Integrate', color: '#2563eb' },
          { label: 'Replace', color: '#d97706' },
          { label: 'Eliminate', color: '#dc2626' },
          { label: 'Native', color: '#059669' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[11px] font-medium text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Main Business Case Component ─────────────────────────────────────────────

export default function BusinessCase({ content }: { content: string }) {
  const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

  return (
    <div>
      {/* Letterhead */}
      <div className="flex items-start justify-between pb-7 mb-7 border-b border-gray-200">
        <Image
          src="/erpexperts-logo.png"
          alt="ERP Experts"
          width={200}
          height={70}
          className="h-12 w-auto object-contain"
        />
      </div>

      {/* Charts */}
      <BeforeAfterCards />
      <IntegrationFlow />

      {/* Prose */}
      <div className="font-letter text-[16px] leading-[1.9] text-gray-800 space-y-7">
        {paragraphs.map((para, i) => (
          <p key={i}>{para.trim()}</p>
        ))}
      </div>

      <div className="mt-10 pt-5 border-t border-gray-100 text-[11px] text-gray-400 flex items-center justify-between tracking-wide">
        <span>ERP Experts Ltd · Manchester, UK</span>
        <span>www.erpexperts.co.uk</span>
      </div>
    </div>
  )
}
