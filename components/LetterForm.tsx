'use client'

import { useState } from 'react'

export interface FormValues {
  company: string
  url: string
  recipientName: string
  jobTitle: string
  notes: string
}

interface Props {
  onSubmit: (values: FormValues) => void
}

export default function LetterForm({ onSubmit }: Props) {
  const [values, setValues] = useState<FormValues>({
    company: '',
    url: '',
    recipientName: '',
    jobTitle: '',
    notes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(values)
  }

  const isValid = values.company && values.url && values.recipientName && values.jobTitle

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company name" name="company" value={values.company} onChange={handleChange} placeholder="GolfBays" required />
        <Field label="Website" name="url" value={values.url} onChange={handleChange} placeholder="https://golfbays.com" type="url" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Recipient first name" name="recipientName" value={values.recipientName} onChange={handleChange} placeholder="Oliver" required />
        <Field label="Job title" name="jobTitle" value={values.jobTitle} onChange={handleChange} placeholder="Operations Director" required />
      </div>
      <div>
        <label className="block text-[11px] font-medium text-gray-400 dark:text-[#444] mb-1.5 uppercase tracking-[0.1em]">
          Notes <span className="normal-case font-normal text-gray-300 dark:text-[#333]">(optional)</span>
        </label>
        <textarea
          name="notes"
          value={values.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Anything you already know about their systems, operations, or the recipient…"
          className="w-full rounded-lg border border-gray-200 dark:border-[#1e1e1e] bg-white dark:bg-[#1a1a1a] px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-[#333] focus:outline-none focus:border-gray-400 dark:focus:border-[#2a2a2a] focus:ring-1 focus:ring-gray-200 dark:focus:ring-[#1e1e1e] resize-none transition-colors"
        />
      </div>
      <button
        type="submit"
        disabled={!isValid}
        className="w-full bg-gray-900 dark:bg-white text-white dark:text-[#090909] text-sm font-semibold rounded-lg px-4 py-3 hover:bg-gray-800 dark:hover:bg-[#e8e8e8] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
      >
        Generate letter pack →
      </button>
    </form>
  )
}

function Field({ label, name, value, onChange, placeholder, required, type = 'text' }: {
  label: string; name: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string; required?: boolean; type?: string
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-400 dark:text-[#444] mb-1.5 uppercase tracking-[0.1em]">{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        className="w-full rounded-lg border border-gray-200 dark:border-[#1e1e1e] bg-white dark:bg-[#1a1a1a] px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-[#333] focus:outline-none focus:border-gray-400 dark:focus:border-[#2a2a2a] focus:ring-1 focus:ring-gray-200 dark:focus:ring-[#1e1e1e] transition-colors"
      />
    </div>
  )
}
