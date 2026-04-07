export const maxDuration = 30

// NOTE: Apollo industry tag IDs vary per account and cannot be hardcoded reliably.
// Industry filtering is handled via keyword search (q_organization_keyword_tags) instead.

export interface ApolloOrganization {
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

  const requestBody: Record<string, unknown> = {
    organization_locations: [location],
    organization_num_employees_ranges: [employeeRange],
    page: 1,
    per_page: 100,
  }

  const userKeywords = keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
  if (userKeywords.length > 0) {
    requestBody.q_organization_keyword_tags = userKeywords
  }

  let res: Response
  try {
    res = await fetch('https://api.apollo.io/api/v1/mixed_companies/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'x-api-key': apolloKey,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(20000),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Apollo request failed'
    return Response.json({ error: message }, { status: 502 })
  }

  const responseText = await res.text()

  if (!res.ok) {
    console.error(`Apollo ${res.status}:`, responseText)
    return Response.json(
      { error: `Apollo ${res.status}: ${responseText.slice(0, 300)}` },
      { status: 502 }
    )
  }

  const data = JSON.parse(responseText) as ApolloResponse
  const orgs: ApolloOrganization[] = data.organizations ?? data.accounts ?? []

  if (orgs.length === 0) {
    return Response.json(
      { error: 'No companies found. Try broadening your search criteria.' },
      { status: 404 }
    )
  }

  return Response.json({ orgs, totalFound: orgs.length })
}
