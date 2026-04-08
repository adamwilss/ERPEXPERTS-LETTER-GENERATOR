import { create } from 'zustand'
import type { Lead, ReviewedLead } from '@/components/LeadReview'
import type { PackStatus } from '@/components/BatchOutput'
import { savePack } from '@/lib/history'

// ── Types ─────────────────────────────────────────────────────────────────────

export type Phase = 'form' | 'streaming' | 'results' | 'generating' | 'done'

export interface SearchParams {
  industry: string
  employeeRange: string
  location: string
  keywords: string
}

interface DiscoverState {
  // Session state
  phase: Phase
  leads: Lead[]
  totalSearched: number
  streamStatus: string
  streamProgress: { done: number; total: number }
  searchError: string | null
  packs: PackStatus[]
  activePreset: string | null

  // Form state (persisted so custom search fields survive navigation)
  industry: string
  employeeRange: string
  location: string
  keywords: string
  showCustom: boolean

  // Actions
  startSearch: (params: SearchParams, preset?: string) => Promise<void>
  startGeneration: (leads: ReviewedLead[]) => Promise<void>
  reset: () => void
  setFormField: <K extends 'industry' | 'employeeRange' | 'location' | 'keywords'>(
    field: K,
    value: string
  ) => void
  setShowCustom: (v: boolean) => void
}

// ── Store ──────────────────────────────────────────────────────────────────────

const INITIAL_FORM = {
  industry: 'Manufacturing',
  employeeRange: '51,200',
  location: 'United Kingdom',
  keywords: '',
  showCustom: false,
}

const INITIAL_SESSION = {
  phase: 'form' as Phase,
  leads: [] as Lead[],
  totalSearched: 0,
  streamStatus: '',
  streamProgress: { done: 0, total: 30 },
  searchError: null as string | null,
  packs: [] as PackStatus[],
  activePreset: null as string | null,
}

export const useDiscoverStore = create<DiscoverState>((set, get) => ({
  ...INITIAL_SESSION,
  ...INITIAL_FORM,

  setFormField: (field, value) => set({ [field]: value }),
  setShowCustom: (v) => set({ showCustom: v }),

  reset: () => set({ ...INITIAL_SESSION }),

  // ── Search ────────────────────────────────────────────────────────────────
  // Runs entirely in the store — survives component unmount / navigation.

  startSearch: async (params, preset) => {
    set({
      searchError: null,
      leads: [],
      totalSearched: 0,
      streamStatus: 'Searching Apollo…',
      streamProgress: { done: 0, total: 30 },
      phase: 'streaming',
      activePreset: preset ?? null,
    })

    try {
      const res = await fetch('/api/discover-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      if (!res.ok || !res.body) {
        let msg = `Search failed (HTTP ${res.status})`
        try {
          const b = await res.json()
          msg = b.error ?? msg
        } catch {}
        throw new Error(msg)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          let event: Record<string, unknown>
          try {
            event = JSON.parse(line)
          } catch {
            continue
          }

          if (event.type === 'status') {
            set({ streamStatus: event.message as string })
            if (event.total)
              set((s) => ({ streamProgress: { ...s.streamProgress, total: event.total as number } }))
          } else if (event.type === 'lead') {
            set((s) => ({
              leads: [...s.leads, event.lead as Lead],
              streamProgress: { done: event.count as number, total: event.total as number },
            }))
          } else if (event.type === 'done') {
            set({ totalSearched: (event.total as number) * 4, phase: 'results' })
          } else if (event.type === 'error') {
            throw new Error(event.message as string)
          }
        }
      }

      // If stream ended without a 'done' event
      if (get().phase === 'streaming') set({ phase: 'results' })
    } catch (err) {
      set({
        searchError: err instanceof Error ? err.message : 'Something went wrong',
        phase: 'form',
      })
    }
  },

  // ── Generation ────────────────────────────────────────────────────────────
  // Also runs in the store so batch generation survives navigation.

  startGeneration: async (approvedLeads) => {
    const initialPacks: PackStatus[] = approvedLeads.map((l) => ({
      company: l.company,
      status: 'pending',
      recipientName: l.recipientName || l.contactName,
      contactTitle: l.contactTitle,
      erpScore: l.erpScore,
      website: l.website,
      location: l.location,
    }))

    set({ packs: initialPacks, phase: 'generating' })

    const results = [...initialPacks]

    for (let i = 0; i < approvedLeads.length; i++) {
      const lead = approvedLeads[i]
      results[i] = { ...results[i], status: 'generating' }
      set({ packs: [...results] })

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company: lead.company,
            url: lead.website || '',
            recipientName: lead.recipientName || lead.contactTitle,
            jobTitle: lead.contactTitle,
            postalAddress: lead.postalAddress || '',
            industry: lead.industry,
            notes: `Size: ${lead.employees}. ${lead.description}`.slice(0, 400),
          }),
        })
        if (!res.ok) throw new Error(await res.text())

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let completion = ''

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            completion += decoder.decode(value, { stream: true })
            results[i] = { ...results[i], status: 'generating', completion }
            set({ packs: [...results] })
          }
        }

        results[i] = { ...results[i], status: 'done', completion }

        // Save to history immediately (no React dependency)
        if (completion) {
          savePack({
            company: lead.company,
            recipientName: lead.recipientName ?? '',
            contactTitle: lead.contactTitle ?? '',
            completion,
            erpScore: lead.erpScore,
            website: lead.website,
            location: lead.location,
          })
        }
      } catch (err) {
        results[i] = {
          ...results[i],
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed',
        }
      }

      set({ packs: [...results] })
    }

    set({ phase: 'done' })
  },
}))
