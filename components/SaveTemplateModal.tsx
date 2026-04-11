'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { TEMPLATE_INDUSTRY_TAGS, TEMPLATE_CONTENT_TAGS } from '@/lib/templates'

interface SaveTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  initialContent: string
  onSave: (template: { name: string; description: string; industry: string; tags: string[] }) => void
}

export default function SaveTemplateModal({
  isOpen,
  onClose,
  initialContent,
  onSave,
}: SaveTemplateModalProps) {
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Save as Template
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

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
