'use client'

import Image from 'next/image'
import InlineRewrite from './InlineRewrite'

function BeforeAfterCards() {
  return (
    <div className="grid grid-cols-2 gap-5 mb-10">
      <div className="border border-gray-200 bg-gray-50/50 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500 mb-3">
          Likely current state
        </p>
        <p className="text-[36px] font-bold text-gray-900 leading-none">5+</p>
        <p className="text-[13px] text-gray-600 mt-2 font-medium">disconnected tools</p>
        <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
          Each holding a fragment of the operational picture.
        </p>
      </div>

      <div className="border-2 border-gray-900 bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-700 mb-3">
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

export default function BusinessCase({ content }: { content: string }) {
  const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

  return (
    <div>
      {/* Letterhead — stacked left-aligned */}
      <div className="mb-10">
        <Image
          src="/erpexperts-logo.png"
          alt="ERP Experts"
          width={280}
          height={96}
          className="h-24 w-auto object-contain"
        />
      </div>

      <BeforeAfterCards />

      {/* Prose */}
      <InlineRewrite context={content} part="case">
        <div className="letter-body-text">
          {paragraphs.map((para, i) => (
            <p key={i}>{para.trim()}</p>
          ))}
        </div>
      </InlineRewrite>

      <div className="mt-12 page-footer-text flex items-center justify-between tracking-wide">
        <span>ERP Experts Ltd &middot; Manchester, UK &middot; 01785 336 253</span>
        <span>hello@erpexperts.co.uk &middot; www.erpexperts.co.uk</span>
      </div>
    </div>
  )
}
