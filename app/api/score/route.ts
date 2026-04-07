import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import type { ApolloOrganization } from '../discover/route'

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const maxDuration = 90

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

export async function POST(req: Request) {
  const { orgs, industry } = await req.json() as { orgs: ApolloOrganization[]; industry: string }

  if (!orgs?.length || !industry) {
    return new Response('Missing orgs or industry', { status: 400 })
  }

  const capped = orgs.slice(0, 100)

  const companySummaries = capped
    .map((o, i) => {
      const emp = o.estimated_num_employees ? `${o.estimated_num_employees} employees` : 'unknown size'
      const desc = o.short_description ? o.short_description.slice(0, 150) : 'No description'
      const loc = [o.city, o.country].filter(Boolean).join(', ') || 'UK'
      return `${i + 1}. ${o.name ?? 'Unknown'} | ${o.industry ?? industry} | ${emp} | ${loc}\n   ${desc}`
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

Score all ${capped.length} companies. contactTitle = most likely NetSuite decision-maker.`

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

  const leads: Lead[] = scored.map(({ org, score, rationale, contactTitle }, i) => ({
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

  return Response.json({ leads, totalSearched: orgs.length })
}
