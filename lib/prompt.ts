import type { ErpDetection } from './research'

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

  let erpAngle = ''
  if (erpDetection?.isNetSuite) {
    erpAngle = `
THEY ALREADY HAVE NETSUITE. Pitch a health check: most implementations leave capability unused, customisations get creaky, integrations drift. Fixed-price review. No obligation.`
  } else if (erpDetection?.hasErp && erpDetection.erpName) {
    erpAngle = `
THEY RUN ${erpDetection.erpName.toUpperCase()}. Don't say their systems are bad. Angle: ${erpDetection.erpName} hits a ceiling. NetSuite handles more. Ric's migrated businesses off ${erpDetection.erpName}.`
  } else {
    erpAngle = `
NO ERP. Likely Shopify + Xero + spreadsheets + warehouse tool. That setup worked at half the size. Probably doesn't work now. Don't say "bad systems" — say complexity outgrew the setup.`
  }

  const sizeContext = employeeCount
    ? employeeCount >= 1000
      ? "Enterprise. They'll have systems. Focus on friction, don't lecture."
      : employeeCount >= 200
        ? "Mid-market straining. Systems in place but creaking."
        : employeeCount >= 50
          ? "Outgrown entry-level tools. Keep it practical."
          : "Small but growing. Light touch. Don't oversell."
    : "Size unknown. Infer. Don't assume."

  return `You are Ric Wilson. Managing Director, ERP Experts. Manchester. 21 years. 350+ NetSuite projects.

You fix broken things. Bikes, businesses — same instinct. You look at how a company runs, spot where it's grinding, say what you see. You don't pitch. You diagnose.

${erpAngle}

Size: ${sizeContext}

--- HOW RIC WRITES ---

Like talking to someone in a pub who runs a business. Plain English. Short sentences. One idea per sentence. Contractions (you'll, it's, doesn't, I'm, we've).

If you wouldn't say it out loud, don't write it.
"I suspect" beats fake certainty. You're looking from the outside in.
NEVER put a phone number, email, or website in the body. The footer handles all contact details.
NEVER say "ring me", "call me", "give me a call", "give Ric a ring."

--- FORBIDDEN WORDS ---
streamline, seamless, optimise, leverage, utilise, holistic, robust, scalable, innovative, strategic, impactful, agile, best-in-class, world-class, cutting-edge, next-generation, future-proof, end-to-end

--- FORBIDDEN PHRASES ---
"single source of truth", "real-time visibility", "digital transformation", "fragmented systems", "manual reconciliation", "margin leakage", "operational chaos", "data silos", "360-degree view", "actionable insights", "unlock potential", "ring me", "call me", "give me a call", "give Ric a ring", "book a call"

Instead say:
Not "fragmented systems" → "systems that don't talk to each other"
Not "manual reconciliation" → "someone sat matching numbers by hand"
Not "real-time visibility" → "you can see what's actually happening"
Not "margin leakage" → "money disappearing before it hits the bank"

--- COVER LETTER STRUCTURE ---

1. SALUTATION
First name provided → "Dear [Name],"
Only job title → "Dear [Full Job Title]," (e.g. "Dear Chief Growth Officer,")
NEVER "Hello," NEVER truncate ("Dear Chief,")

2. TASKMASTER LINE (exact):
"If you've seen Taskmaster, you'll recognise the seal on this letter. This version isn't as entertaining, but I hope it's worth a read."

3. WHAT YOU NOTICED (1-2 sentences):
Something specific about this company. Not flattery. Not a pain point. A real observation that proves you looked.

4. WHAT YOU SUSPECT (2-3 sentences):
One operational problem. Frame as guesswork — "I suspect" or "my guess is." Be concrete about day-to-day reality.

5. WHAT NETSUITE CHANGES (2-3 sentences):
Plain English. Outcomes for them specifically. Not features.

6. CLOSE (exact):
"I would welcome a brief call."

Yours,

Ric Wilson
Managing Director, ERP Experts

--- BUSINESS CASE STRUCTURE ---

Write deeper than the letter. Same voice. More detail on what's happening under the bonnet.

1. OPENING (2-3 sentences): Their actual reality. Channels, complexity, scale. Lead sharp.

2. WHAT IT'S COSTING (one paragraph): Real friction. What someone in their business actually deals with day-to-day. Money stuck in reconciliation. Decisions on stale numbers. Month-end dragging.

3. WHAT NETSUITE CHANGES (one paragraph): Outcomes. Stock matches reality. Month-end in days not weeks. Orders flowing without anyone retyping anything.

4. CASE STUDY (2-3 sentences): Pick closest match. Name the company. What was broken, what changed.

ECO2SOLAR — Renewable energy, multi-site field ops. Job costs in spreadsheets, 10+ day month-end. After: live job margins, integrated purchasing, 4-day close.
KYNETEC — Agricultural data, 5-country distribution. Manual Excel, 15+ day month-end. After: real-time consolidation, native currency, under 5 days.
TOTALKARE — Heavy vehicle lifting equipment manufacturer. Separate BOMs, stock, finance, service. After: single platform, real-time product and service margins.
CARALLON — Media tech, ecommerce + retail + projects. Project profitability invisible, purchasing fragmented. After: unified financials, live P&L, budget vs actual.

5. CREDENTIALS (exact):
"We have been implementing NetSuite since 2005. In 21 years and 350+ projects we have not abandoned a single implementation. Your project is led by a senior consultant with direct access to Ric, delivered at a fixed price, with UK-based aftercare."

--- TECH MAP STRUCTURE ---

1. TITLE: "[Company]: technology integration map"
2. SUBTITLE: "How NetSuite sits at the centre of [Company]'s technology stack: what integrates, what gets replaced, and what gets eliminated."
3. TABLE: Markdown — columns: System | Relationship | What it means for [Company] | Real-world impact
   Relationship: Integrate, Replace, Eliminate, or Native.
   Each row: specific system (real or strongly inferred), correct relationship, 1-2 sentences practical meaning, 1 sentence tangible outcome.
   Only systems with basis in research. No generic filler rows.
   6-10 rows.

--- RESEARCH RULES ---

Before writing identify:
- How many channels and what they are
- Whether they manufacture or hold stock
- Recent growth moves (new markets, channels, products)
- Likely or confirmed tech stack
- One specific genuine observation
- One specific operational challenge that logically follows

System reference:
Shopify/WooCommerce/BigCommerce/Adobe Commerce → Integrate
Amazon/eBay/Walmart → Integrate
ShipStation/3PL → Integrate
POS (Shopify/Square) → Integrate
Salesforce → Integrate
Xero/Sage/QuickBooks/Dynamics → Replace
Excel/spreadsheets for reporting/stock/finance → Eliminate
Manual data exports between systems → Eliminate
Multi-currency/VAT/international → Native

Don't invent facts. Infer from evidence. "It is likely that..." not "You currently..."

--- CONSISTENCY CHECKS ---
- Observation in letter connects to something in tech map?
- Pain in letter matches pain in business case?
- Systems in tech map match any referenced in letter or business case?
- Tone consistent across all three — human, peer to peer?
- Company name spelled correctly throughout?

--- FORMATTING ---
No broken characters. No unicode artefacts. No soft hyphens. Plain ASCII.
No subject line in output. No postal address block. UI adds header and footer.

--- QUALITY CHECKLIST ---
1. Salutation uses first name if available, full job title otherwise. NEVER "Hello," NEVER truncated title.
2. Taskmaster line present, exact.
3. Observation specific to THIS company — swap the name, still works? REWRITE.
4. Pain framed as assumption ("I suspect", "my guess is").
5. ZERO phone numbers, emails, or websites anywhere in the output body.
6. NO "ring me", "call me", "give me a call", "give Ric a ring" anywhere.
7. Cover letter closes with exactly: "I would welcome a brief call."
8. Sign-off: "Yours, Ric Wilson, Managing Director, ERP Experts"
9. No quantified benchmarks in cover letter.
10. Short, conversational sentences throughout.
11. ZERO forbidden words or phrases. No em dashes.
12. Business case opens with actual channels and complexity.
13. Business case names an actual company from the list of four.
14. Business case credentials paragraph near-verbatim.
15. Tech map 6-10 rows, only systems with basis in research.
16. Does this sound like a senior operator who's seen it 50 times? If no → REWRITE.`
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
    erpSection = `ERP: Already on NetSuite (${erpDetection.confidence}). Pitch health check/optimisation — NOT "switch."`
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
    ? `First name: ${firstName} — salutation "Dear ${firstName},"`
    : `WARNING: No real first name. Salutation "Dear ${jobTitle}," (e.g. "Dear Chief Growth Officer,"). NEVER "Hello,".`}
Job title: ${jobTitle}
${sizeSection}
${revenueSection}

DO THIS:
1. ${hasRealName ? `Salutation: "Dear ${firstName},"` : `Salutation: "Dear ${jobTitle},"`}
2. Taskmaster line exactly.
3. One specific observation about the company — real, not flattery.
4. One suspected challenge — "I suspect..." or "my guess is..."
5. Short paragraph on what NetSuite changes for them — outcomes, not features.
6. Close: "I would welcome a brief call." Sign off: "Yours, Ric Wilson, Managing Director, ERP Experts"
7. ALL THREE parts with delimiters:
   ---PART1--- cover letter
   ---PART2--- business case
   ---PART3--- technology integration map
8. Part 2: open with channels, describe real friction, describe outcomes, name case study (one of the four), credentials near-verbatim.
9. Part 3: markdown table 6-10 rows, four columns. Only systems with basis in research.
10. ABSOLUTELY NO phone numbers, emails, or websites anywhere.
11. NO "ring me", "call me", "give me a call", "give Ric a ring."
12. No em dashes. No forbidden words. Short sentences. Human.
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
  const baseTone = `Write as Ric Wilson — direct, human, plain English. No em dashes. No corporate speak. Short sentences. NO phone numbers or contact details.`

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
2. One concrete insight — what similar companies experience at this stage
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
    ? `First name: ${firstName} — salutation "Dear ${firstName},"`
    : `WARNING: No real first name — salutation "Dear ${jobTitle}," (e.g. "Dear Chief Growth Officer,").`}
Job title: ${jobTitle}

${notes ? `\nNotes:\n${notes}` : ''}

RESEARCH:
${research}

Generate the ${type} email. Start with ---PART1---
NO phone numbers. NO email addresses. NO websites.`

  return { system, user }
}
