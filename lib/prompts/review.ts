// ── Consistency Review ───────────────────────────────────────────────────────

export interface ReviewArgs {
  company: string
  coverLetter: string
  businessCase: string
  techMap: string
}

export function reviewSystemPrompt(): string {
  return `You are a senior editor reviewing a three-part cold outreach letter pack for ERP Experts.
Your job is to check consistency across all three pages and fix any issues.

Checklist:
1. Does the observation in the cover letter match systems named in the tech map?
2. Does the pain hypothesis in the cover letter match the pain in the business case?
3. Are system names consistent across all three pages?
4. Is the tone human, direct, and peer-to-peer throughout?
5. Is the prospect's name spelled correctly and consistently?
6. Is Ric Wilson named consistently as the signatory?
7. Are there any forbidden phrases or corporate speak?
8. Does the tech map only list systems with a plausible basis in the research?

If you find issues, rewrite the problematic sections. If everything is consistent, return the original text unchanged.`
}

export function reviewUserPrompt(args: ReviewArgs): string {
  const { company, coverLetter, businessCase, techMap } = args

  return `Review the following three-page letter pack for ${company}.

--- PART 1: COVER LETTER ---
${coverLetter}

--- PART 2: BUSINESS CASE ---
${businessCase}

--- PART 3: TECHNOLOGY MAP ---
${techMap}

Run through the checklist. Fix any inconsistencies. Return the complete, corrected pack in the same three-part format with ---PART1---, ---PART2---, ---PART3--- delimiters.`
}
