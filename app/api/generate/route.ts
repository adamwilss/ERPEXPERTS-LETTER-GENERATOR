import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { fetchResearch, type ErpDetection } from '@/lib/research'
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
      previousContent,
      employeeCount,
      revenue,
    } = body

    if (!company || !recipientName || !jobTitle) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Research phase
    let research = ''
    let erpDetection: ErpDetection = { hasErp: false, erpName: null, isNetSuite: false, confidence: 'low' }
    let erpExpertsContext = ''

    if (type === 'initial' || !previousContent) {
      const result = await Promise.race([
        fetchResearch(url ?? '', company),
        new Promise<{ text: string; erpDetection: ErpDetection; erpExpertsContext: string }>((resolve) =>
          setTimeout(
            () => resolve({
              text: `No research retrieved within time limit for ${company}. Infer from company name and any domain knowledge.`,
              erpDetection: { hasErp: false, erpName: null, isNetSuite: false, confidence: 'low' },
              erpExpertsContext: '',
            }),
            20000
          )
        ),
      ])
      research = result.text
      erpDetection = result.erpDetection
      erpExpertsContext = result.erpExpertsContext
    } else {
      research = 'Follow-up based on previous outreach. See previous content for company context.'
    }

    // Resolve NetSuite context
    const resolvedIndustry = industry || inferIndustryFromResearch(research)
    const netsuiteContext = formatContextForPrompt(getIndustryContext(resolvedIndustry))

    // Build prompt based on type
    let systemPrompt: string
    let userMessage: string

    if (type === 'initial') {
      systemPrompt = buildSystemPrompt({
        erpDetection,
        erpExpertsContext,
        employeeCount,
        revenue,
      })
      userMessage = buildUserMessage({
        company, url: url ?? '', recipientName, jobTitle, notes, research,
        postalAddress: postalAddress ?? '',
        netsuiteContext,
        erpDetection,
        employeeCount,
        revenue,
      })
    } else {
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

    // Generation phase
    const result = await streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      maxOutputTokens: type === 'initial' ? 3000 : 2000,
    })

    return result.toTextStreamResponse()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(`Generation failed: ${message}`, { status: 500 })
  }
}
