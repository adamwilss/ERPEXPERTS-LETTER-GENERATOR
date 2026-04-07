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

// Enrich a single org by domain — returns full profile from Apollo
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

async function searchContacts(apolloKey: string, orgIds: string[]): Promise<Record<string, ApolloPerson>> {
  if (orgIds.length === 0) return {}
  try {
    const res = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', 'x-api-key': apolloKey },
      body: JSON.stringify({
        organization_ids: orgIds,
        person_seniority: ['c_suite', 'owner', 'founder', 'partner', 'vp', 'director'],
        page: 1,
        per_page: 50,
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) { console.error('People search failed:', res.status); return {} }
    const data = await res.json()
    const people: ApolloPerson[] = data.people ?? []
    const byOrg: Record<string, ApolloPerson> = {}
    for (const person of people) {
      const orgId = person.organization_id
      if (!orgId) continue
      const newRank = SENIORITY_RANK[person.seniority ?? ''] ?? 0
      const existingRank = SENIORITY_RANK[byOrg[orgId]?.seniority ?? ''] ?? -1
      if (!byOrg[orgId] || newRank > existingRank) byOrg[orgId] = person
    }
    return byOrg
  } catch (err) {
    console.error('People search error:', err)
    return {}
  }
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

  const prompt = `You are evaluating UK businesses as NetSuite ERP prospects for ERP Experts, a Manchester-based NetSuite implementation firm.

Score each company 0–100 on ERP-readiness:
- High: multi-channel ops, inventory-holding, multi-site/international, 50–500 employees, manufacturing/distribution/wholesale
- Low: pure software, media agencies, small consultancies, micro-businesses

Companies:
${companySummaries}

Return ONLY valid JSON, no markdown:
{"scores":[{"index":1,"score":85,"rationale":"Two sentences on ERP-readiness.","contactTitle":"Finance Director"}]}

Score all ${usable.length} companies. contactTitle = most likely NetSuite decision-maker (e.g. Finance Director, MD, CFO, Operations Director).`

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
    .slice(0, 10)

  // Enrich top 10 via Apollo org enrichment (full profile by domain) + people search in parallel
  const topOrgIds = scored.map((s) => s.org.id).filter((id): id is string => Boolean(id))

  const [enrichedMap, contacts] = await Promise.all([
    // Enrich each top-10 org by domain to fill missing fields
    Promise.all(
      scored.map(async (s) => {
        const domain = getDomain(s.org)
        if (!domain) return { id: s.org.id, data: {} as Partial<ApolloOrganization> }
        const data = await enrichOrg(apolloKey, domain)
        return { id: s.org.id, data }
      })
    ).then((results) => {
      const map: Record<string, Partial<ApolloOrganization>> = {}
      for (const r of results) { if (r.id) map[r.id] = r.data }
      return map
    }),
    searchContacts(apolloKey, topOrgIds),
  ])

  const leads: Lead[] = scored.map(({ org, score, rationale, contactTitle }, i) => {
    // Merge search result with enrichment data — enrichment wins for missing fields
    const enriched = (org.id ? enrichedMap[org.id] : {}) ?? {}
    const merged: ApolloOrganization = { ...org, ...Object.fromEntries(Object.entries(enriched).filter(([, v]) => v != null && v !== '')) }

    const contact = org.id ? contacts[org.id] : undefined
    const loc = [merged.city, merged.state, merged.country].filter(Boolean).join(', ') || undefined

    const addressParts = [
      merged.street_address,
      merged.city,
      merged.state,
      merged.postal_code,
      merged.country !== 'United Kingdom' ? merged.country : undefined,
    ].filter(Boolean)
    const postalAddress = merged.raw_address ?? (addressParts.length > 0 ? addressParts.join('\n') : undefined)

    return {
      rank: i + 1,
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

  return Response.json({ leads, totalSearched: orgs.length })
}
