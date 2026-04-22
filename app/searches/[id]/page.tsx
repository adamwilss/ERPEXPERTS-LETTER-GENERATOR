'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  Users,
  Building2,
  Mail,
  MapPin,
  ArrowRight,
  Check,
  X,
  RotateCcw,
  Zap,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SavedLead } from '@/lib/db/search-db'

function contactBadge(dataScore: number): { label: string; className: string } {
  if (dataScore >= 100) return { label: 'Full', className: 'badge-success' }
  if (dataScore >= 65) return { label: 'Email', className: 'badge-warning' }
  if (dataScore >= 35) return { label: 'Name', className: 'badge-neutral' }
  return { label: 'Partial', className: 'badge-neutral opacity-60' }
}

function statusBadge(status?: string): { label: string; className: string } {
  switch (status) {
    case 'generated':
      return { label: 'Generated', className: 'badge-success' }
    case 'approved':
      return { label: 'Approved', className: 'badge-info' }
    case 'rejected':
      return { label: 'Skipped', className: 'badge-neutral opacity-60' }
    default:
      return { label: 'Pending', className: 'badge-neutral' }
  }
}

export default function SearchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchId = params.id as string

  const [leads, setLeads] = useState<SavedLead[]>([])
  const [searchInfo, setSearchInfo] = useState<{
    industry: string
    employeeRange: string
    location: string
    keywords?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<string | 'all'>('all')
  const [updating, setUpdating] = useState<Set<string>>(new Set())

  const loadSearchData = useCallback(async () => {
    if (!searchId) return
    try {
      const res = await fetch(`/api/searches/${searchId}/leads`)
      const data = await res.json()
      if (data.leads) {
        setLeads(data.leads)
        if (data.leads.length > 0) {
          setSearchInfo({
            industry: data.leads[0]?.industry || '',
            employeeRange: data.leads[0]?.employees || '',
            location: data.leads[0]?.location || '',
          })
        }
      }
    } catch (err) {
      console.error('Failed to load search:', err)
    } finally {
      setLoading(false)
    }
  }, [searchId])

  useEffect(() => {
    loadSearchData()
  }, [loadSearchData])

  const updateLeadStatus = useCallback(async (leadId: string, status: string) => {
    setUpdating((prev) => new Set(prev).add(leadId))
    try {
      const res = await fetch(`/api/searches/${searchId}/leads`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, status }),
      })
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)))
      }
    } catch (err) {
      console.error('Failed to update lead status:', err)
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev)
        next.delete(leadId)
        return next
      })
    }
  }, [searchId])

  const toggleLead = (leadId: string) => {
    setSelectedLeads((prev) => {
      const next = new Set(prev)
      if (next.has(leadId)) next.delete(leadId)
      else next.add(leadId)
      return next
    })
  }

  const selectAll = () => {
    const ids = filteredLeads
      .filter((l) => l.status !== 'generated')
      .map((l) => l.id)
    setSelectedLeads(new Set(ids))
  }

  const clearSelection = () => setSelectedLeads(new Set())

  const generateLetters = () => {
    const selectedLeadData = leads.filter((l) => selectedLeads.has(l.id))
    selectedLeadData.forEach((l) => {
      if (l.status !== 'generated') {
        updateLeadStatus(l.id, 'approved')
      }
    })
    localStorage.setItem('pending_leads', JSON.stringify(selectedLeadData))
    router.push('/discover?batch=true')
  }

  const filteredLeads =
    statusFilter === 'all'
      ? leads
      : leads.filter(
          (l) =>
            l.status === statusFilter ||
            (statusFilter === 'pending' && (!l.status || l.status === 'pending'))
        )

  const stats = {
    total: leads.length,
    generated: leads.filter((l) => l.status === 'generated').length,
    approved: leads.filter((l) => l.status === 'approved').length,
    rejected: leads.filter((l) => l.status === 'rejected').length,
    pending: leads.filter((l) => !l.status || l.status === 'pending').length,
  }

  if (loading) {
    return (
      <main className="page-shell">
        <div className="page-container">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg"></div>
            <div className="h-4 w-32 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg"></div>
            <div className="grid grid-cols-5 gap-3 mt-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-[#1a1a1a] rounded-2xl"></div>
              ))}
            </div>
            <div className="space-y-3 mt-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 dark:bg-[#1a1a1a] rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <div className="page-container">
        <div className="mb-10">
          <Link
            href="/searches"
            className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-[#555] hover:text-gray-950 dark:hover:text-white mb-4 font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to saved searches
          </Link>

          <div className="page-badge mb-4">
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            Apollo Results
          </div>
          <h1 className="page-title">{searchInfo?.industry || 'Search Results'}</h1>
          <p className="page-description">
            {searchInfo?.employeeRange} employees · {searchInfo?.location} ·{' '}
            {leads.length} leads found
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Total', value: stats.total, filter: 'all', color: 'text-gray-950 dark:text-white' },
            { label: 'Pending', value: stats.pending, filter: 'pending', color: 'text-gray-500 dark:text-[#555]' },
            { label: 'Approved', value: stats.approved, filter: 'approved', color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Generated', value: stats.generated, filter: 'generated', color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Skipped', value: stats.rejected, filter: 'rejected', color: 'text-gray-400 dark:text-[#444]' },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => setStatusFilter(s.filter)}
              className={`card p-4 text-left transition-all ${
                statusFilter === s.filter
                  ? 'ring-1 ring-gray-200 dark:ring-[#2a2a2a]'
                  : 'opacity-80 hover:opacity-100'
              }`}
            >
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-gray-400 dark:text-[#555] font-medium mt-1">
                {s.label}
              </div>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className="btn btn-secondary btn-sm"
            >
              Select all
            </button>
            {selectedLeads.size > 0 && (
              <>
                <button
                  onClick={clearSelection}
                  className="btn btn-ghost btn-sm"
                >
                  Clear ({selectedLeads.size})
                </button>
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={generateLetters}
                  className="btn btn-primary btn-sm"
                >
                  Generate {selectedLeads.size} letter
                  {selectedLeads.size !== 1 ? 's' : ''}
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 dark:text-[#555]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-transparent border-none text-gray-500 dark:text-[#555] focus:outline-none cursor-pointer"
            >
              <option value="all">All leads</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="generated">Generated</option>
              <option value="rejected">Skipped</option>
            </select>
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="card p-12 text-center">
            <Building2 className="w-7 h-7 text-gray-400 dark:text-[#444] mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-[#555]">
              {statusFilter === 'all'
                ? 'No leads found in this search.'
                : `No leads with status "${statusFilter}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredLeads.map((lead, index) => {
                const cb = contactBadge(lead.dataScore)
                const sb = statusBadge(lead.status)
                const isSelected = selectedLeads.has(lead.id)
                const isUpdating = updating.has(lead.id)

                return (
                  <motion.div
                    key={lead.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ delay: index * 0.03 }}
                    className={`card overflow-hidden transition-all ${
                      isSelected
                        ? 'ring-1 ring-gray-900 dark:ring-white/10'
                        : 'card-hover'
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggleLead(lead.id)}
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected
                              ? 'bg-gray-950 dark:bg-white border-gray-950 dark:border-white'
                              : 'border-gray-300 dark:border-[#444] hover:border-gray-400 dark:hover:border-[#555]'
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 text-white dark:text-gray-950" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-950 dark:text-white text-[15px]">
                                  {lead.company}
                                </span>
                                {lead.website && (
                                  <a
                                    href={
                                      lead.website.startsWith('http')
                                        ? lead.website
                                        : `https://${lead.website}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-300 dark:text-[#333] hover:text-gray-500 dark:hover:text-[#555] transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sb.className}`}>
                                  {sb.label}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 dark:text-[#444] mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <span>{lead.industry}</span>
                                {lead.employees !== 'Unknown' && (
                                  <>
                                    <span className="text-gray-200 dark:text-[#222]">·</span>
                                    <span>{lead.employees} employees</span>
                                  </>
                                )}
                                {lead.location && (
                                  <>
                                    <span className="text-gray-200 dark:text-[#222]">·</span>
                                    <span className="flex items-center gap-0.5">
                                      <MapPin className="w-2.5 h-2.5" />{lead.location}
                                    </span>
                                  </>
                                )}
                                {lead.foundedYear && (
                                  <>
                                    <span className="text-gray-200 dark:text-[#222]">·</span>
                                    <span>Est. {lead.foundedYear}</span>
                                  </>
                                )}
                                {lead.annualRevenue && (
                                  <>
                                    <span className="text-gray-200 dark:text-[#222]">·</span>
                                    <span className="text-gray-500 dark:text-[#555]">{lead.annualRevenue}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="flex flex-col items-end gap-1">
                                <span
                                  className={`text-xl font-bold tabular-nums leading-none ${
                                    lead.erpScore >= 60
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : lead.erpScore >= 35
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-gray-400 dark:text-[#444]'
                                  }`}
                                >
                                  {lead.erpScore}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-[#444] uppercase tracking-[0.07em]"
                                >
                                  ERP fit
                                </span>
                              </div>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cb.className}`}
                              >
                                {cb.label}
                              </span>
                            </div>
                          </div>

                          {lead.description && (
                            <p className="text-xs text-gray-500 dark:text-[#555] mt-3 leading-relaxed"
                            >
                              {lead.description}
                            </p>
                          )}

                          {lead.techStack && lead.techStack.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5"
                            >
                              {lead.techStack.map((tech) => (
                                <span
                                  key={tech}
                                  className="text-[11px] bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-[#888] border border-gray-200 dark:border-[#1e1e1e] rounded-md px-2 py-0.5 font-medium"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}

                          {lead.rationale && (
                            <p className="text-xs text-gray-400 dark:text-[#555] mt-2.5 leading-relaxed italic"
                            >
                              “{lead.rationale}”
                            </p>
                          )}

                          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#181818] flex items-center justify-between flex-wrap gap-3"
                          >
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1"
                            >
                              {lead.contactName && (
                                <span className="text-xs text-gray-600 dark:text-[#888] font-medium"
                                >
                                  <Users className="w-3 h-3 inline mr-1 text-gray-400 dark:text-[#555]" />
                                  {lead.contactName}, {lead.contactTitle}
                                </span>
                              )}
                              {lead.contactEmail && (
                                <a
                                  href={`mailto:${lead.contactEmail}`}
                                  className="text-xs text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-[#ccc] transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Mail className="w-3 h-3 inline mr-1" />
                                  {lead.contactEmail}
                                </a>
                              )}
                            </div>

                            <div className="flex items-center gap-1"
                            >
                              {lead.status !== 'generated' && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      updateLeadStatus(lead.id, 'rejected')
                                    }}
                                    disabled={isUpdating}
                                    className="p-1.5 rounded-md text-gray-300 dark:text-[#333] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/5 transition-all"
                                    title="Skip"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      updateLeadStatus(lead.id, 'approved')
                                    }}
                                    disabled={isUpdating}
                                    className="p-1.5 rounded-md text-gray-300 dark:text-[#333] hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-all"
                                    title="Approve"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              {lead.status === 'generated' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateLeadStatus(lead.id, 'pending')
                                  }}
                                  disabled={isUpdating}
                                  className="p-1.5 rounded-md text-gray-300 dark:text-[#333] hover:text-gray-600 dark:hover:text-[#888] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all"
                                  title="Reset"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  )
}
