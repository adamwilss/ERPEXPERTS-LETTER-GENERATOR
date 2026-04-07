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

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'bg-green-100 text-green-800'
      : score >= 60
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
      {score}
    </span>
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
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Top {leads.length} prospects</h2>
        <p className="text-sm text-gray-500 mt-1">
          Scored from {totalSearched} companies. Remove any you do not want to include. Optionally
          add a named contact — if left blank the letter will address the job title.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {leads.map((lead, i) => (
          <div
            key={lead.rank}
            className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4 items-start"
          >
            {/* Rank */}
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
              {i + 1}
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{lead.company}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {lead.industry} · {lead.employees} employees
                    {lead.website && (
                      <>
                        {' '}
                        ·{' '}
                        <span className="text-gray-400">{lead.website.replace(/^https?:\/\//, '')}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <ScoreBadge score={lead.erpScore} />
                  <button
                    onClick={() => removeLead(lead.rank)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                    title="Remove this lead"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Rationale */}
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{lead.rationale}</p>

              {/* Editable fields */}
              <div className="mt-3 flex flex-wrap gap-4">
                {/* Contact title */}
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

                {/* Recipient name (optional) */}
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
        ))}
      </div>

      <button
        onClick={() => onGenerate(leads)}
        disabled={leads.length === 0}
        className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Generate {leads.length} letter pack{leads.length !== 1 ? 's' : ''}
      </button>
    </div>
  )
}
