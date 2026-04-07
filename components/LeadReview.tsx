'use client'

import { useState } from 'react'
import { X, ExternalLink, User } from 'lucide-react'

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

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-400' : 'bg-gray-300'
  const label = score >= 80 ? 'text-emerald-700' : score >= 60 ? 'text-amber-700' : 'text-gray-500'
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className={`text-xs font-bold tabular-nums ${label}`}>{score}</span>
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
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
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Top {leads.length} prospects</h2>
          <p className="text-sm text-gray-500 mt-1">
            Scored from {totalSearched.toLocaleString()} companies · Remove any to skip · Contacts sourced from Apollo
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 pb-0.5">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Strong fit</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Good fit</span>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        {leads.map((lead, i) => (
          <div key={lead.rank} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
            <div className="flex gap-4 items-start">
              {/* Rank */}
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 mt-0.5">
                {i + 1}
              </div>

              <div className="flex-1 min-w-0">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm leading-tight">{lead.company}</span>
                      {lead.website && (
                        <a
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {lead.linkedinUrl && (
                        <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-blue-500">
                          in
                        </a>
                      )}
                    </div>

                    <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                      <span>{lead.industry}</span>
                      <span>·</span>
                      <span>{lead.employees} employees</span>
                      {lead.location && <><span>·</span><span>{lead.location}</span></>}
                      {lead.foundedYear && <><span>·</span><span>Est. {lead.foundedYear}</span></>}
                      {lead.annualRevenue && <><span>·</span><span>{lead.annualRevenue}</span></>}
                      {lead.phone && <><span>·</span><span>{lead.phone}</span></>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <ScoreBar score={lead.erpScore} />
                    <button onClick={() => removeLead(lead.rank)} className="text-gray-300 hover:text-red-400 transition-colors" title="Remove">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {lead.description && (
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">{lead.description}</p>
                )}

                {/* Tech stack */}
                {lead.techStack && lead.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {lead.techStack.map((tech) => (
                      <span key={tech} className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{tech}</span>
                    ))}
                  </div>
                )}

                {/* AI rationale */}
                <p className="text-xs text-gray-500 mt-2.5 leading-relaxed italic">{lead.rationale}</p>

                {/* Contact & editable fields */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {/* Found contact */}
                  {lead.contactName && (
                    <div className="flex items-center gap-2 mb-2.5">
                      <User className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-800">{lead.contactName}</span>
                      <span className="text-xs text-gray-400">{lead.contactTitle}</span>
                      {lead.contactEmail && (
                        <a href={`mailto:${lead.contactEmail}`} className="text-xs text-blue-500 hover:underline ml-1">
                          {lead.contactEmail}
                        </a>
                      )}
                      {lead.contactLinkedIn && (
                        <a href={lead.contactLinkedIn} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-blue-500">
                          in
                        </a>
                      )}
                    </div>
                  )}

                  {/* Postal address */}
                  {lead.postalAddress && (
                    <div className="mb-2.5 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Post to</p>
                      <pre className="text-xs text-gray-700 font-sans whitespace-pre-line leading-relaxed">
                        {lead.contactName ? `${lead.contactName}\n` : ''}{lead.contactTitle ? `${lead.contactTitle}\n` : ''}{lead.company}{'\n'}{lead.postalAddress}
                      </pre>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Address to:</span>
                      {editingTitle === lead.rank ? (
                        <input
                          autoFocus
                          value={lead.contactTitle}
                          onChange={(e) => updateTitle(lead.rank, e.target.value)}
                          onBlur={() => setEditingTitle(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(null)}
                          className="text-xs border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-gray-400 w-44"
                        />
                      ) : (
                        <button onClick={() => setEditingTitle(lead.rank)} className="text-xs text-gray-700 underline decoration-dotted hover:text-gray-900">
                          {lead.contactTitle}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Named contact:</span>
                      {editingName === lead.rank ? (
                        <input
                          autoFocus
                          value={lead.recipientName}
                          onChange={(e) => updateName(lead.rank, e.target.value)}
                          onBlur={() => setEditingName(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingName(null)}
                          placeholder="e.g. Sarah Jennings"
                          className="text-xs border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-gray-400 w-44 placeholder-gray-300"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingName(lead.rank)}
                          className="text-xs underline decoration-dotted hover:text-gray-900"
                          style={{ color: lead.recipientName ? '#111' : '#9ca3af' }}
                        >
                          {lead.recipientName || 'Add name (optional)'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => onGenerate(leads)}
          disabled={leads.length === 0}
          className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Generate {leads.length} letter pack{leads.length !== 1 ? 's' : ''}
        </button>
        <span className="text-xs text-gray-400">~{leads.length * 45}s total · one at a time</span>
      </div>
    </div>
  )
}
