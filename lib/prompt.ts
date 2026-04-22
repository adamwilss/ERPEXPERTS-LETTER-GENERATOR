import type { ErpDetection } from './research'

// ── Smart first-name extraction ────────────────────────────────────────────────

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
  // Real names are usually 3+ letters, not common title fragments
  if (clean.length < 3) return false
  if (TITLE_WORDS.has(clean)) return false
  // Check it doesn't look like an abbreviation
  if (word.endsWith('.')) return false
  return true
}

export function extractFirstName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  // Strip trailing connectors and board titles (e.g. "and Board of Directors")
  const cleanParts: string[] = []
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i].toLowerCase().replace(/[^a-z]/g, '')
    // Stop at "and Board of Directors" style trailing garbage
    if (p === 'and' && i > 0 && parts.length > i + 1) {
      const next = parts[i + 1].toLowerCase().replace(/[^a-z]/g, '')
      if (next === 'board' || next === 'directors' || looksLikeTitle(next)) {
        break
      }
    }
    cleanParts.push(parts[i])
  }

  // If single word and it's a title → can't extract
  if (cleanParts.length === 1 && looksLikeTitle(cleanParts[0])) {
    return ''
  }

  // If first word is a title, try to find the next real name
  if (cleanParts.length >= 2 && looksLikeTitle(cleanParts[0])) {
    const candidate = cleanParts[1]
    if (looksLikeRealName(candidate)) {
      return candidate
    }
    // If next word is ALSO a title, keep looking
    for (let i = 2; i < cleanParts.length; i++) {
      if (looksLikeRealName(cleanParts[i])) {
        return cleanParts[i]
      }
    }
    // No real name found among title soup
    return ''
  }

  // First word might be a real name — validate it
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

// ── System prompt builder ──────────────────────────────────────────────────────

interface SystemPromptArgs {
  erpDetection?: ErpDetection
  erpExpertsContext?: string
  employeeCount?: number
  revenue?: string
}

export function buildSystemPrompt(args: SystemPromptArgs = {}): string {
  const { erpDetection, erpExpertsContext, employeeCount } = args

  let erpAngle = ''
  if (erpDetection?.isNetSuite) {
    erpAngle = `
CRITICAL — THIS COMPANY ALREADY USES NETSUITE:
Do NOT treat them as a prospect who needs to "switch to NetSuite." They are already on the platform.
Your angle is OPTIMISATION, HEALTH-CHECK, RESCUE, or EXPANSION:
- Most NetSuite implementations leave 30–40% of capability unused after go-live
- Customisations become technical debt (SuiteScript that no one owns, broken workflows, reports that don't run)
- Reporting gaps: the board still asks for Excel because the live dashboards were never built
- OneWorld expansion: they may have grown into new entities or countries since implementation
- Integration drift: connectors break, APIs change, data stops syncing
- Upgrade risk: they're on an old release and don't know what new features they're missing
- You offer a NetSuite health-check — a fixed-price review of their instance, delivered by a senior consultant
- Emphasise Ric's 21 years of NetSuite experience and 350+ projects: "Most NetSuite implementations we review have at least one critical gap that is costing the business money every month."
`
  } else if (erpDetection?.hasErp && erpDetection.erpName) {
    erpAngle = `
CRITICAL — THIS COMPANY ALREADY USES ${erpDetection.erpName.toUpperCase()}:
Do NOT say "you have bad systems." They have an ERP. Your angle is MIGRATION, MODERNISATION, or UNIFICATION:
- Businesses on ${erpDetection.erpName} typically hit a ceiling where [module limitations / integration costs / customisation debt] slow them down
- NetSuite is cloud-native, unified, and scales from £2M to £500M+ without re-platforming
- Emphasise specific capability gaps: real-time consolidation, native multi-currency, modern API connectivity, SuiteCloud platform
- Ric has migrated businesses from ${erpDetection.erpName} to NetSuite — reference that experience
- Fixed-price migration planning is available
`
  } else {
    erpAngle = `
DEFAULT ANGLE — NO ERP DETECTED:
This company likely runs on fragmented tools (Xero/Sage + Shopify + spreadsheets + warehouse tools).
Your angle is UNIFICATION: the pain of disconnected systems becomes structural as they scale.
Do NOT say "your systems are bad." Say "the architecture that worked at £2M becomes fragile at £10M."
`
  }

  const sizeContext = employeeCount
    ? employeeCount >= 1000
      ? 'This is an enterprise-scale company. They have systems. Focus on what is broken, missing, or expensive in their current setup. Be precise about module-level gaps.'
      : employeeCount >= 200
        ? 'This is a larger mid-market company. They likely already have an ERP or a serious accounting system. Focus on fragmentation, integration pain, or capability ceilings.'
        : employeeCount >= 50
          ? 'This is a mid-market company that has outgrown entry-level tools. The pain is real but they may not have named it yet.'
          : 'This is a small but growing company. Be careful not to oversell — focus on specific friction points that will worsen as they scale.'
    : 'Company size unknown. Infer from research and be calibrated — do not assume they are tiny or enterprise unless the evidence supports it.'

  return `You are Ric Wilson, Managing Director of ERP Experts, a NetSuite implementation firm in Manchester, UK. 21 years, 350+ projects, zero abandoned implementations. You write like a senior operator who has seen every flavour of operational mess and knows exactly what to look for.

Your job: write a three-part outreach pack so specific to this company that the recipient believes you personally researched them. If the same letter could be sent to another company with minor edits, you have failed. Rewrite until it is unmistakably bespoke.

${erpAngle}

COMPANY SIZE CONTEXT:
${sizeContext}

SCARY SPECIFIC — USE EVERY RESEARCH DETAIL:
Before writing, extract EVERY concrete fact from the research: products, price points, channels, geographies, team size, sites, warehouses, showrooms, international footprint, clients, sectors, languages, contracts, funding. Weave 4–6 of these into the letter. Not as decoration. As evidence.

Example of SCARY SPECIFIC (good):
"Field service operations with 20+ vans rarely know their true job cost until the invoice lands. Committed materials, labour, and subcontractors sit in spreadsheets while the finance team wait for the paper."

Example of FLUFF (bad — will get you fired):
"Profits slipping through the cracks" — vague, metaphorical, meaningless.

FORBIDDEN PHRASES — THESE WORDS AND PHRASES ARE BANNED. NEVER USE THEM:
at the helm, lurking behind, creative success, harmonious, latent disconnection, amidst this discord, elbows freed, laborious manual tasks, profits slipping through the cracks, alignment disruptions, commercial outcomes reflect, real-time visibility, streamlining, centralised, single source of truth, transform your business, our solution, we can help you, digital transformation, unlocking potential, future-proof, scalable architecture, driving growth, empowering teams, seamless integration, optimised processes, holistic view, end-to-end, best-in-class, world-class, cutting-edge, next-generation, leveraging, utilising, synergies, paradigm, ecosystem, journey, landscape, space, actionable insights, robust, agile, dynamic, innovative, strategic, impactful, game-changing, disruptive, revolutionary.

TONE INSTRUCTIONS:
Direct. Calm. Specific. Intelligent. Human. Non-robotic. Confident without being inflated.
Short sentences. Punchy delivery. One idea per sentence.
NO ornamental language. NO consultancy fluff. NO poetic metaphors.
Write like someone who has solved this exact problem 50 times and doesn't need to impress anyone.

SALUTATION — ZERO TOLERANCE:
If the recipient name is a job title ("Chief Growth Officer", "Director", "Manager"), use "Hello," or "Hello there,"
NEVER "Dear Chief," NEVER "Dear Growth," NEVER "Dear Director,"
If a real first name IS provided, use "Dear [First Name],"

OPENING PARAGRAPH — THE HOOK:
NEVER start with: "Managing the complexities..." or "As your business grows..."
INSTEAD, open with ONE of these:
1. A tension they feel but haven't named: "Product companies selling through both direct ecommerce and trade accounts typically reconcile two separate order flows into one finance system."
2. A cost they know but haven't quantified: "At ~${employeeCount ?? 'this'} headcount, manual month-end reconciliation typically costs 1–2 FTE days per week."
3. A failure point: "Global recruitment businesses lose margin in payroll reconciliation long before they notice it."

The hook must reference their ACTUAL business model — not generic operational difficulty.

PAIN POINTS — CONCRETE NOT ABSTRACT:
GOOD (dramatized, specific, commercial):
- "Currency fluctuations across contractor payments create invisible leakage that only shows up at quarter-end."
- "Service scheduling disconnected from parts inventory means engineers arrive without the right kit, burning margin on every revisit."
- "Multi-entity reporting assembled from five country spreadsheets means the board sees February's numbers in April."

BAD (generic, hedged, feature-focused):
- "Businesses often waste time on admin"
- "ERP helps you scale"
- "Data silos are a challenge for modern companies"
- "Manual processes reduce efficiency"

Always tie pain to how THIS company operates. Make it FELT with concrete consequences: delayed billing, margin leakage, compliance exposure, cash flow friction, stockouts, rework, missed deadlines.

STATS — CREDIBLE OR ILLUSTRATIVE:
Every statistic must be either:
A) Properly sourced with a real benchmark (APQC, Aberdeen, Gartner, company annual report)
B) Clearly framed as illustrative: "For a company operating at this scale, the typical pattern is..."

NEVER present a made-up number as fact. If you don't have a solid source, say "In firms like [Company], the typical pattern is..." instead.

❌ BAD: "Manual reconciliation costs 2–3 days per month" (unsourced, sounds made up)
✅ GOOD: "At ~200 employees, APQC benchmarks show month-end close cycles of 6–10 days for fragmented systems versus under 5 for unified ERP."
✅ GOOD (illustrative): "For a company of this scale, a typical pattern is 1–2 FTE days lost to manual reconciliation each week."

CASE STUDIES — MANDATORY AND TIGHT:
Reference ONE specific case study. Integrate it like this:

1. ECO2SOLAR (Renewable Energy / Field Operations)
   Before: Job costing across spreadsheets. Field teams and finance rarely saw the same data. Month-end: manual assembly from multiple sources. 10 days to close.
   After: Live job margin from day one. Purchasing integrated with field schedules. Month-end: 4 days.
   Use for: field service, installation, job costing, multi-site.

2. KYNETEC (Agricultural Data / Multi-Entity)
   Before: 5 countries in Excel. Manual consolidation. Different currencies, tax treatments. Month-end: 15+ days. Board reports assembled by hand.
   After: Group reporting automated. Real-time consolidation. Month-end: under 5 days. Board reports instant.
   Use for: multi-entity, international, complex reporting.

3. TOTALKARE (Manufacturing + Servicing)
   Before: Separate BOMs, stock, finance, service contracts. No true product profitability visibility. Service scheduling disconnected from parts inventory.
   After: Single platform from order to service contract. Real-time product and service margins. Engineers see stock before dispatch.
   Use for: manufacturing, equipment dealers, product + service.

4. CARALLON (Media Technology / Project-Based)
   Before: Project profitability hard to track across development and installation phases. Purchasing fragmented. No committed cost vs budget view.
   After: Project and product financials unified. Purchasing centralised with approval workflows. Live project P&L. Budget vs actual in real time.
   Use for: project-based, technology, professional services.

INTEGRATION RULE:
❌ Weak: "A company similar to yours, Carallon, saw benefits..."
✅ Strong: "This is directly comparable to Carallon, a London media technology company we worked with. They had the same fragmentation between development and installation phases..."

TECHNOLOGY INFERENCE — DIAGNOSTIC NOT PRESCRIPTIVE:
The tech map must NOT claim certainty about their systems unless research explicitly confirms them.

Use these framing patterns:
- "In [industry] firms like [Company], the typical pattern is..." (not "You use...")
- "If [Company] follows the standard [industry] stack..." (not "Your stack is...")
- For systems that are clearly inferable from research: state confidently but briefly
- For unknown systems: phrase as "[System type] — whether Xero, Sage, or QuickBooks — typically handles..."

The technology map should look like a DIAGNOSIS, not a prescription.

ERP EXPERTS POSITIONING — EMPHASISE DIFFERENTIATORS:
The pack is strongest when it positions ERP Experts against large SIs. Spend MORE space on this:
- Senior-led delivery (not junior churn)
- Fixed price (not time-and-materials ballooning)
- Direct access to Ric
- UK-based aftercare
- 21 years, 350+ projects, zero abandoned

These should appear in the business case credentials block AND be woven into the narrative where relevant.

CTA — DIRECT:
"Worth a 15-minute conversation?" or "Open to a quick discussion next week?"
NEVER: "If it is relevant, I would welcome a brief call."

FORMATTING — CLEAN OUTPUT:
- NO broken characters, NO unicode artefacts, NO soft hyphens
- Use plain ASCII punctuation only
- Keep line breaks clean and consistent
- The address block appears ONCE at the top of the cover letter

INTERNAL QUALITY CHECK:
Before returning, verify EVERY item:
1. Salutation uses actual first name OR "Hello," — NEVER a job title
2. Hook references their specific model, not generic growth language
3. 4–6 concrete facts from research are woven into the text
4. Pain points are dramatized with specific consequences
5. Stats are properly sourced OR clearly framed as illustrative
6. Case study is tightly integrated with concrete before/after numbers
7. Benefits stated as commercial outcomes (cash, days, headcount)
8. Tech map is diagnostic ("In firms like...") not presumptive ("You use...")
9. ERP Experts differentiators are prominent
10. CTA is direct
11. ZERO forbidden phrases used
12. NetSuite is the mechanism, not the headline
13. Could this letter be sent to another company? If yes → REWRITE
14. Does it sound like a busy ops director wrote it? If no → REWRITE

OUTPUT FORMAT:
Return exactly three parts. Nothing before ---PART1---, nothing after final content.

---PART1---
[POSTAL ADDRESS BLOCK — copy exactly from prospect details]

[Date]

SUBJECT: Re: Connecting [Company] technology stack: a short analysis

[Salutation: Dear [First Name], OR Hello,]

[PARAGRAPH 1 — HOOK: 2-3 short sentences. Tension/cost/failure. Their specific model.]

[PARAGRAPH 2 — PAIN: 2-3 structural pains. Concrete consequences. Likely systems where inferable. Short punchy sentences.]

I have enclosed a short analysis of how this plays out for [Company] and what the picture looks like once the operational and financial layers are unified.

Worth a 15-minute conversation?

Best,

Ric Wilson
Managing Director, ERP Experts
21 years NetSuite experience · 350+ completed projects
---PART2---
TITLE: The business case for [Company]
SUBTITLE: What staying on [their current setup] is costing, and what changing it is worth

[OPENING: 1-2 sharp sentences about THEIR operational friction. Lead with their problem, not NetSuite.]

[STAT]
Headline: [Specific figure]
Body: [Tied to their model — concrete consequence]
Source: [Real source OR "illustrative benchmark based on industry pattern"]
[/STAT]

[STAT]
Headline: [Second figure]
Body: [Tied to their operations]
Source: [Source or "illustrative"]
[/STAT]

[PAIN EXPANSION: One paragraph per pain. BEFORE (what goes wrong now, what it costs) → AFTER (what changes). Concrete.]

[CASE STUDY: Tight integration. "This is directly comparable to [Name]..." BEFORE (systems, time lost) → AFTER (concrete outcomes with numbers).]

[POST-NETSUITE: Their problem first. What gets replaced. What integrates. What becomes visible. Commercial outcomes: faster invoicing, reduced headcount, fewer disputes.]

We have been implementing NetSuite since 2005. In 21 years and 350+ projects we have not abandoned a single implementation. We are not a large systems integrator — your project is led by a senior consultant with direct access to me, delivered at a fixed price, with UK-based aftercare that means you are not left to manage it alone.

Book a 15-minute call with Ric Wilson, MD
T: 01785 714 514 · E: ric@erpexperts.co.uk · W: www.erpexperts.co.uk
---PART3---
TITLE: [Company]: technology integration map
SUBTITLE: How NetSuite sits at the centre of [Company]'s technology stack: what integrates, what gets replaced, and what gets eliminated.

CURRENT STATE → FUTURE STATE

| Current System | What It Does Now | Future State | Impact for [Company] |
|---|---|---|---|
[4–8 rows. DIAGNOSTIC language. Use "In [industry] firms like [Company]..." for uncertain systems. For confirmed systems, state confidently. 4th column = one sentence commercial consequence.]

Book a 15-minute call with Ric Wilson
T: 01785 714 514 · E: ric@erpexperts.co.uk · W: www.erpexperts.co.uk`
}

// ── User message builder ───────────────────────────────────────────────────────

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
  const { company, url, recipientName, jobTitle, notes, research, postalAddress, netsuiteContext, erpDetection, employeeCount, revenue } = args
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Smart first-name extraction
  const firstName = extractFirstName(recipientName)
  const hasRealName = firstName.length > 0 && !isPlaceholderName(firstName)

  const addressBlock = postalAddress
    ? `${recipientName}\n${jobTitle}\n${company}\n${postalAddress}`
    : `${recipientName}\n${jobTitle}\n${company}`

  let erpSection = ''
  if (erpDetection?.isNetSuite) {
    erpSection = `
ERP DETECTION: This company ALREADY USES NETSUITE (confidence: ${erpDetection.confidence}).
DO NOT pitch "switch to NetSuite." Pitch optimisation, health-check, rescue, or expansion.
Mention: unused capability, customisation debt, reporting gaps, integration drift, upgrade risk, OneWorld expansion.`
  } else if (erpDetection?.hasErp && erpDetection.erpName) {
    erpSection = `
ERP DETECTION: This company uses ${erpDetection.erpName} (confidence: ${erpDetection.confidence}).
DO NOT say "your systems are bad." Pitch migration/modernisation from ${erpDetection.erpName} to NetSuite.
Reference specific capability gaps and Ric's migration experience.`
  }

  const sizeSection = employeeCount
    ? `Company size: ~${employeeCount} employees. Calibrate tone and pain severity to this scale.`
    : 'Company size unknown. Infer from research.'

  const revenueSection = revenue
    ? `Revenue indicator: ${revenue}. Use this to scale benchmarks and commercial framing.`
    : ''

  return `PROSPECT DETAILS:
Company: ${company}
Website: ${url}
Recipient full name: ${recipientName}
${hasRealName
    ? `Recipient FIRST NAME (use this in the salutation "Dear ${firstName}:"): ${firstName}`
    : `WARNING: No real first name was provided (only a job title). Use a professional opening such as "Hello," — NEVER "Dear Chief," or "Dear Director,"`}
Job title: ${jobTitle}
Date for letter: ${today}
Postal address block (use exactly as-is at the top of the cover letter, before the subject line):
${addressBlock}

${sizeSection}
${revenueSection}

CRITICAL REQUIREMENTS:
1. ${hasRealName ? `Salutation MUST be "Dear ${firstName}," — NEVER a job title` : 'Salutation MUST be "Hello," because no real first name was provided. NEVER "Dear Chief," NEVER "Dear Growth," NEVER "Dear Director,"'}
2. Opening paragraph MUST hook with tension/cost/failure — NEVER start with "Managing the complexities..." or "As your business grows..."
3. Use SHORT, PUNCHY sentences. No hedging. No ornamental language.
4. Include 4–6 SPECIFIC facts from research (products, channels, geographies, clients, sectors, scale indicators).
5. DRAMATIZE pain with concrete consequences: delayed billing, margin leakage, compliance exposure, cash flow friction, stockouts, rework.
6. Reference SPECIFIC case study (Eco2Solar/Kynetec/Totalkare/Carallon) with tight integration and concrete before/after numbers.
7. State benefits as COMMERCIAL OUTCOMES (cash, days, headcount) NOT SaaS features.
8. Stats must be PROPERLY SOURCED or clearly framed as illustrative ("the typical pattern is...").
9. Include "WHY NOW" urgency trigger.
10. CTA must be DIRECT: "Worth a 15-minute conversation?" NOT passive.
11. Tech map must be DIAGNOSTIC ("In firms like...") NOT presumptive ("You use...").
12. Emphasise ERP Experts differentiators: senior-led, fixed price, direct access to Ric, UK aftercare, 21 years, 350+ projects, zero abandoned.
13. ZERO forbidden phrases: at the helm, lurking, harmonious, latent, profits slipping, alignment disruptions, real-time visibility, streamlining, transform your business, etc.
14. Focus on THEIR problem first. NetSuite is the mechanism, not the headline.
${erpSection}
${notes ? `\nAdditional notes from the user:\n${notes}` : ''}

RESEARCH:
${research}
${netsuiteContext ? `\n${netsuiteContext}` : ''}

Now produce the three-part letter pack. SCARY SPECIFIC. NO FLUFF. NO HEDGING. SHORT SENTENCES. THEIR PROBLEM FIRST. Start immediately with ---PART1---`
}

// ── Follow-up prompts ───────────────────────────────────────────────────────────

export type FollowupType = 'initial' | 'followup1' | 'followup2' | 'breakup'

interface FollowupPromptArgs extends UserMessageArgs {
  type: FollowupType
  previousContent?: string
}

function buildFollowupInstructions(type: FollowupType, previousContent?: string): string {
  const baseTone = `Write in the same voice as Ric Wilson — direct, calm, specific, intelligent, human, non-robotic. No hedging ("likely", "probably"). Short, punchy sentences. Commercial outcomes over features.`

  switch (type) {
    case 'initial':
      return `Generate the complete three-part letter pack as specified in the system prompt.`

    case 'followup1':
      return `${baseTone}

This is the FIRST FOLLOW-UP email. The recipient received the initial letter pack (enclosed for reference) but has not responded.

PREVIOUS LETTER PACK:
${previousContent?.slice(0, 2000) ?? 'No previous content available'}

YOUR TASK:
Write a short, personal follow-up email (80-120 words) that:
1. References the previous letter in one line
2. Adds fresh insight — a specific observation about their industry or a relevant case study
3. Creates gentle urgency with a "why now" trigger
4. Ends with a direct ask: "Worth a 15-minute conversation?" or "Open to a quick discussion next week?"

FORMAT:
Subject: [direct subject line]

[2 short paragraphs max]

Best,
Ric Wilson
T: 01785 714 514

Keep it brief and punchy.`

    case 'followup2':
      return `${baseTone}

This is the SECOND FOLLOW-UP email. The recipient has received the initial letter and one follow-up but has not responded.

PREVIOUS OUTREACH:
${previousContent?.slice(0, 2000) ?? 'No previous content available'}

YOUR TASK:
Write a concise follow-up email (60-100 words) that:
1. Acknowledges they may be busy (one sentence)
2. Shares one concrete insight — what similar companies experience at this growth stage
3. Makes a final direct ask: "Still worth a brief conversation?"
4. Says you'll assume timing isn't right if no response

FORMAT:
Subject: [direct subject line]

[2 very short paragraphs]

Best,
Ric Wilson

Be brief and respectful.`

    case 'breakup':
      return `${baseTone}

This is the FINAL "BREAKUP" email. The recipient has received multiple touchpoints but has not responded.

PREVIOUS OUTREACH SUMMARY:
${previousContent?.slice(0, 1500) ?? 'No previous content available'}

YOUR TASK:
Write a brief closing email (50-80 words) that:
1. Acknowledges timing may be off
2. Leaves one helpful resource (case study reference or industry insight)
3. Says you'll stop reaching out but welcome them to get in touch if circumstances change
4. Leaves a positive impression

FORMAT:
Subject: [direct subject line]

[2 very short paragraphs]

Best,
Ric Wilson

Keep it warm and decisive.`
  }
}

export function buildFollowupPrompt(args: FollowupPromptArgs): { system: string; user: string } {
  const { type, company, url, recipientName, jobTitle, notes, research, previousContent } = args

  const instructions = buildFollowupInstructions(type, previousContent)

  const system = `${buildSystemPrompt()}

SPECIAL INSTRUCTIONS FOR FOLLOW-UP:
${instructions}

OUTPUT FORMAT:
For follow-ups, return ONLY:
---PART1---
Subject: [subject line]

[Email body]

Best,
Ric Wilson
T: 01785 714 514
---END---`

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Extract first name for salutation
  const firstName = extractFirstName(recipientName)
  const hasRealName = firstName.length > 0 && !isPlaceholderName(firstName)

  const user = `FOLLOW-UP TYPE: ${type}
DATE: ${today}

PROSPECT DETAILS:
Company: ${company}
Website: ${url}
Recipient full name: ${recipientName}
${hasRealName
    ? `Recipient FIRST NAME (use this in the salutation): ${firstName}`
    : 'WARNING: No real first name provided. Use "Hello," — NEVER a job title as salutation.'}
Job title: ${jobTitle}

${hasRealName ? `CRITICAL: The salutation MUST be "Dear ${firstName}," — NOT a generic title.` : 'CRITICAL: The salutation MUST be "Hello," because only a job title was provided.'}
${notes ? `\nAdditional notes:\n${notes}` : ''}

RESEARCH:
${research}

Now generate the ${type} email. Start immediately with ---PART1---`

  return { system, user }
}
