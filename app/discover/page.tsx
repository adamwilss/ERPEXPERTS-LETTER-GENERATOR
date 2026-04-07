'use client'

import { useState } from 'react'
import Link from 'next/link'
import LeadReview, { Lead, ReviewedLead } from '@/components/LeadReview'
import BatchOutput, { PackStatus } from '@/components/BatchOutput'

const INDUSTRIES = [
  'Manufacturing',
  'Wholesale Distribution',
  'Ecommerce',
  'Field Services',
  'Professional Services',
  'Specialty Retail',
  'Technology',
  'Construction',
]

const EMPLOYEE_RANGES = [
  { label: '50 – 200 employees', value: '51,200' },
  { label: '200 – 500 employees', value: '201,500' },
  { label: '500 – 1,000 employees', value: '501,1000' },
]

type Phase = 'form' | 'reviewing' | 'generating' | 'done'

export default function DiscoverPage() {
  const [phase, setPhase] = useState<Phase>('form')
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [totalSearched, setTotalSearched] = useState(0)
  const [packs, setPacks] = useState<PackStatus[]>([])

  // Form state
  const [industry, setIndustry] = useState(INDUSTRIES[0])
  const [employeeRange, setEmployeeRange] = useState(EMPLOYEE_RANGES[0].value)
  const [location, setLocation] = useState('United Kingdom')
  const [keywords, setKeywords] = useState('')

  const handleSearch = async () => {
    setIsSearching(true)
    setSearchError(null)
    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, employeeRange, location, keywords }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Search failed')
      }
      const data = await res.json() as { leads: Lead[]; totalSearched: number }
      setLeads(data.leads)
      setTotalSearched(data.totalSearched)
      setPhase('reviewing')
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSearching(false)
    }
  }

  const handleGenerate = async (approvedLeads: ReviewedLead[]) => {
    // Initialise pack statuses
    const initialPacks: PackStatus[] = approvedLeads.map((l) => ({
      company: l.company,
      status: 'pending',
    }))
    setPacks(initialPacks)
    setPhase('generating')

    // Generate each pack sequentially
    const results = [...initialPacks]

    for (let i = 0; i < approvedLeads.length; i++) {
      const lead = approvedLeads[i]

      // Mark as generating
      results[i] = { ...results[i], status: 'generating' }
      setPacks([...results])

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company: lead.company,
            url: lead.website || '',
            recipientName: lead.recipientName || lead.contactTitle,
            jobTitle: lead.contactTitle,
            notes: `Industry: ${lead.industry}. Size: ${lead.employees}. ${lead.description}`.slice(0, 500),
          }),
        })

        if (!res.ok) {
          throw new Error(await res.text())
        }

        // Read streaming response fully
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let completion = ''

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            completion += decoder.decode(value, { stream: true })

            // Update in real time
            results[i] = { ...results[i], status: 'generating', completion }
            setPacks([...results])
          }
        }

        results[i] = { ...results[i], status: 'done', completion }
      } catch (err) {
        results[i] = {
          ...results[i],
          status: 'error',
          error: err instanceof Error ? err.message : 'Generation failed',
        }
      }

      setPacks([...results])
    }

    setPhase('done')
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-lg font-bold tracking-tight text-gray-900">ERP EXPERTS</span>
              <span className="ml-3 text-sm text-gray-400">Letter Portal</span>
            </div>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-gray-400 hover:text-gray-700">
                Single letter
              </Link>
              <span className="text-gray-900 font-medium">Discover leads</span>
            </nav>
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-widest">Internal · Confidential</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Phase 1: Search form */}
        {phase === 'form' && (
          <div className="max-w-lg">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Discover leads</h1>
            <p className="text-gray-500 text-sm mb-8">
              Set your criteria below. The system will search Apollo for matching UK companies, score
              them for ERP-readiness, and surface the best 10 for you to review before generating
              letter packs.
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company size</label>
                <select
                  value={employeeRange}
                  onChange={(e) => setEmployeeRange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  {EMPLOYEE_RANGES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Keywords <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. multi-site, international, ecommerce"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-300"
                />
              </div>

              {searchError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                  {searchError}
                </div>
              )}

              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSearching ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Searching and scoring leads…
                  </span>
                ) : (
                  'Find and score leads'
                )}
              </button>

              {isSearching && (
                <p className="text-xs text-gray-400 text-center">
                  Searching Apollo and scoring with Claude — this takes 30–60 seconds.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Phase 2: Review */}
        {phase === 'reviewing' && (
          <>
            <button
              onClick={() => setPhase('form')}
              className="mb-6 text-sm text-gray-400 hover:text-gray-600 underline"
            >
              ← New search
            </button>
            <LeadReview
              leads={leads}
              totalSearched={totalSearched}
              onGenerate={handleGenerate}
            />
          </>
        )}

        {/* Phase 3 & 4: Generating / Done */}
        {(phase === 'generating' || phase === 'done') && (
          <>
            {phase === 'done' && (
              <button
                onClick={() => setPhase('form')}
                className="mb-6 text-sm text-gray-400 hover:text-gray-600 underline"
              >
                ← New search
              </button>
            )}
            <BatchOutput packs={packs} />
          </>
        )}
      </div>

      <footer className="mt-auto py-6 text-center text-xs text-gray-400 border-t border-gray-100">
        ERP Experts Ltd · Internal Outreach Generation Portal
      </footer>
    </main>
  )
}
