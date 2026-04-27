'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

// ── Animated Counter ───────────────────────────────────────────────────────────

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      {target}{suffix}
    </motion.span>
  )
}

// ── Before/After Cards ───────────────────────────────────────────────────────

function BeforeAfterCards() {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-red-200 bg-red-50/50 p-4"
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-red-600 mb-1">
          Current State
        </p>
        <p className="text-[24px] font-bold text-gray-900 leading-none">
          <AnimatedNumber target={5} suffix="+" />
        </p>
        <p className="text-[12px] text-gray-500 mt-1">
          disconnected tools
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4"
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-1">
          Future State
        </p>
        <p className="text-[24px] font-bold text-gray-900 leading-none">
          1
        </p>
        <p className="text-[12px] text-gray-500 mt-1">
          unified platform
        </p>
      </motion.div>
    </div>
  )
}

// ── Integration Flow Diagram ───────────────────────────────────────────────────

function IntegrationFlow() {
  const leftSystems = ['Ecommerce', 'CRM', 'Warehouse']
  const rightSystems = ['Finance', 'Reporting']

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="rounded-xl border border-gray-200 bg-white p-5 mb-6"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-4">
        How NetSuite connects your operation
      </p>

      <div className="flex items-center justify-center gap-2 flex-wrap">
        {/* Left side systems */}
        <div className="flex flex-col gap-2">
          {leftSystems.map((s) => (
            <div
              key={s}
              className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[11px] font-medium text-blue-700"
            >
              {s}
            </div>
          ))}
        </div>

        {/* Arrows to centre */}
        <div className="flex flex-col items-center gap-3">
          {leftSystems.map((_, i) => (
            <div key={i} className="flex items-center">
              <div className="w-6 h-px bg-gray-300" />
              <svg className="w-3 h-3 text-gray-300 -ml-0.5" fill="currentColor" viewBox="0 0 20 20">
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
          className="px-5 py-3 rounded-xl bg-gray-950 text-white text-[13px] font-bold shadow-lg"
        >
          NetSuite
        </motion.div>

        {/* Arrows from centre */}
        <div className="flex flex-col items-center gap-3">
          {rightSystems.map((_, i) => (
            <div key={i} className="flex items-center">
              <svg className="w-3 h-3 text-gray-300 -mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" />
              </svg>
              <div className="w-6 h-px bg-gray-300" />
            </div>
          ))}
        </div>

        {/* Right side systems */}
        <div className="flex flex-col gap-2">
          {rightSystems.map((s) => (
            <div
              key={s}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-700"
            >
              {s}
            </div>
          ))}
        </div>
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
        <div className="flex items-start gap-4">
          <Image
            src="/erpexperts-logo.png"
            alt="ERP Experts"
            width={80}
            height={28}
            className="h-7 w-auto object-contain"
          />
          <div>
            <div className="text-[13px] font-bold tracking-[0.06em] text-gray-900">ERP EXPERTS</div>
            <div className="text-[11px] text-gray-400 mt-1 tracking-wide">
              NetSuite Implementation · Manchester, UK
            </div>
          </div>
        </div>
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
