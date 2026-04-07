import { streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

const anthropic = createAnthropic({ apiKey: process.env.OPENAI_API_KEY })
import { fetchResearch } from '@/lib/research'
import { buildSystemPrompt, buildUserMessage } from '@/lib/prompt'

export const runtime = 'edge'
export const maxDuration = 120

export async function POST(req: Request) {
  const body = await req.json()
  const { company, url, recipientName, jobTitle, notes } = body

  if (!company || !url || !recipientName || !jobTitle) {
    return new Response('Missing required fields', { status: 400 })
  }

  // Research phase — runs before streaming starts
  const research = await fetchResearch(url, company)

  // Generation phase — streamed back to client
  const result = await streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: buildSystemPrompt(),
    messages: [
      {
        role: 'user',
        content: buildUserMessage({ company, url, recipientName, jobTitle, notes, research }),
      },
    ],
    maxOutputTokens: 6000,
  })

  return result.toTextStreamResponse()
}
