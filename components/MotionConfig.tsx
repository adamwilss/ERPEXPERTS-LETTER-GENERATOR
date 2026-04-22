'use client'

import { create } from 'zustand'
import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface MotionStore {
  cinematicMode: boolean
  toggleCinematic: () => void
}

export const useMotionStore = create<MotionStore>((set) => ({
  cinematicMode: false,
  toggleCinematic: () => set((s) => ({ cinematicMode: !s.cinematicMode })),
}))

// ── Cursor-following glow effect for hero ──────────────────────────────────────

export function HeroGlow({ children }: { children: React.ReactNode }) {
  const cinematic = useMotionStore((s) => s.cinematicMode)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted || !cinematic) return <>{children}</>

  return <CursorGlow>{children}</CursorGlow>
}

function CursorGlow({ children }: { children: React.ReactNode }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 })

  const gradient = useTransform(
    [springX, springY],
    ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(16,185,129,0.08), transparent 40%)`
  )

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [mouseX, mouseY])

  return (
    <div className="relative">
      <motion.div
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{ background: gradient }}
      />
      {children}
    </div>
  )
}

// ── Floating particles (CSS-only for performance) ─────────────────────────────

export function ParticleBackground() {
  const cinematic = useMotionStore((s) => s.cinematicMode)
  if (!cinematic) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="particle-dot"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${8 + Math.random() * 12}s`,
          }}
        />
      ))}
    </div>
  )
}
