'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight } from 'lucide-react'
import LetterOutput from './LetterOutput'
import type { PipelineOutput as PipelineOutputType } from '@/lib/pipeline/schemas'

interface Props {
  output: PipelineOutputType
  companyName: string
  recipientName?: string
  jobTitle?: string
}

function JsonPanel({ title, data }: { title: string; data: unknown }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-200 dark:border-[#1e1e1e] rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-[12px] font-semibold text-gray-700 dark:text-[#bbb]">{title}</span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <pre className="px-4 py-3 text-[11px] text-gray-500 dark:text-[#555] bg-gray-50 dark:bg-[#0a0a0a] overflow-auto max-h-64">
              {JSON.stringify(data, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PipelineOutput({ output, companyName, recipientName, jobTitle }: Props) {
  const [showDebug, setShowDebug] = useState(false)

  return (
    <div className="space-y-6">
      {/* Main letter output */}
      <LetterOutput
        letter={output.part1}
        businessCase={output.part2}
        techMap={output.part3}
        companyName={companyName}
        recipientName={recipientName}
        jobTitle={jobTitle}
        isStreaming={false}
      />

      {/* Debug toggle */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-[11px] text-gray-400 dark:text-[#555] hover:text-gray-600 dark:hover:text-[#888] underline underline-offset-2 transition-colors"
        >
          {showDebug ? 'Hide pipeline details' : 'Show pipeline details'}
        </button>
      </div>

      {/* Debug panels */}
      <AnimatePresence>
        {showDebug && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="space-y-3"
          >
            <JsonPanel title="Insight" data={output.insight} />
            <JsonPanel title="Cover Letter (structured)" data={output.coverLetter} />
            <JsonPanel title="Business Case (structured)" data={output.businessCase} />
            <JsonPanel title="Tech Map (structured)" data={output.techMap} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
