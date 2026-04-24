'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Plus, Archive, Check, Loader2 } from 'lucide-react'
import CopyButton from './CopyButton'
import DownloadMenu from './DownloadMenu'
import SaveTemplateModal from './SaveTemplateModal'
import InlineRewrite from './InlineRewrite'
import { saveTemplate } from '@/lib/templates'
import { savePack } from '@/lib/history'
import { WritingAnimation } from './WritingAnimation'

interface Props {
  letter: string
  companyName?: string
  recipientName?: string
  jobTitle?: string
  isStreaming: boolean
}

function CoverLetterView({ content }: { content: string }) {
  const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

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

      {/* Body */}
      <InlineRewrite context={content} part="letter">
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
      </InlineRewrite>

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

export default function LetterOutput({
  letter, companyName, recipientName, jobTitle, isStreaming,
}: Props) {
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
        completion: letter,
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
      {/* Actions bar */}
      <div className="flex items-center gap-2 mb-6">
        {letter && <CopyButton text={letter} label="Copy" />}
        {!isStreaming && letter && (
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
              letter={letter}
              companyName={companyName}
            />
          </>
        )}
      </div>

      {/* Document — always light mode */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="letter-paper rounded-2xl max-w-2xl px-12 py-11"
        style={{ color: '#111' }}
        data-theme="light"
      >
        {letter ? <CoverLetterView content={letter} /> : <Placeholder />}
      </motion.div>

      <SaveTemplateModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        initialContent={letter}
        onSave={({ name, description, industry, tags }) => {
          saveTemplate({
            name,
            description,
            industry,
            preview: letter.slice(0, 200),
            fullContent: letter,
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
    <div className="py-12 flex flex-col items-center gap-4">
      <WritingAnimation text="Writing your letter..." />
    </div>
  )
}
