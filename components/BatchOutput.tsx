'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, CheckCircle, Loader2 } from 'lucide-react'
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

  return (
    <div>
      {/* Progress summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {done === total ? 'All letter packs generated' : `Generating packs… ${done} of ${total} done`}
          </span>
          <span className="text-xs text-gray-400">{done}/{total}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-500"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Pack list */}
      <div className="space-y-2">
        {packs.map((pack) => {
          const isExpanded = expanded === pack.company
          const parsed = pack.completion ? parseOutput(pack.completion) : null

          return (
            <div
              key={pack.company}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
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
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : pack.status === 'generating' ? (
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
                  ) : pack.status === 'error' ? (
                    <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xs flex-shrink-0">!</span>
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium text-gray-900">{pack.company}</span>
                  {pack.status === 'error' && (
                    <span className="text-xs text-red-500 ml-1">{pack.error ?? 'Generation failed'}</span>
                  )}
                </div>

                {pack.status === 'done' && (
                  isExpanded
                    ? <ChevronDown className="w-4 h-4 text-gray-400" />
                    : <ChevronRight className="w-4 h-4 text-gray-400" />
                )}

                {pack.status === 'generating' && (
                  <span className="text-xs text-gray-400">Writing…</span>
                )}

                {pack.status === 'pending' && (
                  <span className="text-xs text-gray-300">Queued</span>
                )}
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
    </div>
  )
}
