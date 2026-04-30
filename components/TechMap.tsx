import Image from 'next/image'
import { parseTechTable, TableRow } from '@/lib/parse'

// ── Relationship normalizer ────────────────────────────────────────────────────

const RELATIONSHIP_KEYWORDS = ['Integrate', 'Replace', 'Eliminate', 'Native'] as const

function normalizeRelationship(text: string): string {
  const lower = text.toLowerCase()
  for (const kw of RELATIONSHIP_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) return kw
  }
  if (lower.includes('integrat') || lower.includes('connect') || lower.includes('sync')) return 'Integrate'
  if (lower.includes('replac') || lower.includes('substitut') || lower.includes('migrate')) return 'Replace'
  if (lower.includes('eliminat') || lower.includes('remove') || lower.includes('remov')) return 'Eliminate'
  if (lower.includes('nativ') || lower.includes('built-in') || lower.includes('internal')) return 'Native'
  return 'Other'
}

// ── Visual config per relationship ─────────────────────────────────────────────

const RELATIONSHIP_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  Integrate: {
    color: '#3b82f6',
    bg: '#f0f7ff',
    border: 'border-l-blue-500',
    label: 'Connects to NetSuite',
  },
  Replace: {
    color: '#f59e0b',
    bg: '#fffcf0',
    border: 'border-l-amber-500',
    label: 'Replaced by NetSuite',
  },
  Eliminate: {
    color: '#ef4444',
    bg: '#fff8f8',
    border: 'border-l-red-500',
    label: 'Eliminated',
  },
  Native: {
    color: '#10b981',
    bg: '#f4fdf9',
    border: 'border-l-emerald-500',
    label: 'Handled natively',
  },
}

// ── Before / After summary cards ────────────────────────────────────────────────

function SummaryCards({ rows }: { rows: TableRow[] }) {
  const count = rows.length
  const eliminated = rows.filter((r) => /replace|eliminat/i.test(r.relationship)).length

  return (
    <div className="grid grid-cols-2 gap-4 mb-10">
      <div className="border border-gray-200 bg-gray-50/50 p-5">
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-400 mb-2">
          Likely Current State
        </p>
        <p className="text-[32px] font-extrabold text-gray-900 leading-none">{count}</p>
        <p className="text-[11px] text-gray-500 mt-1.5">disconnected systems</p>
        <p className="text-[9px] text-gray-400 mt-2 leading-relaxed">
          {eliminated} can be replaced or eliminated
        </p>
      </div>

      <div className="border-2 border-gray-900 bg-white p-5">
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-600 mb-2">
          Future State
        </p>
        <p className="text-[32px] font-extrabold text-gray-900 leading-none">1</p>
        <p className="text-[11px] text-gray-700 mt-1.5 font-medium">unified platform</p>
        <p className="text-[9px] text-gray-500 mt-2 leading-relaxed">
          NetSuite at the centre
        </p>
      </div>
    </div>
  )
}

// ── Single system row -- editorial card style ────────────────────────────────────

function SystemCard({ row }: { row: TableRow }) {
  const rel = normalizeRelationship(row.relationship)
  const style = RELATIONSHIP_STYLE[rel] ?? RELATIONSHIP_STYLE.Integrate

  return (
    <div
      className="border-l-[3px] pl-5 py-5 border-b border-gray-100 last:border-b-0"
      style={{ borderLeftColor: style.color, backgroundColor: style.bg }}
    >
      <div className="flex items-baseline gap-3 mb-2.5">
        <span className="text-[15px] font-bold text-gray-900 leading-tight tracking-[-0.01em]">
          {row.system}
        </span>
        <span
          className="text-[9px] font-bold uppercase tracking-[0.08em] px-2.5 py-0.5 rounded-full border"
          style={{
            color: style.color,
            borderColor: style.color,
            backgroundColor: 'transparent',
          }}
        >
          {rel}
        </span>
      </div>
      <p className="text-[13px] text-gray-700 leading-relaxed max-w-prose">
        {row.meaning}
      </p>
      {row.impact && (
        <div className="mt-2.5 pl-3 border-l-2 border-gray-200" style={{ borderLeftColor: style.color + '40' }}>
          <p className="text-[12px] text-gray-500 leading-relaxed">
            {row.impact}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TechMap({ content }: { content: string }) {
  const { rows, before } = parseTechTable(content)

  const lines = before.split('\n').filter(Boolean)
  const title = lines.find((l) => l.startsWith('TITLE:'))?.replace('TITLE:', '').trim() ?? 'Technology Integration Map'
  const subtitle = lines.find((l) => l.startsWith('SUBTITLE:'))?.replace('SUBTITLE:', '').trim() ?? ''

  // Group and order rows
  const relationshipOrder = ['Integrate', 'Replace', 'Eliminate', 'Native']
  const grouped: Record<string, TableRow[]> = {}
  for (const row of rows) {
    const key = normalizeRelationship(row.relationship)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(row)
  }
  const orderedKeys = [
    ...relationshipOrder.filter(k => grouped[k]),
    ...Object.keys(grouped).filter(k => !relationshipOrder.includes(k)),
  ]

  return (
    <div>
      {/* Letterhead -- logo only */}
      <div className="mb-10">
        <Image
          src="/erpexperts-logo.png"
          alt="ERP Experts"
          width={280}
          height={96}
          className="h-24 w-auto object-contain"
        />
      </div>

      {/* Title */}
      {title && (
        <h2 className="text-[22px] font-bold text-gray-900 tracking-[-0.02em] leading-tight mb-2">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="text-[13px] text-gray-500 mb-10 leading-relaxed">
          {subtitle}
        </p>
      )}

      {rows.length > 0 && (
        <>
          <SummaryCards rows={rows} />

          {/* System cards by relationship group */}
          {orderedKeys.map(key => {
            const groupRows = grouped[key]
            const style = RELATIONSHIP_STYLE[key] ?? RELATIONSHIP_STYLE.Integrate
            return (
              <div key={key} className="mb-8">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: style.color }}
                  />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.1em]">
                    {style.label}
                  </span>
                  <span className="text-[10px] text-gray-300 ml-auto">{groupRows.length}</span>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {groupRows.map((row, i) => (
                    <SystemCard key={i} row={row} />
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}

      <div className="mt-12 page-footer-text flex items-center justify-between tracking-wide">
        <span>ERP Experts Ltd &middot; Manchester, UK &middot; 01785 336 253</span>
        <span>hello@erpexperts.co.uk &middot; www.erpexperts.co.uk</span>
      </div>
    </div>
  )
}
