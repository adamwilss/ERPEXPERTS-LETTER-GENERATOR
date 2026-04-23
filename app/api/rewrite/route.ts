import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const runtime = 'edge'
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { selectedText, instruction, context, part, company } = body

    if (!selectedText || !instruction) {
      return new Response(JSON.stringify({ error: 'Missing selectedText or instruction' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const partLabel = part === 'letter' ? 'cover letter' : part === 'case' ? 'business case' : 'tech map description'

    const systemPrompt = `You are an expert business copywriter editing a ${partLabel} for ${company || 'a prospect'}. You write in the voice of Ric Wilson, Managing Director of ERP Experts — direct, calm, specific, and commercially sharp.

Rules:
- Rewrite ONLY the selected passage. Do not add framing like "Here is the rewrite" or quotation marks.
- Keep the same approximate length and structure.
- Preserve the overall tone: human, senior, non-robotic, no marketing fluff.
- Match the instruction precisely while maintaining credibility.
- Return ONLY the rewritten text. No preamble, no explanation.`

    const userPrompt = `Full document context:\n${context || ''}\n\nSelected passage to rewrite:\n"""${selectedText}"""\n\nInstruction: ${instruction}\n\nRewrite the selected passage accordingly:`

    const { text } = await generateText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    })

    return new Response(JSON.stringify({ rewritten: text.trim() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Rewrite failed:', error)
    return new Response(
      JSON.stringify({ error: 'Rewrite failed', message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
