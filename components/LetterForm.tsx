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
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Company name" name="company" value={values.company} onChange={handleChange} placeholder="e.g. GolfBays" required />
      <Field label="Website URL" name="url" value={values.url} onChange={handleChange} placeholder="e.g. https://golfbays.com" type="url" required />
      <Field label="Recipient first name" name="recipientName" value={values.recipientName} onChange={handleChange} placeholder="e.g. Oliver" required />
      <Field label="Recipient job title" name="jobTitle" value={values.jobTitle} onChange={handleChange} placeholder="e.g. Operations Director" required />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          name="notes"
          value={values.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Anything you already know about the company, their systems, or the recipient…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={!isValid}
        className="w-full bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-3 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Generate letter pack
      </button>
    </form>
  )
}

function Field({
  label, name, value, onChange, placeholder, required, type = 'text',
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
      />
    </div>
  )
}
