'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, Link2, ArrowLeft } from 'lucide-react'
import BusinessCase from '@/components/BusinessCase'
import TechMap from '@/components/TechMap'
import QRCode from 'qrcode'

interface Props {
  companyName: string
  recipientName: string
  jobTitle: string
  businessCase: string
  techMap: string
  viewCount: number
  packId: string
}

export default function ViewPageClient({
  companyName,
  recipientName,
  jobTitle,
  businessCase,
  techMap,
  viewCount,
  packId,
}: Props) {
  const [qrUrl, setQrUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''

  useEffect(() => {
    if (pageUrl) {
      QRCode.toDataURL(pageUrl, { width: 160, margin: 2, color: { dark: '#111', light: '#fff' } })
        .then(setQrUrl)
        .catch(() => {})
    }
  }, [pageUrl])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div>
              <h1 className="text-[13px] font-semibold text-gray-900">
                {companyName} — Business Case &amp; Tech Map
              </h1>
              <p className="text-[11px] text-gray-400">
                Prepared for {recipientName || 'the recipient'} · {jobTitle || ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <Eye className="w-3.5 h-3.5" />
              <span>{viewCount} view{viewCount !== 1 ? 's' : ''}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Link2 className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>
      </div>

      {/* One-pager layout */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          {/* Header card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600 mb-2">
                  Confidential — Prepared by ERP Experts
                </p>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  The business case for {companyName}
                </h2>
                <p className="text-[14px] text-gray-500 mt-2 max-w-lg leading-relaxed">
                  A short analysis of how fragmented systems are likely affecting {companyName}&apos;s operation, and what a single integrated platform would change.
                </p>
              </div>
              {qrUrl && (
                <div className="flex flex-col items-center gap-2 flex-shrink-0 ml-6">
                  <img src={qrUrl} alt="QR Code" className="w-20 h-20 rounded-lg border border-gray-200" />
                  <span className="text-[9px] text-gray-400 uppercase tracking-wide">Scan to save</span>
                </div>
              )}
            </div>
          </div>

          {/* Business Case */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-8 pt-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-4 rounded-full bg-blue-500" />
                <h3 className="text-[13px] font-bold uppercase tracking-[0.1em] text-gray-500">
                  Business Case
                </h3>
              </div>
            </div>
            <div className="px-8 pb-8">
              <BusinessCase content={businessCase} />
            </div>
          </div>

          {/* Tech Map */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-8 pt-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-4 rounded-full bg-amber-500" />
                <h3 className="text-[13px] font-bold uppercase tracking-[0.1em] text-gray-500">
                  Technology Integration Map
                </h3>
              </div>
            </div>
            <div className="px-8 pb-8">
              <TechMap content={techMap} />
            </div>
          </div>

          {/* Footer CTA */}
          <div className="bg-gray-950 rounded-2xl p-8 text-white text-center">
            <p className="text-lg font-semibold">Ready to discuss your NetSuite migration?</p>
            <p className="text-[14px] text-gray-400 mt-2">
              Book a 15-minute call with Ric Wilson, Managing Director
            </p>
            <div className="flex items-center justify-center gap-6 mt-5 text-[13px]">
              <span>T: 01785 336 253</span>
              <span className="text-gray-600">·</span>
              <a href="mailto:hello@erpexperts.co.uk" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                hello@erpexperts.co.uk
              </a>
              <span className="text-gray-600">·</span>
              <a href="https://www.erpexperts.co.uk" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                www.erpexperts.co.uk
              </a>
            </div>
          </div>

          {/* ERP Experts footer */}
          <div className="text-center text-[11px] text-gray-400 pb-8">
            ERP Experts Ltd · Manchester, UK · 21 years NetSuite experience · 350+ completed projects
          </div>
        </motion.div>
      </div>
    </div>
  )
}
