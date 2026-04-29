// ── Business Case Builder ────────────────────────────────────────────────────

export interface BusinessCaseArgs {
  company: string
  channels: string[]
  observation: string
  painHypothesis: string
  caseStudy?: string
  notes?: string
}

export function businessCaseSystemPrompt(): string {
  return `--- BUSINESS CASE STRUCTURE -- FOLLOW THIS EXACTLY ---

The business case must follow this structure:

1. OPENING: Open with their specific operational reality. Name their actual channels and complexity. Two or three sentences maximum. Lead with something sharp and specific — not a generic claim.

2. THE COST OF FRAGMENTATION: One short paragraph on what disconnected systems are actually costing this business. Not abstract — name the real friction: reconciliation time, month-end lag, decisions made on stale data, AI tools that can only see half the picture.

3. THE NETSUITE OUTCOME: One paragraph on what changes with NetSuite at the centre. Specific to their channels and complexity. Not "efficiency" — real operational changes they would feel day-to-day.

4. CASE STUDY: One brief case study reference. Two or three sentences. Focus on the mechanism — what was broken, what changed, what the result was. Name the company clearly.

   You MUST use one of these four specific ERP Experts case studies. Choose the one with the closest operational parallel to this company:

   - ECO2SOLAR: Renewable energy installer with multi-site field operations. Before: Job costs tracked across spreadsheets, field and finance rarely saw same data, month-end took 10+ days. After: Live job margins from day one, purchasing integrated with field schedules, month-end reduced to 4 days.

   - KYNETEC: Agricultural data / multi-entity distribution. Before: Fragmented reporting across 5 countries, manual Excel consolidation, month-end 15+ days. After: Real-time group consolidation, currency handling native, month-end under 5 days.

   - TOTALKARE: UK manufacturer of heavy vehicle lifting equipment. Before: Separate systems for manufacturing BOMs, stock, finance, and service contracts. No true product profitability visibility. After: Single platform from order through production to service. Real-time product and service margins.

   - CARALLON: Media technology with ecommerce, retail showrooms, and installation projects. Before: Project profitability hard to track across phases, purchasing fragmented, no single view of committed costs. After: Project and product financials unified, live project P&L, budget vs actual in real time.

   NEVER invent a generic or anonymised case study. ALWAYS name one of the four above.

5. CREDENTIALS PARAGRAPH (copy near-verbatim):
"We have been implementing NetSuite since 2005. In 21 years and 350+ projects we have not abandoned a single implementation. Your project is led by a senior consultant with direct access to Ric, delivered at a fixed price, with UK-based aftercare."

6. CTA (copy exactly):
"Book a 15-minute call with Ric Wilson, MD"
T: 01785 336 253  ·  E: hello@erpexperts.co.uk  ·  W: www.erpexperts.co.uk`
}

export function businessCaseUserPrompt(args: BusinessCaseArgs): string {
  const { company, channels, observation, painHypothesis, caseStudy, notes } = args

  return `PROSPECT DETAILS:
Company: ${company}
Channels: ${channels.join(', ') || 'Unknown'}

PRE-EXTRACTED INSIGHTS (use these directly):
- Observation: ${observation}
- Pain hypothesis: ${painHypothesis}
${caseStudy ? `- Case study to reference: ${caseStudy}` : ''}

CRITICAL REQUIREMENTS:
1. OPEN with their specific operational reality — name their actual channels and complexity. 2-3 sentences max. Lead sharp.
2. One paragraph on what fragmentation is costing them — real friction, not abstract claims.
3. One paragraph on what NetSuite changes — outcomes they would feel, not feature lists.
4. One case study reference (2-3 sentences). You MUST name one of: Eco2Solar, Kynetec, Totalkare, or Carallon.
5. Credentials paragraph near-verbatim: "We have been implementing NetSuite since 2005..."
6. CTA EXACTLY: "Book a 15-minute call with Ric Wilson, MD" followed by "T: 01785 336 253  ·  E: hello@erpexperts.co.uk  ·  W: www.erpexperts.co.uk"
7. No em dashes. No generic openers. No "fragmented systems", "manual reconciliation", "operational chaos".
8. Short sentences. Specific. Direct. Label nothing as "illustrative".
9. No bullet points anywhere — prose flows like a real business analysis.
${notes ? `\nAdditional notes from the user:\n${notes}` : ''}

Now write the business case.`
}
