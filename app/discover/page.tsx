'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Search, Zap } from 'lucide-react'
import LeadReview, { Lead, ReviewedLead } from '@/components/LeadReview'
import BatchOutput, { PackStatus } from '@/components/BatchOutput'

// ── Presets ────────────────────────────────────────────────────────────────────

const PRESETS = [
  { label: 'Manufacturing', sub: '50–200 · UK', industry: 'Manufacturing', range: '51,200', loc: 'United Kingdom' },
  { label: 'Distribution', sub: '100–500 · UK', industry: 'Wholesale Distribution', range: '101,500', loc: 'United Kingdom' },
  { label: 'Ecommerce', sub: '50–200 · UK', industry: 'Ecommerce', range: '51,200', loc: 'United Kingdom' },
  { label: 'Field Services', sub: '50–200 · UK', industry: 'Field Services', range: '51,200', loc: 'United Kingdom' },
  { label: 'Construction', sub: '100–500 · UK', industry: 'Construction', range: '101,500', loc: 'United Kingdom' },
  { label: 'Specialty Retail', sub: '50–200 · UK', industry: 'Specialty Retail', range: '51,200', loc: 'United Kingdom' },
  { label: 'Professional Services', sub: '50–200 · UK', industry: 'Professional Services', range: '51,200', loc: 'United Kingdom' },
  { label: 'Technology', sub: '50–200 · UK', industry: 'Technology', range: '51,200', loc: 'United Kingdom' },
]

const EMPLOYEE_RANGES = [
  { label: '10 – 50 employees', value: '11,50' },
  { label: '50 – 200 employees', value: '51,200' },
  { label: '100 – 500 employees', value: '101,500' },
  { label: '200 – 1,000 employees', value: '201,1000' },
  { label: '500 – 2,000 employees', value: '501,2000' },
]

const INDUSTRIES = [
  'Manufacturing', 'Wholesale Distribution', 'Ecommerce', 'Field Services',
  'Professional Services', 'Specialty Retail', 'Technology', 'Construction',
  'Healthcare', 'Food & Beverage', 'Automotive', 'Aerospace & Defence',
]

// ── Types ──────────────────────────────────────────────────────────────────────

type Phase = 'form' | 'streaming' | 'results' | 'generating' | 'done'

interface SearchParams {
  industry: string
  employeeRange: string
  location: string
  keywords: string
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const [phase, setPhase] = useState<Phase>('form')
  const [streamedLeads, setStreamedLeads] = useState<Lead[]>([])
  const [totalSearched, setTotalSearched] = useState(0)
  const [streamStatus, setStreamStatus] = useState('')
  const [streamProgress, setStreamProgress] = useState({ done: 0, total: 30 })
  const [searchError, setSearchError] = useState<string | null>(null)
  const [packs, setPacks] = useState<PackStatus[]>([])
  const [showCustom, setShowCustom] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)

  // Custom form state
  const [industry, setIndustry] = useState(INDUSTRIES[0])
  const [employeeRange, setEmployeeRange] = useState(EMPLOYEE_RANGES[1].value)
  const [location, setLocation] = useState('United Kingdom')
  const [keywords, setKeywords] = useState('')

  const startStreaming = async (params: SearchParams) => {
    setSearchError(null)
    setStreamedLeads([])
    setTotalSearched(0)
    setStreamStatus('Searching Apollo…')
    setStreamProgress({ done: 0, total: 30 })
    setPhase('streaming')

    try {
      const res = await fetch('/api/discover-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      if (!res.ok || !res.body) {
        let msg = `Search failed (HTTP ${res.status})`
        try { const b = await res.json(); msg = b.error ?? msg } catch {}
        throw new Error(msg)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          // Parse JSON separately so parse errors don't swallow event processing errors
          let event: Record<string, unknown>
          try {
            event = JSON.parse(line)
          } catch {
            continue // genuinely malformed / partial line
          }
          if (event.type === 'status') {
            setStreamStatus(event.message as string)
            if (event.total) setStreamProgress((p) => ({ ...p, total: event.total as number }))
          } else if (event.type === 'lead') {
            // Append only — never sort here; sorting reshuffles array indices and
            // breaks LeadReview's ID-based tracking, causing leads to vanish
            setStreamedLeads((prev) => [...prev, event.lead as Lead])
            setStreamProgress({ done: event.count as number, total: event.total as number })
          } else if (event.type === 'done') {
            setTotalSearched((event.total as number) * 4)
            setPhase('results')
          } else if (event.type === 'error') {
            throw new Error(event.message as string) // propagates to outer catch → shows error UI
          }
        }
      }

      if (phase !== 'results') setPhase('results')
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Something went wrong')
      setPhase('form')
    }
  }

  const handlePreset = (preset: typeof PRESETS[0]) => {
    setActivePreset(preset.label)
    startStreaming({
      industry: preset.industry,
      employeeRange: preset.range,
      location: preset.loc,
      keywords: '',
    })
  }

  const handleCustomSearch = () => {
    setActivePreset(null)
    startStreaming({ industry, employeeRange, location, keywords })
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
            industry: lead.industry,
            notes: `Size: ${lead.employees}. ${lead.description}`.slice(0, 400),
          }),
        })
        if (!res.ok) throw new Error(await res.text())
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
        results[i] = { ...results[i], status: 'error', error: err instanceof Error ? err.message : 'Failed' }
      }
      setPacks([...results])
    }
    setPhase('done')
  }

  const reset = () => {
    setPhase('form')
    setStreamedLeads([])
    setActivePreset(null)
    setSearchError(null)
  }

  return (
    <main className="min-h-[calc(100vh-52px)]">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Form ────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {phase === 'form' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl"
            >
              <h1 className="text-[22px] font-semibold text-white tracking-tight mb-1">Discover leads</h1>
              <p className="text-sm text-[#555] mb-8 leading-relaxed">
                Pick a preset to search instantly, or customise your own criteria below.
              </p>

              {/* Preset chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                {PRESETS.map((preset) => (
                  <motion.button
                    key={preset.label}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handlePreset(preset)}
                    className="bg-[#111] border border-[#1e1e1e] hover:border-[#333] hover:bg-[#161616] rounded-xl px-4 py-3 text-left transition-colors group"
                  >
                    <div className="text-[13px] font-medium text-[#ccc] group-hover:text-white transition-colors">
                      {preset.label}
                    </div>
                    <div className="text-[11px] text-[#444] mt-0.5">{preset.sub}</div>
                  </motion.button>
                ))}
              </div>

              {/* Custom search toggle */}
              <button
                onClick={() => setShowCustom((v) => !v)}
                className="flex items-center gap-2 text-xs text-[#444] hover:text-[#888] transition-colors mb-4"
              >
                {showCustom ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                Custom search
              </button>

              <AnimatePresence>
                {showCustom && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <SelectField label="Industry" value={industry} onChange={setIndustry}
                          options={INDUSTRIES.map((i) => ({ label: i, value: i }))} />
                        <SelectField label="Company size" value={employeeRange} onChange={setEmployeeRange}
                          options={EMPLOYEE_RANGES} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-medium text-[#555] mb-1.5 uppercase tracking-[0.1em]">Location</label>
                          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                            className="w-full border border-[#222] bg-[#0d0d0d] rounded-lg px-3 py-2.5 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#3a3a3a] focus:ring-1 focus:ring-white/10 transition-colors" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-[#555] mb-1.5 uppercase tracking-[0.1em]">
                            Keywords <span className="normal-case font-normal text-[#3a3a3a]">(optional)</span>
                          </label>
                          <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)}
                            placeholder="e.g. multi-site, ecommerce"
                            className="w-full border border-[#222] bg-[#0d0d0d] rounded-lg px-3 py-2.5 text-sm text-[#e8e8e8] placeholder:text-[#333] focus:outline-none focus:border-[#3a3a3a] focus:ring-1 focus:ring-white/10 transition-colors" />
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleCustomSearch}
                        className="w-full px-5 py-3 bg-white text-[#090909] text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Search className="w-4 h-4" />
                        Search
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {searchError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 bg-red-500/5 border border-red-500/20 rounded-lg p-4 text-sm text-red-400"
                >
                  {searchError}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Streaming / Results ─────────────────────────────────────────── */}
        {(phase === 'streaming' || phase === 'results') && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activePreset && (
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-[#444]" />
                    <span className="text-xs text-[#555]">{activePreset}</span>
                  </div>
                )}
              </div>
              <button onClick={reset} className="text-xs text-[#333] hover:text-[#888] underline underline-offset-2 transition-colors">
                ← New search
              </button>
            </div>

            <LeadReview
              leads={streamedLeads}
              totalSearched={totalSearched}
              onGenerate={handleGenerate}
              isStreaming={phase === 'streaming'}
              streamStatus={streamStatus}
              streamProgress={streamProgress}
            />
          </>
        )}

        {/* ── Generating / Done ────────────────────────────────────────────── */}
        {(phase === 'generating' || phase === 'done') && (
          <>
            {phase === 'done' && (
              <button onClick={reset} className="mb-6 text-xs text-[#444] hover:text-[#888] underline underline-offset-2 transition-colors">
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

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: { label: string; value: string }[]
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[#555] mb-1.5 uppercase tracking-[0.1em]">{label}</label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none border border-[#222] bg-[#0d0d0d] rounded-lg px-3 py-2.5 text-sm text-[#e8e8e8] focus:outline-none focus:border-[#3a3a3a] focus:ring-1 focus:ring-white/10 transition-colors cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#111] text-[#e8e8e8]">{opt.label}</option>
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
