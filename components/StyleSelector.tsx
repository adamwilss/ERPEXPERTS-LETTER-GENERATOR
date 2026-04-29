'use client'

import { useEffect, useState } from 'react'
import { Palette } from 'lucide-react'

export type LetterStyle = 'executive' | 'modern' | 'warm' | 'dark' | 'studio'

const STYLES: { key: LetterStyle; label: string }[] = [
  { key: 'executive', label: 'Executive' },
  { key: 'modern', label: 'Punchy' },
  { key: 'warm', label: 'Boutique' },
  { key: 'dark', label: 'Authority' },
  { key: 'studio', label: 'Studio' },
]

interface Props {
  value: LetterStyle
  onChange: (style: LetterStyle) => void
}

export default function StyleSelector({ value, onChange }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex items-center gap-1.5">
      <Palette className="w-3 h-3 text-gray-400 dark:text-[#555] mr-1" />
      {STYLES.map((s) => (
        <button
          key={s.key}
          onClick={() => onChange(s.key)}
          className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-150 ${
            value === s.key
              ? 'bg-[#1a1a1a] text-white shadow-sm'
              : 'bg-white dark:bg-transparent text-gray-500 dark:text-[#666] border border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a] hover:text-gray-700 dark:hover:text-[#aaa]'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
