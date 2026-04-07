'use client'

import { useState } from 'react'
import { useCompletion } from '@ai-sdk/react'
import LetterForm, { FormValues } from '@/components/LetterForm'
import LetterOutput from '@/components/LetterOutput'
import { parseOutput } from '@/lib/parse'

export default function Home() {
  const [submitted, setSubmitted] = useState(false)
  const [companyName, setCompanyName] = useState('')

  const { complete, completion, isLoading, error } = useCompletion({
    api: '/api/generate',
    streamProtocol: 'text',
  })

  const handleSubmit = async (values: FormValues) => {
    setCompanyName(values.company)
    setSubmitted(true)
    await complete('', { body: values })
  }

  const parsed = completion ? parseOutput(completion) : null

  return (
    <main className="min-h-[calc(100vh-52px)]">
      {!submitted ? (
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
            {/* Form panel */}
            <div>
              <div className="mb-8">
                <h1 className="text-[22px] font-semibold text-white tracking-tight leading-tight">
                  Generate outreach pack
                </h1>
                <p className="text-sm text-[#666] mt-2 leading-relaxed max-w-sm">
                  Enter the prospect details. The system researches the company and produces a
                  three-part personalised letter pack in under 60 seconds.
                </p>
              </div>
              <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6">
                <LetterForm onSubmit={handleSubmit} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-3 pt-[60px]">
              <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
                <p className="text-[11px] font-medium text-[#444] uppercase tracking-[0.12em] mb-4">
                  What you get
                </p>
                <div className="space-y-4">
                  {[
                    ['Cover letter', 'Company-specific, signed by Ric. Ready to print and post.'],
                    ['Business case', 'Pain points, benchmarks, and a named case study.'],
                    ['Tech map', 'Which systems integrate, replace, or get eliminated.'],
                  ].map(([title, desc]) => (
                    <div key={title} className="flex gap-3">
                      <span className="mt-1 w-1 h-1 rounded-full bg-[#444] flex-shrink-0" />
                      <div>
                        <div className="text-[13px] font-medium text-[#ccc]">{title}</div>
                        <div className="text-xs text-[#555] mt-0.5 leading-relaxed">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
                <p className="text-[11px] font-medium text-[#444] uppercase tracking-[0.12em] mb-4">
                  Credentials
                </p>
                <div className="space-y-2.5">
                  {[
                    ['Experience', '21 years NetSuite'],
                    ['Projects completed', '350+'],
                    ['Abandoned implementations', '0'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-[#555]">{label}</span>
                      <span className="text-xs font-semibold text-[#ccc]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-6 py-10">
          {isLoading && !completion && (
            <div className="py-20 flex flex-col items-start gap-5">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border border-white/20 border-t-white/80 rounded-full animate-spin" />
                <span className="text-sm font-medium text-white">Researching {companyName}…</span>
              </div>
              <div className="ml-7 space-y-1.5">
                <p className="text-xs text-[#555]">Reading the company website and gathering context.</p>
                <p className="text-xs text-[#444]">This takes around 15–30 seconds.</p>
              </div>
              <button
                onClick={() => setSubmitted(false)}
                className="ml-7 mt-1 text-xs text-[#444] hover:text-[#888] underline underline-offset-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {isLoading && completion && (
            <div className="mb-5 flex items-center gap-2 text-xs text-[#555]">
              <div className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />
              Writing letter pack…
            </div>
          )}

          {error && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 text-sm text-red-400">
              Generation failed: {error.message}
            </div>
          )}

          {parsed && (
            <LetterOutput
              coverLetter={parsed.part1}
              businessCase={parsed.part2}
              techMap={parsed.part3}
              companyName={companyName}
              isStreaming={isLoading}
            />
          )}

          {!isLoading && !error && (
            <button
              onClick={() => setSubmitted(false)}
              className="mt-8 text-xs text-[#444] hover:text-[#888] underline underline-offset-2 transition-colors"
            >
              ← Generate another
            </button>
          )}
        </div>
      )}

      <footer className="mt-auto py-6 text-center text-[11px] text-[#333] border-t border-[#141414]">
        ERP Experts Ltd · Internal Outreach Generation Portal
      </footer>
    </main>
  )
}
