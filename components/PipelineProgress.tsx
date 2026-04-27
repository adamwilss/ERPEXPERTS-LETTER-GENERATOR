'use client'

import { motion } from 'framer-motion'
import { Search, Lightbulb, FileText, BarChart3, Network, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export type StepStatus = 'pending' | 'running' | 'complete' | 'error'

export interface StepState {
  key: string
  label: string
  icon: typeof Search
  status: StepStatus
  message?: string
  data?: unknown
}

interface Props {
  steps: StepState[]
}

const STEP_CONFIG: { key: string; label: string; icon: typeof Search }[] = [
  { key: 'research', label: 'Research', icon: Search },
  { key: 'insight', label: 'Insight', icon: Lightbulb },
  { key: 'coverLetter', label: 'Cover Letter', icon: FileText },
  { key: 'businessCase', label: 'Business Case', icon: BarChart3 },
  { key: 'techMap', label: 'Tech Map', icon: Network },
  { key: 'review', label: 'Review', icon: CheckCircle },
]

export function createInitialSteps(): StepState[] {
  return STEP_CONFIG.map((s) => ({ ...s, status: 'pending' }))
}

export default function PipelineProgress({ steps }: Props) {
  const activeIndex = steps.findIndex((s) => s.status === 'running')
  const completedCount = steps.filter((s) => s.status === 'complete').length

  return (
    <div className="w-full max-w-xs mb-8">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">
          Pipeline Progress
        </span>
        <span className="text-[11px] font-medium text-gray-400">
          {completedCount}/{steps.length}
        </span>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => {
          const Icon = step.icon
          const isActive = step.status === 'running'
          const isComplete = step.status === 'complete'
          const isError = step.status === 'error'
          const isPending = step.status === 'pending'

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                isActive
                  ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-500/20'
                  : isComplete
                    ? 'bg-gray-50/50 border-gray-200 dark:bg-white/[0.02] dark:border-[#1e1e1e]'
                    : isError
                      ? 'bg-red-50/50 border-red-200 dark:bg-red-500/5 dark:border-red-500/20'
                      : 'bg-transparent border-transparent opacity-50'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : isComplete
                      ? 'bg-gray-100 text-gray-500 dark:bg-[#1a1a1a] dark:text-[#555]'
                      : isError
                        ? 'bg-red-100 text-red-500 dark:bg-red-500/10 dark:text-red-400'
                        : 'bg-gray-100 text-gray-300 dark:bg-[#1a1a1a] dark:text-[#333]'
                }`}
              >
                {isActive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isComplete ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : isError ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[13px] font-medium ${
                      isActive
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : isComplete
                          ? 'text-gray-700 dark:text-[#bbb]'
                          : isError
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-400 dark:text-[#555]'
                    }`}
                  >
                    {step.label}
                  </span>
                  {isComplete && (
                    <span className="text-[10px] text-gray-400 dark:text-[#444]">Done</span>
                  )}
                </div>
                {step.message && isActive && (
                  <span className="text-[11px] text-gray-500 dark:text-[#666] block truncate">
                    {step.message}
                  </span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-4 w-full h-1 bg-gray-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(completedCount / steps.length) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}
