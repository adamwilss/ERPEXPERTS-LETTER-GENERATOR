// ── Composable Prompt Composer ───────────────────────────────────────────────
// Assembles prompt fragments for the agentic multi-step pipeline.

export { identityPrompt, type IdentityArgs } from './identity'
export { toneRules, formattingRules } from './tone'
export { researchPrompt, type ResearchArgs } from './research'
export { coverLetterSystemPrompt, coverLetterUserPrompt, type CoverLetterArgs } from './cover-letter'
export { businessCaseSystemPrompt, businessCaseUserPrompt, type BusinessCaseArgs } from './business-case'
export { techMapSystemPrompt, techMapUserPrompt, type TechMapArgs } from './tech-map'
export { reviewSystemPrompt, reviewUserPrompt, type ReviewArgs } from './review'
