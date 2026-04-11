// ── Template Library ───────────────────────────────────────────────────────────
// Storage: localStorage 'erp_templates'

export interface Template {
  id: string
  name: string
  description: string
  industry: string
  preview: string // First 200 chars of content
  fullContent: string // Complete letter pack
  createdBy: string
  createdAt: string
  usageCount: number
  responseCount?: number // How many times it got positive responses
  tags: string[]
}

const KEY = 'erp_templates'
const MAX_TEMPLATES = 50

export function loadTemplates(): Template[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveTemplate(
  template: Omit<Template, 'id' | 'createdAt' | 'usageCount'>
): Template {
  const saved: Template = {
    ...template,
    id: `tmpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    usageCount: 0,
  }
  const templates = loadTemplates()
  const updated = [saved, ...templates].slice(0, MAX_TEMPLATES)
  localStorage.setItem(KEY, JSON.stringify(updated))
  return saved
}

export function incrementTemplateUsage(id: string): void {
  const updated = loadTemplates().map((t) =>
    t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t
  )
  localStorage.setItem(KEY, JSON.stringify(updated))
}

export function recordTemplateResponse(id: string, positive: boolean): void {
  const updated = loadTemplates().map((t) =>
    t.id === id
      ? {
          ...t,
          responseCount: (t.responseCount ?? 0) + (positive ? 1 : 0),
        }
      : t
  )
  localStorage.setItem(KEY, JSON.stringify(updated))
}

export function deleteTemplate(id: string): void {
  const updated = loadTemplates().filter((t) => t.id !== id)
  localStorage.setItem(KEY, JSON.stringify(updated))
}

export function getTopTemplates(limit = 5): Template[] {
  return loadTemplates()
    .sort((a, b) => {
      // Sort by response rate, then usage count
      const aRate = (a.responseCount ?? 0) / Math.max(a.usageCount, 1)
      const bRate = (b.responseCount ?? 0) / Math.max(b.usageCount, 1)
      if (bRate !== aRate) return bRate - aRate
      return b.usageCount - a.usageCount
    })
    .slice(0, limit)
}

export function getTemplateById(id: string): Template | undefined {
  return loadTemplates().find((t) => t.id === id)
}

// Predefined industry tags for filtering
export const TEMPLATE_INDUSTRY_TAGS = [
  'Manufacturing',
  'Ecommerce',
  'Retail',
  'Field Services',
  'Construction',
  'Professional Services',
  'Technology',
  'Recruitment',
  'Distribution',
  'Healthcare',
  'General',
]

// Predefined content tags
export const TEMPLATE_CONTENT_TAGS = [
  'High ERP Score',
  'Strong Opening',
  'Great Case Study',
  'Specific Pain Points',
  'Strong CTA',
  'Concise',
  'Detailed',
]
