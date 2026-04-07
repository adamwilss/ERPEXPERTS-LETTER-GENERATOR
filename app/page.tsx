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
    <main className="min-h-[calc(100vh-56px)]">
      {!submitted ? (
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
            {/* Form */}
            <div>
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                  Generate outreach pack
                </h1>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Enter the prospect details. The system researches the company and produces a
                  three-part personalised letter pack in under 60 seconds.
                </p>
              </div>
              <LetterForm onSubmit={handleSubmit} />
            </div>

            {/* Sidebar */}
            <div className="space-y-4 pt-[52px]">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  What you get
                </p>
                <div className="space-y-3">
                  {[
                    ['Cover letter', 'Company-specific, signed by Ric. Ready to print and post.'],
                    ['Business case', 'Pain points, benchmarks, and case study reference.'],
                    ['Tech map', 'Which systems integrate, replace, or get eliminated.'],
                  ].map(([title, desc]) => (
                    <div key={title} className="flex gap-3">
                      <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-gray-900 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-gray-900">{title}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Credentials
                </p>
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Experience</span>
                    <span className="font-medium text-gray-900">21 years NetSuite</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Projects completed</span>
                    <span className="font-medium text-gray-900">350+</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Abandoned implementations</span>
                    <span className="font-medium text-gray-900">0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-6 py-10">
          {isLoading && !completion && (
            <div className="py-16 flex flex-col items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-gray-900">Researching {companyName}…</span>
              </div>
              <div className="ml-7 space-y-1.5">
                <p className="text-xs text-gray-400">Reading the company website and gathering context.</p>
                <p className="text-xs text-gray-400">This takes around 15–30 seconds.</p>
              </div>
              <button
                onClick={() => setSubmitted(false)}
                className="ml-7 mt-1 text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2"
              >
                Cancel
              </button>
            </div>
          )}

          {isLoading && completion && (
            <div className="mb-5 flex items-center gap-2 text-xs text-gray-400">
              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              Writing letter pack…
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">
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
              className="mt-8 text-sm text-gray-400 hover:text-gray-700 underline underline-offset-2 transition-colors"
            >
              ← Generate another
            </button>
          )}
        </div>
      )}

      <footer className="mt-auto py-6 text-center text-xs text-gray-400 border-t border-gray-200">
        ERP Experts Ltd · Internal Outreach Generation Portal
      </footer>
    </main>
  )
}
