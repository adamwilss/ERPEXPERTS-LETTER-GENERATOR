import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { buildVariantBody, APOLLO_VARIANTS } from '@/lib/apollo-variants'

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

type RawLead = Omit<StreamedLead, 'dataScore' | 'rank'>

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
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.warn(`[Apollo people] HTTP ${res.status} | body: ${JSON.stringify(body)} | response: ${errText.slice(0, 300)}`)
      return []
    }
    const data = await res.json()
    const people: ApolloPerson[] = data.contacts ?? data.people ?? data.results ?? []
    console.log(`[Apollo people] ${people.length} result(s) | keys: ${Object.keys(data).join(', ')} | query: ${JSON.stringify(body)}`)
    if (people.length > 0) {
      const sample = people[0]
      console.log(`[Apollo people] sample — name: ${sample.name ?? 'null'}, title: ${sample.title ?? 'null'}, email: ${sample.email ?? 'null'}, seniority: ${sample.seniority ?? 'null'}`)
    }
    return people
  } catch (err) {
    console.error(`[Apollo people] exception: ${err} | query: ${JSON.stringify(body)}`)
    return []
  }
}

function pickBest(people: ApolloPerson[]): ApolloPerson | null {
  if (!people.length) return null
  return people.sort((a, b) =>
    (SENIORITY_RANK[b.seniority ?? ''] ?? 0) - (SENIORITY_RANK[a.seniority ?? ''] ?? 0)
  )[0]
}

async function findContact(key: string, domain: string, orgId?: string): Promise<ApolloPerson | null> {
  const seniority = ['c_suite', 'owner', 'founder', 'partner', 'vp', 'director']

  const byDomain = await apolloPeopleSearch(key, { organization_domains: [domain], person_seniority: seniority, per_page: 5 })
  if (byDomain.length) return pickBest(byDomain)

  if (orgId) {
    const byId = await apolloPeopleSearch(key, { organization_ids: [orgId], person_seniority: seniority, per_page: 5 })
    if (byId.length) return pickBest(byId)
  }

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

// Data completeness score
function computeDataScore(lead: Partial<StreamedLead>): number {
  if (!lead.contactName) return 0
  let s = 35
  if (lead.contactEmail) s += 30
  if (lead.postalAddress && /\d/.test(lead.postalAddress)) s += 35
  return s
}

function preScore(org: ApolloOrg): number {
  let s = 0
  const desc = org.short_description || org.seo_description || ''
  if (desc.length > 80) s += 20
  else if (desc.length > 30) s += 10
  if (org.annual_revenue_printed) s += 15
  if (org.estimated_num_employees) s += 10
  if (org.linkedin_url) s += 10
  if (org.phone) s += 8
  if (org.city) s += 7
  if (org.technology_names?.length) s += 5
  if (org.founded_year) s += 5
  return s
}

function computeErpScore(org: ApolloOrg): number {
  const emp = org.estimated_num_employees ?? 0
  const techCount = org.technology_names?.length ?? 0
  const text = `${org.short_description ?? ''} ${org.seo_description ?? ''} ${org.industry ?? ''} ${org.keywords?.join(' ') ?? ''}`.toLowerCase()

  const erpKeywords = [
    'ecommerce', 'e-commerce', 'online store', 'shopify', 'woocommerce',
    'distribution', 'wholesale', 'manufacturing', 'fabrication',
    'inventory', 'stock', 'warehouse', 'fulfilment', 'fulfillment',
    'multi-site', 'multiple locations', 'international', 'global', 'export', 'import',
    'logistics', 'supply chain', 'procurement', '3pl',
    'retail', 'trade', 'omnichannel',
    'field service', 'construction', 'professional services', 'project-based', 'job costing',
    'multi-currency', 'cross-border',
  ]
  const hits = erpKeywords.filter(k => text.includes(k)).length
  const keywordScore = Math.min(40, hits * 6)

  let sizeScore = 0
  if (emp >= 100 && emp <= 249) sizeScore = 25
  else if (emp >= 50 && emp < 100) sizeScore = 22
  else if (emp >= 250 && emp < 500) sizeScore = 16
  else if (emp >= 30 && emp < 50) sizeScore = 16
  else if (emp >= 500 && emp < 1000) sizeScore = 8
  else if (emp >= 15 && emp < 30) sizeScore = 10
  else if (emp >= 5 && emp < 15) sizeScore = 5
  else if (emp >= 1000) sizeScore = 3
  else if (emp > 0) sizeScore = 2

  let techScore = 0
  if (techCount >= 10) techScore = 20
  else if (techCount >= 7) techScore = 16
  else if (techCount >= 4) techScore = 11
  else if (techCount >= 2) techScore = 6
  else if (techCount >= 1) techScore = 3

  const revenueScore = org.annual_revenue_printed ? 15 : 0

  return Math.min(100, keywordScore + sizeScore + techScore + revenueScore)
}

function defaultContactTitle(industry: string): string {
  const i = industry.toLowerCase()
  if (i.includes('finance') || i.includes('accounting')) return 'Finance Director'
  if (i.includes('technology') || i.includes('software')) return 'CEO'
  if (i.includes('manufacturing') || i.includes('distribution') || i.includes('logistics')) return 'Operations Director'
  if (i.includes('retail') || i.includes('ecommerce')) return 'Managing Director'
  if (i.includes('construction') || i.includes('field')) return 'Managing Director'
  return 'Managing Director'
}

function classifyLead(lead: RawLead): 'complete' | 'partial' | 'sparse' {
  const hasName = Boolean(lead.contactName)
  const hasEmail = Boolean(lead.contactEmail)
  const hasAddress = Boolean(lead.postalAddress && /\d/.test(lead.postalAddress))
  if (hasName && hasEmail && hasAddress) return 'complete'
  if (hasName) return 'partial'
  return 'sparse'
}

async function rankLeadsWithGPT(
  leads: RawLead[],
  openaiKey: string
): Promise<Array<{ lead: RawLead; rationale: string }>> {
  if (leads.length === 0) return []
  if (leads.length === 1) {
    const l = leads[0]
    return [{ lead: l, rationale: l.description.slice(0, 160) || `${l.industry} company, ${l.employees} employees` }]
  }

  const openai = createOpenAI({ apiKey: openaiKey })

  const summaries = leads
    .map((l, i) => {
      const tech = l.techStack?.slice(0, 5).join(', ') || ''
      const rev = l.annualRevenue ? ` | Revenue: ${l.annualRevenue}` : ''
      const techLine = tech ? ` | Tech: ${tech}` : ''
      const desc = (l.description || 'No description').slice(0, 180)
      return `${i + 1}. ${l.company} | ${l.employees} employees | ${l.location ?? 'UK'}${rev}${techLine}\n   ${desc}`
    })
    .join('\n\n')

  const prompt = `You are ranking ${leads.length} UK companies for a NetSuite ERP implementation firm. Rank them by operational complexity and ERP pain signals. Multi-site, international, complex inventory, disconnected tech stacks, and revenue scale are the strongest signals. You MUST differentiate — the top company should score noticeably better than the bottom.

Return ONLY valid JSON (no markdown wrapping):
{"ranked":[{"index":1,"rationale":"Two specific sentences about this company's operational complexity and why they need ERP."},...]}

List all ${leads.length} companies in order, best prospect first.

${summaries}`

  try {
    const { text } = await generateText({
      model: openai('gpt-4o'),
      maxOutputTokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    let parsed: { ranked: Array<{ index: number; rationale: string }> }
    try {
      parsed = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('unparseable')
      parsed = JSON.parse(match[0])
    }

    return parsed.ranked
      .map(({ index, rationale }) => {
        const lead = leads[index - 1]
        return lead ? { lead, rationale } : null
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  } catch {
    return [...leads]
      .sort((a, b) => b.erpScore - a.erpScore)
      .map((lead) => ({
        lead,
        rationale: lead.description.slice(0, 160) || `${lead.industry} company, ${lead.employees} employees`,
      }))
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

  const baseBody: Record<string, unknown> = {
    organization_locations: [location],
    organization_num_employees_ranges: [employeeRange],
  }

  // Add user keywords
  const userKeywords = keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
  if (userKeywords.length > 0) {
    baseBody.q_organization_keyword_tags = userKeywords
  }

  // ── VARIANT ROTATION ─────────────────────────────────────────────────────────
  const variantIndex = Math.floor(Math.random() * APOLLO_VARIANTS)
  const { body: apolloBody, label: variantLabel } = buildVariantBody(
    industry,
    variantIndex,
    baseBody
  )

  console.log(`[Apollo Search] Variant: ${variantLabel} | Keywords: ${(apolloBody.q_organization_keyword_tags as string[])?.join(', ') ?? 'none'}`)
  console.log('[Apollo Search] Full body:', JSON.stringify(apolloBody, null, 2))

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try { controller.enqueue(encoder.encode(JSON.stringify(data) + '\n')) } catch {}
      }

      try {
        // Phase 1a: Apollo search (2 pages for more raw material)
        send({ type: 'status', message: `Searching Apollo (${variantLabel})…` })
        const [r1, r2] = await Promise.all([
          fetchApolloPage(apolloKey, apolloBody, 1),
          fetchApolloPage(apolloKey, apolloBody, 2),
        ])

        if (r1.error && r2.error) {
          send({ type: 'error', message: `Apollo search failed: ${r1.error}` })
          controller.close()
          return
        }

        const seen = new Set<string>()
        const allOrgs: ApolloOrg[] = []
        for (const org of [...(r1.orgs ?? []), ...(r2.orgs ?? [])]) {
          if (!org.name || !getDomain(org)) continue
          const key = org.id ?? org.name
          if (seen.has(key)) continue
          seen.add(key)
          allOrgs.push(org)
        }

        if (allOrgs.length === 0) {
          send({ type: 'error', message: 'No companies found. Try different criteria.' })
          controller.close()
          return
        }

        // Phase 1b: Pre-sort by org data richness, enrich top 15 (up from 5)
        const candidates = allOrgs
          .sort((a, b) => preScore(b) - preScore(a))
          .slice(0, 15)

        send({ type: 'status', message: `Found ${allOrgs.length} companies — enriching ${candidates.length}…`, total: candidates.length })

        // Phase 1c: Enrich + contact lookup for all candidates in parallel
        const complete: RawLead[] = []
        const partial: RawLead[] = []
        const sparse: RawLead[] = []

        await Promise.all(
          candidates.map(async (org) => {
            const domain = getDomain(org)!
            const [enriched, contact] = await Promise.all([
              enrichOrg(apolloKey, domain),
              findContact(apolloKey, domain, org.id),
            ])

            const merged: ApolloOrg = {
              ...org,
              ...Object.fromEntries(Object.entries(enriched).filter(([, v]) => v != null && v !== '')),
            }

            const loc = [merged.city, merged.state, merged.country].filter(Boolean).join(', ') || undefined
            const postalAddress = buildAddress(merged, contact?.organization)
            const erpScore = computeErpScore(merged)
            const desc = merged.short_description || merged.seo_description || ''

            const lead: RawLead = {
              company: merged.name ?? org.name ?? 'Unknown',
              website: merged.website_url ?? merged.primary_domain ?? domain,
              industry: merged.industry ?? org.industry ?? industry,
              employees: merged.estimated_num_employees ? `~${merged.estimated_num_employees}` : 'Unknown',
              description: desc,
              erpScore,
              rationale: desc.length > 40 ? desc.slice(0, 160) : `${merged.industry ?? industry} company, ${merged.estimated_num_employees ?? '?'} employees`,
              contactTitle: contact?.title ?? defaultContactTitle(merged.industry ?? industry),
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

            const bucket = classifyLead(lead)
            if (bucket === 'complete') complete.push(lead)
            else if (bucket === 'partial') partial.push(lead)
            else sparse.push(lead)
          })
        )

        send({
          type: 'status',
          message: `Enriched ${candidates.length} — ${complete.length} ready · ${partial.length} partial · AI ranking…`,
        })

        // Phase 2: AI ranks ALL leads by operational complexity.
        const allLeadsForRanking = [
          ...complete,
          ...partial.sort((a, b) => b.erpScore - a.erpScore),
          ...sparse.sort((a, b) => b.erpScore - a.erpScore),
        ].slice(0, 30)

        const rankedAll = await rankLeadsWithGPT(allLeadsForRanking, openaiKey)

        // Phase 3: Stream in GPT-ranked order
        let count = 0
        const totalToStream = rankedAll.length
        send({ type: 'status', message: 'Streaming results…', total: totalToStream })

        for (const { lead, rationale } of rankedAll) {
          count++
          send({
            type: 'lead',
            lead: { ...lead, rank: count, rationale, dataScore: computeDataScore(lead) } as StreamedLead,
            count,
            total: totalToStream,
          })
        }

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
