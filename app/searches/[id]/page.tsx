'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Users, Building2, Mail, MapPin, ArrowRight } from 'lucide-react'
import type { SavedLead } from '@/lib/db/search-db'

export default function SearchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchId = params.id as string

  const [leads, setLeads] = useState<SavedLead[]>([])
  const [searchInfo, setSearchInfo] = useState<{ industry: string; employeeRange: string; location: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!searchId) return
    loadSearchData()
  }, [searchId])

  const loadSearchData = async () => {
    try {
      const res = await fetch(`/api/searches/${searchId}/leads`)
      const data = await res.json()
      if (data.leads) {
        setLeads(data.leads)
        if (data.leads.length > 0) {
          setSearchInfo({
            industry: data.leads[0]?.industry || '',
            employeeRange: data.leads[0]?.employees || '',
            location: data.leads[0]?.location || ''
          })
        }
      }
    } catch (err) {
      console.error('Failed to load search:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads)
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId)
    } else {
      newSelected.add(leadId)
    }
    setSelectedLeads(newSelected)
  }

  const generateLetters = () => {
    const selectedLeadData = leads.filter(l => selectedLeads.has(l.id))
    localStorage.setItem('pending_leads', JSON.stringify(selectedLeadData))
    router.push('/discover?batch=true')
  }

  if (loading) {
    return (
      <main className="page-shell">
        <div className="page-container">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Users className="w-5 h-5 text-gray-400 dark:text-[#444] animate-pulse" />
            </div>
            <p className="text-sm text-gray-500 dark:text-[#555]">Loading leads…</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <div className="page-container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/searches"
              className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-[#555] hover:text-gray-950 dark:hover:text-white mb-3 font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to saved searches
            </Link>
            <h1 className="text-3xl font-bold text-gray-950 dark:text-white tracking-tight leading-tight">
              {searchInfo?.industry || 'Search Results'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-[#555] mt-2">
              {searchInfo?.employeeRange} employees · {searchInfo?.location} · {leads.length} leads
            </p>
          </div>

          {selectedLeads.size > 0 && (
            <button
              onClick={generateLetters}
              className="btn-primary"
            >
              Generate {selectedLeads.size} letter{selectedLeads.size !== 1 ? 's' : ''}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {leads.length === 0 ? (
          <div className="empty-state animate-fade-up">
            <div className="empty-state-icon">
              <Building2 className="w-7 h-7 text-gray-400 dark:text-[#444]" />
            </div>
            <p className="text-sm text-gray-500 dark:text-[#555]">No leads found in this search.</p>
          </div>
        ) : (
          <div className="grid gap-3 stagger-children">
            {leads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => toggleLead(lead.id)}
                className={`card p-5 cursor-pointer transition-all ${
                  selectedLeads.has(lead.id)
                    ? 'border-blue-300 dark:border-blue-500/30 ring-1 ring-blue-100 dark:ring-blue-500/10'
                    : 'card-hover'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all ${
                      selectedLeads.has(lead.id)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300 dark:border-[#444]'
                    }`}>
                      {selectedLeads.has(lead.id) && (
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-gray-950 dark:text-white">
                        {lead.company}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-[#555] flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                        {lead.contactName && (
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3 h-3" />
                            {lead.contactName}, {lead.contactTitle}
                          </span>
                        )}
                        {!lead.contactName && lead.contactTitle && (
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3 h-3" />
                            {lead.contactTitle}
                          </span>
                        )}
                        {lead.contactEmail && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3" />
                            {lead.contactEmail}
                          </span>
                        )}
                        {lead.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" />
                            {lead.location}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-[#555] mt-2.5 line-clamp-2 leading-relaxed">
                        {lead.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <span className={`text-[11px] px-2 py-1 rounded-md font-bold ${
                      lead.erpScore >= 70
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : lead.erpScore >= 40
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-[#222] dark:text-gray-400'
                    }`}>
                      Score: {lead.erpScore}
                    </span>
                    {lead.generated && (
                      <span className="text-[11px] text-gray-400 dark:text-[#555] font-medium">Generated</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
