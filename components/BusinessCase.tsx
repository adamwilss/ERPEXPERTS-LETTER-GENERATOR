'use client'

import Image from 'next/image'

// ── Before/After Cards ───────────────────────────────────────────────────────

function BeforeAfterCards() {
  return (
    <div className="grid grid-cols-2 gap-5 mb-7">
      <div className="border border-gray-300 bg-white p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500 mb-3">
          Current state
        </p>
        <p className="text-[36px] font-bold text-gray-900 leading-none">5+</p>
        <p className="text-[13px] text-gray-600 mt-2 font-medium">disconnected tools</p>
        <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
          Shopify, Xero, spreadsheets, 3PL, CRM — each holding a fragment of the operational picture.
        </p>
      </div>

      <div className="border border-gray-900 bg-gray-900 text-white p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-3">
          Future state
        </p>
        <p className="text-[36px] font-bold text-white leading-none">1</p>
        <p className="text-[13px] text-gray-300 mt-2 font-medium">unified platform</p>
        <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
          NetSuite at the centre. One live record across sales, stock, finance, and fulfilment.
        </p>
      </div>
    </div>
  )
}

// ── Integration Architecture ──────────────────────────────────────────────────

function IntegrationFlow() {
  const rows = [
    { system: 'Ecommerce', relationship: 'Integrate', meaning: 'Shopify, Magento, or WooCommerce connects directly to NetSuite — orders, stock, and customer data flow in real time.' },
    { system: 'CRM', relationship: 'Integrate', meaning: 'Salesforce or HubSpot integrates so your sales pipeline and fulfilment data sit in one place.' },
    { system: 'Warehouse / 3PL', relationship: 'Integrate', meaning: 'ShipStation, Peoplevox, or your 3PL connects — stock movements and shipments are visible without manual checks.' },
    { system: 'Accounting', relationship: 'Replace', meaning: 'Xero, Sage, or QuickBooks is retired. Finance moves into the same platform as operations — no more exporting between systems.' },
    { system: 'Spreadsheets', relationship: 'Eliminate', meaning: 'Stock tracking, month-end reports, and manual data assembly disappear. Reporting runs from live data in NetSuite.' },
    { system: 'Multi-Currency / VAT', relationship: 'Native', meaning: 'International orders, multi-currency, VAT, and entity reporting are handled natively — no workarounds required.' },
  ]

  const badge = (rel: string) => {
    if (rel === 'Integrate') return 'text-blue-700 bg-blue-50 border-blue-200'
    if (rel === 'Replace') return 'text-amber-700 bg-amber-50 border-amber-200'
    if (rel === 'Eliminate') return 'text-red-700 bg-red-50 border-red-200'
    return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  }

  return (
    <div className="mb-7">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500 mb-4">
        How NetSuite connects your operation
      </p>

      <div className="border border-gray-200 divide-y divide-gray-100">
        {rows.map((row) => (
          <div key={row.system} className="flex items-start gap-5 px-5 py-4">
            <div className="w-36 flex-shrink-0 pt-0.5">
              <p className="text-[14px] font-semibold text-gray-900">{row.system}</p>
            </div>
            <div className="w-24 flex-shrink-0 pt-0.5">
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge(row.relationship)}`}>
                {row.relationship}
              </span>
            </div>
            <p className="flex-1 text-[13px] text-gray-600 leading-relaxed min-w-0">
              {row.meaning}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Business Case Component ─────────────────────────────────────────────

export default function BusinessCase({ content }: { content: string }) {
  const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

  return (
    <div>
      {/* Letterhead */}
      <div className="flex items-start justify-between pb-7 mb-7 border-b border-gray-200">
        <Image
          src="/erpexperts-logo.png"
          alt="ERP Experts"
          width={280}
          height={96}
          className="h-16 w-auto object-contain"
        />
      </div>

      {/* Charts */}
      <BeforeAfterCards />
      <IntegrationFlow />

      {/* Prose */}
      <div className="font-letter text-[17px] leading-[1.9] text-gray-800 space-y-7">
        {paragraphs.map((para, i) => (
          <p key={i}>{para.trim()}</p>
        ))}
      </div>

      <div className="mt-10 pt-5 border-t border-gray-100 text-[11px] text-gray-400 flex items-center justify-between tracking-wide">
        <span>ERP Experts Ltd · Manchester, UK</span>
        <span>www.erpexperts.co.uk</span>
      </div>
    </div>
  )
}
