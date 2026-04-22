'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FileText, BarChart3, Table2, Archive, Check, Loader2 } from 'lucide-react'
import CopyButton from './CopyButton'
import CalloutStat from './CalloutStat'
import TechMap from './TechMap'
import DownloadMenu from './DownloadMenu'
import SaveTemplateModal from './SaveTemplateModal'
import { saveTemplate } from '@/lib/templates'
import { savePack } from '@/lib/history'
import { parseStats } from '@/lib/parse'

interface Props {
  coverLetter: string
  businessCase: string
  techMap: string
  companyName?: string
  recipientName?: string
  jobTitle?: string
  isStreaming: boolean
}

const tabs = [
  { id: 'letter' as const, label: 'Cover letter', icon: FileText },
  { id: 'case' as const, label: 'Business case', icon: BarChart3 },
  { id: 'map' as const, label: 'Tech map', icon: Table2 },
]

type TabId = (typeof tabs)[number]['id']

function CoverLetterView({ content }: { content: string }) {
  const lines = content.split('\n')

  const subjectIdx = lines.findIndex((l) => l.trim().startsWith('SUBJECT:'))
  const subjectLine = subjectIdx >= 0
    ? lines[subjectIdx].replace(/^SUBJECT:\s*/i, '').replace(/^Re:\s*/i, '').trim()
    : ''

  const preLines = (subjectIdx > 0 ? lines.slice(0, subjectIdx) : []).filter((l) => l.trim())

  const bodyRaw = subjectIdx >= 0
    ? lines.slice(subjectIdx + 1).join('\n').trim()
    : content

  const paragraphs = bodyRaw.split(/\n{2,}/).filter((p) => p.trim())

  const salutationIdx = paragraphs.findIndex((p) => /^dear\s/i.test(p.trim()))
  const signoffIdx = paragraphs.findIndex((p) =>
    /^yours sincerely|^kind regards|^best regards/i.test(p.trim())
  )

  const signoff = signoffIdx >= 0 ? paragraphs.slice(signoffIdx).join('\n\n') : null

  return (
    <div>
      {/* Letterhead */}
      <div className="flex items-start justify-between pb-7 mb-7 border-b border-gray-200">
        <div className="flex items-start gap-4">
          <Image
            src="/erpexperts-logo.png"
            alt="ERP Experts"
            width={80}
            height={28}
            className="h-7 w-auto object-contain"
          />
          <div>
            <div className="text-[13px] font-bold tracking-[0.06em] text-gray-900">ERP EXPERTS</div>
            <div className="text-[11px] text-gray-400 mt-1 tracking-wide">
              NetSuite Implementation · Manchester, UK
            </div>
          </div>
        </div>
        <div className="text-[12px] text-gray-400 text-right leading-relaxed">
          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Recipient address */}
      {preLines.length > 0 && (
        <div className="mb-7 text-[13px] text-gray-600 leading-[1.7] space-y-0.5 font-sans">
          {preLines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}

      {/* Subject */}
      {subjectLine && (
        <div className="mb-7 text-[14px] font-semibold text-gray-900 tracking-[-0.01em]">
          Re: {subjectLine}
        </div>
      )}

      {/* Body */}
      <div className="font-letter text-[16px] leading-[1.9] text-gray-800 space-y-7">
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

      {/* Sign-off */}
      {signoff && (
        <div className="mt-10 pt-7 border-t border-gray-100 font-sans text-[14px] text-gray-700 whitespace-pre-line leading-[1.7]">
          {signoff}
        </div>
      )}

      <div className="mt-10 pt-5 border-t border-gray-100 text-[11px] text-gray-400 flex items-center justify-between tracking-wide">
        <span>ERP Experts Ltd · Manchester, UK</span>
        <span>www.erpexperts.co.uk</span>
      </div>
    </div>
  )
}

function BusinessCaseView({ content }: { content: string }) {
  const lines = content.split('\n')
  const title = lines.find((l) => l.startsWith('TITLE:'))?.replace('TITLE:', '').trim()
  const subtitle = lines.find((l) => l.startsWith('SUBTITLE:'))?.replace('SUBTITLE:', '').trim()
  const bodyStart = lines.findIndex(
    (l) => !l.startsWith('TITLE:') && !l.startsWith('SUBTITLE:') && l.trim() !== ''
  )
  const bodyText = lines
    .slice(bodyStart)
    .filter((l) => !l.startsWith('TITLE:') && !l.startsWith('SUBTITLE:'))
    .join('\n')

  return (
    <div>
      <div className="flex items-start justify-between pb-7 mb-7 border-b border-gray-200">
        <div className="flex items-start gap-4">
          <Image
            src="/erpexperts-logo.png"
            alt="ERP Experts"
            width={80}
            height={28}
            className="h-7 w-auto object-contain"
          />
          <div>
            <div className="text-[13px] font-bold tracking-[0.06em] text-gray-900">ERP EXPERTS</div>
            <div className="text-[11px] text-gray-400 mt-1 tracking-wide">
              NetSuite Implementation · Manchester, UK
            </div>
          </div>
        </div>
      </div>

      {title && (
        <h2 className="text-[22px] font-bold text-gray-900 tracking-[-0.02em] leading-tight mb-3">{title}</h2>
      )}
      {subtitle && (
        <p className="text-[14px] text-gray-500 italic mb-9 pb-7 border-b border-gray-200 leading-relaxed">{subtitle}</p>
      )}
      <div className="font-letter text-[16px] leading-[1.9] text-gray-800">
        {renderProseWithStats(bodyText)}
      </div>
      <div className="mt-10 pt-5 border-t border-gray-100 text-[11px] text-gray-400 flex items-center justify-between tracking-wide">
        <span>ERP Experts Ltd · Manchester, UK</span>
        <span>www.erpexperts.co.uk</span>
      </div>
    </div>
  )
}

function renderProseWithStats(text: string) {
  const parts = text.split(/(\[STAT\][\s\S]*?\[\/STAT\])/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('[STAT]')) {
          const headline = part.match(/Headline:\s*(.+)/)?.[1]?.trim() ?? ''
          const body = part.match(/Body:\s*([\s\S]+?)(?=Source:|$)/)?.[1]?.trim() ?? ''
          const source = part.match(/Source:\s*(.+)/)?.[1]?.trim() ?? ''
          return <CalloutStat key={i} stat={{ headline, body, source }} />
        }
        const trimmed = part.trim()
        if (!trimmed) return null
        return trimmed.split(/\n{2,}/).filter(Boolean).map((para, j) => (
          <p key={`${i}-${j}`} className="mb-6 last:mb-0">{para.trim()}</p>
        ))
      })}
    </>
  )
}

export default function LetterOutput({
  coverLetter, businessCase, techMap, companyName, recipientName, jobTitle, isStreaming,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('letter')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const handleSaveToHistory = async () => {
    if (!companyName) return
    setSaveStatus('saving')
    try {
      await savePack({
        company: companyName,
        recipientName: recipientName || 'Unknown',
        contactTitle: jobTitle || '',
        completion: `${coverLetter}\n\n---\n\n${businessCase}\n\n---\n\n${techMap}`,
        website: '',
        location: '',
        industry: '',
        employees: '',
        erpScore: undefined,
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch (err) {
      console.warn('Failed to save to history:', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2500)
    }
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-0.5 mb-6">
        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-[#1e1e1e] rounded-xl p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-lg transition-all duration-150 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-white text-gray-900 dark:text-[#090909] shadow-sm'
                    : 'text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-[#ccc]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {isStreaming && tab.id === activeTab && (
                  <span className="ml-0.5 inline-block w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
                )}
              </button>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {activeTab === 'letter' && coverLetter && <CopyButton text={coverLetter} label="Copy" />}
          {activeTab === 'case' && businessCase && <CopyButton text={businessCase} label="Copy" />}
          {activeTab === 'map' && techMap && <CopyButton text={techMap} label="Copy" />}
          {!isStreaming && coverLetter && businessCase && techMap && (
            <>
              <button
                onClick={handleSaveToHistory}
                disabled={saveStatus === 'saving'}
                className={`btn-secondary btn-sm ${saveStatus === 'saved' ? 'text-emerald-600 dark:text-emerald-400' : ''}`}
                title="Save to History"
              >
                {saveStatus === 'saving' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : saveStatus === 'saved' ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Archive className="w-3 h-3" />
                )}
                {saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Failed' : 'Save'}
              </button>
              <button
                onClick={() => setShowSaveModal(true)}
                className="btn-secondary btn-sm"
              >
                <Plus className="w-3 h-3" />
                Save Template
              </button>
              <DownloadMenu
                coverLetter={coverLetter}
                businessCase={businessCase}
                techMap={techMap}
                companyName={companyName}
              />
            </>
          )}
        </div>
      </div>

      {/* Document with animated tab transitions — always light mode */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className={`letter-paper rounded-2xl ${activeTab === 'map' ? 'max-w-4xl' : 'max-w-2xl'} px-12 py-11`}
          style={{ color: '#111' }}
          data-theme="light"
        >
          {activeTab === 'letter' && (coverLetter ? <CoverLetterView content={coverLetter} /> : <Placeholder />)}
          {activeTab === 'case' && (businessCase ? <BusinessCaseView content={businessCase} /> : <Placeholder />)}
          {activeTab === 'map' && (techMap ? <TechMap content={techMap} /> : <Placeholder />)}
        </motion.div>
      </AnimatePresence>

      <SaveTemplateModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        initialContent={`${coverLetter}\n\n---\n\n${businessCase}\n\n---\n\n${techMap}`}
        onSave={({ name, description, industry, tags }) => {
          saveTemplate({
            name,
            description,
            industry,
            preview: `${coverLetter}\n\n${businessCase}`.slice(0, 200),
            fullContent: `${coverLetter}\n\n---\n\n${businessCase}\n\n---\n\n${techMap}`,
            createdBy: 'User',
            tags,
          })
        }}
      />
    </div>
  )
}

function Placeholder() {
  return (
    <div className="py-16 text-center">
      <div className="loading-ring mx-auto mb-4" />
      <p className="text-sm text-gray-400 dark:text-[#444]">Generating…</p>
    </div>
  )
}
