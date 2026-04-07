'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/', label: 'Single letter' },
  { href: '/discover', label: 'Discover leads' },
  { href: '/history', label: 'History' },
]

export default function Header() {
  const pathname = usePathname()
  return (
    <header className="bg-[#0A0A0A] sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-white font-bold tracking-tight text-sm">ERP EXPERTS</span>
            <span className="hidden sm:block w-px h-3 bg-white/20" />
            <span className="hidden sm:block text-white/40 text-xs">Letter Portal</span>
          </Link>
          <nav className="flex items-center">
            {nav.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                    active
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-white/45 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <span className="text-[10px] text-white/20 uppercase tracking-[0.15em] font-medium">
          Internal
        </span>
      </div>
    </header>
  )
}
