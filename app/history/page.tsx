'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { loadHistory, deletePack, clearHistory, type SavedPack } from '@/lib/history'
import LetterOutput from '@/components/LetterOutput'
import { parseOutput } from '@/lib/parse'

export default function HistoryPage() {
  const [packs, setPacks] = useState<SavedPack[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    setPacks(loadHistory())
  }, [])

  const handleDelete = (id: string) => {
    deletePack(id)
    setPacks(loadHistory())
    if (expanded === id) setExpanded(null)
  }

  const handleClear = () => {
    if (confirm('Delete all saved letter packs?')) {
      clearHistory()
      setPacks([])
      setExpanded(null)
    }
  }

  return (
    <main className="min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-lg font-bold tracking-tight text-gray-900">ERP EXPERTS</span>
              <span className="ml-3 text-sm text-gray-400">Letter Portal</span>
            </div>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-gray-400 hover:text-gray-700">Single letter</Link>
              <Link href="/discover" className="text-gray-400 hover:text-gray-700">Discover leads</Link>
              <span className="text-gray-900 font-medium">History</span>
            </nav>
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-widest">Internal · Confidential</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Letter history</h1>
            <p className="text-sm text-gray-500 mt-1">
              {packs.length === 0 ? 'No saved letters yet.' : `${packs.length} letter pack${packs.length !== 1 ? 's' : ''} saved in this browser`}
            </p>
          </div>
          {packs.length > 0 && (
            <button onClick={handleClear} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
              Clear all
            </button>
          )}
        </div>

        {packs.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-sm">Generated letter packs will appear here automatically.</p>
            <Link href="/discover" className="mt-4 inline-block text-sm text-gray-900 underline">
              Discover leads →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {packs.map((pack) => {
              const isExpanded = expanded === pack.id
              const parsed = parseOutput(pack.completion)
              const date = new Date(pack.date).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              })

              return (
                <div key={pack.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between px-5 py-4">
                    <button
                      onClick={() => setExpanded(isExpanded ? null : pack.id)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      }
                      <div>
                        <div className="text-sm font-medium text-gray-900">{pack.company}</div>
                        <div className="text-xs text-gray-400 mt-0.5 flex gap-2">
                          <span>{pack.recipientName || pack.contactTitle}</span>
                          {pack.location && <><span>·</span><span>{pack.location}</span></>}
                          <span>·</span>
                          <span>{date}</span>
                          {pack.erpScore && (
                            <><span>·</span><span className="text-emerald-600 font-medium">{pack.erpScore}</span></>
                          )}
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDelete(pack.id)}
                      className="ml-4 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {isExpanded && (
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
        )}
      </div>

      <footer className="mt-auto py-6 text-center text-xs text-gray-400 border-t border-gray-100">
        ERP Experts Ltd · Internal Outreach Generation Portal
      </footer>
    </main>
  )
}
