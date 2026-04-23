'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, X, Check, Loader2, Sparkles } from 'lucide-react'

interface InlineRewriteProps {
  children: React.ReactNode
  context: string
  part: 'letter' | 'case' | 'map'
  companyName?: string
}

type RewriteState =
  | { type: 'idle' }
  | { type: 'selecting'; text: string; rect: DOMRect }
  | { type: 'prompting'; text: string; rect: DOMRect }
  | { type: 'rewriting'; text: string; instruction: string }
  | { type: 'review'; original: string; rewritten: string; target: Node; offset: number }

export default function InlineRewrite({ children, context, part, companyName }: InlineRewriteProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<RewriteState>({ type: 'idle' })
  const [instruction, setInstruction] = useState('')
  const [error, setError] = useState('')

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setState({ type: 'idle' })
      return
    }

    const range = selection.getRangeAt(0)
    const container = containerRef.current
    if (!container || !container.contains(range.commonAncestorContainer)) {
      setState({ type: 'idle' })
      return
    }

    const text = selection.toString().trim()
    if (text.length < 3) {
      setState({ type: 'idle' })
      return
    }

    const rect = range.getBoundingClientRect()
    setState({ type: 'selecting', text, rect })
    setError('')
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('mouseup', handleMouseUp)
    return () => container.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseUp])

  const handleRewrite = async () => {
    if (state.type !== 'prompting' && state.type !== 'selecting') return
    const text = state.type === 'prompting' ? state.text : state.text
    const instr = instruction.trim() || 'Improve this text'

    // Store range info before async call (selection may be lost)
    const selection = window.getSelection()
    let targetNode: Node | null = null
    let targetOffset = 0
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      targetNode = range.startContainer
      targetOffset = range.startOffset
    }

    setState({ type: 'rewriting', text, instruction: instr })

    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedText: text,
          instruction: instr,
          context: context.slice(0, 3000),
          part,
          company: companyName || 'a prospect',
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Rewrite failed')
      }

      const data = await res.json()
      setState({
        type: 'review',
        original: text,
        rewritten: data.rewritten,
        target: targetNode || document.createTextNode(''),
        offset: targetOffset,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rewrite')
      setState({ type: 'idle' })
    }
  }

  const acceptRewrite = () => {
    if (state.type !== 'review') return
    const selection = window.getSelection()
    if (!selection) return

    // Try to find and replace the original text in the DOM
    const walker = document.createTreeWalker(
      containerRef.current!,
      NodeFilter.SHOW_TEXT,
      null
    )

    let node: Node | null
    while ((node = walker.nextNode())) {
      const idx = node.textContent?.indexOf(state.original)
      if (idx !== undefined && idx >= 0) {
        const textNode = node as Text
        const before = textNode.textContent!.slice(0, idx)
        const after = textNode.textContent!.slice(idx + state.original.length)
        const parent = textNode.parentNode!

        if (before) parent.insertBefore(document.createTextNode(before), textNode)
        const newSpan = document.createElement('span')
        newSpan.textContent = state.rewritten
        newSpan.className = 'inline-rewrite-accepted'
        parent.insertBefore(newSpan, textNode)
        if (after) parent.insertBefore(document.createTextNode(after), textNode)
        parent.removeChild(textNode)

        break
      }
    }

    setState({ type: 'idle' })
    setInstruction('')
  }

  const rejectRewrite = () => {
    setState({ type: 'idle' })
    setInstruction('')
  }

  const toolbarPos = () => {
    let rect: DOMRect | undefined
    if (state.type === 'selecting' || state.type === 'prompting') {
      rect = state.rect
    }
    if (!rect) return { top: 0, left: 0 }
    const containerRect = containerRef.current?.getBoundingClientRect()
    const top = rect.bottom - (containerRect?.top ?? 0) + 8
    const left = Math.min(
      rect.left - (containerRect?.left ?? 0),
      (containerRef.current?.clientWidth ?? 300) - 280
    )
    return { top, left: Math.max(0, left) }
  }

  return (
    <div ref={containerRef} className="relative">
      {children}

      <AnimatePresence>
        {(state.type === 'selecting' || state.type === 'prompting') && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50"
            style={{ ...toolbarPos() }}
          >
            {state.type === 'selecting' ? (
              <div className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl px-3 py-2 shadow-xl border border-gray-800 dark:border-gray-200"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                <span className="text-xs font-medium pr-1">Rewrite with AI</span>
                <button
                  onClick={() => setState({ type: 'prompting', text: state.text, rect: state.rect })}
                  className="ml-1 p-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 dark:text-emerald-600 transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setState({ type: 'idle' })}
                  className="p-1 rounded-lg hover:bg-white/10 dark:hover:bg-black/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="w-[280px] bg-gray-900 dark:bg-white rounded-xl shadow-xl border border-gray-800 dark:border-gray-200 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Wand2 className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                  <span className="text-[11px] font-semibold text-white dark:text-gray-900">Ask AI to rewrite</span>
                </div>
                <input
                  autoFocus
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRewrite()
                    if (e.key === 'Escape') setState({ type: 'idle' })
                  }}
                  placeholder="e.g., Make it sharper, shorter, warmer..."
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 border border-gray-700 dark:border-gray-200 focus:outline-none focus:border-emerald-500 mb-2"
                />
                <div className="flex items-center justify-between">
                  {error && (
                    <span className="text-[10px] text-red-400 dark:text-red-500">{error}</span>
                  )}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      onClick={() => setState({ type: 'idle' })}
                      className="text-[11px] text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-700 px-2 py-1 rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRewrite}
                      className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-500 hover:bg-emerald-400 text-white px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Wand2 className="w-3 h-3" />
                      Rewrite
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.type === 'review' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={rejectRewrite}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#1e1e1e] shadow-2xl max-w-lg w-full p-6"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                AI Rewrite
              </h3>

              <div className="space-y-3 mb-5">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-[#555] uppercase tracking-wider mb-1">Original</p>
                  <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#111] rounded-lg p-3 border border-gray-100 dark:border-[#1e1e1e] line-through opacity-60">
                    {state.original}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Rewritten</p>
                  <div className="text-xs text-gray-900 dark:text-white bg-emerald-50 dark:bg-emerald-500/5 rounded-lg p-3 border border-emerald-100 dark:border-emerald-500/15">
                    {state.rewritten}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={rejectRewrite}
                  className="flex-1 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-[#1e1e1e] rounded-lg transition-colors"
                >
                  <X className="w-3 h-3 inline mr-1" />
                  Reject
                </button>
                <button
                  onClick={acceptRewrite}
                  className="flex-1 px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors"
                >
                  <Check className="w-3 h-3 inline mr-1" />
                  Accept
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
