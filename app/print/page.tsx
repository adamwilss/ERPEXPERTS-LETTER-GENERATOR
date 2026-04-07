'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadHistory } from '@/lib/history'
import { parseOutput } from '@/lib/parse'

function PrintContent() {
  const params = useSearchParams()
  const id = params.get('id')
  const [content, setContent] = useState<{ part1: string; part2: string; part3: string } | null>(null)
  const [company, setCompany] = useState('')

  useEffect(() => {
    if (!id) return
    const history = loadHistory()
    const pack = history.find((p) => p.id === id)
    if (!pack) return
    setCompany(pack.company)
    setContent(parseOutput(pack.completion))
  }, [id])

  useEffect(() => {
    if (content) {
      setTimeout(() => window.print(), 400)
    }
  }, [content])

  if (!content) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400 text-sm">
        Loading…
      </div>
    )
  }

  const lines = content.part1.split('\n')
  const subjectIdx = lines.findIndex((l) => l.trim().startsWith('SUBJECT:'))
  const subjectLine = subjectIdx >= 0
    ? lines[subjectIdx].replace(/^SUBJECT:\s*/i, '').replace(/^Re:\s*/i, '').trim()
    : ''
  const preLines = (subjectIdx > 0 ? lines.slice(0, subjectIdx) : []).filter((l) => l.trim())
  const bodyRaw = subjectIdx >= 0 ? lines.slice(subjectIdx + 1).join('\n').trim() : content.part1
  const paragraphs = bodyRaw.split(/\n{2,}/).filter((p) => p.trim())

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <>
      {/* Screen controls — hidden on print */}
      <div className="no-print fixed top-0 left-0 right-0 bg-[#0A0A0A] text-white px-6 py-3 flex items-center justify-between z-50">
        <span className="text-sm font-medium">{company} — Cover Letter</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="bg-white text-black text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Print / Save PDF
          </button>
          <button
            onClick={() => window.close()}
            className="text-white/50 hover:text-white text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* A4 letter — this is what prints */}
      <div className="print-page">
        {/* Letterhead */}
        <div className="letterhead">
          <div>
            <div className="letterhead-name">ERP EXPERTS</div>
            <div className="letterhead-sub">NetSuite Implementation &amp; Aftercare · Manchester, UK</div>
          </div>
          <div className="letterhead-date">{today}</div>
        </div>
        <div className="divider" />

        {/* Recipient address */}
        {preLines.length > 0 && (
          <div className="address-block">
            {preLines.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        )}

        {/* Subject */}
        {subjectLine && (
          <div className="subject-line">Re: {subjectLine}</div>
        )}

        {/* Body */}
        <div className="letter-body">
          {paragraphs.map((para, i) => (
            <p key={i}>{para.trim()}</p>
          ))}
        </div>

        {/* Footer */}
        <div className="letter-footer">
          ERP Experts Ltd · 21 years NetSuite experience · 350+ completed projects · www.erpexperts.co.uk
        </div>
      </div>
    </>
  )
}

export default function PrintPage() {
  return (
    <Suspense>
      <PrintContent />
    </Suspense>
  )
}
