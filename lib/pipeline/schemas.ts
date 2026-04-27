import { z } from 'zod'

// ── Step 2: Insight ──────────────────────────────────────────────────────────

export const InsightSchema = z.object({
  observation: z.string().describe('A specific, genuine observation about the company (1-2 sentences)'),
  painHypothesis: z.string().describe('A specific operational challenge framed as an assumption (2-3 sentences)'),
  channels: z.array(z.string()).describe('Sales channels they sell through'),
  growthMoves: z.array(z.string()).describe('Recent growth moves: new markets, channels, product lines'),
  likelySystems: z.array(z.string()).describe('Technology systems they likely use or would logically use'),
  aiTools: z.array(z.string()).describe('AI tools they are likely already using or would logically use'),
})

export type InsightOutput = z.infer<typeof InsightSchema>

// ── Step 3: Cover Letter ───────────────────────────────────────────────────

export const CoverLetterSchema = z.object({
  salutation: z.string(),
  taskmasterLine: z.string(),
  observation: z.string(),
  challenge: z.string(),
  netSuiteParagraph: z.string(),
  close: z.string(),
  signOff: z.string(),
  fullText: z.string().describe('The complete cover letter text, assembled'),
})

export type CoverLetterOutput = z.infer<typeof CoverLetterSchema>

// ── Step 4: Business Case ──────────────────────────────────────────────────

export const BusinessCaseSchema = z.object({
  opening: z.string().describe('Open with their specific operational reality (2-3 sentences)'),
  aiThread: z.string().describe('Why fragmented data is becoming a problem now (1 short paragraph)'),
  outcome: z.string().describe('What a single integrated platform means for them (1 short paragraph)'),
  caseStudy: z.string().describe('Brief case study reference (2-3 sentences)'),
  close: z.string().describe('Exactly: "Fixed price. Senior-led. No surprises."'),
  fullText: z.string().describe('The complete business case text, assembled'),
})

export type BusinessCaseOutput = z.infer<typeof BusinessCaseSchema>

// ── Step 5: Tech Map ───────────────────────────────────────────────────────

export const TechMapRowSchema = z.object({
  system: z.string(),
  relationship: z.enum(['Integrate', 'Replace', 'Eliminate', 'Native']),
  meaning: z.string().describe('What it means for this specific company'),
})

export const TechMapSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  rows: z.array(TechMapRowSchema),
  cta: z.string(),
  fullText: z.string().describe('The complete tech map as markdown text'),
})

export type TechMapOutput = z.infer<typeof TechMapSchema>
export type TechMapRow = z.infer<typeof TechMapRowSchema>

// ── Pipeline Event Types ───────────────────────────────────────────────────

export interface PipelineEvent {
  type: 'step_start' | 'step_complete' | 'step_error' | 'complete'
  step?: string
  message?: string
  data?: unknown
}

export interface PipelineInput {
  company: string
  url: string
  recipientName: string
  jobTitle: string
  notes?: string
  postalAddress?: string
  industry?: string
  employeeCount?: number
  revenue?: string
}

export interface PipelineOutput {
  part1: string
  part2: string
  part3: string
  insight: InsightOutput
  coverLetter: CoverLetterOutput
  businessCase: BusinessCaseOutput
  techMap: TechMapOutput
}
