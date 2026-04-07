'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import LetterOutput from './LetterOutput'
import { parseOutput } from '@/lib/parse'

export interface PackStatus {
  company: string
  status: 'pending' | 'generating' | 'done' | 'error'
  completion?: string
  error?: string
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
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-sm font-semibold text-gray-900">
              {allDone ? `All ${total} letter packs ready` : `Generating letter packs…`}
            </span>
            {!allDone && currentlyGenerating && (
              <span className="ml-2 text-xs text-gray-400">Writing {currentlyGenerating.company}</span>
            )}
          </div>
          <span className="text-sm font-semibold tabular-nums text-gray-500">{done}/{total}</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${allDone ? 'bg-emerald-500' : 'bg-gray-900'}`}
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
        {!allDone && (
          <p className="text-xs text-gray-400 mt-1.5">
            ~{(total - done) * 45}s remaining · letters appear as each one finishes
          </p>
        )}
      </div>

      {/* Pack list */}
      <div className="space-y-2">
        {packs.map((pack) => {
          const isExpanded = expanded === pack.company
          const parsed = pack.completion ? parseOutput(pack.completion) : null

          return (
            <div
              key={pack.company}
              className={`bg-white border rounded-xl overflow-hidden transition-colors ${
                pack.status === 'done'
                  ? 'border-gray-200 hover:border-gray-300'
                  : pack.status === 'generating'
                  ? 'border-gray-300'
                  : pack.status === 'error'
                  ? 'border-red-200'
                  : 'border-gray-100'
              }`}
            >
              {/* Header row */}
              <button
                onClick={() => {
                  if (pack.status === 'done') {
                    setExpanded(isExpanded ? null : pack.company)
                  }
                }}
                className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
                  pack.status === 'done' ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className="flex items-center gap-3">
                  {pack.status === 'done' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : pack.status === 'generating' ? (
                    <Loader2 className="w-4 h-4 text-gray-500 animate-spin flex-shrink-0" />
                  ) : pack.status === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border-2 border-gray-200 flex-shrink-0" />
                  )}
                  <span className={`text-sm font-medium ${
                    pack.status === 'pending' ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {pack.company}
                  </span>
                  {pack.status === 'error' && (
                    <span className="text-xs text-red-500">{pack.error ?? 'Generation failed'}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {pack.status === 'done' && (
                    <>
                      <span className="text-xs text-gray-400">View pack</span>
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 text-gray-400" />
                        : <ChevronRight className="w-4 h-4 text-gray-400" />
                      }
                    </>
                  )}
                  {pack.status === 'generating' && (
                    <span className="text-xs text-gray-400 animate-pulse">Writing…</span>
                  )}
                  {pack.status === 'pending' && (
                    <span className="text-xs text-gray-300">Queued</span>
                  )}
                </div>
              </button>

              {/* Expanded letter output */}
              {isExpanded && parsed && (
                <div className="border-t border-gray-100 p-6">
                  <LetterOutput
                    coverLetter={parsed.part1}
                    businessCase={parsed.part2}
                    techMap={parsed.part3}
                    companyName={pack.company}
                    isStreaming={false}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {allDone && (
        <p className="mt-6 text-xs text-gray-400 text-center">
          Click any row to expand and review the letter pack.
        </p>
      )}
    </div>
  )
}
