'use client'

import { useState } from 'react'
import { X, ExternalLink, User, MapPin, Mail } from 'lucide-react'

export interface Lead {
  rank: number
  company: string
  website: string
  industry: string
  employees: string
  description: string
  erpScore: number
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

function ScoreDisplay({ score }: { score: number }) {
  const color = score >= 80
    ? 'text-emerald-400'
    : score >= 60
    ? 'text-amber-400'
    : 'text-[#555]'
  const label = score >= 80 ? 'Strong fit' : score >= 60 ? 'Good fit' : 'Possible'

  return (
    <div className="flex flex-col items-end flex-shrink-0">
      <span className={`text-2xl font-bold tabular-nums leading-none ${color}`}>{score}</span>
      <span className="text-[10px] text-[#444] mt-1 uppercase tracking-[0.08em]">{label}</span>
    </div>
  )
}

export default function LeadReview({ leads: initialLeads, totalSearched, onGenerate }: Props) {
  const [leads, setLeads] = useState<ReviewedLead[]>(
    initialLeads.map((l) => ({ ...l, recipientName: l.contactName ?? '' }))
  )
  const [editingTitle, setEditingTitle] = useState<number | null>(null)
  const [editingName, setEditingName] = useState<number | null>(null)

  const removeLead = (rank: number) => setLeads((prev) => prev.filter((l) => l.rank !== rank))
  const updateTitle = (rank: number, value: string) =>
    setLeads((prev) => prev.map((l) => (l.rank === rank ? { ...l, contactTitle: value } : l)))
  const updateName = (rank: number, value: string) =>
    setLeads((prev) => prev.map((l) => (l.rank === rank ? { ...l, recipientName: value } : l)))

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Top {leads.length} prospects</h2>
          <p className="text-sm text-[#555] mt-1">
            Scored from {totalSearched.toLocaleString()} companies · Contacts sourced from Apollo
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-8">
        {leads.map((lead, i) => (
          <div
            key={lead.rank}
            className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden hover:border-[#2a2a2a] transition-colors duration-150"
          >
            <div className="p-5">
              <div className="flex gap-4 items-start">
                {/* Rank number */}
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-[11px] font-bold text-[#333] mt-0.5">
                  {i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Top row: name + score + remove */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-[15px] leading-tight">{lead.company}</span>
                        {lead.website && (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#444] hover:text-[#888] transition-colors"
                            title="Open website"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {lead.linkedinUrl && (
                          <a
                            href={lead.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#444] hover:text-blue-400 transition-colors font-medium border border-[#2a2a2a] px-1.5 py-0.5 rounded"
                          >
                            in
                          </a>
                        )}
                      </div>

                      <div className="text-xs text-[#555] mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span>{lead.industry}</span>
                        {lead.employees !== 'Unknown' && (
                          <><span className="text-[#333]">·</span><span>{lead.employees} employees</span></>
                        )}
                        {lead.location && (
                          <><span className="text-[#333]">·</span><span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{lead.location}</span></>
                        )}
                        {lead.foundedYear && (
                          <><span className="text-[#333]">·</span><span>Est. {lead.foundedYear}</span></>
                        )}
                        {lead.annualRevenue && (
                          <><span className="text-[#333]">·</span><span className="text-[#666]">{lead.annualRevenue}</span></>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <ScoreDisplay score={lead.erpScore} />
                      <button
                        onClick={() => removeLead(lead.rank)}
                        className="text-[#333] hover:text-red-400 transition-colors p-0.5"
                        title="Remove lead"
                      >
                        <X className="w-4 h-4" />
                      </button>
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
                        <span
                          key={tech}
                          className="text-[11px] bg-[#1a1a1a] text-[#666] border border-[#252525] rounded px-1.5 py-0.5"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* AI rationale */}
                  <p className="text-xs text-[#444] mt-2.5 leading-relaxed italic">{lead.rationale}</p>

                  {/* Contact block */}
                  <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
                    {lead.contactName && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                          <span className="text-[13px] font-semibold text-white">{lead.contactName}</span>
                          <span className="text-xs text-[#555]">{lead.contactTitle}</span>
                        </div>
                        {lead.contactEmail && (
                          <a
                            href={`mailto:${lead.contactEmail}`}
                            className="flex items-center gap-1 text-xs text-[#555] hover:text-[#888] transition-colors"
                          >
                            <Mail className="w-3 h-3" />
                            {lead.contactEmail}
                          </a>
                        )}
                        {lead.contactLinkedIn && (
                          <a
                            href={lead.contactLinkedIn}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#444] hover:text-blue-400 transition-colors font-medium border border-[#2a2a2a] px-1.5 py-0.5 rounded"
                          >
                            in
                          </a>
                        )}
                      </div>
                    )}

                    {/* Postal address */}
                    {lead.postalAddress && (
                      <div className="mb-3 bg-[#0d0d0d] rounded-lg px-3 py-2.5 border border-[#1a1a1a]">
                        <p className="text-[10px] text-[#444] mb-1.5 font-medium uppercase tracking-[0.1em]">Post to</p>
                        <pre className="text-xs text-[#777] font-sans whitespace-pre-line leading-relaxed">
                          {lead.contactName ? `${lead.contactName}\n` : ''}{lead.contactTitle ? `${lead.contactTitle}\n` : ''}{lead.company}{'\n'}{lead.postalAddress}
                        </pre>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4">
                      {/* Generate single letter */}
                      <button
                        onClick={() => onGenerate([lead])}
                        className="text-xs px-4 py-2 bg-white text-[#090909] rounded-lg hover:bg-[#e8e8e8] transition-all duration-150 font-semibold"
                      >
                        Generate letter →
                      </button>

                      {/* Editable fields */}
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-[#444]">Address to:</span>
                          {editingTitle === lead.rank ? (
                            <input
                              autoFocus
                              value={lead.contactTitle}
                              onChange={(e) => updateTitle(lead.rank, e.target.value)}
                              onBlur={() => setEditingTitle(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(null)}
                              className="text-xs bg-[#0d0d0d] border border-[#333] rounded px-2 py-0.5 text-[#e8e8e8] focus:outline-none focus:border-[#555] w-44"
                            />
                          ) : (
                            <button
                              onClick={() => setEditingTitle(lead.rank)}
                              className="text-xs text-[#666] underline decoration-dotted hover:text-[#aaa] transition-colors"
                            >
                              {lead.contactTitle}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-[#444]">Name:</span>
                          {editingName === lead.rank ? (
                            <input
                              autoFocus
                              value={lead.recipientName}
                              onChange={(e) => updateName(lead.rank, e.target.value)}
                              onBlur={() => setEditingName(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingName(null)}
                              placeholder="e.g. Sarah Jennings"
                              className="text-xs bg-[#0d0d0d] border border-[#333] rounded px-2 py-0.5 text-[#e8e8e8] focus:outline-none focus:border-[#555] w-44 placeholder-[#333]"
                            />
                          ) : (
                            <button
                              onClick={() => setEditingName(lead.rank)}
                              className={`text-xs underline decoration-dotted transition-colors ${
                                lead.recipientName ? 'text-[#666] hover:text-[#aaa]' : 'text-[#444] hover:text-[#666]'
                              }`}
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
        ))}
      </div>

      {/* Generate all */}
      <div className="flex items-center gap-4 pb-2">
        <button
          onClick={() => onGenerate(leads)}
          disabled={leads.length === 0}
          className="px-6 py-2.5 bg-white text-[#090909] text-sm font-semibold rounded-lg hover:bg-[#e8e8e8] disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-150"
        >
          Generate all {leads.length} packs
        </button>
        <span className="text-xs text-[#444]">~{leads.length * 45}s · one at a time</span>
      </div>
    </div>
  )
}
