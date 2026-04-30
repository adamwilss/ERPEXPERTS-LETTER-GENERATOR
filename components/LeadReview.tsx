'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ExternalLink, User, MapPin, Mail, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface Lead {
  rank: number
  company: string
  website: string
  industry: string
  employees: string
  description: string
  erpScore: number
  dataScore: number
  rationale: string
  contactTitle: string
  contactName?: string
  contactEmail?: string
  contactLinkedIn?: string
  orgId?: string
  foundedYear?: number
  annualRevenue?: string
  techStack?: string[]
  location?: string
  phone?: string
  linkedinUrl?: string
  postalAddress?: string
}

export interface ReviewedLead extends Lead {
  recipientName: string
}

interface Props {
  leads: Lead[]
  totalSearched: number
  onGenerate: (leads: ReviewedLead[]) => void
  isStreaming?: boolean
  streamStatus?: string
  streamProgress?: { done: number; total: number }
}

function contactBadge(dataScore: number): { label: string; className: string } {
  if (dataScore >= 100) return { label: 'Full', className: 'badge-success' }
  if (dataScore >= 65) return { label: 'Email', className: 'badge-warning' }
  if (dataScore >= 35) return { label: 'Name', className: 'badge-neutral' }
  return { label: 'None', className: 'badge-neutral opacity-60' }
}

function ScoreDisplay({ erpScore, dataScore }: { erpScore: number; dataScore: number }) {
  const erpColor = erpScore >= 60
    ? 'text-emerald-600 dark:text-emerald-400'
    : erpScore >= 35
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-gray-400 dark:text-[#444]'

  const badge = contactBadge(dataScore)

  return (
    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
      <div className="flex flex-col items-end">
        <span className={`text-2xl font-bold tabular-nums leading-none ${erpColor}`}>{erpScore}</span>
        <span className="text-[10px] text-gray-400 dark:text-[#444] mt-0.5 uppercase tracking-[0.07em]">ERP fit</span>
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
        {badge.label}
      </span>
    </div>
  )
}

function LeadCard({
  lead,
  index,
  onRemove,
  onGenerate,
  onUpdateTitle,
  onUpdateName,
  editingTitle,
  editingName,
  setEditingTitle,
  setEditingName,
}: {
  lead: ReviewedLead
  index: number
  onRemove: () => void
  onGenerate: () => void
  onUpdateTitle: (v: string) => void
  onUpdateName: (v: string) => void
  editingTitle: boolean
  editingName: boolean
  setEditingTitle: (v: boolean) => void
  setEditingName: (v: boolean) => void
}) {
  return (
    <div className="card card-hover overflow-hidden">
      <div className="p-5">
        <div className="flex gap-4 items-start">
          {/* Rank */}
          <div className="flex-shrink-0 w-5 text-[11px] font-bold text-gray-300 dark:text-[#333] mt-1 tabular-nums">
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            {/* Top row */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 dark:text-white text-[15px] leading-tight">{lead.company}</span>
                  {lead.website && (
                    <a
                      href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-gray-300 dark:text-[#333] hover:text-gray-500 dark:hover:text-[#555] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {lead.linkedinUrl && (
                    <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-gray-400 dark:text-[#444] hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium border border-gray-200 dark:border-[#1e1e1e] px-1.5 py-0.5 rounded"
                    >
                      in
                    </a>
                  )}
                </div>
                <div className="text-xs text-gray-400 dark:text-[#444] mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span>{lead.industry}</span>
                  {lead.employees !== 'Unknown' && (
                    <><span className="text-gray-200 dark:text-[#222]">·</span><span>{lead.employees} employees</span></>
                  )}
                  {lead.location && (
                    <><span className="text-gray-200 dark:text-[#222]">·</span>
                    <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{lead.location}</span></>
                  )}
                  {lead.foundedYear && (
                    <><span className="text-gray-200 dark:text-[#222]">·</span><span>Est. {lead.foundedYear}</span></>
                  )}
                  {lead.annualRevenue && (
                    <><span className="text-gray-200 dark:text-[#222]">·</span><span className="text-gray-500 dark:text-[#555]">{lead.annualRevenue}</span></>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <ScoreDisplay erpScore={lead.erpScore} dataScore={lead.dataScore} />
                <motion.button
                  whileHover={{ scale: 1.15, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={onRemove}
                  className="text-gray-300 dark:text-[#333] hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/5"
                  title="Skip this lead"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Description */}
            {lead.description && (
              <p className="text-xs text-gray-500 dark:text-[#555] mt-3 leading-relaxed line-clamp-2">{lead.description}</p>
            )}

            {/* Tech stack */}
            {lead.techStack && lead.techStack.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2.5">
                {lead.techStack.map((tech) => (
                  <span key={tech} className="text-[11px] bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-[#555] border border-gray-200 dark:border-[#1e1e1e] rounded px-1.5 py-0.5">
                    {tech}
                  </span>
                ))}
              </div>
            )}

            {/* Rationale */}
            <p className="text-xs text-gray-400 dark:text-[#444] mt-2.5 leading-relaxed italic">{lead.rationale}</p>

            {/* Contact + address */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#181818]">
              {lead.contactName && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                    <span className="text-[13px] font-semibold text-gray-900 dark:text-white">{lead.contactName}</span>
                    <span className="text-xs text-gray-400 dark:text-[#444]">{lead.contactTitle}</span>
                  </div>
                  {lead.contactEmail && (
                    <a href={`mailto:${lead.contactEmail}`}
                      className="flex items-center gap-1 text-xs text-gray-400 dark:text-[#444] hover:text-gray-700 dark:hover:text-[#ccc] transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      {lead.contactEmail}
                    </a>
                  )}
                  {lead.contactLinkedIn && (
                    <a href={lead.contactLinkedIn} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-gray-400 dark:text-[#444] hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-gray-200 dark:border-[#1e1e1e] px-1.5 py-0.5 rounded"
                    >
                      in
                    </a>
                  )}
                </div>
              )}

              {lead.postalAddress && (
                <div className="mb-3 bg-gray-50 dark:bg-[#0d0d0d] rounded-lg px-3 py-2.5 border border-gray-200 dark:border-[#1e1e1e]">
                  <p className="text-[10px] text-gray-400 dark:text-[#444] mb-1.5 font-medium uppercase tracking-[0.1em]">Post to</p>
                  <pre className="text-xs text-gray-600 dark:text-[#888] font-sans whitespace-pre-line leading-relaxed">
                    {lead.contactName ? `${lead.contactName}\n` : ''}{lead.contactTitle ? `${lead.contactTitle}\n` : ''}{lead.company}{'\n'}{lead.postalAddress}
                  </pre>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onGenerate}
                  className="btn-primary btn-sm"
                >
                  Generate letter →
                </motion.button>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400 dark:text-[#444]">Address to:</span>
                    {editingTitle ? (
                      <input
                        autoFocus value={lead.contactTitle}
                        onChange={(e) => onUpdateTitle(e.target.value)}
                        onBlur={() => setEditingTitle(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                        className="text-xs bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded px-2 py-0.5 text-gray-900 dark:text-white focus:outline-none focus:border-gray-500 dark:focus:border-[#444] w-44"
                      />
                    ) : (
                      <button onClick={() => setEditingTitle(true)}
                        className="text-xs text-gray-500 dark:text-[#555] underline decoration-dotted hover:text-gray-800 dark:hover:text-[#ccc] transition-colors"
                      >
                        {lead.contactTitle}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400 dark:text-[#444]">Name:</span>
                    {editingName ? (
                      <input
                        autoFocus value={lead.recipientName}
                        onChange={(e) => onUpdateName(e.target.value)}
                        onBlur={() => setEditingName(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
                        placeholder="e.g. Sarah Jennings"
                        className="text-xs bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded px-2 py-0.5 text-gray-900 dark:text-white focus:outline-none focus:border-gray-500 dark:focus:border-[#444] w-44 placeholder-gray-300 dark:placeholder-[#333]"
                      />
                    ) : (
                      <button onClick={() => setEditingName(true)}
                        className={`text-xs underline decoration-dotted transition-colors ${lead.recipientName ? 'text-gray-500 dark:text-[#555] hover:text-gray-800 dark:hover:text-[#ccc]' : 'text-gray-300 dark:text-[#333] hover:text-gray-500 dark:hover:text-[#555]'}`}
                      >
                        {lead.recipientName || 'Add name'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LeadReview({ leads: allLeads, totalSearched, onGenerate, isStreaming, streamStatus, streamProgress }: Props) {
  const toReviewed = (l: Lead): ReviewedLead => ({ ...l, recipientName: l.contactName ?? '' })

  const ACTIVE_SIZE = 10
  const [active, setActive] = useState<ReviewedLead[]>(() => allLeads.slice(0, ACTIVE_SIZE).map(toReviewed))
  const [bench, setBench] = useState<ReviewedLead[]>(() => allLeads.slice(ACTIVE_SIZE).map(toReviewed))
  const [showBench, setShowBench] = useState(false)
  const [editingTitle, setEditingTitle] = useState<number | null>(null)
  const [editingName, setEditingName] = useState<number | null>(null)
  const processedRanks = useRef(new Set<number>())

  useEffect(() => {
    const newLeads = allLeads.filter((l) => !processedRanks.current.has(l.rank))
    if (newLeads.length === 0) return
    for (const l of newLeads) processedRanks.current.add(l.rank)

    const newReviewed = newLeads.map(toReviewed)

    setActive((currentActive) => {
      const needed = ACTIVE_SIZE - currentActive.length
      if (needed <= 0) {
        setBench((b) => [...b, ...newReviewed])
        return currentActive
      }
      const forActive = newReviewed.slice(0, needed)
      const forBench = newReviewed.slice(needed)
      if (forBench.length > 0) setBench((b) => [...b, ...forBench])
      return [...currentActive, ...forActive]
    })
  }, [allLeads])

  const handleRemove = (rank: number) => {
    if (bench.length > 0) {
      const [replacement, ...rest] = bench
      setActive((prev) => [...prev.filter((l) => l.rank !== rank), replacement])
      setBench(rest)
    } else {
      setActive((prev) => prev.filter((l) => l.rank !== rank))
    }
  }

  const updateTitle = (rank: number, value: string) =>
    setActive((prev) => prev.map((l) => (l.rank === rank ? { ...l, contactTitle: value } : l)))
  const updateName = (rank: number, value: string) =>
    setActive((prev) => prev.map((l) => (l.rank === rank ? { ...l, recipientName: value } : l)))

  const promoteFromBench = (benchLead: ReviewedLead) => {
    setBench((prev) => prev.filter((l) => l.rank !== benchLead.rank))
    if (active.length < ACTIVE_SIZE) {
      setActive((prev) => [...prev, benchLead])
    }
  }

  const totalRemaining = bench.length

  return (
    <div>
      {/* Streaming status bar */}
      <AnimatePresence>
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5 flex items-center gap-3"
          >
            <Loader2 className="w-3.5 h-3.5 text-gray-400 dark:text-[#444] animate-spin flex-shrink-0" />
            <span className="text-xs text-gray-500 dark:text-[#555]">{streamStatus || 'Finding leads…'}</span>
            {streamProgress && streamProgress.total > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <div className="w-24 h-0.5 bg-gray-200 dark:bg-[#222] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gray-400 dark:bg-white rounded-full"
                    animate={{ width: `${(streamProgress.done / streamProgress.total) * 100}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <span className="text-[11px] text-gray-400 dark:text-[#444] tabular-nums">
                  {streamProgress.done}/{streamProgress.total}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {active.length > 0 ? `${active.length} prospects` : isStreaming ? 'Searching…' : 'No results'}
          </h2>
          <p className="text-sm text-gray-400 dark:text-[#444] mt-1">
            {totalSearched > 0 && <>Scored from {totalSearched.toLocaleString()} companies · </>}
            {totalRemaining > 0 && (
              <span className="text-gray-400 dark:text-[#444]">{totalRemaining} more in reserve</span>
            )}
            {isStreaming && active.length === 0 && (
              <span className="text-gray-400 dark:text-[#444]">First leads arriving shortly…</span>
            )}
          </p>
        </div>

        {totalRemaining > 0 && (
          <motion.div
            key={totalRemaining}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <span className="text-xs text-gray-400 dark:text-[#444] tabular-nums">
              {totalRemaining} in bench
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: Math.min(totalRemaining, 8) }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="w-1 h-3 bg-gray-200 dark:bg-[#222] rounded-sm"
                />
              ))}
              {totalRemaining > 8 && <span className="text-[10px] text-gray-400 dark:text-[#444] ml-1">+{totalRemaining - 8}</span>}
            </div>
          </motion.div>
        )}
      </div>

      {/* Active deck -- best ERP fit first, contact completeness as tiebreaker */}
      <div className="space-y-2 mb-6">
        <AnimatePresence mode="popLayout" initial={false}>
          {[...active].sort((a, b) => b.erpScore - a.erpScore || b.dataScore - a.dataScore || a.rank - b.rank).map((lead, i) => (
            <motion.div
              key={lead.rank}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                x: 80,
                scale: 0.95,
                filter: 'blur(2px)',
                transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
              }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 32,
                delay: i === active.length - 1 ? 0.05 : 0,
              }}
            >
              <LeadCard
                lead={lead}
                index={i}
                onRemove={() => handleRemove(lead.rank)}
                onGenerate={() => onGenerate([lead])}
                onUpdateTitle={(v) => updateTitle(lead.rank, v)}
                onUpdateName={(v) => updateName(lead.rank, v)}
                editingTitle={editingTitle === lead.rank}
                editingName={editingName === lead.rank}
                setEditingTitle={(v) => setEditingTitle(v ? lead.rank : null)}
                setEditingName={(v) => setEditingName(v ? lead.rank : null)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bench / reserve pool */}
      {bench.length > 0 && (
        <div className="mb-8">
          <button
            onClick={() => setShowBench((v) => !v)}
            className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#444] hover:text-gray-600 dark:hover:text-[#888] transition-colors mb-3"
          >
            {showBench ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showBench ? 'Hide' : 'Show'} reserve pool ({bench.length} companies)
          </button>

          <AnimatePresence>
            {showBench && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-1">
                  {bench.map((lead, i) => (
                    <motion.div
                      key={lead.rank}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.025 }}
                      className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1e1e1e] rounded-lg hover:border-gray-300 dark:hover:border-[#2a2a2a] transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[11px] text-gray-300 dark:text-[#333] tabular-nums w-4 flex-shrink-0">{i + ACTIVE_SIZE + 1}</span>
                        <div className="min-w-0">
                          <span className="text-sm text-gray-600 dark:text-[#888] group-hover:text-gray-900 dark:group-hover:text-white transition-colors truncate block">{lead.company}</span>
                          <span className="text-xs text-gray-400 dark:text-[#444]">{lead.industry} · {lead.employees} employees</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold tabular-nums ${lead.erpScore >= 60 ? 'text-emerald-600 dark:text-emerald-400' : lead.erpScore >= 35 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-300 dark:text-[#333]'}`}>
                            {lead.erpScore}
                          </span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${contactBadge(lead.dataScore).className}`}>
                            {contactBadge(lead.dataScore).label}
                          </span>
                        </div>
                        {active.length < ACTIVE_SIZE && (
                          <button
                            onClick={() => promoteFromBench(lead)}
                            className="text-[10px] text-gray-400 dark:text-[#444] hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-[#1e1e1e] hover:border-gray-400 dark:hover:border-[#2a2a2a] px-2 py-0.5 rounded transition-all"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Generate CTA */}
      {active.length > 0 && (
        <motion.div
          layout
          className="flex items-center gap-4 pb-2"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onGenerate(active)}
            className="px-7 py-3 bg-gray-900 dark:bg-white text-white dark:text-[#090909] text-sm font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-[#e8e8e8] transition-colors"
          >
            Generate all {active.length} packs →
          </motion.button>
          <span className="text-xs text-gray-400 dark:text-[#444]">~{active.length * 45}s · one at a time</span>
        </motion.div>
      )}
    </div>
  )
}
