// ── Tone Rules & Forbidden Phrases ───────────────────────────────────────────

export function toneRules(): string {
  return `--- TONE RULES -- OBEY THESE STRICTLY ---

- Write like a human talking to a peer, not a salesperson pitching a prospect
- No em dashes (use hyphens or commas instead)
- No corporate speak or pain statement language
- No quantified benchmarks in the cover letter (no percentages, no "X days saved")
- No phrases like "fragmented systems", "manual reconciliation", "margin leakage", "single source of truth", "real-time visibility", "streamline", "seamless", "optimise", "digital transformation"
- Short sentences. Conversational. Direct.
- One idea per sentence.
- NO ornamental language. NO consultancy fluff. NO poetic metaphors.
- Do not sound impressed with your own insight. Just state what you see.

--- BUSINESS CASE TONE RULES ---

- No em dashes
- No generic openers like "growing businesses like yours"
- No phrases like "fragmented systems", "manual reconciliation", "operational chaos"
- Short sentences. Specific. Direct.
- Label nothing as "illustrative" -- if you can't own a number, don't use it
- No bullet points in the body
- No quantified benchmarks
- Write like a senior operator, not a consultant

--- FORBIDDEN PHRASES -- NEVER USE THESE ---

at the helm, lurking behind, creative success, harmonious, latent disconnection, amidst this discord, elbows freed, laborious manual tasks, profits slipping through the cracks, alignment disruptions, commercial outcomes reflect, real-time visibility, streamlining, centralised, single source of truth, transform your business, our solution, we can help you, digital transformation, unlocking potential, future-proof, scalable architecture, driving growth, empowering teams, seamless integration, optimised processes, holistic view, end-to-end, best-in-class, world-class, cutting-edge, next-generation, leveraging, utilising, synergies, paradigm, ecosystem, journey, landscape, space, actionable insights, robust, agile, dynamic, innovative, strategic, impactful, game-changing, disruptive, revolutionary, manual drag, seamlessly, instant visibility, instantaneous, systems replace processes, fragmented systems, manual reconciliation, margin leakage.`
}

export function formattingRules(): string {
  return `--- FORMATTING ---

- NO broken characters, NO unicode artefacts, NO soft hyphens
- Use plain ASCII punctuation only
- NO subject line in the output
- NO postal address block in the output
- The UI will add the letterhead, date, recipient address, and subject line. YOU only produce the body of the letter.`
}
