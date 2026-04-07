'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trash2, ChevronDown, ChevronRight, Printer } from 'lucide-react'
import { loadHistory, deletePack, clearHistory, updatePackStatus, type SavedPack, type PackStatus } from '@/lib/history'
import LetterOutput from '@/components/LetterOutput'
import { parseOutput } from '@/lib/parse'

const STATUS_OPTIONS: { value: PackStatus; label: string; color: string }[] = [
  { value: 'sent', label: 'Sent', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'responded', label: 'Responded', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'meeting', label: 'Meeting', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'not_interested', label: 'No interest', color: 'bg-gray-100 text-gray-500 border-gray-200' },
]

function StatusBadge({ status, onChange }: { status?: PackStatus; onChange: (s: PackStatus | undefined) => void }) {
  const [open, setOpen] = useState(false)
  const current = STATUS_OPTIONS.find((o) => o.value === status)
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        className={`text-xs px-2 py-1 rounded-md border font-medium transition-colors ${
          current ? current.color : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
        }`}
      >
        {current?.label ?? '+ Status'}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[130px]">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={(e) => { e.stopPropagation(); onChange(status === opt.value ? undefined : opt.value); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${status === opt.value ? 'font-semibold' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

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

  const handleStatus = (id: string, status: PackStatus | undefined) => {
    updatePackStatus(id, status)
    setPacks(loadHistory())
  }

  const handleClear = () => {
    if (confirm('Delete all saved letter packs?')) {
      clearHistory()
      setPacks([])
      setExpanded(null)
    }
  }

  return (
    <main className="min-h-[calc(100vh-56px)]">
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
                    <div className="ml-4 flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={pack.status} onChange={(s) => handleStatus(pack.id, s)} />
                      <button
                        onClick={() => window.open(`/print?id=${pack.id}`, '_blank')}
                        className="text-gray-300 hover:text-gray-700 transition-colors"
                        title="Print letter"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pack.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
