'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from './ThemeToggle'

const nav = [
  { href: '/', label: 'Single letter' },
  { href: '/discover', label: 'Discover leads' },
  { href: '/history', label: 'History' },
]

export default function Header() {
  const pathname = usePathname()
  return (
    <header className="bg-white dark:bg-[#111] sticky top-0 z-50 border-b border-gray-200 dark:border-[#1e1e1e]">
      <div className="max-w-5xl mx-auto px-6 h-13 flex items-center justify-between" style={{ height: '52px' }}>
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex flex-col">
              <span className="text-gray-900 dark:text-white font-semibold tracking-[-0.02em] text-[13px] leading-none">
                ERP EXPERTS
              </span>
              <span className="text-gray-400 dark:text-[#444] text-[10px] leading-none mt-[3px] tracking-[0.08em] uppercase">
                Letter Portal
              </span>
            </div>
          </Link>

          <div className="w-px h-4 bg-gray-200 dark:bg-[#1e1e1e]" />

          <nav className="flex items-center gap-0.5">
            {nav.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-[13px] rounded-md transition-all duration-150 ${
                    active
                      ? 'bg-gray-100 text-gray-900 font-medium dark:bg-[#1a1a1a] dark:text-white'
                      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:text-[#444] dark:hover:text-[#ccc] dark:hover:bg-white/[0.02]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-[10px] text-gray-300 dark:text-[#333] uppercase tracking-[0.2em] font-medium select-none">
            Internal
          </span>
        </div>
      </div>
    </header>
  )
}
