// ── Follow-up Reminders ────────────────────────────────────────────────────────
// Storage: localStorage 'erp_reminders'

export interface Reminder {
  id: string
  packId: string
  company: string
  recipientName: string
  dueDate: string // ISO date
  type: 'followup1' | 'followup2' | 'breakup' | 'custom'
  status: 'pending' | 'completed' | 'dismissed' | 'snoozed'
  suggestedAction: string // AI-generated suggestion
  notes?: string
  createdAt: string
}

const KEY = 'erp_reminders'

export function loadReminders(): Reminder[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function createReminder(
  reminder: Omit<Reminder, 'id' | 'createdAt' | 'status'>
): Reminder {
  const saved: Reminder = {
    ...reminder,
    id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  const reminders = loadReminders()
  const updated = [saved, ...reminders]
  localStorage.setItem(KEY, JSON.stringify(updated))
  return saved
}

export function updateReminderStatus(
  id: string,
  status: Reminder['status']
): void {
  const updated = loadReminders().map((r) =>
    r.id === id ? { ...r, status } : r
  )
  localStorage.setItem(KEY, JSON.stringify(updated))
}

export function snoozeReminder(id: string, days: number): void {
  const reminder = loadReminders().find((r) => r.id === id)
  if (!reminder) return

  const newDueDate = new Date(reminder.dueDate)
  newDueDate.setDate(newDueDate.getDate() + days)

  const updated = loadReminders().map((r) =>
    r.id === id
      ? { ...r, dueDate: newDueDate.toISOString(), status: 'snoozed' as const }
      : r
  )
  localStorage.setItem(KEY, JSON.stringify(updated))
}

export function deleteReminder(id: string): void {
  const updated = loadReminders().filter((r) => r.id !== id)
  localStorage.setItem(KEY, JSON.stringify(updated))
}

export function getPendingReminders(): Reminder[] {
  const now = new Date().toISOString()
  return loadReminders()
    .filter((r) => r.status === 'pending' || r.status === 'snoozed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
}

export function getOverdueReminders(): Reminder[] {
  const now = new Date().toISOString()
  return loadReminders().filter(
    (r) =>
      (r.status === 'pending' || r.status === 'snoozed') && r.dueDate < now
  )
}

export function getRemindersForPack(packId: string): Reminder[] {
  return loadReminders()
    .filter((r) => r.packId === packId)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
}

export function getReminderCount(): number {
  return getPendingReminders().length
}

// Auto-create follow-up reminders based on sequence stage
export function createFollowupReminder(
  packId: string,
  company: string,
  recipientName: string,
  type: 'followup1' | 'followup2' | 'breakup',
  industry?: string
): Reminder {
  const daysFromNow = type === 'followup1' ? 7 : type === 'followup2' ? 14 : 21
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + daysFromNow)

  const suggestions: Record<typeof type, string> = {
    followup1: `Send first follow-up email. Suggested angle: share a relevant ${industry ?? 'industry'} case study or mention a recent company milestone.`,
    followup2: `Send second follow-up. Keep it brief — acknowledge they may be busy and offer a specific time slot for a call.`,
    breakup: `Send final "breakup" email. Leave a positive impression with a helpful resource.`,
  }

  return createReminder({
    packId,
    company,
    recipientName,
    dueDate: dueDate.toISOString(),
    type,
    suggestedAction: suggestions[type],
  })
}

// Get upcoming reminders for next N days
export function getUpcomingReminders(days: number): Reminder[] {
  const now = new Date()
  const future = new Date()
  future.setDate(future.getDate() + days)

  return loadReminders().filter(
    (r) =>
      (r.status === 'pending' || r.status === 'snoozed') &&
      r.dueDate >= now.toISOString() &&
      r.dueDate <= future.toISOString()
  )
}
