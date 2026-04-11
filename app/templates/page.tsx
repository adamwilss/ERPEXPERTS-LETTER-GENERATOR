'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  X,
  Tag,
  User,
  Calendar,
  TrendingUp,
  Copy,
  Trash2,
  FileText,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  loadTemplates,
  saveTemplate,
  deleteTemplate,
  incrementTemplateUsage,
  type Template,
  TEMPLATE_INDUSTRY_TAGS,
  TEMPLATE_CONTENT_TAGS,
} from '@/lib/templates'

// ── Components ─────────────────────────────────────────────────────────────────

function SaveTemplateModal({
  isOpen,
  onClose,
  onSave,
  initialContent,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (template: { name: string; description: string; industry: string; tags: string[] }) => void
  initialContent: string
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [industry, setIndustry] = useState('General')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#1e1e1e] shadow-xl max-w-lg w-full p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Save as Template
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-[#555] mb-1.5 block">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Manufacturing - Strong Pain Points"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#1e1e1e] rounded-lg bg-white dark:bg-[#111] text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-[#2a2a2a]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-[#555] mb-1.5 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this template effective..."
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#1e1e1e] rounded-lg bg-white dark:bg-[#111] text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-[#2a2a2a]"
              rows={2}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-[#555] mb-1.5 block">
              Industry
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#1e1e1e] rounded-lg bg-white dark:bg-[#111] text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-[#2a2a2a]"
            >
              {TEMPLATE_INDUSTRY_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-[#555] mb-1.5 block">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_CONTENT_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() =>
                    setSelectedTags((prev) =>
                      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                    )
                  }
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                      : 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#1e1e1e] hover:border-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (name.trim()) {
                onSave({ name, description, industry, tags: selectedTags })
                onClose()
              }
            }}
            disabled={!name.trim()}
            className="flex-1 px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Save Template
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const router = useRouter()

  useEffect(() => {
    setTemplates(loadTemplates())
  }, [])

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.preview.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesIndustry = selectedIndustry ? t.industry === selectedIndustry : true
    return matchesSearch && matchesIndustry
  })

  const handleUseTemplate = (template: Template) => {
    incrementTemplateUsage(template.id)
    // Navigate to generator with template context
    sessionStorage.setItem('selectedTemplate', JSON.stringify(template))
    router.push('/')
  }

  return (
    <main className="min-h-[calc(100vh-52px)]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white tracking-tight">
              Template Library
            </h1>
            <p className="text-sm text-gray-500 dark:text-[#555] mt-1">
              Save and reuse your best-performing letter templates
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-[#1e1e1e] rounded-lg bg-white dark:bg-[#111] text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-[#2a2a2a]"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedIndustry(null)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedIndustry === null
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            {TEMPLATE_INDUSTRY_TAGS.slice(0, 5).map((industry) => (
              <button
                key={industry}
                onClick={() => setSelectedIndustry(industry)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  selectedIndustry === industry
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                }`}
              >
                {industry}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-24 text-gray-300 dark:text-[#333]">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              {templates.length === 0
                ? 'No templates saved yet. Generate a great letter and save it as a template!'
                : 'No templates match your search.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredTemplates.map((template, i) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1e1e1e] rounded-xl p-5 shadow-sm dark:shadow-none hover:border-gray-300 dark:hover:border-[#2a2a2a] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">{template.industry}</p>
                  </div>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                  {template.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {template.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-[10px] bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#1e1e1e]">
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {template.usageCount} uses
                    </span>
                    {template.responseCount !== undefined && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {Math.round((template.responseCount / Math.max(template.usageCount, 1)) * 100)}%
                        response
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewTemplate(template)}
                      className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      Use
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewTemplate(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#1e1e1e] shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-[#1e1e1e] flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {previewTemplate.name}
                  </h3>
                  <p className="text-xs text-gray-500">{previewTemplate.industry}</p>
                </div>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans leading-relaxed">
                  {previewTemplate.fullContent.slice(0, 1500)}...
                </pre>
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-[#1e1e1e] bg-gray-50 dark:bg-[#111] flex justify-end">
                <button
                  onClick={() => {
                    handleUseTemplate(previewTemplate)
                    setPreviewTemplate(null)
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Use This Template
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-auto py-6 text-center text-[11px] text-gray-300 dark:text-[#333] border-t border-gray-200 dark:border-[#1e1e1e]">
        ERP Experts Ltd · Internal Outreach Generation Portal
      </footer>
    </main>
  )
}
