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
  erpScore: number
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
    console.log(`Apollo people search (${JSON.stringify(Object.keys(body))}) → ${people.length} results`)
    return people
  } catch (err) {
    console.error('People search error:', err)
    return []
  }
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

// Batch search by org IDs
async function batchSearchByIds(apolloKey: string, orgIds: string[]): Promise<Record<string, ApolloPerson>> {
  if (orgIds.length === 0) return {}

  // Try with organization_ids first
  const people = await apolloPeopleSearch(apolloKey, {
    organization_ids: orgIds,
    person_seniority: ['c_suite', 'owner', 'founder', 'partner', 'vp', 'director'],
    page: 1,
    per_page: 50,
  })
  if (people.length > 0) return buildByOrgMap(people)

  // Try q_organization_ids fallback
  const fallback = await apolloPeopleSearch(apolloKey, {
    q_organization_ids: orgIds,
    person_seniority: ['c_suite', 'owner', 'founder', 'partner', 'vp', 'director'],
    page: 1,
    per_page: 50,
  })
  return buildByOrgMap(fallback)
}

// Per-company search by domain — used when batch search misses a company
async function searchByDomain(apolloKey: string, domain: string): Promise<ApolloPerson | null> {
  const people = await apolloPeopleSearch(apolloKey, {
    organization_domains: [domain],
    person_seniority: ['c_suite', 'owner', 'founder', 'partner', 'vp', 'director'],
    page: 1,
    per_page: 5,
  })

  if (people.length > 0) {
    // Return highest seniority person
    return people.sort((a, b) => {
      const aRank = SENIORITY_RANK[a.seniority ?? ''] ?? 0
      const bRank = SENIORITY_RANK[b.seniority ?? ''] ?? 0
      return bRank - aRank
    })[0]
  }

  // Broaden to include manager level if nothing found
  const broader = await apolloPeopleSearch(apolloKey, {
    organization_domains: [domain],
    person_seniority: ['c_suite', 'owner', 'founder', 'partner', 'vp', 'director', 'manager', 'head'],
    page: 1,
    per_page: 5,
  })

  if (broader.length > 0) {
    return broader.sort((a, b) => {
      const aRank = SENIORITY_RANK[a.seniority ?? ''] ?? 0
      const bRank = SENIORITY_RANK[b.seniority ?? ''] ?? 0
      return bRank - aRank
    })[0]
  }

  return null
}

// Determine if an address is proper (has a street number / postcode)
function isDetailedAddress(addr: string): boolean {
  // Good if contains a digit (street number or postcode), and has more than just city + country
  return /\d/.test(addr) && addr.split('\n').length + addr.split(',').length > 3
}

function buildPostalAddress(org: ApolloOrganization, personOrg?: ApolloPerson['organization']): string | undefined {
  // Prefer org's raw_address if it looks like a complete postal address
  if (org.raw_address && isDetailedAddress(org.raw_address)) {
    return org.raw_address
  }

  // Try address from person's embedded org data
  if (personOrg?.raw_address && isDetailedAddress(personOrg.raw_address)) {
    return personOrg.raw_address
  }

  // Build from structured fields if we have a street address
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

  // Fall back to city + postcode if at least both present (still useful for large cities)
  if (org.city && org.postal_code) {
    const parts = [
      org.city,
      org.postal_code,
      org.country !== 'United Kingdom' ? org.country : 'United Kingdom',
    ].filter(Boolean)
    return parts.join('\n')
  }

  // City + country only — only include if city is specific (not just a county/region)
  if (org.city && org.country) {
    return [org.city, org.country].join('\n')
  }

  return undefined
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
      const desc = (o.short_description || o.seo_description || 'No description').slice(0, 150)
      const loc = [o.city, o.country].filter(Boolean).join(', ') || 'UK'
      const tech = o.technology_names?.slice(0, 5).join(', ') || ''
      const rev = o.annual_revenue_printed ? ` | Revenue: ${o.annual_revenue_printed}` : ''
      const techLine = tech ? ` | Tech: ${tech}` : ''
      return `${i + 1}. ${o.name} | ${o.industry ?? industry} | ${emp} | ${loc}${rev}${techLine}\n   ${desc}`
    })
    .join('\n\n')

  const prompt = `You are evaluating UK businesses as NetSuite ERP prospects for ERP Experts, a Manchester-based NetSuite implementation firm. Score 0–100 on ERP-readiness.

CRITICAL: Use the FULL scoring range — force real differentiation between companies. Do NOT cluster around 55–70.

STRONG prospects (score 75–95):
- Physical goods businesses: manufacturers, distributors, wholesalers with real inventory
- Multi-site, multi-channel, or international operations
- 100–500 employees with operational complexity across purchasing, warehouse, fulfilment, finance
- Mix of ecommerce + trade + B2B sales channels
- Companies where stock, orders, finance and fulfilment are clearly handled in separate systems

MODERATE prospects (score 40–70):
- Services with job/project costing complexity (field services, construction)
- Single-site product businesses in transition
- 50–100 employees growing into complexity
- Businesses where a mid-market ERP would be a clear step-up but urgency is lower

POOR prospects (score 5–35):
- Pure software/SaaS companies
- Marketing, media, PR, creative agencies
- Small consultancies under 50 people
- Financial services, insurance, law firms
- Simple single-channel businesses with no inventory

EXAMPLES to calibrate:
- UK manufacturer, 250 employees, multi-site → 88
- Wholesale distributor, 150 employees, ecommerce + B2B → 83
- Field services firm, 80 employees, job management → 58
- IT consultancy, 60 employees → 28
- Marketing agency, 45 employees → 14

Companies:
${companySummaries}

Return ONLY valid JSON, no markdown:
{"scores":[{"index":1,"score":85,"rationale":"Two sentences on ERP-readiness specific to this company.","contactTitle":"Exact title of most likely NetSuite decision-maker (MD/CEO/CFO/Finance Director/Operations Director — match to company type)"}]}

Score all ${usable.length} companies. Rationale must reference specific facts about THIS company (size, channels, industry), not generic ERP copy.`

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

  // Take top 15 by score
  const scored = parsed.scores
    .map(({ index, score, rationale, contactTitle }) => {
      const org = usable[index - 1]
      if (!org) return null
      return { org, score, rationale, contactTitle }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)

  // Step 1: Enrich all top companies by domain in parallel
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

  // Step 2: Batch people search by org IDs
  const topOrgIds = scored.map((s) => s.org.id).filter((id): id is string => Boolean(id))
  const batchContacts = await batchSearchByIds(apolloKey, topOrgIds)

  // Step 3: Per-domain fallback for any companies that got no contact
  const missedOrgs = scored.filter((s) => s.org.id && !batchContacts[s.org.id])
  const domainFallbacks: Record<string, ApolloPerson> = {}

  if (missedOrgs.length > 0) {
    console.log(`Batch search missed ${missedOrgs.length} companies — trying per-domain fallback`)
    const domainSearches = await Promise.allSettled(
      missedOrgs.slice(0, 10).map(async (s) => {
        const domain = getDomain(s.org)
        if (!domain) return null
        const person = await searchByDomain(apolloKey, domain)
        return person ? { orgId: s.org.id, person } : null
      })
    )
    for (const result of domainSearches) {
      if (result.status === 'fulfilled' && result.value?.orgId && result.value.person) {
        domainFallbacks[result.value.orgId] = result.value.person
      }
    }
    console.log(`Domain fallback found contacts for ${Object.keys(domainFallbacks).length} additional companies`)
  }

  // Merge contacts: batch results + domain fallbacks
  const contacts: Record<string, ApolloPerson> = { ...batchContacts, ...domainFallbacks }

  // Build leads
  const leads: Lead[] = scored.map(({ org, score, rationale, contactTitle }) => {
    const enriched = (org.id ? enrichedMap[org.id] : {}) ?? {}
    const merged: ApolloOrganization = {
      ...org,
      ...Object.fromEntries(Object.entries(enriched).filter(([, v]) => v != null && v !== '')),
    }

    const contact = org.id ? contacts[org.id] : undefined
    const loc = [merged.city, merged.state, merged.country].filter(Boolean).join(', ') || undefined

    const postalAddress = buildPostalAddress(merged, contact?.organization)

    return {
      rank: 0,
      company: merged.name ?? org.name ?? 'Unknown',
      website: merged.website_url ?? merged.primary_domain ?? org.website_url ?? '',
      industry: merged.industry ?? org.industry ?? industry,
      employees: merged.estimated_num_employees ? `~${merged.estimated_num_employees}` : 'Unknown',
      description: merged.short_description || merged.seo_description || org.short_description || org.seo_description || '',
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
  })

  // Quality filter: needs named contact AND (description or known size)
  const withContact = leads
    .filter((l) => l.contactName && (l.description || l.employees !== 'Unknown'))
    .slice(0, 10)
    .map((l, i) => ({ ...l, rank: i + 1 }))

  if (withContact.length >= 3) {
    return Response.json({ leads: withContact, totalSearched: orgs.length })
  }

  // Fallback: return best leads even without named contacts
  const fallback = leads
    .filter((l) => l.description || l.employees !== 'Unknown')
    .slice(0, 10)
    .map((l, i) => ({ ...l, rank: i + 1 }))

  return Response.json({ leads: fallback, totalSearched: orgs.length })
}
