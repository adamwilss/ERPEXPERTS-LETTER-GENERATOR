'use client'

import { useState } from 'react'
import Link from 'next/link'
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
    <main className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-lg font-bold tracking-tight text-gray-900">ERP EXPERTS</span>
              <span className="ml-3 text-sm text-gray-400">Letter Portal</span>
            </div>
            <nav className="flex items-center gap-4 text-sm">
              <span className="text-gray-900 font-medium">Single letter</span>
              <Link href="/discover" className="text-gray-400 hover:text-gray-700">Discover leads</Link>
              <Link href="/history" className="text-gray-400 hover:text-gray-700">History</Link>
            </nav>
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-widest">Internal · Confidential</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {!submitted ? (
          <div className="max-w-xl">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Generate outreach pack</h1>
            <p className="text-gray-500 text-sm mb-8">
              Enter the prospect details below. The system will research the company and produce a
              three-part letter pack in under 60 seconds.
            </p>
            <LetterForm onSubmit={handleSubmit} />
          </div>
        ) : (
          <div>
            {isLoading && !completion && (
              <div className="flex flex-col items-start gap-3 py-12">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-600">Researching company…</span>
                </div>
                <p className="text-xs text-gray-400 ml-7">Fetching and reading the company website — this takes around 15–30 seconds.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="ml-7 mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Cancel
                </button>
              </div>
            )}

            {isLoading && completion && (
              <div className="mb-4 flex items-center gap-2 text-xs text-gray-400">
                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                Generating letter pack…
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                Something went wrong: {error.message}. Check your API key and try again.
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
                onClick={() => { setSubmitted(false) }}
                className="mt-8 text-sm text-gray-400 hover:text-gray-600 underline"
              >
                Generate another
              </button>
            )}
          </div>
        )}
      </div>
      <footer className="mt-auto py-6 text-center text-xs text-gray-400 border-t border-gray-100">
        ERP Experts Ltd · Internal Outreach Generation Portal
      </footer>
    </main>
  )
}
