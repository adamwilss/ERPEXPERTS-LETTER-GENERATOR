'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Plus, Archive, Check, Loader2, FileText, BarChart3, Network, Link2 } from 'lucide-react'
import CopyButton from './CopyButton'
import DownloadMenu from './DownloadMenu'
import SaveTemplateModal from './SaveTemplateModal'
import InlineRewrite from './InlineRewrite'
import BusinessCase from './BusinessCase'
import TechMap from './TechMap'
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

function CoverLetterView({ content, savedPackId }: { content: string; savedPackId?: string | null }) {
  const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

  const salutationIdx = paragraphs.findIndex((p) => /^dear\s/i.test(p.trim()))
  const signoffIdx = paragraphs.findIndex((p) =>
    /^yours sincerely|^kind regards|^best regards|^yours,|^yours$|^best,/i.test(p.trim())
  )

  const signoff = signoffIdx >= 0 ? paragraphs.slice(signoffIdx).join('\n\n') : null

  return (
    <div>
      {/* Letterhead — logo only */}
      <div className="mb-10">
        <Image
          src="/erpexperts-logo.png"
          alt="ERP Experts"
          width={280}
          height={96}
          className="h-24 w-auto object-contain"
        />
      </div>

      {/* Body */}
      <InlineRewrite context={content} part="letter">
        <div className="letter-body-text">
          {paragraphs
            .filter((_, i) => {
              if (i === salutationIdx) return false
              if (signoffIdx >= 0 && i >= signoffIdx) return false
              return true
            })
            .map((para, i) => {
              if (i === 0 && salutationIdx >= 0) {
                return (
                  <React.Fragment key={i}>
                    <p className="letter-salutation">{paragraphs[salutationIdx]}</p>
                    <p>{para.trim()}</p>
                  </React.Fragment>
                )
              }
              return <p key={i}>{para.trim()}</p>
            })}
        </div>
      </InlineRewrite>

      {/* Sign-off — whitespace only, no lines */}
      {signoff && (
        <div className="mt-16 mb-4 font-sans text-[14px] text-gray-700 leading-[1.7]">
          {signoff.split('\n').map((line, i) => {
            if (/^[_\s]+$/.test(line)) {
              // Whitespace gap where a physical signature would go
              return <div key={i} className="h-10" />
            }
            // Name line gets extra prominence
            if (/^Ric Wilson$/i.test(line.trim())) {
              return (
                <div key={i}>
                  <span className="letter-signature-name">{line}</span>
                </div>
              )
            }
            return <div key={i}>{line}</div>
          })}
        </div>
      )}

      {/* QR Code footer — no top border */}
      {savedPackId && (
        <div className="mt-8 flex items-center gap-4 opacity-40">
          <div className="w-16 h-16 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-500">View online at erpexperts.co.uk</p>
            <p className="text-[9px] text-gray-400 mt-0.5">NetSuite implementation &amp; aftercare.</p>
          </div>
        </div>
      )}

      <div className="mt-12 page-footer-text flex items-center justify-between tracking-wide">
        <span>ERP Experts Ltd &middot; Manchester, UK &middot; 01785 336 253</span>
        <span>hello@erpexperts.co.uk &middot; www.erpexperts.co.uk</span>
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

  const letterRef = useRef<HTMLDivElement>(null)
  const caseRef = useRef<HTMLDivElement>(null)
  const techRef = useRef<HTMLDivElement>(null)

  const isAlreadySaved = Boolean(savedPackId)

  const handleSaveToHistory = async () => {
    if (!companyName || isAlreadySaved) return
    setSaveStatus('saving')
    try {
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

      {/* Document */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="letter-paper rounded-2xl max-w-2xl px-14 py-11"
      >
        {activeTab === 'letter' && (letter ? <CoverLetterView content={letter} savedPackId={savedPackId} /> : <Placeholder />)}
        {activeTab === 'case' && (businessCase ? <BusinessCase content={businessCase} /> : <Placeholder />)}
        {activeTab === 'tech' && (techMap ? <TechMap content={techMap} /> : <Placeholder />)}
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

      {/* Hidden PDF capture containers */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: 850, overflow: 'visible' }} className="z-[-1]">
        {letter && (
          <div ref={letterRef} className="letter-paper w-[850px] px-14 py-12 bg-white" style={{ overflow: 'visible' }}>
            <CoverLetterView content={letter} savedPackId={savedPackId} />
          </div>
        )}
        {businessCase && (
          <div ref={caseRef} className="letter-paper w-[850px] px-14 py-12 bg-white" style={{ overflow: 'visible' }}>
            <BusinessCase content={businessCase} />
          </div>
        )}
        {techMap && (
          <div ref={techRef} className="letter-paper w-[900px] px-14 py-12 bg-white" style={{ overflow: 'visible' }}>
            <TechMap content={techMap} />
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
