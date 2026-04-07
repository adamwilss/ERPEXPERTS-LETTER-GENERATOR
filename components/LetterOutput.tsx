'use client'

import { useState } from 'react'
import CopyButton from './CopyButton'
import CalloutStat from './CalloutStat'
import TechMap from './TechMap'
import DownloadMenu from './DownloadMenu'
import { parseStats } from '@/lib/parse'

interface Props {
  coverLetter: string
  businessCase: string
  techMap: string
  companyName?: string
  isStreaming: boolean
}

const tabs = [
  { id: 'letter', label: 'Cover letter' },
  { id: 'case', label: 'Business case' },
  { id: 'map', label: 'Tech map' },
] as const

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
      <div className="flex items-start justify-between pb-6 mb-6 border-b border-gray-200">
        <div>
          <div className="text-sm font-bold tracking-tight text-gray-900">ERP EXPERTS</div>
          <div className="text-xs text-gray-400 mt-0.5">
            NetSuite Implementation · Manchester, UK
          </div>
        </div>
        <div className="text-xs text-gray-400 text-right">
          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Recipient address block */}
      {preLines.length > 0 && (
        <div className="mb-6 text-sm text-gray-700 leading-relaxed space-y-0.5">
          {preLines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}

      {/* Subject */}
      {subjectLine && (
        <div className="mb-6 text-sm font-semibold text-gray-900">
          Re: {subjectLine}
        </div>
      )}

      {/* Letter body */}
      <div className="font-letter text-[15px] leading-[1.8] text-gray-800 space-y-5">
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
                  <p key="sal" className="font-sans text-sm text-gray-700">{paragraphs[salutationIdx]}</p>
                  <p key={i}>{para.trim()}</p>
                </>
              )
            }
            return <p key={i}>{para.trim()}</p>
          })}
      </div>

      {/* Sign-off */}
      {signoff && (
        <div className="mt-8 pt-6 border-t border-gray-100 font-sans text-sm text-gray-700 whitespace-pre-line leading-relaxed">
          {signoff}
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
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
      {title && (
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight mb-2">{title}</h2>
      )}
      {subtitle && (
        <p className="text-sm text-gray-500 italic mb-8 pb-6 border-b border-gray-200">{subtitle}</p>
      )}
      <div className="font-letter text-[15px] leading-[1.8] text-gray-800">
        {renderProseWithStats(bodyText)}
      </div>
      <div className="mt-8 pt-4 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
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
          <p key={`${i}-${j}`} className="mb-5 last:mb-0">{para.trim()}</p>
        ))
      })}
    </>
  )
}

export default function LetterOutput({
  coverLetter, businessCase, techMap, companyName, isStreaming,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('letter')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-0.5 mb-6">
        <div className="flex items-center gap-0.5 bg-[#111] border border-[#1e1e1e] rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-all duration-150 ${
                activeTab === tab.id
                  ? 'bg-white text-[#090909] shadow-sm'
                  : 'text-[#555] hover:text-[#ccc]'
              }`}
            >
              {tab.label}
              {isStreaming && tab.id === activeTab && (
                <span className="ml-1.5 inline-block w-1 h-1 bg-current rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {activeTab === 'letter' && coverLetter && <CopyButton text={coverLetter} label="Copy" />}
          {activeTab === 'case' && businessCase && <CopyButton text={businessCase} label="Copy" />}
          {activeTab === 'map' && techMap && <CopyButton text={techMap} label="Copy" />}
          {!isStreaming && coverLetter && businessCase && techMap && (
            <DownloadMenu
              coverLetter={coverLetter}
              businessCase={businessCase}
              techMap={techMap}
              companyName={companyName}
            />
          )}
        </div>
      </div>

      {/* Document — light paper on dark background */}
      <div className={`letter-paper rounded-xl ${activeTab === 'map' ? 'max-w-4xl' : 'max-w-2xl'} p-10`}>
        {activeTab === 'letter' && (coverLetter ? <CoverLetterView content={coverLetter} /> : <Placeholder />)}
        {activeTab === 'case' && (businessCase ? <BusinessCaseView content={businessCase} /> : <Placeholder />)}
        {activeTab === 'map' && (techMap ? <TechMap content={techMap} /> : <Placeholder />)}
      </div>
    </div>
  )
}

function Placeholder() {
  return (
    <div className="py-12 text-center text-sm text-gray-300">Generating…</div>
  )
}
