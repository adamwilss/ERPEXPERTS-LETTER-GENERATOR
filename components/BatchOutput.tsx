'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import LetterOutput from './LetterOutput'
import { WritingAnimation } from './WritingAnimation'
import { parseOutput } from '@/lib/parse'

export interface PackStatus {
  company: string
  status: 'pending' | 'generating' | 'done' | 'error'
  completion?: string
  error?: string
  recipientName?: string
  contactTitle?: string
  erpScore?: number
  website?: string
  location?: string
}

interface Props {
  packs: PackStatus[]
}

export default function BatchOutput({ packs }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const done = packs.filter((p) => p.status === 'done').length
  const total = packs.length
  const allDone = done === total
  const currentlyGenerating = packs.find((p) => p.status === 'generating')

  return (
    <div>
      {/* Progress header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {allDone ? `All ${total} letter packs ready` : `Generating letter packs…`}
            </span>
            {!allDone && currentlyGenerating && (
              <span className="ml-2 text-xs text-gray-400 dark:text-[#444]">Writing {currentlyGenerating.company}</span>
            )}
          </div>
          <span className="text-sm font-semibold tabular-nums text-gray-400 dark:text-[#444]">{done}/{total}</span>
        </div>
        <div className="w-full h-1 bg-gray-200 dark:bg-[#222] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${allDone ? 'bg-emerald-500' : 'bg-gray-700 dark:bg-white'}`}
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
        {!allDone && (
          <p className="text-xs text-gray-400 dark:text-[#444] mt-1.5">
            ~{(total - done) * 45}s remaining · letters appear as each finishes
          </p>
        )}
      </div>

      {/* Pack list */}
      <div className="space-y-1.5">
        {packs.map((pack) => {
          const isExpanded = expanded === pack.company
          const parsed = pack.completion ? parseOutput(pack.completion) : null

          const borderColor = pack.status === 'generating'
            ? 'border-gray-300 dark:border-[#2a2a2a]'
            : pack.status === 'error'
            ? 'border-red-200 dark:border-red-500/20'
            : pack.status === 'done'
            ? 'border-gray-200 dark:border-[#1e1e1e] hover:border-gray-300 dark:hover:border-[#2a2a2a]'
            : 'border-gray-100 dark:border-[#181818]'

          return (
            <div
              key={pack.company}
              className={`bg-white dark:bg-[#111] border rounded-xl overflow-hidden transition-colors duration-150 shadow-sm dark:shadow-none ${borderColor}`}
            >
              {/* Header row */}
              <button
                onClick={() => {
                  if (pack.status === 'done') {
                    setExpanded(isExpanded ? null : pack.company)
                  }
                }}
                className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
                  pack.status === 'done' ? 'hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className="flex items-center gap-3">
                  {pack.status === 'done' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                  ) : pack.status === 'generating' ? (
                    <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                      <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    </div>
                  ) : pack.status === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border-2 border-gray-200 dark:border-[#222] flex-shrink-0" />
                  )}
                  <span className={`text-sm font-medium ${
                    pack.status === 'pending' ? 'text-gray-400 dark:text-[#444]' : 'text-gray-900 dark:text-white'
                  }`}>
                    {pack.company}
                  </span>
                  {pack.status === 'error' && (
                    <span className="text-xs text-red-500 dark:text-red-400">{pack.error ?? 'Generation failed'}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {pack.status === 'done' && (
                    <>
                      <span className="text-xs text-gray-400 dark:text-[#444]">View pack</span>
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 text-gray-400 dark:text-[#444]" />
                        : <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#444]" />
                      }
                    </>
                  )}
                  {pack.status === 'generating' && (
                    <span className="text-xs text-amber-500 dark:text-amber-400 font-semibold animate-pulse">Writing...</span>
                  )}
                  {pack.status === 'pending' && (
                    <span className="text-xs text-gray-300 dark:text-[#333]">Queued</span>
                  )}
                </div>
              </button>

              {/* Expanded letter output */}
              {isExpanded && parsed && (
                <div className="border-t border-gray-100 dark:border-[#181818] p-6">
                  <LetterOutput
                    letter={parsed?.part1 || ''}
                    businessCase={parsed?.part2 || ''}
                    techMap={parsed?.part3 || ''}
                    companyName={pack.company}
                    isStreaming={false}
                  />
                </div>
              )}

              {/* Generating placeholder */}
              {pack.status === 'generating' && (
                <div className="border-t border-gray-100 dark:border-[#181818] px-5 py-8">
                  <div className="flex flex-col items-center gap-4">
                    <WritingAnimation text={`Writing letter for ${pack.company}...`} />
                    <p className="text-xs text-gray-400 dark:text-[#444]">
                      Researching and drafting -- this takes about 45 seconds
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {allDone && (
        <p className="mt-6 text-xs text-gray-400 dark:text-[#444] text-center">
          Click any row to expand and review the letter pack.
        </p>
      )}
    </div>
  )
}
