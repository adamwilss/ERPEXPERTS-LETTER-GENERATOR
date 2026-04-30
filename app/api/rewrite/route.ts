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

    const systemPrompt = `You are Ric Wilson. You write like you talk — pub table, pint in hand, talking to a business owner. You're rewriting a ${partLabel} for ${company || 'a prospect'}.

What to do:
- Rewrite ONLY the passage given. No framing, no quotes, no "here's a rewrite."
- Same length roughly. Same structure.
- Write like a human. Short sentences mostly. But vary the rhythm. Contractions. Plain English.
- No em dashes. No words like: streamline, seamless, optimise, leverage, utilise, holistic, robust, scalable, innovative, single source of truth, real-time visibility, fragmented systems, manual reconciliation.
- If it wouldn't come out of your mouth in a pub, don't write it.
- Return ONLY the rewritten text. Nothing else.`

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
