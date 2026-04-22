/**
 * Research pipeline — multi-source company intelligence.
 *
 * Sources:
 *   1. Jina Reader (primary) — website content
 *   2. Tavily (parallel queries) — business model, tech stack, executive context
 *   3. LinkedIn company page — supplementary metadata
 *   4. ERP Experts site cache — injected into prompts for current service context
 */

// ── ERP Detection ──────────────────────────────────────────────────────────────

export interface ErpDetection {
  hasErp: boolean
  erpName: string | null
  isNetSuite: boolean
  confidence: 'high' | 'medium' | 'low'
}

const ERP_PATTERNS: Array<{ name: string; keywords: string[]; isNetSuite: boolean }> = [
  { name: 'NetSuite', keywords: ['netsuite', 'net suite', 'oracle netsuite'], isNetSuite: true },
  { name: 'SAP', keywords: ['sap', 'sap business one', 'sap b1', 's/4hana'], isNetSuite: false },
  { name: 'Microsoft Dynamics', keywords: ['dynamics', 'business central', 'd365', 'dynamics 365', 'nav', 'ax'], isNetSuite: false },
  { name: 'Sage', keywords: ['sage 200', 'sage x3', 'sage intacct', 'sage 50', 'sage line 50'], isNetSuite: false },
  { name: 'Epicor', keywords: ['epicor'], isNetSuite: false },
  { name: 'Acumatica', keywords: ['acumatica'], isNetSuite: false },
  { name: 'Odoo', keywords: ['odoo', 'openerp'], isNetSuite: false },
  { name: 'Workday', keywords: ['workday'], isNetSuite: false },
  { name: 'Oracle ERP', keywords: ['oracle erp', 'oracle fusion', 'e-business suite'], isNetSuite: false },
  { name: 'Infor', keywords: ['infor', 'm3', 'ln'], isNetSuite: false },
  { name: 'QuickBooks', keywords: ['quickbooks', 'quick books'], isNetSuite: false },
  { name: 'Xero', keywords: ['xero'], isNetSuite: false },
]

export function detectExistingErp(text: string): ErpDetection {
  const lower = text.toLowerCase()
  let bestMatch: { name: string; count: number; isNetSuite: boolean } | null = null

  for (const { name, keywords, isNetSuite } of ERP_PATTERNS) {
    const count = keywords.filter((k) => lower.includes(k)).length
    if (count > 0) {
      if (!bestMatch || count > bestMatch.count) {
        bestMatch = { name, count, isNetSuite }
      }
    }
  }

  if (!bestMatch) {
    return { hasErp: false, erpName: null, isNetSuite: false, confidence: 'low' }
  }

  return {
    hasErp: true,
    erpName: bestMatch.name,
    isNetSuite: bestMatch.isNetSuite,
    confidence: bestMatch.count >= 2 ? 'high' : 'medium',
  }
}

// ── ERP Experts site cache ────────────────────────────────────────────────────

let _erpExpertsCache: string | null = null
let _erpExpertsCacheTime = 0
const CACHE_TTL_MS = 1000 * 60 * 60 // 1 hour

async function fetchErpExpertsContext(): Promise<string> {
  const now = Date.now()
  if (_erpExpertsCache && now - _erpExpertsCacheTime < CACHE_TTL_MS) {
    return _erpExpertsCache
  }

  try {
    const res = await fetch('https://r.jina.ai/https://www.erpexperts.co.uk', {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'markdown' },
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) {
      const text = await res.text()
      const trimmed = text.slice(0, 4000)
      _erpExpertsCache = trimmed
      _erpExpertsCacheTime = now
      return trimmed
    }
  } catch {
    // Fallback
  }

  const fallback = `ERP Experts is a UK-based NetSuite implementation consultancy founded by Ric Wilson. 21+ years NetSuite experience. 350+ completed projects. Zero abandoned implementations. Services: NetSuite implementation, rescue/health-check, optimisation, SuiteScript development, OneWorld multi-entity, Advanced Manufacturing, SuiteProjects, custom reporting, integration development. Fixed-price delivery. UK-based aftercare.`
  _erpExpertsCache = fallback
  _erpExpertsCacheTime = now
  return fallback
}

// ── Tavily multi-query search ──────────────────────────────────────────────────

interface TavilyResult {
  title: string
  content: string
  url: string
}

async function tavilySearch(apiKey: string, query: string, maxResults = 5): Promise<TavilyResult[]> {
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: maxResults,
        include_answer: false,
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data = (await res.json()) as { results?: TavilyResult[] }
    return data.results ?? []
  } catch {
    return []
  }
}

// ── Main research fetcher ─────────────────────────────────────────────────────

export interface ResearchResult {
  text: string
  erpDetection: ErpDetection
  erpExpertsContext: string
}

export async function fetchResearch(url: string, company: string): Promise<ResearchResult> {
  const parts: string[] = []

  // Primary: Jina Reader
  try {
    if (!url) throw new Error('No URL')
    const jinaUrl = `https://r.jina.ai/${url}`
    const res = await fetch(jinaUrl, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'markdown' },
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) {
      const text = await res.text()
      if (text && text.length > 100) {
        parts.push(`=== Website content (${url}) ===\n${text.slice(0, 12000)}`)
      }
    }
  } catch {
    // Jina failed — continue
  }

  // Supplement: Tavily multi-query (parallel)
  const tavilyKey = process.env.TAVILY_API_KEY
  let tavilySnippets = ''
  if (tavilyKey) {
    const queries = [
      `${company} company business model revenue products services`,
      `${company} ERP software systems technology stack accounting`,
      `${company} operations finance logistics warehouse inventory`,
    ]
    const results = await Promise.all(
      queries.map((q) => tavilySearch(tavilyKey, q, 3))
    )
    const all = results.flat()
    const deduped = Array.from(
      new Map(all.map((r) => [`${r.title}|${r.content.slice(0, 80)}`, r])).values()
    )
    const snippets = deduped
      .map((r) => `${r.title}\n${r.content}`)
      .join('\n\n')
    if (snippets) {
      tavilySnippets = `=== Web search results for "${company}" ===\n${snippets.slice(0, 6000)}`
      parts.push(tavilySnippets)
    }
  }

  // LinkedIn company page attempt
  try {
    const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const liUrl = `https://r.jina.ai/https://www.linkedin.com/company/${slug}/about`
    const res = await fetch(liUrl, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'markdown' },
      signal: AbortSignal.timeout(6000),
    })
    if (res.ok) {
      const text = await res.text()
      if (text && text.length > 200 && !text.includes('page not found')) {
        parts.push(`=== LinkedIn company page ===\n${text.slice(0, 3000)}`)
      }
    }
  } catch {
    // LinkedIn may fail — non-critical
  }

  const combined = parts.length > 0 ? parts.join('\n\n') : `No web content could be retrieved for ${company} (${url}). Use business inference based on the company name, URL structure, and any domain knowledge. Do not invent facts — infer carefully.`

  const erpDetection = detectExistingErp(combined)
  const erpExpertsContext = await fetchErpExpertsContext()

  return { text: combined, erpDetection, erpExpertsContext }
}
