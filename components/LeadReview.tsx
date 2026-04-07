'use client'

import { useState, useCallback } from 'react'
import { X, ExternalLink, User, MapPin, Mail, ChevronDown, ChevronUp } from 'lucide-react'
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
}

function ScoreDisplay({ erpScore, dataScore }: { erpScore: number; dataScore: number }) {
  const erpColor = erpScore >= 75
    ? 'text-emerald-400'
    : erpScore >= 50
    ? 'text-amber-400'
    : 'text-[#555]'
  const erpLabel = erpScore >= 75 ? 'Complex ops' : erpScore >= 50 ? 'Moderate fit' : 'Low signals'

  const barColor = dataScore >= 70
    ? 'bg-emerald-500'
    : dataScore >= 40
    ? 'bg-amber-500'
    : 'bg-[#333]'
  const dataLabel = dataScore >= 70 ? 'Full data' : dataScore >= 40 ? 'Partial' : 'Sparse'

  return (
    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
      <div className="flex flex-col items-end">
        <span className={`text-2xl font-bold tabular-nums leading-none ${erpColor}`}>{erpScore}</span>
        <span className="text-[10px] text-[#444] mt-0.5 uppercase tracking-[0.07em]">{erpLabel}</span>
      </div>
      <div className="flex items-center gap-1.5" title={`Data quality: ${dataScore}/100`}>
        <div className="w-12 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${dataScore}%` }} />
        </div>
        <span className="text-[10px] text-[#333]">{dataLabel}</span>
      </div>
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
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden hover:border-[#2a2a2a] transition-colors duration-200">
      <div className="p-5">
        <div className="flex gap-4 items-start">
          {/* Rank */}
          <div className="flex-shrink-0 w-5 text-[11px] font-bold text-[#2a2a2a] mt-1 tabular-nums">
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            {/* Top row */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white text-[15px] leading-tight">{lead.company}</span>
                  {lead.website && (
                    <a
                      href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-[#3a3a3a] hover:text-[#888] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {lead.linkedinUrl && (
                    <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-[#3a3a3a] hover:text-blue-400 transition-colors font-medium border border-[#2a2a2a] px-1.5 py-0.5 rounded"
                    >
                      in
                    </a>
                  )}
                </div>
                <div className="text-xs text-[#555] mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span>{lead.industry}</span>
                  {lead.employees !== 'Unknown' && (
                    <><span className="text-[#2a2a2a]">·</span><span>{lead.employees} employees</span></>
                  )}
                  {lead.location && (
                    <><span className="text-[#2a2a2a]">·</span>
                    <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{lead.location}</span></>
                  )}
                  {lead.foundedYear && (
                    <><span className="text-[#2a2a2a]">·</span><span>Est. {lead.foundedYear}</span></>
                  )}
                  {lead.annualRevenue && (
                    <><span className="text-[#2a2a2a]">·</span><span className="text-[#666]">{lead.annualRevenue}</span></>
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
                  className="text-[#2e2e2e] hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-400/5"
                  title="Skip this lead"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Description */}
            {lead.description && (
              <p className="text-xs text-[#666] mt-3 leading-relaxed line-clamp-2">{lead.description}</p>
            )}

            {/* Tech stack */}
            {lead.techStack && lead.techStack.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2.5">
                {lead.techStack.map((tech) => (
                  <span key={tech} className="text-[11px] bg-[#1a1a1a] text-[#555] border border-[#222] rounded px-1.5 py-0.5">
                    {tech}
                  </span>
                ))}
              </div>
            )}

            {/* Rationale */}
            <p className="text-xs text-[#3a3a3a] mt-2.5 leading-relaxed italic">{lead.rationale}</p>

            {/* Contact + address */}
            <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
              {lead.contactName && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    <span className="text-[13px] font-semibold text-white">{lead.contactName}</span>
                    <span className="text-xs text-[#555]">{lead.contactTitle}</span>
                  </div>
                  {lead.contactEmail && (
                    <a href={`mailto:${lead.contactEmail}`}
                      className="flex items-center gap-1 text-xs text-[#555] hover:text-[#888] transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      {lead.contactEmail}
                    </a>
                  )}
                  {lead.contactLinkedIn && (
                    <a href={lead.contactLinkedIn} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-[#3a3a3a] hover:text-blue-400 transition-colors border border-[#2a2a2a] px-1.5 py-0.5 rounded"
                    >
                      in
                    </a>
                  )}
                </div>
              )}

              {lead.postalAddress && (
                <div className="mb-3 bg-[#0d0d0d] rounded-lg px-3 py-2.5 border border-[#1a1a1a]">
                  <p className="text-[10px] text-[#3a3a3a] mb-1.5 font-medium uppercase tracking-[0.1em]">Post to</p>
                  <pre className="text-xs text-[#666] font-sans whitespace-pre-line leading-relaxed">
                    {lead.contactName ? `${lead.contactName}\n` : ''}{lead.contactTitle ? `${lead.contactTitle}\n` : ''}{lead.company}{'\n'}{lead.postalAddress}
                  </pre>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onGenerate}
                  className="text-xs px-4 py-2 bg-white text-[#090909] rounded-lg font-semibold"
                >
                  Generate letter →
                </motion.button>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#3a3a3a]">Address to:</span>
                    {editingTitle ? (
                      <input
                        autoFocus value={lead.contactTitle}
                        onChange={(e) => onUpdateTitle(e.target.value)}
                        onBlur={() => setEditingTitle(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                        className="text-xs bg-[#0d0d0d] border border-[#333] rounded px-2 py-0.5 text-[#e8e8e8] focus:outline-none focus:border-[#555] w-44"
                      />
                    ) : (
                      <button onClick={() => setEditingTitle(true)}
                        className="text-xs text-[#555] underline decoration-dotted hover:text-[#aaa] transition-colors"
                      >
                        {lead.contactTitle}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#3a3a3a]">Name:</span>
                    {editingName ? (
                      <input
                        autoFocus value={lead.recipientName}
                        onChange={(e) => onUpdateName(e.target.value)}
                        onBlur={() => setEditingName(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
                        placeholder="e.g. Sarah Jennings"
                        className="text-xs bg-[#0d0d0d] border border-[#333] rounded px-2 py-0.5 text-[#e8e8e8] focus:outline-none focus:border-[#555] w-44 placeholder-[#333]"
                      />
                    ) : (
                      <button onClick={() => setEditingName(true)}
                        className={`text-xs underline decoration-dotted transition-colors ${lead.recipientName ? 'text-[#555] hover:text-[#aaa]' : 'text-[#3a3a3a] hover:text-[#555]'}`}
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

export default function LeadReview({ leads: allLeads, totalSearched, onGenerate }: Props) {
  const toReviewed = (l: Lead): ReviewedLead => ({ ...l, recipientName: l.contactName ?? '' })

  const ACTIVE_SIZE = 10
  const [active, setActive] = useState<ReviewedLead[]>(() => allLeads.slice(0, ACTIVE_SIZE).map(toReviewed))
  const [bench, setBench] = useState<ReviewedLead[]>(() => allLeads.slice(ACTIVE_SIZE).map(toReviewed))
  const [showBench, setShowBench] = useState(false)
  const [editingTitle, setEditingTitle] = useState<number | null>(null)
  const [editingName, setEditingName] = useState<number | null>(null)

  const removeLead = useCallback((rank: number) => {
    setActive((prev) => {
      const next = prev.filter((l) => l.rank !== rank)
      setBench((b) => {
        if (b.length === 0) return b
        const [replacement, ...rest] = b
        setActive(a => [...a.filter(l => l.rank !== rank), replacement])
        return rest
      })
      return next
    })
  }, [])

  // Simpler remove that doesn't have the closure issue
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
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">
            {active.length} prospects
          </h2>
          <p className="text-sm text-[#444] mt-1">
            Scored from {totalSearched.toLocaleString()} companies
            {totalRemaining > 0 && (
              <> · <span className="text-[#555]">{totalRemaining} more in reserve</span></>
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
            <span className="text-xs text-[#333] tabular-nums">
              {totalRemaining} in bench
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: Math.min(totalRemaining, 8) }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="w-1 h-3 bg-[#222] rounded-sm"
                />
              ))}
              {totalRemaining > 8 && <span className="text-[10px] text-[#333] ml-1">+{totalRemaining - 8}</span>}
            </div>
          </motion.div>
        )}
      </div>

      {/* Active deck */}
      <div className="space-y-2 mb-6">
        <AnimatePresence mode="popLayout" initial={false}>
          {active.map((lead, i) => (
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
            className="flex items-center gap-2 text-xs text-[#444] hover:text-[#888] transition-colors mb-3"
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
                      className="flex items-center justify-between px-4 py-2.5 bg-[#0d0d0d] border border-[#181818] rounded-lg hover:border-[#252525] transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[11px] text-[#2a2a2a] tabular-nums w-4 flex-shrink-0">{i + ACTIVE_SIZE + 1}</span>
                        <div className="min-w-0">
                          <span className="text-sm text-[#666] group-hover:text-[#999] transition-colors truncate block">{lead.company}</span>
                          <span className="text-xs text-[#333]">{lead.industry} · {lead.employees} employees</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-sm font-bold tabular-nums ${lead.erpScore >= 75 ? 'text-emerald-500/50' : lead.erpScore >= 50 ? 'text-amber-500/50' : 'text-[#333]'}`}>
                          {lead.erpScore}
                        </span>
                        {active.length < ACTIVE_SIZE && (
                          <button
                            onClick={() => promoteFromBench(lead)}
                            className="text-[10px] text-[#333] hover:text-white border border-[#222] hover:border-[#444] px-2 py-0.5 rounded transition-all"
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
            className="px-7 py-3 bg-white text-[#090909] text-sm font-semibold rounded-lg transition-colors"
          >
            Generate all {active.length} packs →
          </motion.button>
          <span className="text-xs text-[#333]">~{active.length * 45}s · one at a time</span>
        </motion.div>
      )}
    </div>
  )
}
