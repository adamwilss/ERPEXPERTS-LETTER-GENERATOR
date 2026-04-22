'use client'

import { useState } from 'react'
import { Sparkles, Building2, Globe, User, Briefcase, FileText } from 'lucide-react'

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(values)
  }

  const isValid = values.company && values.url && values.recipientName && values.jobTitle

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Company name"
          name="company"
          value={values.company}
          onChange={handleChange}
          placeholder="GolfBays"
          icon={<Building2 className="w-3.5 h-3.5" />}
          required
        />
        <Field
          label="Website"
          name="url"
          value={values.url}
          onChange={handleChange}
          placeholder="https://golfbays.com"
          icon={<Globe className="w-3.5 h-3.5" />}
          type="url"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Recipient first name"
          name="recipientName"
          value={values.recipientName}
          onChange={handleChange}
          placeholder="Oliver"
          icon={<User className="w-3.5 h-3.5" />}
          required
        />
        <Field
          label="Job title"
          name="jobTitle"
          value={values.jobTitle}
          onChange={handleChange}
          placeholder="Operations Director"
          icon={<Briefcase className="w-3.5 h-3.5" />}
          required
        />
      </div>
      <div>
        <label className="label flex items-center gap-1.5">
          <FileText className="w-3 h-3" />
          Notes{' '}
          <span className="normal-case font-normal text-gray-300 dark:text-[#333]">
            (optional)
          </span>
        </label>
        <textarea
          name="notes"
          value={values.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Anything you already know about their systems, operations, or the recipient…"
          className="input resize-none"
        />
      </div>
      <button type="submit" disabled={!isValid} className="btn btn-primary w-full">
        <Sparkles className="w-4 h-4" />
        Generate letter pack
      </button>
    </form>
  )
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
  icon,
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  type?: string
  icon?: React.ReactNode
}) {
  return (
    <div>
      <label className="label flex items-center gap-1.5">
        {icon && <span className="text-gray-300 dark:text-[#444]">{icon}</span>}
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="input"
      />
    </div>
  )
}
