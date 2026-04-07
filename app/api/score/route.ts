import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import type { ApolloOrganization } from '../discover/route'

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const maxDuration = 90

interface ApolloPerson {
  id?: string
  name?: string
  first_name?: string
  last_name?: string
  title?: string
  email?: string
  email_status?: string
  linkedin_url?: string
  organization_id?: string
  seniority?: string
  organization?: {
    raw_address?: string
    street_address?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  }
}

export interface Lead {
  rank: number
  company: string
  website: string
  industry: string
  employees: string
  description: string
  erpScore: number      // GPT: operational complexity/ERP pain signals
  dataScore: number     // Computed: how complete and actionable this lead's data is
  rationale: string
  contactTitle: string
  contactName?: string
  contactEmail?: string
  contactLinkedIn?: string
  orgId?: string
  foundedYear?: number
  annualRevenue?: string
  techStack?: string[]
  location?: string
  phone?: string
  linkedinUrl?: string
  postalAddress?: string
}

const SENIORITY_RANK: Record<string, number> = {
  c_suite: 7, owner: 6, founder: 6, partner: 5, vp: 4, head: 3, director: 3, manager: 2, senior: 1,
}

async function enrichOrg(apolloKey: string, domain: string): Promise<Partial<ApolloOrganization>> {
  try {
    const res = await fetch(
      `https://api.apollo.io/api/v1/organizations/enrich?domain=${encodeURIComponent(domain)}`,
      {
        headers: { 'x-api-key': apolloKey, 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(8000),
      }
    )
    if (!res.ok) return {}
    const data = await res.json()
    return data.organization ?? {}
  } catch {
    return {}
  }
}

function getDomain(org: ApolloOrganization): string | null {
  const raw = org.primary_domain ?? org.website_url ?? ''
  return raw.replace(/^https?:\/\//, '').split('/')[0].split('?')[0] || null
}

async function apolloPeopleSearch(apolloKey: string, body: Record<string, unknown>): Promise<ApolloPerson[]> {
  try {
    const res = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', 'x-api-key': apolloKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) {
      console.error('People search failed:', res.status, await res.text())
      return []
    }
    const data = await res.json()
    const people: ApolloPerson[] = data.contacts ?? data.people ?? data.results ?? []
    console.log(`People search → ${people.length} results (keys: ${Object.keys(data).join(', ')})`)
    return people
  } catch (err) {
    console.error('People search error:', err)
    return []
  }
}

function pickBestContact(people: ApolloPerson[]): ApolloPerson {
  return people.sort((a, b) =>
    (SENIORITY_RANK[b.seniority ?? ''] ?? 0) - (SENIORITY_RANK[a.seniority ?? ''] ?? 0)
  )[0]
}

function buildByOrgMap(people: ApolloPerson[]): Record<string, ApolloPerson> {
  const byOrg: Record<string, ApolloPerson> = {}
  for (const person of people) {
    const orgId = person.organization_id
    if (!orgId) continue
    const newRank = SENIORITY_RANK[person.seniority ?? ''] ?? 0
    const existingRank = SENIORITY_RANK[byOrg[orgId]?.seniority ?? ''] ?? -1
    if (!byOrg[orgId] || newRank > existingRank) byOrg[orgId] = person
  }
  return byOrg
}

async function batchSearchByIds(apolloKey: string, orgIds: string[]): Promise<Record<string, ApolloPerson>> {
  if (orgIds.length === 0) return {}
  const seniority = ['c_suite', 'owner', 'founder', 'partner', 'vp', 'director']

  const people = await apolloPeopleSearch(apolloKey, {
    organization_ids: orgIds,
    person_seniority: seniority,
    page: 1,
    per_page: 50,
  })
  if (people.length > 0) return buildByOrgMap(people)

  const fallback = await apolloPeopleSearch(apolloKey, {
    q_organization_ids: orgIds,
    person_seniority: seniority,
    page: 1,
    per_page: 50,
  })
  return buildByOrgMap(fallback)
}

async function searchByDomain(apolloKey: string, domain: string): Promise<ApolloPerson | null> {
  const seniority = ['c_suite', 'owner', 'founder', 'partner', 'vp', 'director']

  const people = await apolloPeopleSearch(apolloKey, {
    organization_domains: [domain],
    person_seniority: seniority,
    page: 1,
    per_page: 5,
  })
  if (people.length > 0) return pickBestContact(people)

  // Broader seniority fallback
  const broader = await apolloPeopleSearch(apolloKey, {
    organization_domains: [domain],
    person_seniority: [...seniority, 'manager', 'head'],
    page: 1,
    per_page: 5,
  })
  if (broader.length > 0) return pickBestContact(broader)

  return null
}

function isDetailedAddress(addr: string): boolean {
  // Real postal address if it has digits (postcode or street number) AND some substance
  return /\d/.test(addr) && (addr.includes('\n') || addr.split(',').length >= 3)
}

function buildPostalAddress(org: ApolloOrganization, personOrg?: ApolloPerson['organization']): string | undefined {
  if (org.raw_address && isDetailedAddress(org.raw_address)) return org.raw_address
  if (personOrg?.raw_address && isDetailedAddress(personOrg.raw_address)) return personOrg.raw_address

  if (org.street_address) {
    const parts = [
      org.street_address,
      org.city,
      org.state,
      org.postal_code,
      org.country !== 'United Kingdom' ? org.country : undefined,
    ].filter(Boolean)
    if (parts.length >= 2) return parts.join('\n')
  }

  if (org.city && org.postal_code) {
    return [org.city, org.postal_code, org.country !== 'United Kingdom' ? org.country : 'United Kingdom'].filter(Boolean).join('\n')
  }

  if (org.city && org.country) return [org.city, org.country].join('\n')
  return undefined
}

// Data quality: how complete and actionable is this lead?
// 0–100 based on what Apollo returned
function computeDataScore(lead: {
  contactName?: string
  contactEmail?: string
  postalAddress?: string
  description?: string
  techStack?: string[]
  annualRevenue?: string
  employees: string
}): number {
  let score = 0
  if (lead.contactName) score += 35             // named person is most critical
  if (lead.contactEmail) score += 20            // can also email them
  if (lead.postalAddress && /\d/.test(lead.postalAddress)) score += 20  // real street address
  else if (lead.postalAddress) score += 5       // partial address
  if (lead.description && lead.description.length > 60) score += 10
  if (lead.techStack && lead.techStack.length > 0) score += 8
  if (lead.annualRevenue) score += 7
  return Math.min(100, score)
}

export async function POST(req: Request) {
  const { orgs, industry } = await req.json() as { orgs: ApolloOrganization[]; industry: string }

  if (!orgs?.length || !industry) return new Response('Missing orgs or industry', { status: 400 })

  const apolloKey = process.env.APOLLO_API_KEY
  if (!apolloKey) return new Response('APOLLO_API_KEY not configured', { status: 500 })

  const usable = orgs.filter((o) => o.name).slice(0, 100)

  const companySummaries = usable
    .map((o, i) => {
      const emp = o.estimated_num_employees ? `${o.estimated_num_employees} employees` : 'unknown size'
      const desc = (o.short_description || o.seo_description || 'No description').slice(0, 200)
      const loc = [o.city, o.country].filter(Boolean).join(', ') || 'UK'
      const tech = o.technology_names?.slice(0, 6).join(', ') || ''
      const rev = o.annual_revenue_printed ? ` | Revenue: ${o.annual_revenue_printed}` : ''
      const techLine = tech ? ` | Tech: ${tech}` : ''
      return `${i + 1}. ${o.name} | ${emp} | ${loc}${rev}${techLine}\n   ${desc}`
    })
    .join('\n\n')

  // IMPORTANT: Industry is already filtered — score on complexity signals within the batch
  const prompt = `You are ranking companies returned from an Apollo search for a NetSuite implementation firm. The industry filter has already been applied — all companies are in the right sector. Do NOT penalise or reward industry type.

Your job: score each company 0–100 on OPERATIONAL COMPLEXITY and ERP PAIN SIGNALS found in their description, employee count, tech stack, and revenue. You are comparing these companies AGAINST EACH OTHER — rank the most complex and multi-system operations highest.

HIGH score signals (75–100) — look for evidence of:
- Multiple sales channels running in parallel (ecommerce AND trade AND B2B)
- International operations, multi-currency, multiple entities
- Multiple sites, warehouses, showrooms, or field operations
- Large inventory requirements with high stock value or fast movement
- Disconnected tech stack visible in their tools (e.g. Shopify + Xero + spreadsheets + 3PL)
- Revenue or employee scale suggesting they have outgrown basic tools
- Specific evidence of operational complexity in the description

MID score (40–74) — standard operations for the sector, some complexity but limited:
- Single-site, single-channel with some growth signals
- 50–150 employees, manageable with simpler tools
- No strong evidence of multi-system pain
- Description is vague or generic

LOW score (5–39) — limited ERP case within this batch:
- Small, simple operations regardless of industry label
- Vague/generic descriptions with no operational substance
- Very small teams (under 30 people)
- No discernible operational complexity

CRITICAL: You must differentiate. In any batch, there will be some genuinely complex businesses and some straightforward ones. The top-ranked company should score noticeably higher than the bottom-ranked. Do not cluster everything at 55–70.

Companies:
${companySummaries}

Return ONLY valid JSON, no markdown:
{"scores":[{"index":1,"score":85,"rationale":"Two specific sentences about THIS company's operational complexity and why they likely need ERP.","contactTitle":"Most likely NetSuite decision-maker title for this specific company type (MD/CEO/CFO/Finance Director/Operations Director/Supply Chain Director — be specific)"}]}

Score all ${usable.length} companies.`

  const { text } = await generateText({
    model: openai('gpt-4o'),
    maxOutputTokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  let parsed: { scores: Array<{ index: number; score: number; rationale: string; contactTitle: string }> }
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return Response.json({ error: 'Failed to parse scoring response' }, { status: 500 })
    parsed = JSON.parse(match[0])
  }

  const scored = parsed.scores
    .map(({ index, score, rationale, contactTitle }) => {
      const org = usable[index - 1]
      if (!org) return null
      return { org, score, rationale, contactTitle }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)  // Increased from 15 — gives frontend a deep bench

  // Enrich top 30 companies by domain in parallel
  const enrichedResults = await Promise.all(
    scored.map(async (s) => {
      const domain = getDomain(s.org)
      if (!domain) return { id: s.org.id, data: {} as Partial<ApolloOrganization> }
      const data = await enrichOrg(apolloKey, domain)
      return { id: s.org.id, data }
    })
  )
  const enrichedMap: Record<string, Partial<ApolloOrganization>> = {}
  for (const r of enrichedResults) {
    if (r.id) enrichedMap[r.id] = r.data
  }

  // Batch people search by org IDs
  const topOrgIds = scored.map((s) => s.org.id).filter((id): id is string => Boolean(id))
  const batchContacts = await batchSearchByIds(apolloKey, topOrgIds)

  // Per-domain fallback for misses — cap at top 20 to stay within timeout
  const missedOrgs = scored.filter((s) => s.org.id && !batchContacts[s.org.id])
  const domainFallbacks: Record<string, ApolloPerson> = {}

  if (missedOrgs.length > 0) {
    console.log(`Batch missed ${missedOrgs.length} — running per-domain fallback`)
    const results = await Promise.allSettled(
      missedOrgs.slice(0, 20).map(async (s) => {
        const domain = getDomain(s.org)
        if (!domain) return null
        const person = await searchByDomain(apolloKey, domain)
        return person ? { orgId: s.org.id, person } : null
      })
    )
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value?.orgId && r.value.person) {
        domainFallbacks[r.value.orgId] = r.value.person
      }
    }
    console.log(`Domain fallback found ${Object.keys(domainFallbacks).length} additional contacts`)
  }

  const contacts: Record<string, ApolloPerson> = { ...batchContacts, ...domainFallbacks }

  // Build lead objects
  const rawLeads = scored.map(({ org, score, rationale, contactTitle }) => {
    const enriched = (org.id ? enrichedMap[org.id] : {}) ?? {}
    const merged: ApolloOrganization = {
      ...org,
      ...Object.fromEntries(Object.entries(enriched).filter(([, v]) => v != null && v !== '')),
    }

    const contact = org.id ? contacts[org.id] : undefined
    const loc = [merged.city, merged.state, merged.country].filter(Boolean).join(', ') || undefined
    const postalAddress = buildPostalAddress(merged, contact?.organization)

    const partial = {
      rank: 0,
      company: merged.name ?? org.name ?? 'Unknown',
      website: merged.website_url ?? merged.primary_domain ?? org.website_url ?? '',
      industry: merged.industry ?? org.industry ?? industry,
      employees: merged.estimated_num_employees ? `~${merged.estimated_num_employees}` : 'Unknown',
      description: merged.short_description || merged.seo_description || org.short_description || org.seo_description || '',
      erpScore: score,
      dataScore: 0,
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

    return { ...partial, dataScore: computeDataScore(partial) }
  })

  // Sort by combined score: 60% ERP fit + 40% data quality
  const sortedLeads = rawLeads
    .sort((a, b) => {
      const aScore = a.erpScore * 0.6 + a.dataScore * 0.4
      const bScore = b.erpScore * 0.6 + b.dataScore * 0.4
      return bScore - aScore
    })
    .slice(0, 30)  // Return up to 30 — frontend uses 10 active + 20 bench
    .map((l, i) => ({ ...l, rank: i + 1 }))

  return Response.json({ leads: sortedLeads, totalSearched: orgs.length })
}
