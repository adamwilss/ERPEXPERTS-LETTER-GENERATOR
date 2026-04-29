'use client'

import Image from 'next/image'
import InlineRewrite from './InlineRewrite'
import { LetterStyle } from './StyleSelector'

// ── Before/After Cards ───────────────────────────────────────────────────────

function BeforeAfterCards() {
  return (
    <div className="grid grid-cols-2 gap-5 mb-7">
      <div className="border border-gray-300 bg-white p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500 mb-3">
          Likely current state
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

export default function BusinessCase({ content, style = 'warm' }: { content: string; style?: LetterStyle }) {
  const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

  const logoHeight = style === 'warm' || style === 'studio' ? 'h-28' : 'h-24'

  return (
    <div>
      {/* Letterhead */}
      <div className="flex items-start justify-between pb-7 mb-7 border-b border-gray-200">
        <Image
          src="/erpexperts-logo.png"
          alt="ERP Experts"
          width={style === 'warm' || style === 'studio' ? 360 : 280}
          height={style === 'warm' || style === 'studio' ? 112 : 96}
          className={`${logoHeight} w-auto object-contain`}
        />
      </div>

      {/* Accent line */}
      <div className="letter-accent-line mb-7" />

      <BeforeAfterCards />

      {/* Prose */}
      <InlineRewrite context={content} part="case">
        <div className="letter-body-text space-y-7">
          {paragraphs.map((para, i) => (
            <p key={i}>{para.trim()}</p>
          ))}
        </div>
      </InlineRewrite>

      <div className="mt-10 pt-5 page-footer-text flex items-center justify-between tracking-wide">
        <span>ERP Experts Ltd · Manchester, UK · 01785 336 253</span>
        <span>hello@erpexperts.co.uk · www.erpexperts.co.uk</span>
      </div>
    </div>
  )
}
