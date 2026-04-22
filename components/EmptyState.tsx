'use client'

import { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-20 animate-fade-up">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gray-100 dark:bg-[#151515] border border-gray-200 dark:border-[#1e1e1e] flex items-center justify-center">
        <div className="text-gray-400 dark:text-[#444]">{icon}</div>
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{title}</p>
      {description && (
        <p className="text-xs text-gray-500 dark:text-[#555] mb-6 max-w-xs mx-auto leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
