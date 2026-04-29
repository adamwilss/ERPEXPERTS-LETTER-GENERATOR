'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Plus, Archive, Check, Loader2, FileText, BarChart3, Network, Link2 } from 'lucide-react'
import QRCode from 'qrcode'
import CopyButton from './CopyButton'
import DownloadMenu from './DownloadMenu'
import SaveTemplateModal from './SaveTemplateModal'
import InlineRewrite from './InlineRewrite'
import BusinessCase from './BusinessCase'
import TechMap from './TechMap'
import StyleSelector, { LetterStyle } from './StyleSelector'
import { saveTemplate } from '@/lib/templates'
import { savePack } from '@/lib/history'
import { WritingAnimation } from './WritingAnimation'

interface Props {
  letter: string
  businessCase?: string
  techMap?: string
  companyName?: string
  recipientName?: string
  jobTitle?: string
  isStreaming: boolean
  savedPackId?: string | null
}

function CoverLetterView({ content, savedPackId, style = 'warm' }: { content: string; savedPackId?: string | null; style?: LetterStyle }) {
  const [qrUrl, setQrUrl] = useState('')

  useEffect(() => {
    const url = 'https://www.erpexperts.co.uk'
    QRCode.toDataURL(url, { width: 120, margin: 1, color: { dark: '#111', light: '#fff' } })
      .then(setQrUrl)
      .catch(() => {})
  }, [])

  const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

  const salutationIdx = paragraphs.findIndex((p) => /^dear\s/i.test(p.trim()))
  const signoffIdx = paragraphs.findIndex((p) =>
    /^yours sincerely|^kind regards|^best regards|^yours,|^best,/i.test(p.trim())
  )

  const signoff = signoffIdx >= 0 ? paragraphs.slice(signoffIdx).join('\n\n') : null
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
        <div className="text-[13px] text-gray-400 text-right leading-relaxed">
          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Accent line */}
      <div className="letter-accent-line mb-7" />

      {/* Body */}
      <InlineRewrite context={content} part="letter">
        <div className="letter-body-text space-y-7">
          {paragraphs
            .filter((_, i) => {
              if (i === salutationIdx) return false
              if (signoffIdx >= 0 && i >= signoffIdx) return false
              return true
            })
            .map((para, i) => {
              if (i === 0 && salutationIdx >= 0) {
                return (
                  <>
                    <p key="sal" className="font-sans text-[14px] text-gray-700">{paragraphs[salutationIdx]}</p>
                    <p key={i}>{para.trim()}</p>
                  </>
                )
              }
              return <p key={i}>{para.trim()}</p>
            })}
        </div>
      </InlineRewrite>

      {/* Sign-off */}
      {signoff && (
        <div className="mt-14 pt-10 border-t border-gray-100 font-sans text-[14px] text-gray-700 leading-[1.7]">
          {signoff.split('\n').map((line, i) => {
            if (/^[_\s]+$/.test(line)) {
              return <div key={i} className="w-72 border-b border-gray-400 my-6" />
            }
            return <div key={i}>{line}</div>
          })}
        </div>
      )}

      {/* QR Code footer */}
      {qrUrl && (
        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-4">
          <img src={qrUrl} alt="QR Code" className="w-20 h-20 rounded-md border border-gray-200" />
          <div>
            <p className="text-[11px] font-semibold text-gray-700">Visit www.erpexperts.co.uk</p>
            <p className="text-[10px] text-gray-400 mt-0.5">NetSuite implementation &amp; aftercare.</p>
          </div>
        </div>
      )}

      <div className="mt-10 pt-5 page-footer-text flex items-center justify-between tracking-wide">
        <span>ERP Experts Ltd · Manchester, UK · 01785 336 253</span>
        <span>hello@erpexperts.co.uk · www.erpexperts.co.uk</span>
      </div>
    </div>
  )
}

export default function LetterOutput({
  letter, businessCase, techMap, companyName, recipientName, jobTitle, isStreaming, savedPackId,
}: Props) {
  const [activeTab, setActiveTab] = useState<'letter' | 'case' | 'tech'>('letter')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [selectedStyle, setSelectedStyle] = useState<LetterStyle>('warm')

  // Load style preference on mount
  useEffect(() => {
    const stored = localStorage.getItem('letter-style') as LetterStyle | null
    if (stored && ['executive', 'modern', 'warm', 'dark', 'studio'].includes(stored)) {
      setSelectedStyle(stored)
    }
  }, [])

  const handleStyleChange = (style: LetterStyle) => {
    setSelectedStyle(style)
    localStorage.setItem('letter-style', style)
  }

  const letterRef = useRef<HTMLDivElement>(null)
  const caseRef = useRef<HTMLDivElement>(null)
  const techRef = useRef<HTMLDivElement>(null)

  const isAlreadySaved = Boolean(savedPackId)

  const handleSaveToHistory = async () => {
    if (!companyName || isAlreadySaved) return
    setSaveStatus('saving')
    try {
      // Reconstruct the full three-part completion so history shows cover letter, business case, and tech map
      const completion = [
        '---PART1---',
        letter,
        '---PART2---',
        businessCase || '',
        '---PART3---',
        techMap || '',
      ].join('\n')

      const saved = await savePack({
        company: companyName,
        recipientName: recipientName || 'Unknown',
        contactTitle: jobTitle || '',
        completion,
        website: '',
        location: '',
        industry: '',
        employees: '',
        erpScore: undefined,
      })
      setSaveStatus('saved')
      // Update savedPackId so the QR code can be generated for this newly saved pack
      if (saved.id && !savedPackId) {
        window.dispatchEvent(new CustomEvent('pack-saved', { detail: { id: saved.id } }))
      }
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch (err) {
      console.warn('Failed to save to history:', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2500)
    }
  }

  const tabs = [
    { key: 'letter' as const, label: 'Cover Letter', icon: FileText, hasContent: !!letter },
    { key: 'case' as const, label: 'Business Case', icon: BarChart3, hasContent: !!businessCase },
    { key: 'tech' as const, label: 'Tech Map', icon: Network, hasContent: !!techMap },
  ]

  const activeContent = activeTab === 'letter' ? letter : activeTab === 'case' ? businessCase : techMap

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100/80 dark:bg-[#111]/80 border border-gray-200 dark:border-[#1e1e1e] rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-[#555] hover:text-gray-700 dark:hover:text-[#999]'
            } ${!tab.hasContent ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!tab.hasContent}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-2 mb-6">
        {activeContent && <CopyButton text={activeContent} label="Copy" />}
        {!isStreaming && activeContent && (
          <>
            <StyleSelector value={selectedStyle} onChange={handleStyleChange} />
            <button
              onClick={handleSaveToHistory}
              disabled={saveStatus === 'saving' || isAlreadySaved}
              className={`btn-secondary btn-sm ${saveStatus === 'saved' || isAlreadySaved ? 'text-emerald-600 dark:text-emerald-400' : ''}`}
              title={isAlreadySaved ? 'Already saved to History' : 'Save to History'}
            >
              {saveStatus === 'saving' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : saveStatus === 'saved' || isAlreadySaved ? (
                <Check className="w-3 h-3" />
              ) : (
                <Archive className="w-3 h-3" />
              )}
              {isAlreadySaved ? 'Saved' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Failed' : 'Save'}
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="btn-secondary btn-sm"
            >
              <Plus className="w-3 h-3" />
              Save Template
            </button>
            <DownloadMenu
              letter={letter}
              businessCase={businessCase}
              techMap={techMap}
              companyName={companyName}
              captureRefs={{ letter: letterRef, case: caseRef, tech: techRef }}
            />
          </>
        )}
        {savedPackId && (
          <a
            href={`/view/${savedPackId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary btn-sm flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"
          >
            <Link2 className="w-3 h-3" />
            Open shared page
          </a>
        )}
      </div>

      {/* Document — always light mode */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={`letter-paper rounded-2xl max-w-2xl px-12 py-11 style-${selectedStyle}`}
      >
        {activeTab === 'letter' && (letter ? <CoverLetterView content={letter} savedPackId={savedPackId} style={selectedStyle} /> : <Placeholder />)}
        {activeTab === 'case' && (businessCase ? <BusinessCase content={businessCase} style={selectedStyle} /> : <Placeholder />)}
        {activeTab === 'tech' && (techMap ? <TechMap content={techMap} style={selectedStyle} /> : <Placeholder />)}
      </motion.div>

      <SaveTemplateModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        initialContent={activeContent || ''}
        onSave={({ name, description, industry, tags }) => {
          const content = activeContent || ''
          saveTemplate({
            name,
            description,
            industry,
            preview: content.slice(0, 200),
            fullContent: content,
            createdBy: 'User',
            tags,
          })
        }}
      />

      {/* Hidden PDF capture containers — rendered off-screen so html-to-image can screenshot each tab */}
      <div style={{ position: 'fixed', left: -9999, top: 0, width: 850 }} className="z-[-1]">
        {letter && (
          <div ref={letterRef} className={`letter-paper w-[850px] px-14 py-12 bg-white style-${selectedStyle}`}>
            <CoverLetterView content={letter} savedPackId={savedPackId} style={selectedStyle} />
          </div>
        )}
        {businessCase && (
          <div ref={caseRef} className={`letter-paper w-[850px] px-14 py-12 bg-white style-${selectedStyle}`}>
            <BusinessCase content={businessCase} style={selectedStyle} />
          </div>
        )}
        {techMap && (
          <div ref={techRef} className={`letter-paper w-[900px] px-14 py-12 bg-white style-${selectedStyle}`}>
            <TechMap content={techMap} style={selectedStyle} />
          </div>
        )}
      </div>
    </div>
  )
}

function Placeholder() {
  return (
    <div className="py-12 flex flex-col items-center gap-4">
      <WritingAnimation text="Writing your letter..." />
    </div>
  )
}
