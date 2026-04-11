'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Loader2, Bell, BarChart3, LayoutTemplate } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { useDiscoverStore } from '@/lib/discover-store'
import { getReminderCount, getOverdueReminders } from '@/lib/reminders'

const nav = [
  { href: '/', label: 'Single letter' },
  { href: '/discover', label: 'Discover leads' },
  { href: '/history', label: 'History' },
]

function ReminderBadge() {
  const [count, setCount] = useState(0)
  const [overdue, setOverdue] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    const update = () => {
      setCount(getReminderCount())
      setOverdue(getOverdueReminders().length)
    }
    update()
    const interval = setInterval(update, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  if (pathname === '/reminders' || count === 0) return null

  return (
    <Link
      href="/reminders"
      className={`relative flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border transition-colors hover:opacity-80 ${
        overdue > 0
          ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
          : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
      }`}
    >
      <Bell className="w-3 h-3" />
      {overdue > 0 ? `${overdue} overdue` : `${count} reminder${count !== 1 ? 's' : ''}`}
      {overdue > 0 && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </Link>
  )
}

function SessionPill() {
  const phase = useDiscoverStore((s) => s.phase)
  const leads = useDiscoverStore((s) => s.leads)
  const packs = useDiscoverStore((s) => s.packs)
  const pathname = usePathname()

  // Don't show if already on /discover or no active session
  if (pathname === '/discover' || phase === 'form') return null

  let label: string
  let color: string
  let showSpinner = false

  if (phase === 'streaming') {
    label = 'Searching…'
    color = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
    showSpinner = true
  } else if (phase === 'results') {
    label = `${leads.length} leads`
    color = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
  } else if (phase === 'generating') {
    const done = packs.filter((p) => p.status === 'done').length
    label = `Generating ${done}/${packs.length}`
    color = 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20'
    showSpinner = true
  } else if (phase === 'done') {
    const done = packs.filter((p) => p.status === 'done').length
    label = `${done} packs ready`
    color = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
  } else {
    return null
  }

  return (
    <Link
      href="/discover"
      className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border transition-colors hover:opacity-80 ${color}`}
    >
      {showSpinner && <Loader2 className="w-3 h-3 animate-spin" />}
      {label}
    </Link>
  )
}

export default function Header() {
  const pathname = usePathname()
  return (
    <header className="bg-white dark:bg-[#111] sticky top-0 z-50 border-b border-gray-200 dark:border-[#1e1e1e]">
      <div className="max-w-5xl mx-auto px-6 h-13 flex items-center justify-between" style={{ height: '52px' }}>
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/erpexperts-logo.png"
              alt="ERP Experts"
              width={100}
              height={32}
              className="h-8 w-auto object-contain"
              priority
            />
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

        <div className="flex items-center gap-3">
          <ReminderBadge />
          <SessionPill />
          <Link
            href="/analytics"
            className={`p-2 rounded-md transition-colors ${
              pathname === '/analytics'
                ? 'bg-gray-100 text-gray-900 dark:bg-[#1a1a1a] dark:text-white'
                : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            title="Analytics"
          >
            <BarChart3 className="w-4 h-4" />
          </Link>
          <Link
            href="/templates"
            className={`p-2 rounded-md transition-colors ${
              pathname === '/templates'
                ? 'bg-gray-100 text-gray-900 dark:bg-[#1a1a1a] dark:text-white'
                : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            title="Templates"
          >
            <LayoutTemplate className="w-4 h-4" />
          </Link>
          <ThemeToggle />
          <span className="text-[10px] text-gray-300 dark:text-[#333] uppercase tracking-[0.2em] font-medium select-none">
            Internal
          </span>
        </div>
      </div>
    </header>
  )
}
