'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Search, Zap } from 'lucide-react'
import LeadReview, { ReviewedLead } from '@/components/LeadReview'
import BatchOutput from '@/components/BatchOutput'
import { useDiscoverStore } from '@/lib/discover-store'

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

// ── Component ──────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const store = useDiscoverStore()

  const handlePreset = (preset: typeof PRESETS[0]) => {
    store.startSearch(
      { industry: preset.industry, employeeRange: preset.range, location: preset.loc, keywords: '' },
      preset.label
    )
  }

  const handleCustomSearch = () => {
    store.startSearch({
      industry: store.industry,
      employeeRange: store.employeeRange,
      location: store.location,
      keywords: store.keywords,
    })
  }

  const handleGenerate = (approvedLeads: ReviewedLead[]) => {
    store.startGeneration(approvedLeads)
  }

  return (
    <main className="min-h-[calc(100vh-52px)]">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Form ────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {store.phase === 'form' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl"
            >
              <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white tracking-tight mb-1">Discover leads</h1>
              <p className="text-sm text-gray-500 dark:text-[#555] mb-8 leading-relaxed">
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
                    className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1e1e1e] hover:border-gray-300 dark:hover:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-white/[0.02] rounded-xl px-4 py-3 text-left transition-colors group shadow-sm dark:shadow-none"
                  >
                    <div className="text-[13px] font-medium text-gray-700 dark:text-[#ccc] group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      {preset.label}
                    </div>
                    <div className="text-[11px] text-gray-400 dark:text-[#444] mt-0.5">{preset.sub}</div>
                  </motion.button>
                ))}
              </div>

              {/* Custom search toggle */}
              <button
                onClick={() => store.setShowCustom(!store.showCustom)}
                className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#444] hover:text-gray-600 dark:hover:text-[#888] transition-colors mb-4"
              >
                {store.showCustom ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                Custom search
              </button>

              <AnimatePresence>
                {store.showCustom && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1e1e1e] rounded-xl p-6 space-y-4 shadow-sm dark:shadow-none">
                      <div className="grid grid-cols-2 gap-4">
                        <SelectField label="Industry" value={store.industry} onChange={(v) => store.setFormField('industry', v)}
                          options={INDUSTRIES.map((i) => ({ label: i, value: i }))} />
                        <SelectField label="Company size" value={store.employeeRange} onChange={(v) => store.setFormField('employeeRange', v)}
                          options={EMPLOYEE_RANGES} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-400 dark:text-[#444] mb-1.5 uppercase tracking-[0.1em]">Location</label>
                          <input type="text" value={store.location} onChange={(e) => store.setFormField('location', e.target.value)}
                            className="w-full border border-gray-200 dark:border-[#1e1e1e] bg-white dark:bg-[#1a1a1a] rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-[#2a2a2a] focus:ring-1 focus:ring-gray-200 dark:focus:ring-[#1e1e1e] transition-colors" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-400 dark:text-[#444] mb-1.5 uppercase tracking-[0.1em]">
                            Keywords <span className="normal-case font-normal text-gray-300 dark:text-[#333]">(optional)</span>
                          </label>
                          <input type="text" value={store.keywords} onChange={(e) => store.setFormField('keywords', e.target.value)}
                            placeholder="e.g. multi-site, ecommerce"
                            className="w-full border border-gray-200 dark:border-[#1e1e1e] bg-white dark:bg-[#1a1a1a] rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-[#333] focus:outline-none focus:border-gray-400 dark:focus:border-[#2a2a2a] focus:ring-1 focus:ring-gray-200 dark:focus:ring-[#1e1e1e] transition-colors" />
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleCustomSearch}
                        className="w-full px-5 py-3 bg-gray-900 dark:bg-white text-white dark:text-[#090909] text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-[#e8e8e8]"
                      >
                        <Search className="w-4 h-4" />
                        Search
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {store.searchError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-lg p-4 text-sm text-red-600 dark:text-red-400"
                >
                  {store.searchError}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Streaming / Results ─────────────────────────────────────────── */}
        {(store.phase === 'streaming' || store.phase === 'results') && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {store.activePreset && (
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-gray-400 dark:text-[#444]" />
                    <span className="text-xs text-gray-500 dark:text-[#555]">{store.activePreset}</span>
                  </div>
                )}
              </div>
              <button onClick={store.reset} className="text-xs text-gray-400 dark:text-[#444] hover:text-gray-600 dark:hover:text-[#888] underline underline-offset-2 transition-colors">
                ← New search
              </button>
            </div>

            <LeadReview
              leads={store.leads}
              totalSearched={store.totalSearched}
              onGenerate={handleGenerate}
              isStreaming={store.phase === 'streaming'}
              streamStatus={store.streamStatus}
              streamProgress={store.streamProgress}
            />
          </>
        )}

        {/* ── Generating / Done ────────────────────────────────────────────── */}
        {(store.phase === 'generating' || store.phase === 'done') && (
          <>
            {store.phase === 'done' && (
              <button onClick={store.reset} className="mb-6 text-xs text-gray-400 dark:text-[#444] hover:text-gray-600 dark:hover:text-[#888] underline underline-offset-2 transition-colors">
                ← New search
              </button>
            )}
            <BatchOutput packs={store.packs} />
          </>
        )}
      </div>

      <footer className="mt-auto py-6 text-center text-[11px] text-gray-300 dark:text-[#333] border-t border-gray-200 dark:border-[#1e1e1e]">
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
      <label className="block text-[11px] font-medium text-gray-400 dark:text-[#444] mb-1.5 uppercase tracking-[0.1em]">{label}</label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none border border-gray-200 dark:border-[#1e1e1e] bg-white dark:bg-[#1a1a1a] rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-[#2a2a2a] focus:ring-1 focus:ring-gray-200 dark:focus:ring-[#1e1e1e] transition-colors cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="w-4 h-4 text-gray-400 dark:text-[#444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )
}
