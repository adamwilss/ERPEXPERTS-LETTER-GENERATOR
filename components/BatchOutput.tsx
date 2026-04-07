'use client'

import { useEffect } from 'react'
import { useState } from 'react'
import { ChevronDown, ChevronRight, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import LetterOutput from './LetterOutput'
import { parseOutput } from '@/lib/parse'
import { savePack } from '@/lib/history'

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

  // Auto-save each pack as it completes
  useEffect(() => {
    for (const pack of packs) {
      if (pack.status === 'done' && pack.completion) {
        savePack({
          company: pack.company,
          recipientName: pack.recipientName ?? '',
          contactTitle: pack.contactTitle ?? '',
          completion: pack.completion,
          erpScore: pack.erpScore,
          website: pack.website,
          location: pack.location,
        })
      }
    }
  }, [packs])

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
            <span className="text-sm font-semibold text-white">
              {allDone ? `All ${total} letter packs ready` : `Generating letter packs…`}
            </span>
            {!allDone && currentlyGenerating && (
              <span className="ml-2 text-xs text-[#555]">Writing {currentlyGenerating.company}</span>
            )}
          </div>
          <span className="text-sm font-semibold tabular-nums text-[#555]">{done}/{total}</span>
        </div>
        <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${allDone ? 'bg-emerald-500' : 'bg-white'}`}
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
        {!allDone && (
          <p className="text-xs text-[#444] mt-1.5">
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
            ? 'border-[#2a2a2a]'
            : pack.status === 'error'
            ? 'border-red-500/20'
            : pack.status === 'done'
            ? 'border-[#1e1e1e] hover:border-[#2a2a2a]'
            : 'border-[#141414]'

          return (
            <div
              key={pack.company}
              className={`bg-[#111] border rounded-xl overflow-hidden transition-colors duration-150 ${borderColor}`}
            >
              {/* Header row */}
              <button
                onClick={() => {
                  if (pack.status === 'done') {
                    setExpanded(isExpanded ? null : pack.company)
                  }
                }}
                className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
                  pack.status === 'done' ? 'hover:bg-white/[0.02] cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className="flex items-center gap-3">
                  {pack.status === 'done' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : pack.status === 'generating' ? (
                    <Loader2 className="w-4 h-4 text-[#555] animate-spin flex-shrink-0" />
                  ) : pack.status === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border-2 border-[#2a2a2a] flex-shrink-0" />
                  )}
                  <span className={`text-sm font-medium ${
                    pack.status === 'pending' ? 'text-[#444]' : 'text-white'
                  }`}>
                    {pack.company}
                  </span>
                  {pack.status === 'error' && (
                    <span className="text-xs text-red-400">{pack.error ?? 'Generation failed'}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {pack.status === 'done' && (
                    <>
                      <span className="text-xs text-[#444]">View pack</span>
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 text-[#444]" />
                        : <ChevronRight className="w-4 h-4 text-[#444]" />
                      }
                    </>
                  )}
                  {pack.status === 'generating' && (
                    <span className="text-xs text-[#444] animate-pulse">Writing…</span>
                  )}
                  {pack.status === 'pending' && (
                    <span className="text-xs text-[#333]">Queued</span>
                  )}
                </div>
              </button>

              {/* Expanded letter output */}
              {isExpanded && parsed && (
                <div className="border-t border-[#1a1a1a] p-6">
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
        <p className="mt-6 text-xs text-[#333] text-center">
          Click any row to expand and review the letter pack.
        </p>
      )}
    </div>
  )
}
