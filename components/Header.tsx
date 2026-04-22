'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Loader2, Bell, BarChart3, LayoutTemplate, HelpCircle } from 'lucide-react'
import { startTour } from './OnboardingTour'
import ThemeToggle from './ThemeToggle'
import { useDiscoverStore } from '@/lib/discover-store'
import { getReminderCount, getOverdueReminders } from '@/lib/reminders'
// Cinematic mode is permanently enabled

const nav = [
  { href: '/', label: 'Single letter' },
  { href: '/discover', label: 'Discover leads' },
  { href: '/searches', label: 'Saved searches' },
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
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])

  if (pathname === '/reminders' || count === 0) return null

  return (
    <Link
      href="/reminders"
      className={`relative flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all hover:opacity-80 ${
        overdue > 0
          ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
          : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
      }`}
    >
      <Bell className="w-3 h-3" />
      {overdue > 0 ? `${overdue} overdue` : `${count} reminder${count !== 1 ? 's' : ''}`}
      {overdue > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </Link>
  )
}

function SessionPill() {
  const phase = useDiscoverStore((s) => s.phase)
  const leads = useDiscoverStore((s) => s.leads)
  const packs = useDiscoverStore((s) => s.packs)
  const pathname = usePathname()

  if (pathname === '/discover' || phase === 'form') return null

  let label: string
  let color: string
  let showSpinner = false

  if (phase === 'streaming') {
    label = 'Searching…'
    color = 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
    showSpinner = true
  } else if (phase === 'results') {
    label = `${leads.length} leads`
    color = 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
  } else if (phase === 'generating') {
    const done = packs.filter((p) => p.status === 'done').length
    label = `Generating ${done}/${packs.length}`
    color = 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20'
    showSpinner = true
  } else if (phase === 'done') {
    const done = packs.filter((p) => p.status === 'done').length
    label = `${done} packs ready`
    color = 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
  } else {
    return null
  }

  return (
    <Link
      href="/discover"
      className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all hover:opacity-80 ${color}`}
    >
      {showSpinner && <Loader2 className="w-3 h-3 animate-spin" />}
      {label}
    </Link>
  )
}


export default function Header() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/60 dark:border-[#1e1e1e]/60 bg-white/75 dark:bg-[#0a0a0a]/75 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between" style={{ height: '52px' }}>
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/erpexperts-logo.png"
              alt="ERP Experts"
              width={100}
              height={32}
              className="h-7 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity"
              priority
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-gray-950 dark:text-white font-bold tracking-[-0.03em] text-[13px] leading-none">
                ERP EXPERTS
              </span>
              <span className="text-gray-400 dark:text-[#444] text-[9px] leading-none mt-[3px] tracking-[0.12em] uppercase font-medium">
                Letter Portal
              </span>
            </div>
          </Link>

          <div className="hidden sm:block w-px h-4 bg-gray-200 dark:bg-[#1e1e1e]" />

          <nav className="hidden sm:flex items-center gap-0.5">
            {nav.map((item) => {
              const active = pathname === item.href
              const tourId =
                item.href === '/discover'
                  ? 'tour-nav-discover'
                  : item.href === '/searches'
                    ? 'tour-nav-searches'
                    : item.href === '/history'
                      ? 'tour-nav-history'
                      : undefined
              return (
                <Link
                  key={item.href}
                  id={tourId}
                  href={item.href}
                  className={`px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all duration-150 ${
                    active
                      ? 'bg-gray-100 text-gray-950 dark:bg-[#1a1a1a] dark:text-white'
                      : 'text-gray-400 hover:text-gray-700 dark:text-[#555] dark:hover:text-[#ccc]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ReminderBadge />
          <SessionPill />
          <div className="w-px h-4 bg-gray-200 dark:bg-[#1e1e1e] mx-1" />
          <Link
            href="/analytics"
            className={`p-2 rounded-lg transition-all ${
              pathname === '/analytics'
                ? 'bg-gray-100 text-gray-950 dark:bg-[#1a1a1a] dark:text-white'
                : 'text-gray-400 hover:text-gray-700 dark:text-[#555] dark:hover:text-[#ccc]'
            }`}
            title="Analytics"
          >
            <BarChart3 className="w-4 h-4" />
          </Link>
          <Link
            href="/templates"
            className={`p-2 rounded-lg transition-all ${
              pathname === '/templates'
                ? 'bg-gray-100 text-gray-950 dark:bg-[#1a1a1a] dark:text-white'
                : 'text-gray-400 hover:text-gray-700 dark:text-[#555] dark:hover:text-[#ccc]'
            }`}
            title="Templates"
          >
            <LayoutTemplate className="w-4 h-4" />
          </Link>
          <button
            id="tour-theme-toggle"
            onClick={() => startTour(true)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:text-[#555] dark:hover:text-[#ccc] transition-all"
            title="Replay tutorial"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <ThemeToggle />
          <span className="hidden md:inline text-[9px] text-gray-300 dark:text-[#333] uppercase tracking-[0.2em] font-semibold select-none ml-1">
            Internal
          </span>
        </div>
      </div>
    </header>
  )
}
