import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { fetchResearch } from '@/lib/research'
import { buildSystemPrompt, buildUserMessage } from '@/lib/prompt'
import { getIndustryContext, inferIndustryFromResearch, formatContextForPrompt } from '@/lib/netsuite-context'

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const runtime = 'edge'
export const maxDuration = 120

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { company, url, recipientName, jobTitle, notes, postalAddress, industry } = body

    if (!company || !recipientName || !jobTitle) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Research phase — hard 20s cap so a hanging fetch never blocks generation
    const research = await Promise.race([
      fetchResearch(url ?? '', company),
      new Promise<string>((resolve) =>
        setTimeout(
          () => resolve(`No research retrieved within time limit for ${company}. Infer from company name and any domain knowledge.`),
          20000
        )
      ),
    ])

    // Resolve NetSuite context — explicit industry takes priority, then infer from research
    const resolvedIndustry = industry || inferIndustryFromResearch(research)
    const netsuiteContext = formatContextForPrompt(getIndustryContext(resolvedIndustry))

    // Generation phase — streamed back to client
    const result = await streamText({
      model: openai('gpt-4o'),
      system: buildSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: buildUserMessage({
            company, url: url ?? '', recipientName, jobTitle, notes, research,
            postalAddress: postalAddress ?? '',
            netsuiteContext,
          }),
        },
      ],
      maxOutputTokens: 6000,
    })

    return result.toTextStreamResponse()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(`Generation failed: ${message}`, { status: 500 })
  }
}
