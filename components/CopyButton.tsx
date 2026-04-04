'use client'

import { useState } from 'react'

export default function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors"
    >
      {copied ? 'Copied' : label}
    </button>
  )
}
