import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

export const maxDuration = 90
export const dynamic = 'force-dynamic'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApolloOrg {
  id?: string; name?: string; website_url?: string; primary_domain?: string
  industry?: string; estimated_num_employees?: number; short_description?: string
  seo_description?: string; street_address?: string; city?: string; state?: string
  country?: string; postal_code?: string; raw_address?: string; phone?: string
  founded_year?: number; annual_revenue_printed?: string; linkedin_url?: string
  technology_names?: string[]; keywords?: string[]
}

interface ApolloPerson {
  id?: string; name?: string; title?: string; email?: string; linkedin_url?: string
  organization_id?: string; seniority?: string
  organization?: { raw_address?: string; street_address?: string; city?: string; state?: string; postal_code?: string; country?: string }
}

export interface StreamedLead {
  rank: number; company: string; website: string; industry: string; employees: string
  description: string; erpScore: number; dataScore: number; rationale: string
  contactTitle: string; contactName?: string; contactEmail?: string; contactLinkedIn?: string
  orgId?: string; foundedYear?: number; annualRevenue?: string; techStack?: string[]
  location?: string; phone?: string; linkedinUrl?: string; postalAddress?: string
}

const SENIORITY_RANK: Record<string, number> = {
  c_suite: 7, owner: 6, founder: 6, partner: 5, vp: 4, head: 3, director: 3, manager: 2, senior: 1,
}

// ── Apollo helpers ─────────────────────────────────────────────────────────────

async function fetchApolloPage(key: string, body: Record<string, unknown>, page: number): Promise<{ orgs: ApolloOrg[]; error?: string }> {
  try {
    const res = await fetch('https://api.apollo.io/api/v1/mixed_companies/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', 'x-api-key': key },
      body: JSON.stringify({ ...body, page, per_page: 100 }),
      signal: AbortSignal.timeout(18000),
    })
    if (!res.ok) {
      let detail = ''
      try { const b = await res.json(); detail = b.message ?? b.error ?? '' } catch {}
      return { orgs: [], error: `Apollo HTTP ${res.status}${detail ? `: ${detail}` : ''}` }
    }
    const data = await res.json()
    return { orgs: data.organizations ?? data.accounts ?? [] }
  } catch (e) {
    return { orgs: [], error: e instanceof Error ? e.message : 'Apollo fetch failed' }
  }
}

async function enrichOrg(key: string, domain: string): Promise<Partial<ApolloOrg>> {
  try {
    const res = await fetch(
      `https://api.apollo.io/api/v1/organizations/enrich?domain=${encodeURIComponent(domain)}`,
      { headers: { 'x-api-key': key, 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return {}
    const data = await res.json()
    return data.organization ?? {}
  } catch { return {} }
}

async function apolloPeopleSearch(key: string, body: Record<string, unknown>): Promise<ApolloPerson[]> {
  try {
    const res = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', 'x-api-key': key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.contacts ?? data.people ?? data.results ?? []
  } catch { return [] }
}

function pickBest(people: ApolloPerson[]): ApolloPerson | null {
  if (!people.length) return null
  return people.sort((a, b) =>
    (SENIORITY_RANK[b.seniority ?? ''] ?? 0) - (SENIORITY_RANK[a.seniority ?? ''] ?? 0)
  )[0]
}

async function findContact(key: string, domain: string, orgId?: string): Promise<ApolloPerson | null> {
  const seniority = ['c_suite', 'owner', 'founder', 'partner', 'vp', 'director']

  // Domain search (most reliable)
  const byDomain = await apolloPeopleSearch(key, { organization_domains: [domain], person_seniority: seniority, per_page: 5 })
  if (byDomain.length) return pickBest(byDomain)

  // Org ID fallback
  if (orgId) {
    const byId = await apolloPeopleSearch(key, { organization_ids: [orgId], person_seniority: seniority, per_page: 5 })
    if (byId.length) return pickBest(byId)
  }

  // Broader seniority
  const broader = await apolloPeopleSearch(key, {
    organization_domains: [domain],
    person_seniority: [...seniority, 'manager', 'head'],
    per_page: 5,
  })
  return pickBest(broader)
}

function getDomain(org: ApolloOrg): string | null {
  const raw = org.primary_domain ?? org.website_url ?? ''
  return raw.replace(/^https?:\/\//, '').split('/')[0].split('?')[0] || null
}

function buildAddress(org: ApolloOrg, personOrg?: ApolloPerson['organization']): string | undefined {
  const isReal = (s: string) => /\d/.test(s) && (s.includes('\n') || s.split(',').length >= 3)
  if (org.raw_address && isReal(org.raw_address)) return org.raw_address
  if (personOrg?.raw_address && isReal(personOrg.raw_address)) return personOrg.raw_address
  if (org.street_address) {
    const parts = [org.street_address, org.city, org.state, org.postal_code, org.country !== 'United Kingdom' ? org.country : undefined].filter(Boolean)
    if (parts.length >= 2) return parts.join('\n')
  }
  if (org.city && org.postal_code) return [org.city, org.postal_code, org.country !== 'United Kingdom' ? org.country : 'United Kingdom'].filter(Boolean).join('\n')
  if (org.city && org.country) return [org.city, org.country].join('\n')
  return undefined
}

function computeDataScore(lead: Partial<StreamedLead>): number {
  let s = 0
  if (lead.contactName) s += 35
  if (lead.contactEmail) s += 20
  if (lead.postalAddress && /\d/.test(lead.postalAddress)) s += 20
  else if (lead.postalAddress) s += 5
  if (lead.description && lead.description.length > 60) s += 10
  if (lead.techStack?.length) s += 8
  if (lead.annualRevenue) s += 7
  return Math.min(100, s)
}

// ── GPT scoring ────────────────────────────────────────────────────────────────

async function scoreWithGPT(orgs: ApolloOrg[], industry: string, openaiKey: string) {
  const openai = createOpenAI({ apiKey: openaiKey })

  const summaries = orgs.map((o, i) => {
    const emp = o.estimated_num_employees ? `${o.estimated_num_employees} employees` : 'unknown size'
    const desc = (o.short_description || o.seo_description || 'No description').slice(0, 200)
    const loc = [o.city, o.country].filter(Boolean).join(', ') || 'UK'
    const tech = o.technology_names?.slice(0, 5).join(', ') || ''
    const rev = o.annual_revenue_printed ? ` | Revenue: ${o.annual_revenue_printed}` : ''
    const techLine = tech ? ` | Tech: ${tech}` : ''
    return `${i + 1}. ${o.name} | ${emp} | ${loc}${rev}${techLine}\n   ${desc}`
  }).join('\n\n')

  const prompt = `Rank these UK companies as NetSuite ERP prospects. Industry filter already applied — do NOT penalise by sector. Score 0–100 on OPERATIONAL COMPLEXITY within this batch.

HIGH signals (75–100): multi-channel (ecommerce + trade + B2B), multi-site/international, complex inventory, disconnected tech stack, 150+ employees with operational overhead
MID (40–74): standard single-site operations, some growth complexity, 50–150 employees
LOW (5–39): simple operations, small team, generic description, no operational substance

Compare companies AGAINST EACH OTHER. Force real spread — top company should clearly outscore the bottom.

${summaries}

Return ONLY valid JSON:
{"scores":[{"index":1,"score":85,"rationale":"Two specific sentences about this company's operational complexity.","contactTitle":"Most likely decision-maker title (MD/CEO/CFO/Finance Director/Operations Director/Supply Chain Director)"}]}

Score all ${orgs.length} companies.`

  const { text } = await generateText({
    model: openai('gpt-4o'),
    maxOutputTokens: 5000,
    messages: [{ role: 'user', content: prompt }],
  })

  try {
    const parsed = JSON.parse(text)
    return parsed.scores as Array<{ index: number; score: number; rationale: string; contactTitle: string }>
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return []
    return (JSON.parse(match[0])).scores
  }
}

// ── Main endpoint ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const body = await req.json()
  const { industry, employeeRange, location = 'United Kingdom', keywords = '' } = body

  const apolloKey = process.env.APOLLO_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY
  if (!apolloKey) return new Response('APOLLO_API_KEY not configured', { status: 500 })
  if (!openaiKey) return new Response('OPENAI_API_KEY not configured', { status: 500 })

  const apolloBody: Record<string, unknown> = {
    organization_locations: [location],
    organization_num_employees_ranges: [employeeRange],
  }
  const kw = keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
  if (kw.length) apolloBody.q_organization_keyword_tags = kw

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try { controller.enqueue(encoder.encode(JSON.stringify(data) + '\n')) } catch {}
      }

      try {
        // 1. Fetch companies (2 pages in parallel)
        send({ type: 'status', message: 'Searching Apollo…' })
        const [r1, r2] = await Promise.all([
          fetchApolloPage(apolloKey, apolloBody, 1),
          fetchApolloPage(apolloKey, apolloBody, 2),
        ])

        // Surface Apollo errors immediately
        if (r1.error && r2.error) {
          send({ type: 'error', message: `Apollo search failed: ${r1.error}` })
          controller.close()
          return
        }

        const seen = new Set<string>()
        const allOrgs: ApolloOrg[] = []
        for (const org of [...r1.orgs, ...r2.orgs]) {
          if (!org.name) continue
          const key = org.id ?? org.name
          if (seen.has(key)) continue
          seen.add(key)
          allOrgs.push(org)
        }

        if (allOrgs.length === 0) {
          const apolloErr = r1.error ?? r2.error
          send({ type: 'error', message: apolloErr ? `Apollo error: ${apolloErr}` : 'No companies found. Try different criteria.' })
          controller.close()
          return
        }

        send({ type: 'status', message: `Found ${allOrgs.length} companies — scoring with AI…` })

        // 2. Score all with GPT
        type ScoreRow = { index: number; score: number; rationale: string; contactTitle: string }
        const scores = await scoreWithGPT(allOrgs, industry, openaiKey)
        const top30 = (scores as ScoreRow[])
          .map(({ index, score, rationale, contactTitle }: ScoreRow) => {
            const org = allOrgs[index - 1]
            return org ? { org, score, rationale, contactTitle } : null
          })
          .filter((x): x is NonNullable<typeof x> => x !== null)
          .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
          .slice(0, 30)

        send({ type: 'status', message: `Scored — enriching top ${top30.length} prospects…`, total: top30.length })

        // 3. Enrich + find contact for each — stream as each completes
        let count = 0
        type ScoredOrg = { org: ApolloOrg; score: number; rationale: string; contactTitle: string }
        await Promise.all(
          top30.map(async ({ org, score, rationale, contactTitle }: ScoredOrg, idx: number) => {
            const domain = getDomain(org)
            const [enriched, contact] = await Promise.all([
              domain ? enrichOrg(apolloKey, domain) : Promise.resolve({} as Partial<ApolloOrg>),
              domain ? findContact(apolloKey, domain, org.id) : Promise.resolve(null),
            ])

            const merged: ApolloOrg = {
              ...org,
              ...Object.fromEntries(Object.entries(enriched).filter(([, v]) => v != null && v !== '')),
            }

            const loc = [merged.city, merged.state, merged.country].filter(Boolean).join(', ') || undefined
            const postalAddress = buildAddress(merged, contact?.organization)

            const partial: Omit<StreamedLead, 'dataScore'> = {
              rank: idx + 1,
              company: merged.name ?? org.name ?? 'Unknown',
              website: merged.website_url ?? merged.primary_domain ?? '',
              industry: merged.industry ?? org.industry ?? industry,
              employees: merged.estimated_num_employees ? `~${merged.estimated_num_employees}` : 'Unknown',
              description: merged.short_description || merged.seo_description || '',
              erpScore: score,
              rationale,
              contactTitle: contact?.title ?? contactTitle,
              contactName: contact?.name,
              contactEmail: contact?.email,
              contactLinkedIn: contact?.linkedin_url,
              orgId: merged.id,
              foundedYear: merged.founded_year,
              annualRevenue: merged.annual_revenue_printed,
              techStack: (merged.technology_names ?? org.technology_names)?.slice(0, 8),
              location: loc,
              phone: merged.phone,
              linkedinUrl: merged.linkedin_url,
              postalAddress,
            }

            const lead: StreamedLead = { ...partial, dataScore: computeDataScore(partial) }
            count++
            send({ type: 'lead', lead, count, total: top30.length })
          })
        )

        send({ type: 'done', total: count })
        controller.close()
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : String(err) })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
