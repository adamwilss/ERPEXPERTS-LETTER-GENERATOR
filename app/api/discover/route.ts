export const maxDuration = 30

export interface ApolloOrganization {
  id?: string
  name?: string
  website_url?: string
  primary_domain?: string
  industry?: string
  estimated_num_employees?: number
  short_description?: string
  seo_description?: string
  street_address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  raw_address?: string
  phone?: string
  founded_year?: number
  annual_revenue_printed?: string
  linkedin_url?: string
  technology_names?: string[]
  keywords?: string[]
}

interface ApolloResponse {
  organizations?: ApolloOrganization[]
  accounts?: ApolloOrganization[]
}

async function fetchPage(
  apolloKey: string,
  baseBody: Record<string, unknown>,
  page: number
): Promise<ApolloOrganization[]> {
  try {
    const res = await fetch('https://api.apollo.io/api/v1/mixed_companies/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'x-api-key': apolloKey,
      },
      body: JSON.stringify({ ...baseBody, page, per_page: 100 }),
      signal: AbortSignal.timeout(18000),
    })
    if (!res.ok) {
      console.error(`Apollo page ${page} failed:`, res.status)
      return []
    }
    const data = await res.json() as ApolloResponse
    return data.organizations ?? data.accounts ?? []
  } catch (err) {
    console.error(`Apollo page ${page} error:`, err)
    return []
  }
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

  const baseBody: Record<string, unknown> = {
    organization_locations: [location],
    organization_num_employees_ranges: [employeeRange],
  }
  if (industry && industry.trim()) {
    baseBody.organization_industry_tag = [industry]
  }

  const userKeywords = keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
  if (userKeywords.length > 0) {
    baseBody.q_organization_keyword_tags = userKeywords
  }

  // Fetch 2 pages in parallel — up to 200 companies
  const [page1, page2] = await Promise.all([
    fetchPage(apolloKey, baseBody, 1),
    fetchPage(apolloKey, baseBody, 2),
  ])

  // Merge and deduplicate by ID
  const seen = new Set<string>()
  const allOrgs: ApolloOrganization[] = []

  for (const org of [...page1, ...page2]) {
    if (!org.name) continue
    const key = org.id ?? org.name
    if (seen.has(key)) continue
    seen.add(key)
    allOrgs.push(org)
  }

  if (allOrgs.length === 0) {
    return Response.json(
      { error: 'No companies found. Try broadening your search criteria.' },
      { status: 404 }
    )
  }

  console.log(`Apollo returned ${allOrgs.length} companies (page1: ${page1.length}, page2: ${page2.length})`)

  return Response.json({ orgs: allOrgs, totalFound: allOrgs.length })
}
