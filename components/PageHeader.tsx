'use client'

import { ReactNode } from 'react'

interface PageHeaderProps {
  badge?: {
    icon: ReactNode
    text: string
  }
  title: string
  description?: string
  actions?: ReactNode
}

export default function PageHeader({ badge, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-10">
      <div>
        {badge && (
          <div className="page-badge mb-4">
            <span className="text-emerald-600 dark:text-emerald-400">{badge.icon}</span>
            {badge.text}
          </div>
        )}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description mt-2">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
