'use client'

import { useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, Zap, Sparkles, ChevronDown, ChevronUp, Compass } from 'lucide-react'
import { GradientBorder } from '@/components/MotionConfig'
import LeadReview, { ReviewedLead } from '@/components/LeadReview'
import BatchOutput from '@/components/BatchOutput'
import { useDiscoverStore, getPendingLeadsFromStorage } from '@/lib/discover-store'

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

function BatchDetector() {
  const store = useDiscoverStore()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('batch') === 'true' && store.phase === 'form') {
      const pending = getPendingLeadsFromStorage()
      if (pending && pending.length > 0) {
        store.startGeneration(pending)
      }
    }
  }, [searchParams, store])

  return null
}

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
    <main className="page-shell">
      <Suspense fallback={null}>
        <BatchDetector />
      </Suspense>
      <div className="page-container">
        {/* ── Form ────────────────────────────────────────────────────────── */}
        {store.phase === 'form' && (
          <div className="max-w-2xl animate-fade-up">
            <div className="mb-10">
              <div className="page-badge mb-4">
                <Compass className="w-3.5 h-3.5 text-blue-500" />
                Apollo + AI Ranking
              </div>
              <h1 className="page-title">Discover leads</h1>
              <p className="page-description">
                Pick a preset to search instantly, or customise your own criteria. Results are ranked by ERP fit and data completeness.
              </p>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 stagger-children">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset)}
                  className="group card card-hover px-4 py-3.5 text-left active:scale-[0.97]"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-[13px] font-semibold text-gray-800 dark:text-[#ddd] group-hover:text-gray-950 dark:group-hover:text-white transition-colors"
                    >
                      {preset.label}
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-gray-300 dark:text-[#333] group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100" />
                  </div>
                  <div className="text-[11px] text-gray-400 dark:text-[#444] font-medium">{preset.sub}</div>
                </button>
              ))}
            </div>

            {/* Custom search */}
            <button
              onClick={() => store.setShowCustom(!store.showCustom)}
              className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#444] hover:text-gray-600 dark:hover:text-[#888] transition-colors mb-4 font-semibold"
            >
              {store.showCustom ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              Custom search
            </button>

            {store.showCustom && (
              <div className="overflow-hidden animate-fade-up"
              >
                <GradientBorder>
                  <div className="card p-7 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <SelectField
                      label="Industry"
                      value={store.industry}
                      onChange={(v) => store.setFormField('industry', v)}
                      options={INDUSTRIES.map((i) => ({ label: i, value: i }))}
                    />
                    <SelectField
                      label="Company size"
                      value={store.employeeRange}
                      onChange={(v) => store.setFormField('employeeRange', v)}
                      options={EMPLOYEE_RANGES}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Location</label>
                      <input
                        type="text"
                        value={store.location}
                        onChange={(e) => store.setFormField('location', e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">
                        Keywords{' '}
                        <span className="normal-case font-normal text-gray-300 dark:text-[#333]">
                          (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={store.keywords}
                        onChange={(e) => store.setFormField('keywords', e.target.value)}
                        placeholder="e.g. multi-site, ecommerce"
                        className="input"
                      />
                    </div>
                  </div>
                  <button onClick={handleCustomSearch} className="btn btn-primary w-full">
                    <Search className="w-4 h-4" />
                    Search
                  </button>
                  </div>
                </GradientBorder>
              </div>
            )}

            {store.searchError && (
              <div className="mt-4 bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-xl p-4 text-sm text-red-600 dark:text-red-400 animate-fade-up flex items-start gap-3"
              >
                <div className="mt-0.5 w-5 h-5 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0"
                >
                  <svg
                    className="w-3 h-3 text-red-600 dark:text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                {store.searchError}
              </div>
            )}
          </div>
        )}

        {/* ── Streaming / Results ─────────────────────────────────────────── */}
        {(store.phase === 'streaming' || store.phase === 'results') && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {store.activePreset && (
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-gray-400 dark:text-[#444]" />
                    <span className="text-xs font-medium text-gray-500 dark:text-[#555]">
                      {store.activePreset}
                    </span>
                  </div>
                )}
              </div>
              <button onClick={store.reset} className="btn btn-ghost text-xs underline underline-offset-2"
              >
                ← New search
              </button>
            </div>

            <div className="mb-6 p-4 bg-blue-50/80 dark:bg-blue-500/[0.07] border border-blue-200/80 dark:border-blue-500/15 rounded-xl flex items-center justify-between backdrop-blur-sm animate-fade-up"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center"
                >
                  <svg
                    className="w-4 h-4 text-blue-600 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-300"
                >
                  Search saved automatically
                </span>
              </div>
              <Link
                href="/searches"
                className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                View saved searches →
              </Link>
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

        {/* ── Generating / Done ──────────────────────────────────────────── */}
        {(store.phase === 'generating' || store.phase === 'done') && (
          <>
            {store.phase === 'done' && (
              <button
                onClick={store.reset}
                className="mb-6 btn btn-ghost text-xs underline underline-offset-2"
              >
                ← New search
              </button>
            )}
            <BatchOutput packs={store.packs} />
          </>
        )}
      </div>

      <footer className="page-footer">
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
      <label className="label">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input appearance-none pr-10 cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <svg
            className="w-4 h-4 text-gray-400 dark:text-[#444]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
