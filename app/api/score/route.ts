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
  // Enriched fields
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
}

const SENIORITY_RANK: Record<string, number> = {
  c_suite: 7,
  owner: 6,
  founder: 6,
  partner: 5,
  vp: 4,
  head: 3,
  director: 3,
  manager: 2,
  senior: 1,
}

async function searchContacts(
  apolloKey: string,
  orgIds: string[]
): Promise<Record<string, ApolloPerson>> {
  if (orgIds.length === 0) return {}
  try {
    const res = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'x-api-key': apolloKey,
      },
      body: JSON.stringify({
        organization_ids: orgIds,
        person_seniority: ['c_suite', 'owner', 'founder', 'partner', 'vp', 'director'],
        page: 1,
        per_page: 50,
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      console.error('People search failed:', res.status, await res.text())
      return {}
    }
    const data = await res.json()
    const people: ApolloPerson[] = data.people ?? []

    // Pick highest-seniority person per org
    const byOrg: Record<string, ApolloPerson> = {}
    for (const person of people) {
      const orgId = person.organization_id
      if (!orgId) continue
      const existing = byOrg[orgId]
      const newRank = SENIORITY_RANK[person.seniority ?? ''] ?? 0
      const existingRank = SENIORITY_RANK[existing?.seniority ?? ''] ?? -1
      if (!existing || newRank > existingRank) {
        byOrg[orgId] = person
      }
    }
    return byOrg
  } catch (err) {
    console.error('People search error:', err)
    return {}
  }
}

export async function POST(req: Request) {
  const { orgs, industry } = await req.json() as { orgs: ApolloOrganization[]; industry: string }

  if (!orgs?.length || !industry) {
    return new Response('Missing orgs or industry', { status: 400 })
  }

  const apolloKey = process.env.APOLLO_API_KEY
  if (!apolloKey) {
    return new Response('APOLLO_API_KEY not configured', { status: 500 })
  }

  const capped = orgs.slice(0, 100)

  const companySummaries = capped
    .map((o, i) => {
      const emp = o.estimated_num_employees ? `${o.estimated_num_employees} employees` : 'unknown size'
      const desc = (o.short_description || o.seo_description || 'No description').slice(0, 150)
      const loc = [o.city, o.country].filter(Boolean).join(', ') || 'UK'
      const tech = o.technology_names?.slice(0, 5).join(', ') || ''
      const rev = o.annual_revenue_printed ? ` | Revenue: ${o.annual_revenue_printed}` : ''
      const techLine = tech ? ` | Tech: ${tech}` : ''
      return `${i + 1}. ${o.name ?? 'Unknown'} | ${o.industry ?? industry} | ${emp} | ${loc}${rev}${techLine}\n   ${desc}`
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

Score all ${capped.length} companies. contactTitle = most likely NetSuite decision-maker (e.g. Finance Director, MD, CFO, Operations Director).`

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
      const org = orgs[index - 1]
      if (!org) return null
      return { org, score, rationale, contactTitle }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  // Enrich top 10 with named contacts from Apollo people search
  const topOrgIds = scored.map((s) => s.org.id).filter((id): id is string => Boolean(id))
  const contacts = await searchContacts(apolloKey, topOrgIds)

  const leads: Lead[] = scored.map(({ org, score, rationale, contactTitle }, i) => {
    const contact = org.id ? contacts[org.id] : undefined
    const loc = [org.city, org.state, org.country].filter(Boolean).join(', ') || undefined
    return {
      rank: i + 1,
      company: org.name ?? 'Unknown',
      website: org.website_url ?? org.primary_domain ?? '',
      industry: org.industry ?? industry,
      employees: org.estimated_num_employees ? `~${org.estimated_num_employees}` : 'Unknown',
      description: org.short_description || org.seo_description || '',
      erpScore: score,
      rationale,
      contactTitle: contact?.title ?? contactTitle,
      contactName: contact?.name,
      contactEmail: contact?.email,
      contactLinkedIn: contact?.linkedin_url,
      orgId: org.id,
      foundedYear: org.founded_year,
      annualRevenue: org.annual_revenue_printed,
      techStack: org.technology_names?.slice(0, 8),
      location: loc,
      phone: org.phone,
      linkedinUrl: org.linkedin_url,
    }
  })

  return Response.json({ leads, totalSearched: orgs.length })
}
