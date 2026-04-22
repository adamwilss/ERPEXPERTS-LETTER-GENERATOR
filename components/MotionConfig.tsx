'use client'

import { create } from 'zustand'
import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface MotionStore {
  cinematicMode: boolean
  toggleCinematic: () => void
}

export const useMotionStore = create<MotionStore>((set) => ({
  cinematicMode: true,
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
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="particle-dot"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${8 + Math.random() * 12}s`,
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            opacity: 0.2 + Math.random() * 0.3,
          }}
        />
      ))}
    </div>
  )
}

// ── Animated gradient border for cards ─────────────────────────────────────────

export function GradientBorder({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const cinematic = useMotionStore((s) => s.cinematicMode)
  if (!cinematic) return <div className={className}>{children}</div>

  return (
    <div className={`relative group ${className}`}>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-amber-500/20 rounded-[22px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
      <div className="relative">
        {children}
      </div>
    </div>
  )
}

// ── Scroll reveal wrapper ──────────────────────────────────────────────────────

export function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const cinematic = useMotionStore((s) => s.cinematicMode)
  if (!cinematic) return <>{children}</>

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

// ── Magnetic button effect ────────────────────────────────────────────────────

export function MagneticButton({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const cinematic = useMotionStore((s) => s.cinematicMode)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 150, damping: 15 })
  const springY = useSpring(y, { stiffness: 150, damping: 15 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cinematic) return
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.15)
    y.set((e.clientY - centerY) * 0.15)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Typing effect for loading text ─────────────────────────────────────────────

export function TypingText({ text, className = '' }: { text: string; className?: string }) {
  const [displayed, setDisplayed] = useState('')
  const cinematic = useMotionStore((s) => s.cinematicMode)

  useEffect(() => {
    if (!cinematic) {
      setDisplayed(text)
      return
    }
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(interval)
    }, 40)
    return () => clearInterval(interval)
  }, [text, cinematic])

  return <span className={className}>{displayed}<span className="animate-pulse">|</span></span>
}
