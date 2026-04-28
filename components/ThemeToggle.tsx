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
    <div className="relative flex items-center rounded-lg border border-cream-300 dark:border-void-50 bg-cream-200/80 dark:bg-void-600 p-[3px]">
      {/* Sliding pill indicator */}
      <span
        aria-hidden
        style={{ left: 3 }}
        className={[
          'pointer-events-none absolute top-[3px] h-[22px] w-[22px] rounded-[3px]',
          'bg-white dark:bg-void-100',
          'border border-cream-300 dark:border-void-50',
          'shadow-[0_1px_2px_rgba(0,0,0,0.06)]',
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
            ? 'text-cream-900'
            : 'text-cream-400 dark:text-void-300 hover:text-cream-600 dark:hover:text-void-200',
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
            ? 'text-cream-900 dark:text-white'
            : 'text-cream-300 hover:text-cream-500',
        ].join(' ')}
      >
        <Moon strokeWidth={1.75} className="w-3 h-3" />
      </button>
    </div>
  )
}
