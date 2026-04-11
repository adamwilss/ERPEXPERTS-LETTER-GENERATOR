export type PackStatus = 'sent' | 'responded' | 'meeting' | 'not_interested' | 'no_response'

export type SequenceStage = 'pending' | 'generating' | 'ready' | 'sent'

export interface SequenceStatus {
  initial: SequenceStage
  followup1: SequenceStage | 'locked'
  followup2: SequenceStage | 'locked'
  breakup: SequenceStage | 'locked'
}

export interface OutcomeData {
  sentDate?: string
  responseDate?: string
  responseType?: 'positive' | 'neutral' | 'negative'
  meetingBooked?: boolean
  notes?: string
}

export interface SavedPack {
  id: string
  company: string
  recipientName: string
  contactTitle: string
  date: string // ISO string
  completion: string
  erpScore?: number
  website?: string
  location?: string
  status?: PackStatus
  // Sequence tracking
  sequenceStatus?: SequenceStatus
  sequenceContent?: {
    initial?: string
    followup1?: string
    followup2?: string
    breakup?: string
  }
  // Outcome tracking
  outcomes?: OutcomeData
  // Template & testing
  templateId?: string
  variant?: 'A' | 'B'
}

const KEY = 'erp_letter_history'
const MAX = 100

export function loadHistory(): SavedPack[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function savePack(pack: Omit<SavedPack, 'id' | 'date'>): SavedPack {
  const saved: SavedPack = {
    ...pack,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
  }
  const history = loadHistory()
  const today = new Date().toDateString()
  const filtered = history.filter(
    (h) => !(h.company === saved.company && h.recipientName === saved.recipientName && new Date(h.date).toDateString() === today)
  )
  const updated = [saved, ...filtered].slice(0, MAX)
  localStorage.setItem(KEY, JSON.stringify(updated))
  return saved
}

export function updatePackStatus(id: string, status: PackStatus | undefined): void {
  const updated = loadHistory().map((h) => h.id === id ? { ...h, status } : h)
  localStorage.setItem(KEY, JSON.stringify(updated))
}

export function deletePack(id: string): void {
  const updated = loadHistory().filter((h) => h.id !== id)
  localStorage.setItem(KEY, JSON.stringify(updated))
}

export function clearHistory(): void {
  localStorage.removeItem(KEY)
}

// ── Sequence helpers ──────────────────────────────────────────────────────────

const DEFAULT_SEQUENCE_STATUS: SequenceStatus = {
  initial: 'pending',
  followup1: 'locked',
  followup2: 'locked',
  breakup: 'locked',
}

export function initializeSequence(packId: string): void {
  const updated = loadHistory().map((h) =>
    h.id === packId
      ? { ...h, sequenceStatus: DEFAULT_SEQUENCE_STATUS, sequenceContent: {} }
      : h
  )
  localStorage.setItem(KEY, JSON.stringify(updated))
}

export function updateSequenceStatus(
  packId: string,
  stage: keyof SequenceStatus,
  status: SequenceStage | 'locked'
): void {
  const updated = loadHistory().map((h) =>
    h.id === packId
      ? { ...h, sequenceStatus: { ...(h.sequenceStatus ?? DEFAULT_SEQUENCE_STATUS), [stage]: status } }
      : h
  )
  localStorage.setItem(KEY, JSON.stringify(updated))
}

export function updateSequenceContent(
  packId: string,
  stage: keyof NonNullable<SavedPack['sequenceContent']>,
  content: string
): void {
  const updated = loadHistory().map((h) =>
    h.id === packId
      ? {
          ...h,
          sequenceContent: { ...(h.sequenceContent ?? {}), [stage]: content },
        }
      : h
  )
  localStorage.setItem(KEY, JSON.stringify(updated))
}

export function unlockNextStage(packId: string, currentStage: keyof SequenceStatus): void {
  const stageOrder: (keyof SequenceStatus)[] = ['initial', 'followup1', 'followup2', 'breakup']
  const currentIndex = stageOrder.indexOf(currentStage)
  const nextStage = stageOrder[currentIndex + 1]

  if (!nextStage) return

  const updated = loadHistory().map((h) =>
    h.id === packId
      ? {
          ...h,
          sequenceStatus: {
            ...(h.sequenceStatus ?? DEFAULT_SEQUENCE_STATUS),
            [nextStage]: 'pending',
          },
        }
      : h
  )
  localStorage.setItem(KEY, JSON.stringify(updated))
}

// ── Outcome helpers ─────────────────────────────────────────────────────────

export function updatePackOutcome(packId: string, outcome: Partial<OutcomeData>): void {
  const updated = loadHistory().map((h) =>
    h.id === packId
      ? { ...h, outcomes: { ...(h.outcomes ?? {}), ...outcome } }
      : h
  )
  localStorage.setItem(KEY, JSON.stringify(updated))
}

export function markAsSent(packId: string): void {
  const now = new Date().toISOString()
  updatePackStatus(packId, 'sent')
  updatePackOutcome(packId, { sentDate: now })
}

export function recordResponse(
  packId: string,
  type: 'positive' | 'neutral' | 'negative',
  meetingBooked?: boolean,
  notes?: string
): void {
  const now = new Date().toISOString()
  updatePackOutcome(packId, {
    responseDate: now,
    responseType: type,
    meetingBooked,
    notes,
  })
  if (type === 'positive') {
    updatePackStatus(packId, meetingBooked ? 'meeting' : 'responded')
  } else if (type === 'negative') {
    updatePackStatus(packId, 'not_interested')
  } else {
    updatePackStatus(packId, 'responded')
  }
}
