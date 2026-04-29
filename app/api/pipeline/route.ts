import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { fetchResearch, type ErpDetection } from '@/lib/research'
import {
  identityPrompt,
  toneRules,
  formattingRules,
  researchPrompt,
  coverLetterSystemPrompt,
  coverLetterUserPrompt,
  businessCaseSystemPrompt,
  businessCaseUserPrompt,
  techMapSystemPrompt,
  techMapUserPrompt,
  reviewSystemPrompt,
  reviewUserPrompt,
} from '@/lib/prompts'
import {
  InsightSchema,
  CoverLetterSchema,
  BusinessCaseSchema,
  TechMapSchema,
} from '@/lib/pipeline/schemas'
import { extractFirstName } from '@/lib/prompt'
import { getIndustryContext, inferIndustryFromResearch, formatContextForPrompt } from '@/lib/netsuite-context'
import type { PipelineEvent, PipelineInput, PipelineOutput } from '@/lib/pipeline/schemas'

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
const model = openai('gpt-4o')

export const runtime = 'edge'
export const maxDuration = 180

// Helper to emit NDJSON events into the stream
function createPipelineStream(input: PipelineInput): ReadableStream {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      const send = (event: PipelineEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))
      }

      try {
        // ── Step 1: Research ────────────────────────────────────────────────
        send({ type: 'step_start', step: 'research', message: `Researching ${input.company}...` })

        let researchText = ''
        let erpDetection: ErpDetection = { hasErp: false, erpName: null, isNetSuite: false, confidence: 'low' }
        let erpExpertsContext = ''

        try {
          const result = await Promise.race([
            fetchResearch(input.url ?? '', input.company),
            new Promise<{
              text: string
              erpDetection: ErpDetection
              erpExpertsContext: string
            }>((resolve) =>
              setTimeout(
                () =>
                  resolve({
                    text: `No research retrieved within time limit for ${input.company}. Infer from company name and any domain knowledge.`,
                    erpDetection: { hasErp: false, erpName: null, isNetSuite: false, confidence: 'low' },
                    erpExpertsContext: '',
                  }),
                20000
              )
            ),
          ])
          researchText = result.text
          erpDetection = result.erpDetection
          erpExpertsContext = result.erpExpertsContext
        } catch {
          researchText = `Research failed for ${input.company}. Proceed with inference.`
        }

        send({ type: 'step_complete', step: 'research', data: { researchText, erpDetection } })

        // ── Step 2: Insight ────────────────────────────────────────────────
        send({ type: 'step_start', step: 'insight', message: 'Extracting insight...' })

        const industry = input.industry || inferIndustryFromResearch(researchText)
        const netsuiteContext = formatContextForPrompt(getIndustryContext(industry))

        const identity = identityPrompt({ erpDetection, employeeCount: input.employeeCount })
        const tone = toneRules()
        const researchUser = researchPrompt({
          company: input.company,
          url: input.url ?? '',
          research: researchText,
          netsuiteContext,
        })

        const { object: insight } = await generateObject({
          model,
          system: `${identity}\n\n${tone}\n\nYour task: extract a structured insight about this company from the research below. Identify their channels, growth moves, likely systems, AI tools, a genuine observation, and a pain hypothesis.`,
          prompt: researchUser,
          schema: InsightSchema,
        })

        send({ type: 'step_complete', step: 'insight', data: insight })

        // ── Step 3: Cover Letter ──────────────────────────────────────────
        send({ type: 'step_start', step: 'coverLetter', message: 'Writing cover letter...' })

        const firstName = extractFirstName(input.recipientName)
        const hasRealName = firstName.length > 0 && !['chief', 'director', 'officer', 'manager', 'growth', 'president', 'board'].some((w) => firstName.toLowerCase().includes(w))

        let erpSection = ''
        if (erpDetection?.isNetSuite) {
          erpSection = `ERP DETECTION: This company ALREADY USES NETSUITE. DO NOT pitch "switch to NetSuite." Pitch optimisation, health-check, rescue, or expansion.`
        } else if (erpDetection?.hasErp && erpDetection.erpName) {
          erpSection = `ERP DETECTION: This company uses ${erpDetection.erpName}. Pitch migration/modernisation to NetSuite.`
        }

        const { object: coverLetter } = await generateObject({
          model,
          system: `${identityPrompt({ erpDetection, employeeCount: input.employeeCount })}\n\n${toneRules()}\n\n${formattingRules()}\n\n${coverLetterSystemPrompt()}`,
          prompt: coverLetterUserPrompt({
            firstName,
            hasRealName,
            jobTitle: input.jobTitle,
            company: input.company,
            observation: insight.observation,
            painHypothesis: insight.painHypothesis,
            erpSection,
            notes: input.notes,
          }),
          schema: CoverLetterSchema,
        })

        send({ type: 'step_complete', step: 'coverLetter', data: coverLetter })

        // ── Step 4: Business Case ─────────────────────────────────────────
        send({ type: 'step_start', step: 'businessCase', message: 'Writing business case...' })

        const { object: businessCase } = await generateObject({
          model,
          system: `${identityPrompt({ erpDetection, employeeCount: input.employeeCount })}\n\n${toneRules()}\n\n${formattingRules()}\n\n${businessCaseSystemPrompt()}`,
          prompt: businessCaseUserPrompt({
            company: input.company,
            channels: insight.channels,
            observation: insight.observation,
            painHypothesis: insight.painHypothesis,
            notes: input.notes,
          }),
          schema: BusinessCaseSchema,
        })

        send({ type: 'step_complete', step: 'businessCase', data: businessCase })

        // ── Step 5: Tech Map ──────────────────────────────────────────────
        send({ type: 'step_start', step: 'techMap', message: 'Building technology map...' })

        const { object: techMap } = await generateObject({
          model,
          system: `${identityPrompt({ erpDetection, employeeCount: input.employeeCount })}\n\n${toneRules()}\n\n${formattingRules()}\n\n${techMapSystemPrompt()}`,
          prompt: techMapUserPrompt({
            company: input.company,
            channels: insight.channels,
            likelySystems: insight.likelySystems,
            notes: input.notes,
          }),
          schema: TechMapSchema,
        })

        send({ type: 'step_complete', step: 'techMap', data: techMap })

        // ── Step 6: Cross-Validation ─────────────────────────────────────
        send({ type: 'step_start', step: 'review', message: 'Checking consistency...' })

        // Enforce specific case study naming
        const ALLOWED_CASE_STUDIES = ['Eco2Solar', 'Kynetec', 'Totalkare', 'Carallon']
        const caseStudyText = businessCase.caseStudy || ''
        const hasNamedCaseStudy = ALLOWED_CASE_STUDIES.some((name) =>
          caseStudyText.includes(name)
        )
        if (!hasNamedCaseStudy) {
          // Force Totalkare as the default — it covers manufacturing, distribution, and service
          businessCase.caseStudy = `Totalkare, a UK manufacturer and distributor of heavy vehicle lifting equipment, faced the same structural issue: separate systems for manufacturing BOMs, stock management, finance, and service contracts meant no visibility of true product profitability. After moving to NetSuite, they have a single platform from order through production to service contract, with real-time visibility of product and service margins.`
          // Re-assemble fullText with corrected case study
          const parts = businessCase.fullText.split('\n\n')
          const caseStudyIdx = parts.findIndex((p) =>
            p.toLowerCase().includes('case study') || p.toLowerCase().includes('totalkare') || p.toLowerCase().includes('eco2solar') || p.toLowerCase().includes('kynetec') || p.toLowerCase().includes('carallon')
          )
          if (caseStudyIdx >= 0) {
            parts[caseStudyIdx] = businessCase.caseStudy
            businessCase.fullText = parts.join('\n\n')
          }
        }

        // Ensure tech map includes systems from the business case insight
        const techMapSystems = new Set(techMap.rows.map((r) => r.system.toLowerCase()))
        const missingSystems = insight.likelySystems.filter(
          (s) => !techMapSystems.has(s.toLowerCase()) && !techMapSystems.has(s.toLowerCase().replace(/[^a-z0-9]/g, ''))
        )
        if (missingSystems.length > 0 && techMap.rows.length < 10) {
          // Add missing inferred systems as "Integrate" or "Replace" rows
          for (const sys of missingSystems.slice(0, 3)) {
            const isAccounting = /xero|sage|quickbooks|dynamics/.test(sys.toLowerCase())
            const isSpreadsheet = /excel|spreadsheet|sheet/.test(sys.toLowerCase())
            techMap.rows.push({
              system: sys,
              relationship: isSpreadsheet ? 'Eliminate' : isAccounting ? 'Replace' : 'Integrate',
              meaning: `${sys} becomes part of the unified NetSuite record, removing manual reconciliation between systems.`,
            })
          }
          // Re-assemble fullText
          const tableLines = techMap.rows.map((r) =>
            `| ${r.system} | ${r.relationship} | ${r.meaning} |`
          )
          techMap.fullText = `${techMap.title}\n\n${techMap.subtitle}\n\n| System | Relationship | What it means for ${input.company} |\n|---|---|---|\n${tableLines.join('\n')}\n\n${techMap.cta}`
        }

        const part1 = coverLetter.fullText
        const part2 = businessCase.fullText
        const part3 = techMap.fullText

        const output: PipelineOutput = {
          part1,
          part2,
          part3,
          insight,
          coverLetter,
          businessCase,
          techMap,
        }

        send({ type: 'step_complete', step: 'review' })
        send({ type: 'complete', data: output })
        controller.close()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown pipeline error'
        send({ type: 'step_error', step: 'pipeline', message })
        controller.close()
      }
    },
  })
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PipelineInput

    if (!body.company || !body.recipientName || !body.jobTitle) {
      return new Response('Missing required fields', { status: 400 })
    }

    const stream = createPipelineStream(body)

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(`Pipeline failed: ${message}`, { status: 500 })
  }
}
