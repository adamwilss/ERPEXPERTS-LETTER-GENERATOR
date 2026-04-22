'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Database, Eye, Search, Trash2, Users, Rocket } from 'lucide-react'
import type { SavedSearch, SavedLead } from '@/lib/db/search-db'
import EmptyState from '@/components/EmptyState'

interface SearchWithLeads extends SavedSearch {
  leads?: SavedLead[]
  expanded?: boolean
}

export default function SearchesPage() {
  const [searches, setSearches] = useState<SearchWithLeads[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSearches()
    const interval = setInterval(loadSearches, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadSearches = async () => {
    try {
      const res = await fetch('/api/searches')
      const data = await res.json()
      if (data.searches) {
        setSearches(data.searches.map((s: SavedSearch) => ({ ...s, expanded: false })))
      }
    } catch (err) {
      console.error('Failed to load searches:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = async (searchId: string) => {
    const search = searches.find((s) => s.id === searchId)
    if (!search) return

    if (search.leads) {
      setSearches(
        searches.map((s) =>
          s.id === searchId ? { ...s, expanded: !s.expanded } : s
        )
      )
    } else {
      try {
        const res = await fetch(`/api/searches/${searchId}/leads`)
        const data = await res.json()
        if (data.leads) {
          setSearches(
            searches.map((s) =>
              s.id === searchId
                ? { ...s, leads: data.leads, expanded: true }
                : s
            )
          )
        }
      } catch (err) {
        console.error('Failed to load leads:', err)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this search and all its leads?')) return
    try {
      const res = await fetch(`/api/searches/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSearches(searches.filter((s) => s.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  if (loading) {
    return (
      <main className="page-shell">
        <div className="page-container">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg"></div>
            <div className="h-4 w-64 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg"></div>
            <div className="space-y-3 mt-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-[#1a1a1a] rounded-2xl"></div>
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
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="page-badge mb-4">
              <Rocket className="w-3.5 h-3.5 text-blue-500" />
              Apollo Database
            </div>
            <h1 className="page-title">Saved Searches</h1>
            <p className="page-description">
              {searches.length === 0
                ? 'All your Apollo searches appear here automatically.'
                : `${searches.length} Apollo search${searches.length !== 1 ? 'es' : ''} saved with full lead data`}
            </p>
          </div>
          <Link href="/discover" className="btn btn-secondary">
            New Search →
          </Link>
        </div>

        {searches.length === 0 ? (
          <EmptyState
            icon={<Search className="w-7 h-7" />}
            title="No saved searches yet"
            description="Run a discovery search to save leads for later. All searches are persisted with full lead data, rationale, and tech stack."
            action={
              <Link href="/discover" className="btn btn-secondary">
                Discover leads →
              </Link>
            }
          />
        ) : (
          <div className="space-y-3 stagger-children">
            {searches.map((search) => (
              <div key={search.id} className="card card-hover overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <button
                    onClick={() => toggleExpand(search.id)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        search.expanded
                          ? 'bg-gray-100 dark:bg-[#1a1a1a]'
                          : 'bg-gray-50 dark:bg-[#111]'
                      }`}
                    >
                      <ChevronRight
                        className={`w-4 h-4 text-gray-400 dark:text-[#555] flex-shrink-0 transition-transform duration-200 ${
                          search.expanded ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-950 dark:text-white">
                        {search.industry}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-[#444] mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#333]" />
                          {search.employeeRange} employees
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#333]" />
                          {search.location}
                        </span>
                        {search.keywords && (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#333]" />
                            {search.keywords}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#333]" />
                          {new Date(search.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </button>
                  <div className="ml-4 flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/searches/${search.id}`}
                      className="btn btn-sm badge-info hover:opacity-80"
                    >
                      <Eye className="w-3 h-3" />
                      View Leads
                    </Link>
                    <button
                      onClick={() => handleDelete(search.id)}
                      className="p-2 rounded-lg text-gray-300 dark:text-[#333] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/5 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {search.expanded && search.leads && (
                  <div className="border-t border-gray-100 dark:border-[#181818] p-5">
                    <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-gray-500 dark:text-[#555]">
                      <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <span>
                        {search.leads.length} lead
                        {search.leads.length !== 1 ? 's' : ''} found
                      </span>
                    </div>
                    <div className="space-y-2">
                      {search.leads.slice(0, 10).map((lead) => (
                        <div
                          key={lead.id}
                          className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-[#222] transition-all"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-950 dark:text-white truncate"
                            >
                              {lead.company}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-[#555] mt-0.5">
                              {lead.contactName || lead.contactTitle} ·{' '}
                              {lead.employees} employees
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            <span
                              className={`text-[11px] px-2 py-1 rounded-md font-bold ${
                                lead.erpScore >= 70
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                  : lead.erpScore >= 40
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                    : 'bg-gray-100 text-gray-600 dark:bg-[#222] dark:text-gray-400'
                              }`}
                            >
                              {lead.erpScore}
                            </span>
                            {lead.generated && (
                              <span className="text-[11px] text-gray-400 dark:text-[#555] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#222] font-medium"
                              >
                                Generated
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {search.leads.length > 10 && (
                        <Link
                          href={`/searches/${search.id}`}
                          className="block text-center py-3 text-xs font-semibold text-gray-500 dark:text-[#555] hover:text-gray-950 dark:hover:text-white transition-colors"
                        >
                          +{search.leads.length - 10} more leads →
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="page-footer">
        ERP Experts Ltd · Saved Apollo Searches
      </footer>
    </main>
  )
}
