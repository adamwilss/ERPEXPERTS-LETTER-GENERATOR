'use client'

import { useState, useEffect } from 'react'
import { useCompletion } from '@ai-sdk/react'
import { motion } from 'framer-motion'
import LetterForm, { FormValues } from '@/components/LetterForm'
import LetterOutput from '@/components/LetterOutput'
import { parseOutput } from '@/lib/parse'
import { savePack } from '@/lib/history'
import { FileText, TrendingUp, Shield, Sparkles, Zap } from 'lucide-react'
import { HeroGlow, GradientBorder, TypingText } from '@/components/MotionConfig'
import { WritingAnimation } from '@/components/WritingAnimation'

export default function Home() {
  const [submitted, setSubmitted] = useState(false)
  const [companyName, setCompanyName] = useState('')

  const { complete, completion, isLoading, error } = useCompletion({
    api: '/api/generate',
    streamProtocol: 'text',
  })

  const [formValues, setFormValues] = useState<FormValues | null>(null)

  const handleSubmit = async (values: FormValues) => {
    setCompanyName(values.company)
    setFormValues(values)
    setSubmitted(true)
    await complete('', { body: values })
  }

  const parsed = completion ? parseOutput(completion) : null

  // Auto-save to history when generation completes
  useEffect(() => {
    if (!isLoading && completion && parsed && formValues) {
      savePack({
        company: formValues.company,
        recipientName: formValues.recipientName,
        contactTitle: formValues.jobTitle,
        completion,
        website: formValues.url,
        location: '',
        industry: '',
        employees: '',
        erpScore: undefined,
      }).catch((err) => console.warn('Failed to auto-save pack:', err))
    }
  }, [isLoading, completion, parsed, formValues])

  return (
    <main className="page-shell">
      {!submitted ? (
        <div className="page-container">
          {/* Hero */}
          <HeroGlow>
            <div id="tour-hero" className="mb-10 animate-fade-up">
              <div className="page-badge mb-4">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                AI-Powered Outreach
              </div>
              <h1 className="page-title max-w-md">Generate outreach pack</h1>
              <p className="page-description">
                Enter prospect details. The system researches the company and produces a three-part
                personalised letter pack in under 60 seconds.
              </p>
            </div>
          </HeroGlow>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
            {/* Form */}
            <div id="tour-form" className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <GradientBorder>
                <div className="card card-hover p-7">
                  <LetterForm onSubmit={handleSubmit} />
                </div>
              </GradientBorder>
            </div>

            {/* Sidebar */}
            <div id="tour-sidebar" className="space-y-4 animate-fade-up" style={{ animationDelay: '0.15s' }}>
              <GradientBorder>
                <div className="card p-6">
                  <p className="label mb-4">What you get</p>
                <div className="space-y-5">
                  {[
                    {
                      num: '01',
                      icon: FileText,
                      title: 'Cover letter',
                      desc: 'Company-specific, signed by Ric. Ready to print and post.',
                    },
                    {
                      num: '02',
                      icon: TrendingUp,
                      title: 'Business case',
                      desc: 'Pain points, benchmarks, and a named case study.',
                    },
                    {
                      num: '03',
                      icon: Shield,
                      title: 'Tech map',
                      desc: 'Which systems integrate, replace, or get eliminated.',
                    },
                  ].map(({ num, icon: Icon, title, desc }) => (
                    <motion.div
                      key={title}
                      whileHover={{ x: 4 }}
                      className="flex gap-4"
                    >
                      <div className="mt-0.5 w-7 h-7 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#1e1e1e] flex items-center justify-center flex-shrink-0"
                      >
                        <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-[#555]" />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-gray-800 dark:text-[#ddd]"
                        >
                          {title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-[#555] mt-0.5 leading-relaxed"
                        >
                          {desc}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              </GradientBorder>

              <GradientBorder>
                <div className="card p-6 bg-gradient-to-br from-gray-50/80 to-white dark:from-[#111] dark:to-[#0a0a0a]">
                <p className="label mb-4">Credentials</p>
                <div className="space-y-3.5">
                  {[
                    ['Experience', '21 years NetSuite'],
                    ['Projects completed', '350+'],
                    ['Abandoned implementations', '0'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between"
                    >
                      <span className="text-xs text-gray-500 dark:text-[#555]">{label}</span>
                      <span className="text-xs font-bold text-gray-800 dark:text-[#ccc]"
                      >{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              </GradientBorder>
            </div>
          </div>
        </div>
      ) : (
        <div className="page-container">
          {isLoading && !completion && (
            <div className="py-20 flex flex-col items-center gap-6 max-w-lg mx-auto animate-fade-up"
            >
              <WritingAnimation text={`Researching ${companyName}…`} />
              <div className="space-y-2 text-center">
                <TypingText
                  text={`Researching ${companyName}…`}
                  className="text-sm font-semibold text-gray-950 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-[#555]"
                >
                  Reading the company website and gathering context.
                </p>
                <p className="text-xs text-gray-400 dark:text-[#444]"
                >
                  This takes around 15–30 seconds.
                </p>
              </div>
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs text-gray-400 dark:text-[#444] hover:text-gray-600 dark:hover:text-[#888] underline underline-offset-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {isLoading && completion && (
            <div className="mb-6 flex items-center gap-2 text-xs text-gray-500 dark:text-[#555] bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1e1e1e] rounded-lg px-3 py-2 w-fit animate-fade-in"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              Writing letter pack…
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-xl p-5 text-sm text-red-600 dark:text-red-400 max-w-lg animate-fade-up"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0"
                >
                  <svg
                    className="w-3 h-3 text-red-600 dark:text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">Generation failed</p>
                  <p className="text-xs mt-1 opacity-80">{error.message}</p>
                </div>
              </div>
            </div>
          )}

          {parsed && (
            <div className="animate-fade-up">
              <LetterOutput
                coverLetter={parsed.part1}
                businessCase={parsed.part2}
                techMap={parsed.part3}
                companyName={companyName}
                recipientName={formValues?.recipientName}
                jobTitle={formValues?.jobTitle}
                isStreaming={isLoading}
              />
            </div>
          )}

          {!isLoading && !error && (
            <button
              onClick={() => setSubmitted(false)}
              className="mt-8 text-xs text-gray-400 dark:text-[#444] hover:text-gray-600 dark:hover:text-[#888] underline underline-offset-2 transition-colors"
            >
              ← Generate another
            </button>
          )}
        </div>
      )}

      <footer className="page-footer">
        ERP Experts Ltd · Internal Outreach Generation Portal
      </footer>
    </main>
  )
}
