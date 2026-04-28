# Project Specification
## ERP Experts — AI Outreach Letter Portal

**Requested by:** Tim Mayho  
**Assigned to:** Adam Wilson  
**Status:** In development  
**Classification:** Internal / Confidential

---

## What we are building

An internal web tool for the ERP Experts sales team. A user enters five fields about a prospect, the system researches that company automatically, and within 60 seconds produces a three-page outreach pack ready to review, copy, or download. No manual research required.

The output quality bar is the GolfBays letter pack. Every generated output must be specific enough to the target company that it could not be sent to another company with minor edits.

---

## Inputs

| Field | Required | Notes |
|---|---|---|
| Company name | Yes | Used in research queries and letter copy |
| Website URL | Yes | Primary research source via Jina Reader |
| Recipient first name | Yes | Used in salutation and letter body |
| Recipient job title | Yes | Used in recipient block |
| Notes | No | Anything the user already knows — fed directly into the prompt |

---

## Output — three parts

### Part 1: Cover letter
- ERP Experts letterhead with date
- Recipient block (name, title, company)
- Subject line: "Re: Connecting [Company] technology stack: a short analysis"
- Salutation: "Dear [First name],"
- Paragraph 1: 3–5 specific company facts — max three sentences
- Paragraph 2: 2–3 structural pain points, named systems where inferable
- Paragraph 3: fixed bridge sentence + CTA
- Sign-off: Yours sincerely / Ric Wilson / MD, ERP Experts / 21 years · 350+ projects

### Part 2: Business case
- Title: "The business case for [Company]"
- Subtitle: "What staying on [their current setup] is costing, and what changing them is worth"
- Opening paragraph specific to their model
- 2–3 callout statistic boxes (figure + explanation + source citation)
- Pain expansion prose — one paragraph per pain point, no bullet points
- Named or anonymised ERP Experts case study
- Post-NetSuite picture paragraph
- Fixed Ric Wilson credentials paragraph
- "Book a 15-minute call" CTA: T: 01785 714 514 · E: ric@erpexperts.co.uk · W: www.erpexperts.co.uk

### Part 3: Technology integration map
- Title: "[Company]: technology integration map"
- Table: System | Relationship (Integrate / Replace / Eliminate / Native) | What it means for [Company]
- CTA with contact details

---

## Technical stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 App Router, TypeScript |
| Styling | Tailwind CSS |
| AI model | OpenAI GPT-4o via @ai-sdk/openai |
| AI streaming | Vercel AI SDK (useCompletion) |
| Web research primary | Jina Reader (r.jina.ai) |
| Web research fallback | Tavily Search API |
| Hosting | Vercel Pro |
| Access control | Vercel password protection |

---

## Claude output format

GPT-4o returns exactly this structure — parsed by lib/parse.ts:

```
---PART1---
[Cover letter including subject, salutation, three paragraphs, sign-off]
---PART2---
[Business case including title, stats, prose, case study, credentials, CTA]
---PART3---
[Tech map including title, markdown table, CTA]
```

Stat boxes use custom tags so the frontend can render them highlighted:
```
[STAT]
Headline: 6–10 days
Body: ...explanation tied to this company...
Source: APQC Financial Management Benchmarking Study
[/STAT]
```

---

## Hosting and cost

- Vercel Pro: $20/month (required for password protection)
- Claude API: ~$1.50/month at 50 letters
- Total: ~$21.55/month
- Domain: letters.erpexperts.co.uk
- Auto-deploys from GitHub main branch

---

## Fixed contact details in all output

- T: 01785 714 514
- E: ric@erpexperts.co.uk
- W: www.erpexperts.co.uk
- Location: Manchester, UK
