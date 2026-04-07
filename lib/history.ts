export type PackStatus = 'sent' | 'responded' | 'meeting' | 'not_interested'

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
