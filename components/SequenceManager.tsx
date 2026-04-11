'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Clock,
  CheckCircle,
  Lock,
  Play,
  Copy,
  Send,
  ChevronRight,
  AlertCircle,
  RotateCcw
} from 'lucide-react'
import { useCompletion } from '@ai-sdk/react'
import type { SequenceStage, SequenceStatus, SavedPack } from '@/lib/history'
import {
  updateSequenceStatus,
  updateSequenceContent,
  unlockNextStage,
  markAsSent
} from '@/lib/history'
import type { FollowupType } from '@/lib/prompt'
import CopyButton from './CopyButton'

// ── Types ────────────────────────────────────────────────────────────────────

interface SequenceManagerProps {
  pack: SavedPack
  onUpdate: () => void // Callback to refresh parent
}

interface StageConfig {
  key: keyof SequenceStatus
  label: string
  description: string
  icon: typeof Mail
  color: string
  delay: number
}

const STAGES: StageConfig[] = [
  {
    key: 'initial',
    label: 'Initial Letter',
    description: 'Full three-part letter pack',
    icon: Mail,
    color: 'blue',
    delay: 0
  },
  {
    key: 'followup1',
    label: 'Follow-up #1',
    description: 'First follow-up email with fresh angle',
    icon: Clock,
    color: 'amber',
    delay: 7
  },
  {
    key: 'followup2',
    label: 'Follow-up #2',
    description: 'Second touch with gentle urgency',
    icon: Clock,
    color: 'orange',
    delay: 14
  },
  {
    key: 'breakup',
    label: 'Final Email',
    description: 'Polite closing that leaves door open',
    icon: CheckCircle,
    color: 'slate',
    delay: 21
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function SequenceManager({ pack, onUpdate }: SequenceManagerProps) {
  const [generatingStage, setGeneratingStage] = useState<keyof SequenceStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedStage, setExpandedStage] = useState<keyof SequenceStatus | null>('initial')

  const sequence = pack.sequenceStatus ?? {
    initial: 'ready',
    followup1: 'locked',
    followup2: 'locked',
    breakup: 'locked',
  }
  const content = pack.sequenceContent ?? {}

  const handleGenerate = async (stage: keyof SequenceStatus) => {
    if (stage === 'initial' && content.initial) {
      // Initial already exists from original generation
      return
    }

    setGeneratingStage(stage)
    setError(null)

    try {
      updateSequenceStatus(pack.id, stage, 'generating')

      // Gather previous content for context
      const stageOrder: (keyof SequenceStatus)[] = ['initial', 'followup1', 'followup2', 'breakup']
      const stageIndex = stageOrder.indexOf(stage)
      const previousStages = stageOrder.slice(0, stageIndex)
      const previousContent = previousStages
        .map((s) => content[s])
        .filter(Boolean)
        .join('\n\n---\n\n')

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: pack.company,
          url: pack.website || '',
          recipientName: pack.recipientName,
          jobTitle: pack.contactTitle,
          type: stage as FollowupType,
          previousContent,
        }),
        cache: 'no-store',
      })

      if (!res.ok) throw new Error(await res.text())

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let completion = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          completion += decoder.decode(value, { stream: true })
        }
      }

      updateSequenceContent(pack.id, stage, completion)
      updateSequenceStatus(pack.id, stage, 'ready')
      unlockNextStage(pack.id, stage)
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate')
      updateSequenceStatus(pack.id, stage, 'pending')
    } finally {
      setGeneratingStage(null)
    }
  }

  const handleMarkSent = (stage: keyof SequenceStatus) => {
    updateSequenceStatus(pack.id, stage, 'sent')
    if (stage === 'initial') {
      markAsSent(pack.id)
    }
    unlockNextStage(pack.id, stage)
    onUpdate()
  }

  const getStageStatus = (stage: keyof SequenceStatus): SequenceStage | 'locked' => {
    return sequence[stage]
  }

  const getStatusColor = (status: SequenceStage | 'locked') => {
    switch (status) {
      case 'locked': return 'bg-gray-100 dark:bg-gray-800 text-gray-400'
      case 'pending': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
      case 'generating': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
      case 'ready': return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
      case 'sent': return 'bg-slate-100 dark:bg-slate-800 text-slate-500'
    }
  }

  const getStatusIcon = (status: SequenceStage | 'locked') => {
    switch (status) {
      case 'locked': return Lock
      case 'pending': return Clock
      case 'generating': return Play
      case 'ready': return CheckCircle
      case 'sent': return CheckCircle
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Outreach Sequence
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Ready
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Sent
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        {STAGES.map((stage) => {
          const status = getStageStatus(stage.key)
          const Icon = getStatusIcon(status)
          const stageContent = content[stage.key]
          const isExpanded = expandedStage === stage.key
          const isGenerating = generatingStage === stage.key

          return (
            <motion.div
              key={stage.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-xl overflow-hidden transition-colors ${
                status === 'locked'
                  ? 'border-gray-200 dark:border-gray-800 opacity-60'
                  : 'border-gray-200 dark:border-gray-800'
              } ${isExpanded ? 'ring-1 ring-gray-200 dark:ring-gray-700' : ''}`}
            >
              {/* Stage Header */}
              <button
                onClick={() => setExpandedStage(isExpanded ? null : stage.key)}
                disabled={status === 'locked'}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(status)}`}>
                  {isGenerating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {stage.label}
                    </span>
                    {stage.delay > 0 && status !== 'sent' && (
                      <span className="text-xs text-gray-400">
                        +{stage.delay} days
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{stage.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  {status === 'ready' && (
                    <>
                      <CopyButton text={stageContent || ''} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkSent(stage.key)
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        Mark Sent
                      </button>
                    </>
                  )}
                  {status === 'sent' && (
                    <span className="text-xs text-emerald-600 font-medium">Sent</span>
                  )}
                  {status === 'locked' && (
                    <Lock className="w-4 h-4 text-gray-300" />
                  )}
                  {status === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleGenerate(stage.key)
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      Generate
                    </button>
                  )}
                  <ChevronRight
                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </div>
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && stageContent && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-200 dark:border-gray-800"
                  >
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans leading-relaxed max-h-64 overflow-y-auto">
                        {stageContent.replace(/---PART\d---/g, '').trim()}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Progress Summary */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Sequence Progress</span>
          <span>
            {Object.values(sequence).filter(s => s === 'sent').length} / {STAGES.length} sent
          </span>
        </div>
        <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{
              width: `${(Object.values(sequence).filter(s => s === 'sent').length / STAGES.length) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  )
}
