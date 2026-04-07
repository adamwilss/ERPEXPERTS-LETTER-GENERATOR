'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

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
}

interface Props {
  leads: Lead[]
  totalSearched: number
  onGenerate: (leads: ReviewedLead[]) => void
}

export interface ReviewedLead extends Lead {
  recipientName: string
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'bg-emerald-500'
      : score >= 60
      ? 'bg-amber-400'
      : 'bg-gray-300'
  const label =
    score >= 80 ? 'text-emerald-700' : score >= 60 ? 'text-amber-700' : 'text-gray-500'

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className={`text-xs font-bold tabular-nums ${label}`}>{score}</span>
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

export default function LeadReview({ leads: initialLeads, totalSearched, onGenerate }: Props) {
  const [leads, setLeads] = useState<ReviewedLead[]>(
    initialLeads.map((l) => ({ ...l, recipientName: '' }))
  )
  const [editingTitle, setEditingTitle] = useState<number | null>(null)
  const [editingName, setEditingName] = useState<number | null>(null)

  const removeLead = (rank: number) => {
    setLeads((prev) => prev.filter((l) => l.rank !== rank))
  }

  const updateTitle = (rank: number, value: string) => {
    setLeads((prev) => prev.map((l) => (l.rank === rank ? { ...l, contactTitle: value } : l)))
  }

  const updateName = (rank: number, value: string) => {
    setLeads((prev) => prev.map((l) => (l.rank === rank ? { ...l, recipientName: value } : l)))
  }

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Top {leads.length} prospects</h2>
          <p className="text-sm text-gray-500 mt-1">
            Scored from {totalSearched.toLocaleString()} companies · Remove any you want to skip · Add a named contact to personalise the letter
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 pb-0.5">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Strong fit</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Good fit</span>
        </div>
      </div>

      <div className="space-y-2.5 mb-8">
        {leads.map((lead, i) => (
          <div
            key={lead.rank}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors"
          >
            <div className="flex gap-4 items-start">
              {/* Rank */}
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 mt-0.5">
                {i + 1}
              </div>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 text-sm leading-tight">{lead.company}</div>
                    <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-x-2">
                      <span>{lead.industry}</span>
                      <span>·</span>
                      <span>{lead.employees} employees</span>
                      {lead.website && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-xs">{lead.website.replace(/^https?:\/\//, '')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <ScoreBar score={lead.erpScore} />
                    <button
                      onClick={() => removeLead(lead.rank)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Rationale */}
                <p className="text-xs text-gray-500 mt-2.5 leading-relaxed">{lead.rationale}</p>

                {/* Editable fields */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-5">
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
                      <button
                        onClick={() => setEditingTitle(lead.rank)}
                        className="text-xs text-gray-700 underline decoration-dotted hover:text-gray-900"
                      >
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
