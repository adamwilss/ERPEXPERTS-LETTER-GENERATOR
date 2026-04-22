'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Trash2, ChevronDown, ChevronRight, Printer, Mail, Plus, Database, History, Search } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import {
  loadHistory, deletePack, clearHistory, updatePackStatus, initializeSequence,
  updatePackOutcome, markAsSent, type SavedPack, type PackStatus, type OutcomeData
} from '@/lib/history'
import LetterOutput from '@/components/LetterOutput'
import SequenceManager from '@/components/SequenceManager'
import { parseOutput } from '@/lib/parse'

const STATUS_OPTIONS: { value: PackStatus; label: string; color: string; darkColor: string }[] = [
  { value: 'sent', label: 'Sent', color: 'bg-blue-50 text-blue-600 border-blue-200', darkColor: 'dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' },
  { value: 'responded', label: 'Responded', color: 'bg-amber-50 text-amber-600 border-amber-200', darkColor: 'dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
  { value: 'meeting', label: 'Meeting', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', darkColor: 'dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' },
  { value: 'not_interested', label: 'No interest', color: 'bg-gray-100 text-gray-400 border-gray-200', darkColor: 'dark:bg-[#1a1a1a] dark:text-[#444] dark:border-[#1e1e1e]' },
  { value: 'no_response', label: 'No response', color: 'bg-gray-100 text-gray-400 border-gray-200', darkColor: 'dark:bg-[#1a1a1a] dark:text-[#444] dark:border-[#1e1e1e]' },
]

function StatusBadge({ status, onChange }: { status?: PackStatus; onChange: (s: PackStatus | undefined) => void }) {
  const [open, setOpen] = useState(false)
  const current = STATUS_OPTIONS.find((o) => o.value === status)
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        className={`text-[11px] px-2 py-1 rounded-lg border font-semibold transition-all ${
          current
            ? `${current.color} ${current.darkColor}`
            : 'bg-transparent text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600 dark:text-[#444] dark:border-[#1e1e1e] dark:hover:border-[#2a2a2a] dark:hover:text-[#888]'
        }`}
      >
        {current?.label ?? '+ Status'}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#1e1e1e] rounded-xl shadow-lg dark:shadow-none z-10 py-1 min-w-[140px]">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={(e) => {
                e.stopPropagation()
                onChange(status === opt.value ? undefined : opt.value)
                setOpen(false)
              }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors ${
                status === opt.value ? 'font-semibold text-gray-950 dark:text-white' : 'text-gray-500 dark:text-[#555]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function OutcomeModal({
  pack, isOpen, onClose, onSave
}: {
  pack: SavedPack
  isOpen: boolean
  onClose: () => void
  onSave: (outcome: Partial<OutcomeData>) => void
}) {
  const [responseType, setResponseType] = useState<OutcomeData['responseType']>(pack.outcomes?.responseType)
  const [meetingBooked, setMeetingBooked] = useState(pack.outcomes?.meetingBooked ?? false)
  const [notes, setNotes] = useState(pack.outcomes?.notes ?? '')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#1e1e1e] shadow-xl max-w-md w-full p-6"
      >
        <h3 className="text-lg font-bold text-gray-950 dark:text-white mb-4">
          Record Outcome — {pack.company}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="label mb-2">Response type</label>
            <div className="flex gap-2">
              {(['positive', 'neutral', 'negative'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setResponseType(t)}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    responseType === t
                      ? t === 'positive'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                        : t === 'neutral'
                        ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'
                        : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'
                      : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-[#1a1a1a] dark:border-[#1e1e1e] dark:text-[#555]'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="meeting"
              checked={meetingBooked}
              onChange={(e) => setMeetingBooked(e.target.checked)}
              className="rounded border-gray-300 dark:border-[#1e1e1e] dark:bg-[#111]"
            />
            <label htmlFor="meeting" className="text-sm text-gray-700 dark:text-gray-300">
              Meeting booked
            </label>
          </div>

          <div>
            <label className="label mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Wants to see demo, Budget approved in Q2..."
              className="input"
              rows={3}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white transition-colors rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave({ responseType, meetingBooked, notes })
              onClose()
            }}
            className="btn-primary flex-1"
          >
            Save Outcome
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function HistoryPage() {
  const [packs, setPacks] = useState<SavedPack[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [outcomePack, setOutcomePack] = useState<SavedPack | null>(null)

  const loadPacks = useCallback(async () => {
    setLoading(true)
    try {
      const loaded = await loadHistory()
      setPacks(loaded)
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPacks()
  }, [loadPacks])

  const refresh = () => loadPacks()

  const handleDelete = async (id: string) => {
    await deletePack(id)
    await loadPacks()
    if (expanded === id) setExpanded(null)
  }

  const handleStatus = async (id: string, status: PackStatus | undefined) => {
    await updatePackStatus(id, status)
    if (status === 'sent') {
      await initializeSequence(id)
    }
    await loadPacks()
  }

  const handleMarkSent = async (id: string) => {
    await markAsSent(id)
    await initializeSequence(id)
    await loadPacks()
  }

  const handleOutcome = async (outcome: Partial<OutcomeData>) => {
    if (outcomePack) {
      await updatePackOutcome(outcomePack.id, outcome)
      await loadPacks()
    }
  }

  const handleClear = async () => {
    if (confirm('Delete all saved letter packs? This cannot be undone.')) {
      await clearHistory()
      setPacks([])
      setExpanded(null)
    }
  }

  return (
    <main className="page-shell">
      <div className="page-container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="page-badge mb-4">
              <History className="w-3.5 h-3.5 text-emerald-500" />
              Persistent Storage
            </div>
            <h1 className="page-title">Letter history</h1>
            <p className="page-description">
              {packs.length === 0
                ? 'No saved letters yet.'
                : `${packs.length} letter pack${packs.length !== 1 ? 's' : ''} saved`}
            </p>
          </div>
          {packs.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-gray-400 dark:text-[#444] hover:text-red-500 dark:hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/5 font-semibold"
            >
              Clear all
            </button>
          )}
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Database className="w-5 h-5 text-gray-400 dark:text-[#444] animate-pulse" />
            </div>
            <p className="text-sm text-gray-500 dark:text-[#555]">Loading history from database…</p>
          </div>
        ) : packs.length === 0 ? (
          <EmptyState
            icon={<Mail className="w-7 h-7" />}
            title="No saved letters yet"
            description="Generated letter packs will appear here automatically. Start by generating a letter or discovering leads."
            action={
              <Link href="/discover" className="btn btn-secondary">
                Discover leads →
              </Link>
            }
          />
        ) : (
          <div className="space-y-2 stagger-children">
            {packs.map((pack) => {
              const isExpanded = expanded === pack.id
              const parsed = parseOutput(pack.completion)
              const date = new Date(pack.date).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              })

              return (
                <div
                  key={pack.id}
                  className="card card-hover overflow-hidden"
                >
                  <div className="flex items-center justify-between px-5 py-4">
                    <button
                      onClick={() => setExpanded(isExpanded ? null : pack.id)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isExpanded ? 'bg-gray-100 dark:bg-[#1a1a1a]' : 'bg-gray-50 dark:bg-[#111]'}`}>
                        {isExpanded
                          ? <ChevronDown className="w-4 h-4 text-gray-500 dark:text-[#666] flex-shrink-0" />
                          : <ChevronRight className="w-4 h-4 text-gray-300 dark:text-[#333] flex-shrink-0" />
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-950 dark:text-white truncate">{pack.company}</div>
                        <div className="text-xs text-gray-400 dark:text-[#444] mt-1 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#333]" />
                            {pack.recipientName || pack.contactTitle}
                          </span>
                          {pack.location && <span className="inline-flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#333]" /><span>{pack.location}</span></span>}
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#333]" />
                            <span>{date}</span>
                          </span>
                          {pack.erpScore && (
                            <span className="inline-flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#333]" />
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{pack.erpScore}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                    <div className="ml-4 flex items-center gap-1 flex-shrink-0">
                      <StatusBadge status={pack.status} onChange={(s) => handleStatus(pack.id, s)} />
                      <button
                        onClick={() => window.open(`/print?id=${pack.id}`, '_blank')}
                        className="p-2 rounded-lg text-gray-300 dark:text-[#333] hover:text-gray-600 dark:hover:text-[#888] transition-all hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                        title="Print letter"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pack.id)}
                        className="p-2 rounded-lg text-gray-300 dark:text-[#333] hover:text-red-500 dark:hover:text-red-400 transition-all hover:bg-red-50 dark:hover:bg-red-500/5"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-[#181818] p-6 space-y-6">
                      {/* Actions Bar */}
                      <div className="flex items-center gap-2 pb-4 border-b border-gray-200 dark:border-[#1e1e1e]">
                        {!pack.sequenceStatus && (
                          <button
                            onClick={() => handleMarkSent(pack.id)}
                            className="btn-sm badge-info hover:opacity-80"
                          >
                            <Mail className="w-3 h-3" />
                            Start Sequence
                          </button>
                        )}
                        {(pack.status === 'responded' || pack.status === 'meeting') && (
                          <button
                            onClick={() => setOutcomePack(pack)}
                            className="btn-sm badge-success hover:opacity-80"
                          >
                            <Plus className="w-3 h-3" />
                            Record Outcome
                          </button>
                        )}
                        <button
                          onClick={() => window.open(`/print?id=${pack.id}`, '_blank')}
                          className="btn-ghost text-xs font-semibold px-3 py-1.5"
                        >
                          <Printer className="w-3 h-3" />
                          Print
                        </button>
                      </div>

                      {/* Sequence Manager */}
                      {pack.sequenceStatus && (
                        <SequenceManager pack={pack} onUpdate={refresh} />
                      )}

                      {/* Letter Output */}
                      <div className="pt-4 border-t border-gray-200 dark:border-[#1e1e1e]">
                        <LetterOutput
                          coverLetter={parsed.part1}
                          businessCase={parsed.part2}
                          techMap={parsed.part3}
                          companyName={pack.company}
                          isStreaming={false}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <footer className="page-footer">
        ERP Experts Ltd · Internal Outreach Generation Portal
      </footer>

      {/* Outcome Modal */}
      {outcomePack && (
        <OutcomeModal
          pack={outcomePack}
          isOpen={true}
          onClose={() => setOutcomePack(null)}
          onSave={handleOutcome}
        />
      )}
    </main>
  )
}
