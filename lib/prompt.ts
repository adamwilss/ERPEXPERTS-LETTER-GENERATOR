import type { ErpDetection } from './research'
import { identityPrompt } from './prompts/identity'
import { toneRules } from './prompts/tone'
import { coverLetterSystemPrompt } from './prompts/cover-letter'
import { businessCaseSystemPrompt } from './prompts/business-case'
import { techMapSystemPrompt } from './prompts/tech-map'

// -- Smart first-name extraction ------------------------------------------------

const TITLE_WORDS = new Set([
  'chief', 'mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'sir', 'lord', 'director',
  'officer', 'manager', 'head', 'vp', 'vice', 'president', 'partner', 'founder',
  'owner', 'ceo', 'coo', 'cto', 'cfo', 'cmo', 'cio', 'md', 'chairman', 'growth',
  'marketing', 'sales', 'operations', 'finance', 'technology', 'digital', 'product',
  'commercial', 'business', 'general', 'executive', 'senior', 'junior', 'assistant',
  'deputy', 'associate', 'board', 'directors', 'member', 'lead', 'global',
])

const CONNECTORS = new Set(['and', '&', '+', 'of', 'for', 'to'])

function looksLikeTitle(word: string): boolean {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '')
  return TITLE_WORDS.has(clean)
}

function looksLikeRealName(word: string): boolean {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '')
  if (clean.length < 3) return false
  if (TITLE_WORDS.has(clean)) return false
  if (word.endsWith('.')) return false
  return true
}

export function extractFirstName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  const cleanParts: string[] = []
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i].toLowerCase().replace(/[^a-z]/g, '')
    if (p === 'and' && i > 0 && parts.length > i + 1) {
      const next = parts[i + 1].toLowerCase().replace(/[^a-z]/g, '')
      if (next === 'board' || next === 'directors' || looksLikeTitle(next)) {
        break
      }
    }
    cleanParts.push(parts[i])
  }

  if (cleanParts.length === 1 && looksLikeTitle(cleanParts[0])) {
    return ''
  }

  if (cleanParts.length >= 2 && looksLikeTitle(cleanParts[0])) {
    const candidate = cleanParts[1]
    if (looksLikeRealName(candidate)) {
      return candidate
    }
    for (let i = 2; i < cleanParts.length; i++) {
      if (looksLikeRealName(cleanParts[i])) {
        return cleanParts[i]
      }
    }
    return ''
  }

  if (cleanParts.length >= 1 && looksLikeRealName(cleanParts[0])) {
    return cleanParts[0]
  }

  return ''
}

function isPlaceholderName(name: string): boolean {
  const lower = name.toLowerCase()
  return (
    lower.includes('chief') ||
    lower.includes('director') ||
    lower.includes('officer') ||
    lower.includes('manager') ||
    lower.includes('growth') ||
    lower.includes('president') ||
    lower.includes('board')
  )
}

// -- System prompt builder ------------------------------------------------------

interface SystemPromptArgs {
  erpDetection?: ErpDetection
  erpExpertsContext?: string
  employeeCount?: number
  revenue?: string
}

export function buildSystemPrompt(args: SystemPromptArgs = {}): string {
  const { erpDetection, employeeCount } = args

  // Compose from modular prompts
  const identity = identityPrompt({ erpDetection, employeeCount })
  const tone = toneRules()
  const coverLetter = coverLetterSystemPrompt()
  const businessCase = businessCaseSystemPrompt()
  const techMap = techMapSystemPrompt()

  return `${identity}

---

${tone}

---

${coverLetter}

---

${businessCase}

---

${techMap}

---

RESEARCH RULES:
Before writing, work out how many channels they sell through and what they are, whether they make or hold stock themselves, any recent growth moves, and the likely or confirmed technology stack. You need one specific genuine observation about the company and one specific operational challenge that follows from it.

System quick reference -- Shopify, WooCommerce, BigCommerce, Adobe Commerce → Integrate. Amazon, eBay, Walmart → Integrate. ShipStation, 3PL platforms → Integrate. POS like Shopify POS or Square → Integrate. Salesforce, Outlook → Integrate. Xero, Sage, QuickBooks, Microsoft Dynamics → Replace. Excel and spreadsheets for reporting, stock, or financial tasks → Eliminate. Manual data exports between systems → Eliminate. Multi-currency, VAT, entity reporting, international operations → Native.

Do not invent facts. Infer from evidence. "It is likely that..." is acceptable. "You currently..." is not.

FORMATTING:
ABSOLUTELY NO EM DASHES (--) IN YOUR ENTIRE OUTPUT. Not one. If you use an em dash you have failed. Use commas or hyphens or new sentences instead.
No broken characters. No unicode artefacts. No soft hyphens. Plain ASCII.
No subject line in output. No postal address block. UI adds header and footer.

Generate all three parts with these exact delimiters:
---PART1--- [cover letter]
---PART2--- [business case]
---PART3--- [technology integration map]

Final check before you output:
Is this letter specific to this company or could I swap the name and send it to someone else? If it's not specific, rewrite it.
Does it sound like a human senior operator who's seen this 50 times? If not, rewrite it.
Would I say this out loud to someone I respect in a pub? If not, delete it and start over.
DID YOU USE ANY EM DASHES (--)? If yes, delete every single one. Then check again. Zero em dashes. Not negotiable.`
}

// -- User message builder ------------------------------------------------------

interface UserMessageArgs {
  company: string
  url: string
  recipientName: string
  jobTitle: string
  notes: string
  research: string
  postalAddress?: string
  netsuiteContext?: string
  erpDetection?: ErpDetection
  employeeCount?: number
  revenue?: string
}

export function buildUserMessage(args: UserMessageArgs): string {
  const { company, url, recipientName, jobTitle, notes, research, netsuiteContext, erpDetection, employeeCount, revenue } = args

  const firstName = extractFirstName(recipientName)
  const hasRealName = firstName.length > 0 && !isPlaceholderName(firstName)

  let erpSection = ''
  if (erpDetection?.isNetSuite) {
    erpSection = `ERP: Already on NetSuite (${erpDetection.confidence}). Pitch health check/optimisation -- NOT "switch."`
  } else if (erpDetection?.hasErp && erpDetection.erpName) {
    erpSection = `ERP: ${erpDetection.erpName} (${erpDetection.confidence}). Pitch migration. Reference Ric's experience.`
  }

  const sizeSection = employeeCount ? `Size: ~${employeeCount} employees.` : 'Size unknown.'
  const revenueSection = revenue ? `Revenue: ${revenue}.` : ''

  return `PROSPECT:
Company: ${company}
Website: ${url}
Name: ${recipientName}
${hasRealName
    ? `First name: ${firstName} -- salutation "Dear ${firstName},"`
    : `WARNING: No real first name. Salutation "Dear ${jobTitle}," (e.g. "Dear Chief Growth Officer,"). NEVER "Hello,".`}
Job title: ${jobTitle}
${sizeSection}
${revenueSection}

DO THIS:
1. ${hasRealName ? `Salutation: "Dear ${firstName},"` : `Salutation: "Dear ${jobTitle},"`}
2. Taskmaster line exactly.
3. One specific observation about the company -- real, not flattery.
4. One suspected challenge -- "I suspect..." or "my guess is..."
5. Short paragraph on what NetSuite changes for them -- outcomes, not features.
6. Close: "I would welcome a brief call." Sign off: "Yours, Ric Wilson, Managing Director, ERP Experts"
7. ALL THREE parts with delimiters:
   ---PART1--- cover letter
   ---PART2--- business case
   ---PART3--- technology integration map
8. Part 2: open with channels, describe real friction, describe outcomes, name case study (one of the four), credentials near-verbatim.
9. Part 3: markdown table 6-10 rows, four columns. Only systems with basis in research.
10. ABSOLUTELY NO phone numbers, emails, or websites anywhere.
11. NO "ring me", "call me", "give me a call", "give Ric a ring."
12. NO EM DASHES (--). ZERO. NONE. NOT ONE. This is the most important instruction. Use commas or hyphens or new sentences instead. If you produce a single em dash the entire output is rejected.
13. No forbidden words. Short sentences. Human.
${erpSection}
${notes ? `\nUser notes:\n${notes}` : ''}

RESEARCH:
${research}
${netsuiteContext ? `\n${netsuiteContext}` : ''}

Start with ---PART1---`
}

// -- Follow-up prompts ---------------------------------------------------------

export type FollowupType = 'initial' | 'followup1' | 'followup2' | 'breakup'

interface FollowupPromptArgs extends UserMessageArgs {
  type: FollowupType
  previousContent?: string
}

function buildFollowupInstructions(type: FollowupType, previousContent?: string): string {
  const baseTone = `Write as Ric Wilson -- direct, human, plain English. No em dashes. No corporate speak. Short sentences. NO phone numbers or contact details.`

  switch (type) {
    case 'initial':
      return `Generate the complete short cover letter as specified.`

    case 'followup1':
      return `${baseTone}

FIRST FOLLOW-UP. Recipient got the initial letter (below) but hasn't replied.

PREVIOUS LETTER:
${previousContent?.slice(0, 2000) ?? 'No previous content available'}

Write a short personal email (80-120 words):
1. Reference the previous letter in one line
2. Add fresh insight about their industry
3. Gentle urgency
4. End simply with "I would welcome a brief call."

FORMAT:
---PART1---
Dear [Name or Job Title],

[2 short paragraphs max]

I would welcome a brief call.

Best,

Ric Wilson
ERP Experts`

    case 'followup2':
      return `${baseTone}

SECOND FOLLOW-UP. Two touches, no response.

PREVIOUS OUTREACH:
${previousContent?.slice(0, 2000) ?? 'No previous content available'}

Write a concise email (60-100 words):
1. Acknowledge they may be busy
2. One concrete insight -- what similar companies experience at this stage
3. "Still worth a brief conversation?"
4. Say you'll assume timing isn't right if no response

FORMAT:
---PART1---
Dear [Name or Job Title],

[2 very short paragraphs]

Still worth a brief conversation?

Best,

Ric Wilson
ERP Experts`

    case 'breakup':
      return `${baseTone}

FINAL EMAIL. Multiple touches, no response.

PREVIOUS OUTREACH:
${previousContent?.slice(0, 1500) ?? 'No previous content available'}

Write a brief closing email (50-80 words):
1. Acknowledge timing may be off
2. Leave one helpful insight
3. Say you'll stop reaching out but welcome them to get in touch
4. Leave positive impression

FORMAT:
---PART1---
Dear [Name or Job Title],

[2 very short paragraphs]

Best,

Ric Wilson
ERP Experts`
  }
}

export function buildFollowupPrompt(args: FollowupPromptArgs): { system: string; user: string } {
  const { type, company, url, recipientName, jobTitle, notes, research, previousContent } = args

  const instructions = buildFollowupInstructions(type, previousContent)

  const system = `${buildSystemPrompt()}

FOLLOW-UP INSTRUCTIONS:
${instructions}`

  const firstName = extractFirstName(recipientName)
  const hasRealName = firstName.length > 0 && !isPlaceholderName(firstName)

  const user = `FOLLOW-UP: ${type}

PROSPECT:
Company: ${company}
Website: ${url}
Name: ${recipientName}
${hasRealName
    ? `First name: ${firstName} -- salutation "Dear ${firstName},"`
    : `WARNING: No real first name -- salutation "Dear ${jobTitle}," (e.g. "Dear Chief Growth Officer,").`}
Job title: ${jobTitle}

${notes ? `\nNotes:\n${notes}` : ''}

RESEARCH:
${research}

Generate the ${type} email. Start with ---PART1---
NO phone numbers. NO email addresses. NO websites.`

  return { system, user }
}
