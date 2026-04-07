import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const runtime = 'edge'
export const maxDuration = 120

// NOTE: Apollo industry tag IDs vary per account and cannot be hardcoded reliably.
// Industry filtering is handled via keyword search (q_organization_keyword_tags) instead.

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
}

interface ApolloOrganization {
  name?: string
  website_url?: string
  primary_domain?: string
  industry?: string
  estimated_num_employees?: number
  short_description?: string
  city?: string
  country?: string
}

interface ApolloResponse {
  organizations?: ApolloOrganization[]
  accounts?: ApolloOrganization[]
  pagination?: { total_entries?: number; total_pages?: number }
}

async function searchApollo(
  apolloKey: string,
  industry: string,
  employeeRange: string,
  location: string,
  keywords: string,
  page: number
): Promise<ApolloOrganization[]> {
  const body: Record<string, unknown> = {
    organization_locations: [location],
    organization_num_employees_ranges: [employeeRange],
    page,
    per_page: 100,
  }

  // Only apply user-supplied keyword filter — industry scoring is handled by GPT-4o
  const userKeywords = keywords.split(',').map((k) => k.trim()).filter(Boolean)
  if (userKeywords.length > 0) {
    body.q_organization_keyword_tags = userKeywords
  }

  try {
    const res = await fetch('https://api.apollo.io/api/v1/mixed_companies/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'x-api-key': apolloKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })

    const responseText = await res.text()

    if (!res.ok) {
      console.error(`Apollo ${res.status}:`, responseText)
      // Surface the actual Apollo error so it's visible in the UI during debugging
      throw new Error(`Apollo ${res.status}: ${responseText.slice(0, 200)}`)
    }

    const data = JSON.parse(responseText) as ApolloResponse
    return data.organizations ?? data.accounts ?? []
  } catch (err) {
    console.error('Apollo search error:', err)
    throw err
  }
}

function deduplicateOrgs(orgs: ApolloOrganization[]): ApolloOrganization[] {
  const seen = new Set<string>()
  return orgs.filter((o) => {
    const key = o.primary_domain ?? o.website_url ?? o.name ?? ''
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function scoreWithClaude(orgs: ApolloOrganization[], industry: string): Promise<Lead[]> {
  const companySummaries = orgs
    .slice(0, 300) // cap at 300 to stay within token budget
    .map((o, i) => {
      const emp = o.estimated_num_employees ? `${o.estimated_num_employees} employees` : 'unknown size'
      const desc = o.short_description ? o.short_description.slice(0, 200) : 'No description available'
      const location = [o.city, o.country].filter(Boolean).join(', ') || 'UK'
      return `${i + 1}. ${o.name ?? 'Unknown'} | ${o.industry ?? industry} | ${emp} | ${location}\n   ${desc}`
    })
    .join('\n\n')

  const prompt = `You are evaluating UK businesses as NetSuite ERP prospects for ERP Experts, a Manchester-based NetSuite implementation firm.

The user searched for companies in the "${industry}" sector. Prioritise companies that fit this profile, but score all companies on ERP-readiness regardless.

Score each company 0–100 on ERP-readiness using these signals:
- Multi-channel operations (ecommerce + wholesale/trade = high)
- Multi-site or international footprint
- Product/inventory-holding businesses (manufacturing, distribution, wholesale)
- Scale at which manual reconciliation across disconnected systems becomes painful (50–500 employees)
- Growth indicators suggesting outgrowing current setup
- Industries with strong ERP pain: manufacturing, distribution, field services, specialty retail

Avoid scoring high: pure software, media agencies, small consultancies, single-location micro-businesses.

Companies to evaluate:
${companySummaries}

Return ONLY valid JSON. No markdown. No explanation outside the JSON. Format:
{
  "scores": [
    {
      "index": 1,
      "score": 85,
      "rationale": "Two sentences specific to this company explaining the ERP-readiness score.",
      "contactTitle": "Finance Director"
    }
  ]
}

Return all ${Math.min(orgs.length, 300)} companies scored. The contactTitle should be the most likely decision-maker title for a NetSuite conversation at a company of this type and size.`

  const { text } = await generateText({
    model: openai('gpt-4o'),
    maxOutputTokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })

  let parsed: { scores: Array<{ index: number; score: number; rationale: string; contactTitle: string }> }
  try {
    parsed = JSON.parse(text)
  } catch {
    // Try to extract JSON if Claude added surrounding text
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return []
    parsed = JSON.parse(match[0])
  }

  // Map scores back to orgs, sort by score, return top 10
  const scored = parsed.scores
    .map(({ index, score, rationale, contactTitle }) => {
      const org = orgs[index - 1]
      if (!org) return null
      return {
        org,
        score,
        rationale,
        contactTitle,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  return scored.map(({ org, score, rationale, contactTitle }, i) => ({
    rank: i + 1,
    company: org.name ?? 'Unknown',
    website: org.website_url ?? org.primary_domain ?? '',
    industry: org.industry ?? industry,
    employees: org.estimated_num_employees ? `~${org.estimated_num_employees}` : 'Unknown',
    description: org.short_description ?? '',
    erpScore: score,
    rationale,
    contactTitle,
  }))
}

export async function POST(req: Request) {
  const body = await req.json()
  const { industry, employeeRange, location = 'United Kingdom', keywords = '' } = body

  if (!industry || !employeeRange) {
    return new Response('Missing required fields', { status: 400 })
  }

  const apolloKey = process.env.APOLLO_API_KEY
  if (!apolloKey) {
    return new Response('APOLLO_API_KEY not configured', { status: 500 })
  }

  // Search Apollo — just page 1 first to validate the query works
  let allOrgs: ApolloOrganization[] = []
  try {
    const pages = await Promise.all(
      [1, 2, 3, 4, 5].map((page) =>
        searchApollo(apolloKey, industry, employeeRange, location, keywords, page)
      )
    )
    allOrgs = deduplicateOrgs(pages.flat())
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Apollo search failed'
    return Response.json({ error: message }, { status: 502 })
  }

  if (allOrgs.length === 0) {
    return Response.json(
      { error: 'No companies found. Try broadening your search criteria.' },
      { status: 404 }
    )
  }

  // Score with Claude and return top 10
  const leads = await scoreWithClaude(allOrgs, industry)

  return Response.json({ leads, totalSearched: allOrgs.length })
}
