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

      <div className="border-2 border-emerald-500 bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-600 mb-3">
          Future state
        </p>
        <p className="text-[36px] font-bold text-gray-900 leading-none">1</p>
        <p className="text-[13px] text-gray-700 mt-2 font-medium">unified platform</p>
        <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
          NetSuite at the centre. One live record across sales, stock, finance, and fulfilment.
        </p>
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

      <BeforeAfterCards />

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
