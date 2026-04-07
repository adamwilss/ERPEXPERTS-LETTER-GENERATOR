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

// Render cover letter: parse SUBJECT line, then prose
function CoverLetterView({ content }: { content: string }) {
  const lines = content.split('\n')
  const subjectLine = lines.find((l) => l.startsWith('SUBJECT:'))?.replace('SUBJECT:', '').trim()
  const body = lines.filter((l) => !l.startsWith('SUBJECT:')).join('\n').trim()
  const paragraphs = body.split(/\n{2,}/).filter((p) => p.trim())

  return (
    <div className="space-y-6">
      {/* Letterhead */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-base font-bold tracking-tight text-gray-900">ERP EXPERTS</div>
            <div className="text-xs text-gray-400 mt-0.5">
              NetSuite Implementation &amp; Aftercare · Manchester, UK · www.erpexperts.co.uk
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {subjectLine && (
        <div className="text-sm font-medium text-gray-700">
          Re: {subjectLine.replace(/^Re:\s*/i, '')}
        </div>
      )}

      <div className="text-sm text-gray-800 leading-relaxed space-y-4">
        {paragraphs.map((para, i) => (
          <p key={i}>{para.trim()}</p>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-100 text-xs text-gray-400">
        ERP Experts Ltd · Manchester, UK · www.erpexperts.co.uk
      </div>
    </div>
  )
}

// Render business case: extract title/subtitle, stat blocks, and prose
function BusinessCaseView({ content }: { content: string }) {
  const lines = content.split('\n')
  const title = lines.find((l) => l.startsWith('TITLE:'))?.replace('TITLE:', '').trim()
  const subtitle = lines.find((l) => l.startsWith('SUBTITLE:'))?.replace('SUBTITLE:', '').trim()

  const bodyStart = lines.findIndex((l) => !l.startsWith('TITLE:') && !l.startsWith('SUBTITLE:') && l.trim() !== '')
  const bodyText = lines
    .slice(bodyStart)
    .filter((l) => !l.startsWith('TITLE:') && !l.startsWith('SUBTITLE:'))
    .join('\n')

  const { stats, prose } = parseStats(bodyText)

  return (
    <div className="space-y-6">
      {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
      {subtitle && <p className="text-sm text-gray-500 italic">{subtitle}</p>}

      <div className="text-sm text-gray-800 leading-relaxed">
        {/* Render prose with stat blocks interspersed in their original positions */}
        {renderProseWithStats(bodyText, stats)}
      </div>

      <div className="pt-4 border-t border-gray-100 text-xs text-gray-400">
        ERP Experts Ltd · Manchester, UK · www.erpexperts.co.uk
      </div>
    </div>
  )
}

function renderProseWithStats(text: string, _stats: ReturnType<typeof parseStats>['stats']) {
  // Split on [STAT]...[/STAT] blocks and render alternating prose + stat components
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
        // Split on double newlines so multi-paragraph chunks render as separate <p> elements
        const paras = trimmed.split(/\n{2,}/).filter(Boolean)
        return paras.map((para, j) => (
          <p key={`${i}-${j}`} className="text-gray-800 leading-relaxed mb-4">
            {para.trim()}
          </p>
        ))
      })}
    </>
  )
}

export default function LetterOutput({ coverLetter, businessCase, techMap, companyName, isStreaming }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('letter')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === tab.id
                ? 'text-gray-900 border-b-2 border-gray-900 -mb-px bg-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {isStreaming && tab.id === activeTab && (
              <span className="ml-2 inline-block w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
            )}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {activeTab === 'letter' && coverLetter && (
            <CopyButton text={coverLetter} label="Copy cover letter" />
          )}
          {activeTab === 'case' && businessCase && (
            <CopyButton text={businessCase} label="Copy business case" />
          )}
          {activeTab === 'map' && techMap && (
            <CopyButton text={techMap} label="Copy tech map" />
          )}
          {!isStreaming && coverLetter && businessCase && techMap && (
            <div className="ml-2 pl-2 border-l border-gray-200">
              <DownloadMenu 
                coverLetter={coverLetter} 
                businessCase={businessCase} 
                techMap={techMap}
                companyName={companyName}
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`bg-white rounded-xl border border-gray-200 p-8 ${activeTab === 'map' ? 'max-w-4xl' : 'max-w-3xl'}`}>
        {activeTab === 'letter' && (
          coverLetter ? <CoverLetterView content={coverLetter} /> : <Placeholder />
        )}
        {activeTab === 'case' && (
          businessCase ? <BusinessCaseView content={businessCase} /> : <Placeholder />
        )}
        {activeTab === 'map' && (
          techMap ? <TechMap content={techMap} /> : <Placeholder />
        )}
      </div>
    </div>
  )
}

function Placeholder() {
  return (
    <div className="py-8 text-center text-sm text-gray-400">
      Generating…
    </div>
  )
}
