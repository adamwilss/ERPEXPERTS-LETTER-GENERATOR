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
    <header className="bg-[#080808] sticky top-0 z-50 border-b border-white/[0.05]">
      <div className="max-w-5xl mx-auto px-6 h-13 flex items-center justify-between" style={{ height: '52px' }}>
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex flex-col">
              <span className="text-white font-semibold tracking-[-0.02em] text-[13px] leading-none">
                ERP EXPERTS
              </span>
              <span className="text-white/30 text-[10px] leading-none mt-[3px] tracking-[0.08em] uppercase">
                Letter Portal
              </span>
            </div>
          </Link>

          <div className="w-px h-4 bg-white/10" />

          <nav className="flex items-center gap-0.5">
            {nav.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-[13px] rounded-md transition-all duration-150 ${
                    active
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-white/40 hover:text-white/80 hover:bg-white/[0.06]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <span className="text-[10px] text-white/15 uppercase tracking-[0.2em] font-medium select-none">
          Internal
        </span>
      </div>
    </header>
  )
}
