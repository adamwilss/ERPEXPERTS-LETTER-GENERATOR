'use client'

import { useEffect } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const TOUR_SEEN_KEY = 'erp_tutorial_seen'

const tourSteps = [
  {
    element: '#tour-hero',
    popover: {
      title: 'Welcome to the Letter Portal',
      description:
        'This tool generates personalised three-part outreach packs for NetSuite prospects. Research, drafting, and formatting — all automated.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '#tour-form',
    popover: {
      title: 'Generate a Single Letter',
      description:
        'Enter the company name, website, and recipient details. The system researches the company automatically and produces a ready-to-send pack in under 60 seconds.',
      side: 'right' as const,
      align: 'start' as const,
    },
  },
  {
    element: '#tour-sidebar',
    popover: {
      title: 'What You Get',
      description:
        'Every pack includes a cover letter signed by Ric, a business case with benchmarks and pain points, and a technology integration map.',
      side: 'left' as const,
      align: 'start' as const,
    },
  },
  {
    element: '#tour-nav-discover',
    popover: {
      title: 'Discover Leads',
      description:
        'Search Apollo by industry and size. AI ranks prospects by ERP fit and operational complexity. Results auto-save to your database.',
      side: 'bottom' as const,
      align: 'center' as const,
    },
  },
  {
    element: '#tour-nav-searches',
    popover: {
      title: 'Saved Searches',
      description:
        'All your Apollo searches are preserved here with full lead data — rationale, tech stack, scores, and contact details. Revisit and generate at any time.',
      side: 'bottom' as const,
      align: 'center' as const,
    },
  },
  {
    element: '#tour-nav-history',
    popover: {
      title: 'History',
      description:
        'Track every generated pack. Mark letters as sent, record responses, book meetings, and manage follow-up sequences.',
      side: 'bottom' as const,
      align: 'center' as const,
    },
  },
  {
    element: '#tour-theme-toggle',
    popover: {
      title: 'Make It Yours',
      description:
        'Toggle dark mode, view analytics, or access your template library. You are ready — generate your first letter.',
      side: 'bottom' as const,
      align: 'end' as const,
    },
  },
]

export function startTour(force = false) {
  if (!force && typeof window !== 'undefined') {
    const seen = localStorage.getItem(TOUR_SEEN_KEY)
    if (seen) return
  }

  const d = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    doneBtnText: 'Finish',
    nextBtnText: 'Next →',
    prevBtnText: '← Back',
    steps: tourSteps,
    onDestroyed: () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOUR_SEEN_KEY, 'true')
      }
    },
    popoverClass: 'erp-tour-popover',
  })

  d.drive()
}

export default function OnboardingTour() {
  useEffect(() => {
    const timer = setTimeout(() => {
      startTour()
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  return null
}
