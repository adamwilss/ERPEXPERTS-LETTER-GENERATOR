'use client'

import { useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Search, Zap, Sparkles, ChevronDown, ChevronUp, Compass,
  Factory, Truck, ShoppingCart, Wrench, HardHat, Store,
  Briefcase, Cpu
} from 'lucide-react'
import { GradientBorder } from '@/components/MotionConfig'
import LeadReview, { ReviewedLead } from '@/components/LeadReview'
import BatchOutput from '@/components/BatchOutput'
import { useDiscoverStore, getPendingLeadsFromStorage } from '@/lib/discover-store'

const PRESETS = [
  { label: 'Manufacturing', sub: '50-200 · UK', industry: 'Manufacturing', range: '51,200', loc: 'United Kingdom', icon: Factory, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', ring: 'group-hover:ring-blue-400/30' },
  { label: 'Distribution', sub: '100-500 · UK', industry: 'Wholesale Distribution', range: '101,500', loc: 'United Kingdom', icon: Truck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', ring: 'group-hover:ring-emerald-400/30' },
  { label: 'Ecommerce', sub: '50-200 · UK', industry: 'Ecommerce', range: '51,200', loc: 'United Kingdom', icon: ShoppingCart, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', ring: 'group-hover:ring-amber-400/30' },
  { label: 'Field Services', sub: '50-200 · UK', industry: 'Field Services', range: '51,200', loc: 'United Kingdom', icon: Wrench, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20', ring: 'group-hover:ring-purple-400/30' },
  { label: 'Construction', sub: '100-500 · UK', industry: 'Construction', range: '101,500', loc: 'United Kingdom', icon: HardHat, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20', ring: 'group-hover:ring-orange-400/30' },
  { label: 'Specialty Retail', sub: '50-200 · UK', industry: 'Specialty Retail', range: '51,200', loc: 'United Kingdom', icon: Store, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', ring: 'group-hover:ring-rose-400/30' },
  { label: 'Professional Services', sub: '50-200 · UK', industry: 'Professional Services', range: '51,200', loc: 'United Kingdom', icon: Briefcase, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10', border: 'border-cyan-200 dark:border-cyan-500/20', ring: 'group-hover:ring-cyan-400/30' },
  { label: 'Technology', sub: '50-200 · UK', industry: 'Technology', range: '51,200', loc: 'United Kingdom', icon: Cpu, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/20', ring: 'group-hover:ring-indigo-400/30' },
]

const EMPLOYEE_RANGES = [
  { label: '10 - 50 employees', value: '11,50' },
  { label: '50 - 200 employees', value: '51,200' },
  { label: '100 - 500 employees', value: '101,500' },
  { label: '200 - 1,000 employees', value: '201,1000' },
  { label: '500 - 2,000 employees', value: '501,2000' },
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
    <main className="page-shell relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh pointer-events-none z-0" />
      <div className="relative z-10">
        <Suspense fallback={null}>
          <BatchDetector />
        </Suspense>
        <div className="page-container">
          {/* ── Form ────────────────────────────────────────────────────────── */}
          {store.phase === 'form' && (
            <div className="max-w-2xl animate-fade-up">
              <div className="mb-10">
                <div className="page-badge-glow mb-5">
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
                {PRESETS.map((preset) => {
                  const Icon = preset.icon
                  return (
                    <motion.button
                      key={preset.label}
                      onClick={() => handlePreset(preset)}
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="group card card-hover px-4 py-3.5 text-left ring-1 ring-transparent transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={`w-8 h-8 rounded-lg ${preset.bg} ${preset.border} border flex items-center justify-center transition-all group-hover:scale-110`}>
                          <Icon className={`w-4 h-4 ${preset.color}`} />
                        </div>
                        <Sparkles className="w-3.5 h-3.5 text-gray-300 dark:text-[#333] group-hover:text-gray-400 dark:group-hover:text-[#555] transition-colors opacity-0 group-hover:opacity-100" />
                      </div>
                      <div className="text-[13px] font-semibold text-gray-800 dark:text-[#ddd] group-hover:text-gray-950 dark:group-hover:text-white transition-colors">
                        {preset.label}
                      </div>
                      <div className="text-[11px] text-gray-400 dark:text-[#444] font-medium mt-0.5">{preset.sub}</div>
                    </motion.button>
                  )
                })}
              </div>

              {/* Custom search */}
              <motion.button
                onClick={() => store.setShowCustom(!store.showCustom)}
                whileHover={{ x: 2 }}
                className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#444] hover:text-gray-600 dark:hover:text-[#888] transition-colors mb-4 font-semibold"
              >
                {store.showCustom ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                Custom search
              </motion.button>

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
                    <motion.button onClick={handleCustomSearch} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="btn btn-primary w-full">
                      <Search className="w-4 h-4" />
                      Search
                    </motion.button>
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
                      <Zap className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-semibold text-gray-500 dark:text-[#555]">
                        {store.activePreset}
                      </span>
                    </div>
                  )}
                </div>
                <button onClick={store.reset} className="btn btn-ghost text-xs underline underline-offset-2"
                >
                  &larr; New search
                </button>
              </div>

              <div className="mb-6 p-4 bg-emerald-50/60 dark:bg-emerald-500/[0.07] border border-emerald-200/60 dark:border-emerald-500/15 rounded-xl flex items-center justify-between backdrop-blur-sm animate-fade-up"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center"
                  >
                    <svg
                      className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
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
                  <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300"
                  >
                    Search saved automatically
                  </span>
                </div>
                <Link
                  href="/searches"
                  className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
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
                  &larr; New search
                </button>
              )}
              <BatchOutput packs={store.packs} />
            </>
          )}
        </div>

        <footer className="page-footer">
          ERP Experts Ltd · Internal Outreach Generation Portal
        </footer>
      </div>
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
