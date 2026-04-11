import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { fetchResearch } from '@/lib/research'
import { buildSystemPrompt, buildUserMessage, buildFollowupPrompt, type FollowupType } from '@/lib/prompt'
import { getIndustryContext, inferIndustryFromResearch, formatContextForPrompt } from '@/lib/netsuite-context'

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const runtime = 'edge'
export const maxDuration = 120

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      company, url, recipientName, jobTitle, notes, postalAddress, industry,
      type = 'initial',
      previousContent, // For follow-ups, the previous letter content
    } = body

    if (!company || !recipientName || !jobTitle) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Research phase — hard 20s cap so a hanging fetch never blocks generation
    // For follow-ups, we may skip research if previousContent is provided
    let research = ''
    if (type === 'initial' || !previousContent) {
      research = await Promise.race([
        fetchResearch(url ?? '', company),
        new Promise<string>((resolve) =>
          setTimeout(
            () => resolve(`No research retrieved within time limit for ${company}. Infer from company name and any domain knowledge.`),
            20000
          )
        ),
      ])
    } else {
      research = 'Follow-up based on previous outreach. See previous content for company context.'
    }

    // Resolve NetSuite context — explicit industry takes priority, then infer from research
    const resolvedIndustry = industry || inferIndustryFromResearch(research)
    const netsuiteContext = formatContextForPrompt(getIndustryContext(resolvedIndustry))

    // Build prompt based on type
    let systemPrompt: string
    let userMessage: string

    if (type === 'initial') {
      systemPrompt = buildSystemPrompt()
      userMessage = buildUserMessage({
        company, url: url ?? '', recipientName, jobTitle, notes, research,
        postalAddress: postalAddress ?? '',
        netsuiteContext,
      })
    } else {
      // Follow-up types
      const { system, user } = buildFollowupPrompt({
        type: type as FollowupType,
        company, url: url ?? '', recipientName, jobTitle, notes, research,
        postalAddress: postalAddress ?? '',
        netsuiteContext,
        previousContent,
      })
      systemPrompt = system
      userMessage = user
    }

    // Generation phase — streamed back to client
    const result = await streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      maxOutputTokens: type === 'initial' ? 6000 : 2000, // Follow-ups are shorter
    })

    return result.toTextStreamResponse()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(`Generation failed: ${message}`, { status: 500 })
  }
}
