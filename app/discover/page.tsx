'use client'

import { useState } from 'react'
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
  const [searchStep, setSearchStep] = useState<'apollo' | 'scoring' | null>(null)
  const [foundCount, setFoundCount] = useState(0)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [totalSearched, setTotalSearched] = useState(0)
  const [packs, setPacks] = useState<PackStatus[]>([])

  const [industry, setIndustry] = useState(INDUSTRIES[0])
  const [employeeRange, setEmployeeRange] = useState(EMPLOYEE_RANGES[0].value)
  const [location, setLocation] = useState('United Kingdom')
  const [keywords, setKeywords] = useState('')

  const handleSearch = async () => {
    setIsSearching(true)
    setSearchError(null)
    setSearchStep('apollo')

    try {
      const searchRes = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, employeeRange, location, keywords }),
      })
      if (!searchRes.ok) {
        let errMsg = `Apollo search failed (HTTP ${searchRes.status})`
        try { const b = await searchRes.json(); errMsg = b.error ?? errMsg } catch { /* ignore */ }
        throw new Error(errMsg)
      }
      const { orgs, totalFound } = await searchRes.json()
      setFoundCount(totalFound)

      setSearchStep('scoring')
      const scoreRes = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgs, industry }),
      })
      if (!scoreRes.ok) {
        let errMsg = `Scoring failed (HTTP ${scoreRes.status})`
        try { const b = await scoreRes.json(); errMsg = b.error ?? errMsg } catch { /* ignore */ }
        throw new Error(errMsg)
      }
      const data = await scoreRes.json() as { leads: Lead[]; totalSearched: number }
      setLeads(data.leads)
      setTotalSearched(data.totalSearched)
      setPhase('reviewing')
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSearching(false)
      setSearchStep(null)
    }
  }

  const handleGenerate = async (approvedLeads: ReviewedLead[]) => {
    const initialPacks: PackStatus[] = approvedLeads.map((l) => ({
      company: l.company,
      status: 'pending',
      recipientName: l.recipientName || l.contactName,
      contactTitle: l.contactTitle,
      erpScore: l.erpScore,
      website: l.website,
      location: l.location,
    }))
    setPacks(initialPacks)
    setPhase('generating')

    const results = [...initialPacks]

    for (let i = 0; i < approvedLeads.length; i++) {
      const lead = approvedLeads[i]

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
            postalAddress: lead.postalAddress || '',
            notes: `Industry: ${lead.industry}. Size: ${lead.employees}. ${lead.description}`.slice(0, 500),
          }),
        })

        if (!res.ok) {
          throw new Error(await res.text())
        }

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let completion = ''

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            completion += decoder.decode(value, { stream: true })
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
    <main className="min-h-[calc(100vh-52px)]">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Phase 1: Search form */}
        {phase === 'form' && (
          <div className="max-w-md">
            <h1 className="text-[22px] font-semibold text-white tracking-tight mb-1">Discover leads</h1>
            <p className="text-sm text-[#555] mb-8 leading-relaxed">
              Set your criteria. The system searches Apollo, scores companies for ERP-readiness
              using GPT-4o, and surfaces the best 10 for review.
            </p>

            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6 space-y-5">
              <SelectField
                label="Industry"
                value={industry}
                onChange={setIndustry}
                options={INDUSTRIES.map((i) => ({ label: i, value: i }))}
              />
              <SelectField
                label="Company size"
                value={employeeRange}
                onChange={setEmployeeRange}
                options={EMPLOYEE_RANGES}
              />
              <div>
                <label className="block text-[11px] font-medium text-[#555] mb-1.5 uppercase tracking-[0.1em]">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-[#222] bg-[#0d0d0d] rounded-lg px-3 py-2.5 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#3a3a3a] focus:ring-1 focus:ring-white/10 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#555] mb-1.5 uppercase tracking-[0.1em]">
                  Keywords <span className="normal-case font-normal text-[#3a3a3a]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. multi-site, international, ecommerce"
                  className="w-full border border-[#222] bg-[#0d0d0d] rounded-lg px-3 py-2.5 text-sm text-[#e8e8e8] placeholder:text-[#333] focus:outline-none focus:border-[#3a3a3a] focus:ring-1 focus:ring-white/10 transition-colors"
                />
              </div>

              {searchError && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 text-sm text-red-400">
                  {searchError}
                </div>
              )}

              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full px-5 py-3 bg-white text-[#090909] text-sm font-semibold rounded-lg hover:bg-[#e8e8e8] disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-150"
              >
                {isSearching ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-[#090909]/30 border-t-[#090909] rounded-full animate-spin" />
                    {searchStep === 'apollo' ? 'Searching Apollo…' : `Scoring ${foundCount} companies…`}
                  </span>
                ) : (
                  'Find and score leads →'
                )}
              </button>
            </div>

            {isSearching && (
              <div className="mt-4 space-y-2">
                <StepIndicator
                  active={searchStep === 'apollo'}
                  done={searchStep === 'scoring'}
                  label="Searching Apollo for matching UK companies"
                />
                <StepIndicator
                  active={searchStep === 'scoring'}
                  done={false}
                  label={`Scoring${foundCount > 0 ? ` ${foundCount}` : ''} companies with GPT-4o`}
                  dim={searchStep !== 'scoring'}
                />
              </div>
            )}
          </div>
        )}

        {/* Phase 2: Review */}
        {phase === 'reviewing' && (
          <>
            <button
              onClick={() => setPhase('form')}
              className="mb-6 text-xs text-[#444] hover:text-[#888] underline underline-offset-2 transition-colors"
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
                className="mb-6 text-xs text-[#444] hover:text-[#888] underline underline-offset-2 transition-colors"
              >
                ← New search
              </button>
            )}
            <BatchOutput packs={packs} />
          </>
        )}
      </div>

      <footer className="mt-auto py-6 text-center text-[11px] text-[#333] border-t border-[#141414]">
        ERP Experts Ltd · Internal Outreach Generation Portal
      </footer>
    </main>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[#555] mb-1.5 uppercase tracking-[0.1em]">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none border border-[#222] bg-[#0d0d0d] rounded-lg px-3 py-2.5 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#3a3a3a] focus:ring-1 focus:ring-white/10 transition-colors cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#111] text-[#e8e8e8]">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="w-4 h-4 text-[#444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )
}

function StepIndicator({ active, done, label, dim }: { active: boolean; done: boolean; label: string; dim?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 text-xs transition-colors ${dim ? 'opacity-30' : ''}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        done ? 'bg-emerald-500' : active ? 'bg-white animate-pulse' : 'bg-[#2a2a2a]'
      }`} />
      <span className={`${done ? 'text-[#444] line-through' : active ? 'text-[#888]' : 'text-[#444]'}`}>
        {label}
      </span>
    </div>
  )
}
