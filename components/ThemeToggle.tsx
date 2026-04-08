'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    } else {
      document.documentElement.classList.remove('dark')
      setIsDark(false)
    }
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Prevent hydration mismatch — reserve space until mounted
  if (!mounted) {
    return <div style={{ width: 52, height: 28 }} />
  }

  return (
    <div className="relative flex items-center rounded border border-gray-200 dark:border-[#222] bg-gray-100/80 dark:bg-[#0a0a0a] p-[3px]">
      {/* Sliding pill indicator */}
      <span
        aria-hidden
        style={{ left: 3 }}
        className={[
          'pointer-events-none absolute top-[3px] h-[22px] w-[22px] rounded-[3px]',
          'bg-white dark:bg-[#1e1e1e]',
          'border border-gray-200 dark:border-[#2a2a2a]',
          'shadow-[0_1px_2px_rgba(0,0,0,0.07)]',
          'transition-transform duration-200 ease-in-out',
          isDark ? 'translate-x-[22px]' : 'translate-x-0',
        ].join(' ')}
      />

      {/* Light */}
      <button
        onClick={() => isDark && toggle()}
        aria-label="Switch to light mode"
        aria-pressed={!isDark}
        className={[
          'relative z-10 flex items-center justify-center w-[22px] h-[22px]',
          'transition-colors duration-150',
          !isDark
            ? 'text-gray-700'
            : 'text-gray-300 dark:text-[#3c3c3c] hover:text-gray-500 dark:hover:text-[#666]',
        ].join(' ')}
      >
        <Sun strokeWidth={1.75} className="w-3.5 h-3.5" />
      </button>

      {/* Dark */}
      <button
        onClick={() => !isDark && toggle()}
        aria-label="Switch to dark mode"
        aria-pressed={isDark}
        className={[
          'relative z-10 flex items-center justify-center w-[22px] h-[22px]',
          'transition-colors duration-150',
          isDark
            ? 'text-gray-800 dark:text-white'
            : 'text-gray-300 hover:text-gray-500',
        ].join(' ')}
      >
        <Moon strokeWidth={1.75} className="w-3 h-3" />
      </button>
    </div>
  )
}
