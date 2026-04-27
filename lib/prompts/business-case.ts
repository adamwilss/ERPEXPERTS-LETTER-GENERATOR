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

1. OPENING: Open with their specific operational reality. Name their actual channels and complexity. Two or three sentences maximum.

2. THE AI THREAD: One short paragraph on why fragmented data was manageable before but is becoming a problem now. The thread is AI -- their AI tools can only see part of the picture if their data is split across multiple systems.

3. THE OUTCOME: One short paragraph on what a single integrated platform actually means for them. Not features, but outcomes. What does good look like for this specific business?

4. CASE STUDY: One brief case study reference. Two or three sentences. Focus on the mechanism, not the client's industry. Use Eco2Solar, Kynetec, Totalkare, or Carallon if relevant. If none fits closely, use an anonymised "similar profile" example.

5. CLOSE: Exactly this line: "Fixed price. Senior-led. No surprises."`
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
1. OPEN with their specific operational reality -- name their actual channels and complexity. 2-3 sentences max.
2. One short paragraph on why fragmented data was manageable before but is becoming a problem now. The thread is AI.
3. One short paragraph on what a single integrated platform actually means for them -- outcomes, not features.
4. One brief case study reference (2-3 sentences). Focus on mechanism, not industry.
5. Close EXACTLY with: "Fixed price. Senior-led. No surprises."
6. No em dashes. No generic openers. No "fragmented systems", "manual reconciliation", "operational chaos".
7. Short sentences. Specific. Direct. Label nothing as "illustrative".
${notes ? `\nAdditional notes from the user:\n${notes}` : ''}

Now write the business case.`
}
