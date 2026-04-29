import Image from 'next/image'
import { parseTechTable, TableRow } from '@/lib/parse'
import { BeforeAfterCards } from './TechMapCharts'

// ── Relationship normalizer ────────────────────────────────────────────────────

const RELATIONSHIP_KEYWORDS = ['Integrate', 'Replace', 'Eliminate', 'Native'] as const

function normalizeRelationship(text: string): string {
  const lower = text.toLowerCase()
  // Check if any keyword appears in the text
  for (const kw of RELATIONSHIP_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      return kw
    }
  }
  // Fallback: check for close matches
  if (lower.includes('integrat') || lower.includes('connect') || lower.includes('sync')) return 'Integrate'
  if (lower.includes('replac') || lower.includes('substitut') || lower.includes('migrate')) return 'Replace'
  if (lower.includes('eliminat') || lower.includes('remove') || lower.includes('remov')) return 'Eliminate'
  if (lower.includes('nativ') || lower.includes('built-in') || lower.includes('internal')) return 'Native'
  return 'Other'
}

// ── Config ─────────────────────────────────────────────────────────────────────

const RELATIONSHIP_ORDER = ['Integrate', 'Replace', 'Eliminate', 'Native']

const CONFIG: Record<string, {
  badge: string
  rowBg: string
  groupLabel: string
  dot: string
}> = {
  Integrate: {
    badge: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200',
    rowBg: 'bg-blue-50/40',
    groupLabel: 'Integrates with NetSuite',
    dot: 'bg-blue-400',
  },
  Replace: {
    badge: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
    rowBg: 'bg-amber-50/40',
    groupLabel: 'Replaced by NetSuite',
    dot: 'bg-amber-400',
  },
  Eliminate: {
    badge: 'bg-red-100 text-red-700 ring-1 ring-red-200',
    rowBg: 'bg-red-50/30',
    groupLabel: 'Eliminated entirely',
    dot: 'bg-red-400',
  },
  Native: {
    badge: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
    rowBg: 'bg-emerald-50/40',
    groupLabel: 'Handled natively by NetSuite',
    dot: 'bg-emerald-400',
  },
}

const FALLBACK_CONFIG = {
  badge: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200',
  rowBg: 'bg-gray-50/40',
  groupLabel: 'Other',
  dot: 'bg-gray-400',
}

// ── CTA parser ─────────────────────────────────────────────────────────────────

function parseCTA(text: string): { intro: string | null; phone: string | null; email: string | null; web: string | null } {
  const phone = text.match(/T:\s*([^\s·]+)/)?.[1] ?? null
  const email = text.match(/E:\s*([^\s·]+)/)?.[1] ?? null
  const web = text.match(/W:\s*([^\s·\n]+)/)?.[1] ?? null
  const intro = text.split('\n').find(l => l.trim() && !/^T:|^E:|^W:/.test(l.trim())) ?? null
  return { intro, phone, email, web }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function RelationshipGroup({ label, rows, cfg }: {
  label: string
  rows: TableRow[]
  cfg: typeof FALLBACK_CONFIG
}) {
  return (
    <div>
      {/* Group header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50/80 border-y border-gray-100">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.08em]">
          {label}
        </span>
        <span className="text-[11px] text-gray-400 ml-auto">{rows.length}</span>
      </div>

      {/* Rows */}
      {rows.map((row, i) => {
        const normalizedRel = normalizeRelationship(row.relationship)
        const rowCfg = CONFIG[normalizedRel] ?? FALLBACK_CONFIG
        return (
          <div
            key={i}
            className={`flex gap-5 px-4 py-5 border-b border-gray-100 last:border-b-0 ${rowCfg.rowBg}`}
          >
            {/* System name */}
            <div className="w-32 flex-shrink-0 pt-0.5 min-w-0">
              <span className="text-[14px] font-semibold text-gray-900 leading-snug">
                {row.system}
              </span>
            </div>

            {/* Badge */}
            <div className="w-28 flex-shrink-0 pt-0.5">
              <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${rowCfg.badge}`}>
                {normalizedRel}
              </span>
            </div>

            {/* Meaning */}
            <p className="flex-1 text-[14px] text-gray-600 leading-relaxed min-w-0">
              {row.meaning}
            </p>

            {/* Impact (4th column) */}
            {row.impact && (
              <div className="w-52 flex-shrink-0 pt-0.5 hidden lg:block min-w-0">
                <p className="text-[13px] text-gray-700 leading-relaxed">
                  {row.impact}
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function CTABlock({ text }: { text: string }) {
  const { intro, phone, email, web } = parseCTA(text)
  if (!phone && !email) {
    return (
      <div className="mt-6 pt-5 border-t border-gray-200 text-sm text-gray-600 whitespace-pre-line">
        {text}
      </div>
    )
  }
  return (
    <div className="mt-6 pt-5 border-t border-gray-200">
      {intro && (
        <p className="text-sm font-semibold text-gray-800 mb-3">{intro.trim()}</p>
      )}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
        {phone && (
          <span className="flex items-center gap-1.5">
            <span className="text-gray-400 text-[11px] font-medium uppercase tracking-wide">Tel</span>
            <span>{phone}</span>
          </span>
        )}
        {email && (
          <span className="flex items-center gap-1.5">
            <span className="text-gray-400 text-[11px] font-medium uppercase tracking-wide">Email</span>
            <a href={`mailto:${email}`} className="text-blue-600 hover:underline">{email}</a>
          </span>
        )}
        {web && (
          <span className="flex items-center gap-1.5">
            <span className="text-gray-400 text-[11px] font-medium uppercase tracking-wide">Web</span>
            <span>{web}</span>
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TechMap({ content }: { content: string }) {
  const { rows, before, after } = parseTechTable(content)

  const lines = before.split('\n').filter(Boolean)
  const title = lines.find((l) => l.startsWith('TITLE:'))?.replace('TITLE:', '').trim() ?? ''
  const subtitle = lines.find((l) => l.startsWith('SUBTITLE:'))?.replace('SUBTITLE:', '').trim() ?? ''

  // Group rows by normalized relationship type, preserving AI order within each group
  const grouped: Record<string, TableRow[]> = {}
  for (const row of rows) {
    const key = normalizeRelationship(row.relationship)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(row)
  }

  const orderedKeys = [
    ...RELATIONSHIP_ORDER.filter(k => grouped[k]),
    ...Object.keys(grouped).filter(k => !RELATIONSHIP_ORDER.includes(k)),
  ]

  return (
    <div>
      {/* Letterhead with Logo */}
      <div className="flex items-start justify-between pb-7 mb-7 border-b border-gray-200">
        <Image
          src="/erpexperts-logo.png"
          alt="ERP Experts"
          width={280}
          height={96}
          className="h-16 w-auto object-contain"
        />
      </div>

      {/* Title */}
      {title && (
        <h2 className="text-[22px] font-semibold text-gray-900 tracking-[-0.02em] leading-tight mb-3">{title}</h2>
      )}
      {subtitle && (
        <p className="text-[14px] text-gray-500 mb-7 pb-7 border-b border-gray-200 leading-relaxed">{subtitle}</p>
      )}

      {rows.length > 0 && (
        <>
          <BeforeAfterCards rows={rows} />

          {/* Grouped table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Column headers */}
            <div className="flex gap-5 px-4 py-2.5 bg-white border-b border-gray-200">
              <span className="w-32 flex-shrink-0 text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em]">System</span>
              <span className="w-28 flex-shrink-0 text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em]">Status</span>
              <span className="flex-1 text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em]">What it means</span>
              <span className="w-52 flex-shrink-0 text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] hidden lg:block">Impact</span>
            </div>

            {orderedKeys.map(key => (
              <RelationshipGroup
                key={key}
                label={(CONFIG[key] ?? FALLBACK_CONFIG).groupLabel}
                rows={grouped[key]}
                cfg={CONFIG[key] ?? FALLBACK_CONFIG}
              />
            ))}
          </div>
        </>
      )}

      {after && <CTABlock text={after} />}

      <div className="mt-10 pt-5 border-t border-gray-100 text-[11px] text-gray-400 flex items-center justify-between tracking-wide">
        <span>ERP Experts Ltd · Manchester, UK</span>
        <span>www.erpexperts.co.uk</span>
      </div>
    </div>
  )
}
