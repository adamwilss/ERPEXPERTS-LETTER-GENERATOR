import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import OnboardingTour from '@/components/OnboardingTour'
import { ParticleBackground } from '@/components/MotionConfig'

export const metadata: Metadata = {
  title: 'ERP Experts — Letter Portal',
  description: 'Internal outreach letter generator for the ERP Experts sales team',
  robots: 'noindex, nofollow',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}})()` }} />
      </head>
      <body className="min-h-screen">
        <ParticleBackground />
        <Header />
        {children}
        <OnboardingTour />
      </body>
    </html>
  )
}
