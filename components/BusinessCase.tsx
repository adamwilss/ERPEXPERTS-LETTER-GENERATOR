'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Unplug, Layers, ArrowRight, ArrowLeft } from 'lucide-react'

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

// ── Integration Flow Diagram ───────────────────────────────────────────────────

function IntegrationFlow() {
  const leftSystems = [
    { name: 'Ecommerce', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { name: 'CRM', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
    { name: 'Warehouse', color: 'bg-sky-50 border-sky-200 text-sky-700' },
  ]
  const rightSystems = [
    { name: 'Finance', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { name: 'Reporting', color: 'bg-teal-50 border-teal-200 text-teal-700' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-2xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/50 p-6 mb-6 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-4 rounded-full bg-gray-950" />
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500">
          How NetSuite connects your operation
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 md:gap-6">
        {/* Left side systems */}
        <div className="flex flex-col gap-2.5 min-w-[100px]">
          {leftSystems.map((s) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className={`px-3.5 py-2 rounded-lg border text-[12px] font-semibold text-center shadow-sm ${s.color}`}
            >
              {s.name}
            </motion.div>
          ))}
        </div>

        {/* Arrows to centre */}
        <div className="flex flex-col items-center gap-3">
          {leftSystems.map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 + i * 0.1 }}
              className="flex items-center"
            >
              <div className="w-5 h-px bg-gray-300" />
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 -ml-1" />
            </motion.div>
          ))}
        </div>

        {/* NetSuite centre */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.1, type: 'spring', stiffness: 200 }}
          className="px-6 py-4 rounded-2xl bg-gray-950 text-white text-[14px] font-bold shadow-xl shadow-gray-950/20 min-w-[120px] text-center"
        >
          NetSuite
        </motion.div>

        {/* Arrows from centre */}
        <div className="flex flex-col items-center gap-3">
          {rightSystems.map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 + i * 0.1 }}
              className="flex items-center"
            >
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 -mr-1" />
              <div className="w-5 h-px bg-gray-300" />
            </motion.div>
          ))}
        </div>

        {/* Right side systems */}
        <div className="flex flex-col gap-2.5 min-w-[100px]">
          {rightSystems.map((s) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.3 }}
              className={`px-3.5 py-2 rounded-lg border text-[12px] font-semibold text-center shadow-sm ${s.color}`}
            >
              {s.name}
            </motion.div>
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
