'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ChevronRight, Database, Search, Trash2, Users } from 'lucide-react'
import type { SavedSearch, SavedLead } from '@/lib/db/search-db'
import { useRouter } from 'next/navigation'

interface SearchWithLeads extends SavedSearch {
  leads?: SavedLead[]
  expanded?: boolean
}

export default function SearchesPage() {
  const [searches, setSearches] = useState<SearchWithLeads[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadSearches()
    // Auto-refresh every 10 seconds to catch new searches
    const interval = setInterval(loadSearches, 10000)
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
    const search = searches.find(s => s.id === searchId)
    if (!search) return

    if (search.leads) {
      // Toggle collapsed
      setSearches(searches.map(s =>
        s.id === searchId ? { ...s, expanded: !s.expanded } : s
      ))
    } else {
      // Load leads via API
      try {
        const res = await fetch(`/api/searches/${searchId}/leads`)
        const data = await res.json()
        if (data.leads) {
          setSearches(searches.map(s =>
            s.id === searchId ? { ...s, leads: data.leads, expanded: true } : s
          ))
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
        setSearches(searches.filter(s => s.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const useSearch = (search: SearchWithLeads) => {
    // Navigate to discover with this search's params
    const params = new URLSearchParams({
      industry: search.industry,
      employeeRange: search.employeeRange,
      location: search.location,
      keywords: search.keywords,
    })
    router.push(`/discover?${params.toString()}`)
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-52px)]">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="text-center py-24 text-gray-400 dark:text-[#555]">
            <Database className="w-8 h-8 mx-auto mb-4 animate-pulse" />
            <p className="text-sm">Loading saved searches…</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-52px)]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white tracking-tight">
              Saved Searches
            </h1>
            <p className="text-sm text-gray-500 dark:text-[#555] mt-1">
              {searches.length === 0
                ? 'No saved searches yet.'
                : `${searches.length} Apollo search${searches.length !== 1 ? 'es' : ''} saved`}
            </p>
          </div>
          <Link
            href="/discover"
            className="text-sm text-gray-700 dark:text-[#ccc] underline underline-offset-2 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            New Search →
          </Link>
        </div>

        {searches.length === 0 ? (
          <div className="text-center py-24 text-gray-300 dark:text-[#333]">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Your Apollo searches will appear here automatically.</p>
            <Link
              href="/discover"
              className="mt-4 inline-block text-sm text-gray-700 dark:text-[#ccc] underline underline-offset-2 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Discover leads →
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            {searches.map((search) => (
              <div
                key={search.id}
                className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1e1e1e] rounded-xl overflow-hidden hover:border-gray-300 dark:hover:border-[#2a2a2a] transition-colors duration-150 shadow-sm dark:shadow-none"
              >
                <div className="flex items-center justify-between px-5 py-4">
                  <button
                    onClick={() => toggleExpand(search.id)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    {search.expanded ? (
                      <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#444] rotate-90 flex-shrink-0 transition-transform" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-[#333] flex-shrink-0 transition-transform" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {search.industry}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-[#444] mt-0.5 flex flex-wrap gap-2">
                        <span>{search.employeeRange} employees</span>
                        <span>·</span>
                        <span>{search.location}</span>
                        {search.keywords && (
                          <><span>·</span><span>{search.keywords}</span></>
                        )}
                        <span>·</span>
                        <span>{new Date(search.createdAt).toLocaleDateString('en-GB')}</span>
                      </div>
                    </div>
                  </button>
                  <div className="ml-4 flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => useSearch(search)}
                      className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-[#222] transition-colors"
                    >
                      Use Search
                    </button>
                    <button
                      onClick={() => handleDelete(search.id)}
                      className="text-gray-300 dark:text-[#333] hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {search.expanded && search.leads && (
                  <div className="border-t border-gray-100 dark:border-[#181818] p-4">
                    <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 dark:text-[#555]">
                      <Users className="w-3 h-3" />
                      <span>{search.leads.length} leads found</span>
                    </div>
                    <div className="space-y-2">
                      {search.leads.slice(0, 10).map((lead) => (
                        <div
                          key={lead.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg"
                        >
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {lead.company}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-[#555]">
                              {lead.contactName || lead.contactTitle} · {lead.employees} employees
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              lead.erpScore >= 70
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                : lead.erpScore >= 40
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-[#222] dark:text-gray-400'
                            }`}>
                              {lead.erpScore}
                            </span>
                            {lead.generated && (
                              <span className="text-xs text-gray-400 dark:text-[#555]">Generated</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {search.leads.length > 10 && (
                        <p className="text-xs text-gray-400 text-center py-2">
                          +{search.leads.length - 10} more leads
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="mt-auto py-6 text-center text-[11px] text-gray-300 dark:text-[#333] border-t border-gray-200 dark:border-[#1e1e1e]">
        ERP Experts Ltd · Saved Apollo Searches
      </footer>
    </main>
  )
}
