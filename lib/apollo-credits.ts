/**
 * Apollo credit tracking utility.
 *
 * Apollo.io $59 plan = 1,000 credits/month.
 * Each discover search uses roughly:
 *   - 2 page fetches (companies) = ~2 credits
 *   - Up to 60 enrichments (orgs) = ~60 credits
 *   - Up to 60 contact searches = ~60 credits
 *   ≈ 122 credits per full discover search
 *
 * We round to 100 for a conservative estimate.
 */

const STORAGE_KEY = 'apollo_credits'
const MONTHLY_CREDITS = 1000
const CREDITS_PER_SEARCH = 100

interface CreditState {
  month: string // YYYY-MM
  used: number
}

function getMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getState(): CreditState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const state = JSON.parse(raw) as CreditState
      if (state.month === getMonthKey()) return state
    }
  } catch {
    // ignore
  }
  return { month: getMonthKey(), used: 0 }
}

function setState(state: CreditState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getApolloCredits(): { used: number; remaining: number; total: number; percentUsed: number } {
  const state = getState()
  const remaining = Math.max(0, MONTHLY_CREDITS - state.used)
  return {
    used: state.used,
    remaining,
    total: MONTHLY_CREDITS,
    percentUsed: Math.min(100, (state.used / MONTHLY_CREDITS) * 100),
  }
}

export function recordApolloSearch(creditCount: number = CREDITS_PER_SEARCH) {
  const state = getState()
  state.used += creditCount
  setState(state)
  return getApolloCredits()
}

export function resetApolloCredits() {
  setState({ month: getMonthKey(), used: 0 })
}

/** Listen for credit updates across tabs */
export function subscribeToCredits(callback: (credits: ReturnType<typeof getApolloCredits>) => void) {
  const handler = () => {
    callback(getApolloCredits())
  }
  window.addEventListener('apollo-credits-updated', handler)
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) handler()
  })
  return () => {
    window.removeEventListener('apollo-credits-updated', handler)
    window.removeEventListener('storage', handler)
  }
}

export function dispatchCreditUpdate() {
  window.dispatchEvent(new CustomEvent('apollo-credits-updated'))
}
