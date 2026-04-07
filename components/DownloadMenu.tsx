'use client'

import React, { useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { LetterPdfDocument } from './PdfDocument'
import { exportToDocx } from '@/lib/exportDocx'

interface Props {
  coverLetter: string
  businessCase: string
  techMap: string
  companyName?: string
}

export default function DownloadMenu({ coverLetter, businessCase, techMap, companyName = 'Company' }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const handleDocx = async () => {
    try {
      setIsGeneratingDocx(true)
      await exportToDocx(coverLetter, businessCase, techMap, companyName)
    } catch (err) {
      console.error(err)
      alert("Failed to generated DOCX")
    } finally {
      setIsGeneratingDocx(false)
      setIsOpen(false)
    }
  }

  const handlePdf = async () => {
    try {
      setIsGeneratingPdf(true)
      // Generate PDF blob
      const doc = <LetterPdfDocument coverLetter={coverLetter} businessCase={businessCase} techMap={techMap} />
      const asPdf = pdf(doc)
      const blob = await asPdf.toBlob()
      
      // Download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_erp_letter_pack.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert("Failed to generate PDF")
    } finally {
      setIsGeneratingPdf(false)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#666] bg-transparent border border-[#2a2a2a] rounded-lg hover:text-[#e8e8e8] hover:border-[#3a3a3a] focus:outline-none transition-all duration-150"
        >
          <Download className="w-3 h-3" />
          Export
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 w-44 mt-1.5 origin-top-right bg-[#161616] border border-[#2a2a2a] rounded-lg shadow-xl shadow-black/50">
            <div className="py-1">
              <button
                onClick={handlePdf}
                disabled={isGeneratingPdf}
                className="w-full flex items-center px-3 py-2 text-xs text-[#888] hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-40"
              >
                {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-2 text-red-400" />}
                Download PDF
              </button>
              <button
                onClick={handleDocx}
                disabled={isGeneratingDocx}
                className="w-full flex items-center px-3 py-2 text-xs text-[#888] hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-40"
              >
                {isGeneratingDocx ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-2 text-blue-400" />}
                Download DOCX
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
