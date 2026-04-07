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
      <div className="grid grid-cols-2 gap-4">
        <Field label="Company name" name="company" value={values.company} onChange={handleChange} placeholder="GolfBays" required />
        <Field label="Website" name="url" value={values.url} onChange={handleChange} placeholder="https://golfbays.com" type="url" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Recipient first name" name="recipientName" value={values.recipientName} onChange={handleChange} placeholder="Oliver" required />
        <Field label="Job title" name="jobTitle" value={values.jobTitle} onChange={handleChange} placeholder="Operations Director" required />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
          Notes <span className="normal-case font-normal">(optional)</span>
        </label>
        <textarea
          name="notes"
          value={values.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Anything you already know about their systems, operations, or the recipient…"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={!isValid}
        className="w-full bg-[#0A0A0A] text-white text-sm font-medium rounded-lg px-4 py-3 hover:bg-gray-800 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
      >
        Generate letter pack
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
      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
      />
    </div>
  )
}
