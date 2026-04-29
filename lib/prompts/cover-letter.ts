// ── Cover Letter Builder ─────────────────────────────────────────────────────

export interface CoverLetterArgs {
  firstName: string
  hasRealName: boolean
  jobTitle: string
  company: string
  observation: string
  painHypothesis: string
  erpSection?: string
  notes?: string
}

export function coverLetterSystemPrompt(): string {
  return `--- COVER LETTER STRUCTURE -- FOLLOW THIS EXACTLY ---

The letter must have six parts in this order:

1. SALUTATION
If a real first name IS provided, use "Dear [First Name],"
If NO real first name was provided, use "Dear [Job Title]," -- e.g. "Dear Chief Growth Officer," or "Dear Finance Director,"
NEVER "Dear Chief," NEVER "Dear Growth," NEVER "Dear Director," NEVER "Hello,"

2. TASKMASTER OPENING LINE (copy exactly):
"If you've seen Taskmaster, you'll recognise the seal on this letter. This version isn't as entertaining, but I hope it's worth a read."

3. THE GENUINE OBSERVATION (one or two sentences):
- Show you've actually looked at what they do
- Name something specific: a product decision, a market move, a channel they've just entered, something unusual about how they operate
- NOT a generic pain point. Something real.

4. THE SUSPECTED CHALLENGE (two or three sentences):
- One specific operational challenge that logically follows from your observation
- Frame it as an assumption, NOT as fact. Use "I suspect" or "my guess is"
- Invite them to correct you
- Be specific about what probably goes wrong day-to-day, not abstract

5. THE NETSUITE PARAGRAPH (one short paragraph, 3-5 sentences):
- Reference NetSuite specifically
- Keep it practical, not salesy
- Describe what it does for a company like theirs in plain language
- Mention ERP Experts' experience (21 years, brands like theirs)

6. CLOSE AND SIGN-OFF (copy exactly):
"Drop me a line if it's worth a conversation."

Yours,

_________________________
Ric Wilson
ERP Experts`
}

export function coverLetterUserPrompt(args: CoverLetterArgs): string {
  const { firstName, hasRealName, jobTitle, company, observation, painHypothesis, erpSection, notes } = args

  return `PROSPECT DETAILS:
Company: ${company}
Recipient: ${hasRealName ? firstName : jobTitle}
${hasRealName ? `Salutation MUST be "Dear ${firstName},"` : `Salutation MUST be "Dear ${jobTitle}," -- e.g. "Dear Chief Growth Officer," or "Dear Finance Director,". NEVER "Hello,".`}

PRE-EXTRACTED INSIGHTS (use these directly -- do not invent new ones):
- Genuine observation: ${observation}
- Suspected challenge: ${painHypothesis}

CRITICAL REQUIREMENTS:
1. Salutation: ${hasRealName ? `"Dear ${firstName},"` : `"Dear ${jobTitle},"`}
2. Start with the Taskmaster line EXACTLY
3. Use the provided observation VERBATIM as your genuine observation
4. Use the provided pain hypothesis VERBATIM as your suspected challenge
5. Write ONE short NetSuite paragraph (practical, not salesy)
6. Close EXACTLY with: "Drop me a line if it's worth a conversation."
7. Sign off EXACTLY as: "Yours,\\n\\n_________________________\\nRic Wilson\\nERP Experts"
8. NO em dashes, NO corporate speak, NO quantified benchmarks
9. Short sentences. Conversational. Direct. One idea per sentence.
10. NO subject line. NO postal address block. The UI adds those.
${erpSection ? `\n${erpSection}` : ''}
${notes ? `\nAdditional notes from the user:\n${notes}` : ''}

Now write the cover letter. Start immediately with the salutation.`
}
