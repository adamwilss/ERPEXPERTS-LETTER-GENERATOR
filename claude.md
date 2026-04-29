# CLAUDE.md

## Purpose

This is an internal tool for ERP Experts staff. It is not a public-facing product.

The portal enables the ERP Experts sales team to generate personalised NetSuite outreach letter packs at scale, without needing to research each prospect manually. It was requested by Tim Mayho and assigned to Adam Wilson.

The system must generate a ready to send two part outreach pack for a NetSuite prospect using minimal user input. The output must feel like it was written specifically for that company and recipient, not like a template with names swapped in.

The standard for tone, structure, specificity, and commercial sharpness is the GolfBays reference letter pack. The portal should match that standard and improve on it where possible. The project specification requires the output to be grounded in the company's actual business profile, inferred systems, likely operational complexity, and credible ERP pain points.

---

## Technical specification

### Stack

| Layer | Tool | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | Frontend and API routes in one project. Streaming support built in. |
| Language | TypeScript | Throughout — frontend, API routes, and generation logic. |
| Styling | Tailwind CSS | Desktop-first internal tool. |
| UI components | shadcn/ui | Form, button, card, tabs, textarea. No bespoke component library. |
| AI model | OpenAI API — gpt-4o | Via `@ai-sdk/openai`. |
| AI streaming | Vercel AI SDK (`ai` package) | Pipes OpenAI streaming tokens directly to the React UI. |
| Web research — primary | Jina Reader (`r.jina.ai`) | Prepend to any URL. Returns clean markdown. No API key needed for basic use. |
| Web research — fallback | Tavily Search API | Supplementary company info when the website alone is sparse. Free tier available. |
| PDF export | `@react-pdf/renderer` | Two-page styled PDF. Add in v2 once output quality is confirmed. |
| Word export | `docx` (npm) | `.docx` download for editing before send. Add in v2. |
| Copy | Clipboard API | One-click copy per section. Zero dependency. Ship in v1. |
| Database | Neon Postgres | Persistent history storage via `@neondatabase/serverless`. |
| Hosting | Vercel | Auto-deploys from GitHub. Edge Runtime for long-running generation calls. |
| Secrets | `.env.local` / Vercel env vars | `OPENAI_API_KEY`, `TAVILY_API_KEY`, `DATABASE_URL`. Never committed. |

### Project structure

```
/
├── app/
│   ├── page.tsx                  # Input form — five fields, submit button, loading state
│   ├── layout.tsx                # Root layout, fonts, metadata
│   ├── discover/
│   │   └── page.tsx              # Lead discovery with 8 industry presets
│   ├── history/
│   │   └── page.tsx              # Letter history with sequences & outcomes
│   ├── analytics/
│   │   └── page.tsx              # Performance dashboard & conversion metrics
│   ├── templates/
│   │   └── page.tsx              # Template library for reusable letters
│   ├── reminders/
│   │   └── page.tsx              # Follow-up reminder management
│   ├── searches/
│   │   └── page.tsx              # Saved Apollo searches & lead review
│   ├── view/
│   │   └── [id]/page.tsx         # Shareable letter pack view (QR + tracking)
│   ├── print/
│   │   └── page.tsx              # Print-optimised letter layout
│   └── api/
│       ├── generate/
│       │   └── route.ts          # Core API — research + letter generation + streaming
│       ├── discover/
│       │   └── route.ts          # Apollo search (legacy)
│       ├── discover-stream/
│       │   └── route.ts          # Streaming Apollo search with AI ranking
│       ├── score/
│       │   └── route.ts          # Lead scoring endpoint
│       ├── pipeline/
│       │   └── route.ts          # Agentic multi-step structured generation
│       ├── rewrite/
│       │   └── route.ts          # Inline section rewrite endpoint
│       ├── searches/
│       │   ├── route.ts          # GET/POST saved searches
│       │   └── [id]/
│       │       ├── route.ts      # DELETE single search
│       │       └── leads/
│       │           └── route.ts  # GET leads for a search
│       ├── view/
│       │   └── [id]/
│       │       └── route.ts      # Public shareable pack endpoint
│       ├── debug/
│       │   └── db/
│       │       └── route.ts      # DB connectivity diagnostic
│       └── history/
│           ├── route.ts          # GET/POST history
│           ├── [id]/
│           │   └── route.ts      # PATCH/DELETE single pack
│           └── migrate/
│               └── route.ts      # localStorage → Postgres migration
├── components/
│   ├── LetterForm.tsx            # Controlled form component
│   ├── LetterOutput.tsx          # Three-tab output display (cover letter / business case / tech map)
│   ├── SequenceManager.tsx       # 4-stage follow-up sequence UI
│   ├── SaveTemplateModal.tsx     # Save letter as template modal
│   ├── LeadReview.tsx            # Lead discovery results with review/approve
│   ├── BatchOutput.tsx           # Batch generation progress display
│   ├── TechMap.tsx               # Tech integration map table
│   ├── CalloutStat.tsx           # Highlighted statistic box
│   ├── AnalyticsCharts.tsx       # Simple bar/line charts for dashboard
│   ├── CopyButton.tsx            # Clipboard copy with confirmation
│   ├── DownloadMenu.tsx          # PDF/DOCX export triggers
│   ├── Header.tsx                # Navigation with reminder badge
│   ├── ThemeToggle.tsx           # Dark/light mode toggle
│   ├── BusinessCase.tsx           # Business case prose renderer
│   ├── InlineRewrite.tsx          # One-click section rewrite UI
│   ├── OnboardingTour.tsx         # First-time user walkthrough
│   ├── PipelineOutput.tsx         # Agentic pipeline live progress
│   ├── PipelineProgress.tsx       # Pipeline step-by-step visualisation
│   ├── PdfDocument.tsx            # @react-pdf PDF layout
│   ├── TechMapCharts.tsx          # Visual tech stack diagram
│   ├── WritingAnimation.tsx       # Animated writing cursor
│   ├── MotionConfig.tsx           # Shared Framer Motion configs
│   ├── PageHeader.tsx             # Reusable page header
│   └── EmptyState.tsx             # Empty state illustration
├── lib/
│   ├── research.ts               # Jina Reader fetch + Tavily search
│   ├── prompt.ts                 # Legacy monolithic prompt builder
│   ├── prompts/                  # Modular prompt library
│   │   ├── index.ts              # Prompt assembler
│   │   ├── identity.ts           # Ric Wilson persona
│   │   ├── tone.ts               # Tone rules
│   │   ├── research.ts           # Research context builder
│   │   ├── cover-letter.ts       # Cover letter prompts
│   │   ├── business-case.ts      # Business case prompts
│   │   ├── tech-map.ts           # Tech map prompts
│   │   └── review.ts             # Review/polish prompts
│   ├── parse.ts                  # Output parsing (part1/2/3)
│   ├── history.ts                # Postgres + localStorage sync layer
│   ├── templates.ts              # Template library storage
│   ├── reminders.ts              # Reminder storage & management
│   ├── discover-store.ts         # Zustand store for discover flow
│   ├── exportDocx.ts             # DOCX generation
│   ├── netsuite-context.ts       # Industry-specific NetSuite context
│   ├── apollo-variants.ts        # Apollo keyword mappings per industry
│   ├── exportDocx.ts             # DOCX generation
│   ├── pipeline/
│   │   └── schemas.ts            # Zod schemas for structured generation
│   └── db/
│       ├── client.ts             # Neon database client (@neondatabase/serverless)
│       ├── schema.sql            # Database tables
│       ├── history-db.ts         # Pack / sequence / outcome CRUD
│       └── search-db.ts          # Search / lead CRUD
├── public/
│   └── erpexperts-logo.png       # ERP Experts logo
├── .env.local                    # API keys — not committed
└── CLAUDE.md                     # This file
```

### Generation pipeline

```
User submits form
        │
        ▼
POST /api/generate
        ├── 1. Fetch r.jina.ai/<url>  →  clean markdown of company website
        ├── 2. Tavily search for company name  →  supplementary snippets (optional)
        ├── 3. Truncate research to ~6,000 tokens to stay within context budget
        └── 4. Stream OpenAI API call
                    │  system prompt: condensed CLAUDE.md output rules + Ric persona
                    │  user message: inputs + research context + output format instructions
                    │  model: gpt-4o via @ai-sdk/openai
                    │  maxOutputTokens: 6000 (initial) / 2000 (follow-ups)
                    ▼
        Streaming tokens → Vercel AI SDK → React UI
        Frontend splits on `---PART1---`, `---PART2---`, `---PART3---` delimiters → populates tabs

Follow-up sequences:
        ├── type: 'followup1' | 'followup2' | 'breakup'
        ├── previousContent: prior letters for context
        └── Output: Shorter emails (100-150 words) that reference previous touchpoints
```

### Output format Claude must return

The API route instructs Claude to return output in this exact structure:

```
---PART1---
[Cover letter — subject line, salutation, three paragraphs, sign-off]
---PART2---
[Business case — title, subtitle, opening, callout stats, pain prose, case study, post-NetSuite paragraph, credentials + CTA]
---PART3---
[Technology integration map — title, subtitle, table in markdown format, CTA]
```

The `parse.ts` utility splits on these delimiters and passes each section to the display component. The UI renders all three as separate tabs or pages. The tech map table (Part 3) must be rendered as an actual HTML table, not raw markdown.

### Lead Discovery Pipeline

```
User clicks preset (e.g., "Manufacturing")
        │
        ▼
POST /api/discover-stream
        ├── 1. Build Apollo search body
        │      ├── organization_locations: ["United Kingdom"]
        │      ├── organization_num_employees_ranges: ["51,200"]
        │      └── q_organization_keyword_tags: ["manufacturing"]  ← Industry as keywords
        ├── 2. Fetch 2 pages from Apollo API (up to 200 companies)
        ├── 3. Pre-sort by data richness, enrich top 60 with contacts
        ├── 4. Score by ERP fit (keywords, size, tech stack, revenue)
        ├── 5. AI rank top 30 by operational complexity (GPT-4o)
        └── 6. Stream results with ranking + data completeness scores
```

**Industry Filtering:** Uses `q_organization_keyword_tags` instead of `organization_industry_tag` (which requires exact Apollo tag IDs). Each industry maps to relevant search terms:
- Manufacturing → `['manufacturing']`
- Technology → `['technology', 'software', 'saas']`
- Ecommerce → `['ecommerce', 'e-commerce', 'online retail']`

This approach provides more reliable filtering across Apollo's database.

### Environment variables

| Key | Where to get it | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | platform.openai.com | Letter generation & lead ranking |
| `TAVILY_API_KEY` | app.tavily.com | Supplementary company research |
| `APOLLO_API_KEY` | apollo.io | Lead discovery (people + company data) |
| `DATABASE_URL` | Vercel Dashboard (Neon) | Postgres connection (auto-injected) |

**Notes:**
- Apollo API is required for lead discovery to function
- `DATABASE_URL` is auto-configured by Vercel when you connect Neon storage

### Hosting

**Platform: Vercel**

Vercel is the natural host for a Next.js project. It auto-deploys from GitHub, manages environment variables, provides HTTPS and a CDN out of the box, and requires no server configuration.

**Tiers and cost:**

| Tier | Price | Relevant limit | Recommendation |
|---|---|---|---|
| Hobby | Free | 10-second serverless function timeout. No password protection. | Not suitable — no access control, generation may exceed 10s |
| Pro | $20/month | 60-second function timeout (or no limit on Edge Runtime). Password protection included. | Required — this is a confidential internal tool |

Use **Edge Runtime** on the `/api/generate` route (`export const runtime = 'edge'` at the top of `route.ts`). Edge functions have no hard timeout, which handles the full research + generation cycle comfortably.

**Vercel Pro is required** because Vercel password protection (the access control mechanism) is a Pro-only feature. At $20/month this is the dominant cost of the project.

**Deployment:**
- Connect the GitHub repo to Vercel (one-click in the Vercel dashboard)
- Vercel auto-deploys every push to `main`
- Set `OPENAI_API_KEY` and `TAVILY_API_KEY` in Project Settings → Environment Variables
- Custom domain: add `letters.erpexperts.co.uk` in Vercel domain settings — takes about 2 minutes to configure

**Running cost estimate:**

| Service | Usage per letter | Cost per letter | Monthly estimate (50 letters) |
|---|---|---|---|
| openapi | ~8,000 tokens in + ~2,000 out | ~$0.03 | ~$1.50 |
| Tavily Search | 1 search call | $0.001 | ~$0.05 |
| Jina Reader | Free (no API key) | $0 | $0 |
| Vercel Pro | Required for password protection | $20/month flat | $20 |
| **Total** | | **~$0.03 + $20/month** | **~$21.55** |

The dominant cost is the Vercel Pro subscription needed for password protection. API costs are negligible — roughly £0.02 per letter generated at current Sonnet pricing.

**Rollout path:**
1. Set up Vercel Pro, connect GitHub repo, configure password protection
2. Set environment variables in Vercel dashboard
3. Deploy and test with real company inputs

### Build order

1. Scaffold with `npx create-next-app@latest --typescript`
2. Install dependencies: `@ai-sdk/openai ai tailwindcss shadcn/ui @react-pdf/renderer docx`
3. Build the five-field input form with loading state
4. Implement `lib/research.ts` — Jina fetch, basic content cleaning, Tavily fallback
5. Implement `lib/prompt.ts` — system prompt and user message builder, including callout stat and tech map table instructions
6. Implement `/api/generate/route.ts` — research + OpenAI streaming + Edge Runtime
6b. Implement `/api/pipeline/route.ts` — agentic multi-step structured generation (optional, higher quality)
7. Implement `lib/parse.ts` — split output on `---PART1---`, `---PART2---`, `---PART3---` delimiters
8. Build `LetterOutput.tsx` — three-tab display (Cover Letter / Business Case / Tech Map)
9. Build `TechMapTable.tsx` — parse the markdown table from Part 3 and render as a styled HTML table
10. Build `CalloutStat.tsx` — render highlighted stat boxes within the business case
11. Add clipboard copy buttons per section
12. Quality loop: test against 5+ real companies, refine prompt until all three parts match GolfBays bar
13. Add PDF export — three-page PDF matching GolfBays layout: letterhead, ERP Experts logo, footer on each page
14. Add DOCX export for editable pre-send version
15. Add ERP Experts branding, error states, empty state, page footer

### Access control

This is a confidential internal tool. It must not be publicly accessible.

The simplest approach for v1 is **Vercel password protection** (available on the Pro plan). Set a single shared password for the ERP Experts team. This requires no login UI, no user table, and no auth library — Vercel handles it at the edge before the page loads.

If the team grows or access needs to be more granular, add Clerk or NextAuth in v2.

### What this does not need in v1

- ~~A database~~ ✅ **Now using Vercel Postgres for persistent history**
- A user management system (Vercel password protection is sufficient)
- A queue or background job system (streaming handles perceived latency)
- A design system beyond Tailwind + shadcn
- Multi-tenant or role-based access

---

## Configuration

### Environment Variables

| Variable | Required | Source | Purpose |
|----------|----------|--------|---------|
| `OPENAI_API_KEY` | **Yes** | platform.openai.com | Letter generation & lead ranking |
| `TAVILY_API_KEY` | No | app.tavily.com | Supplementary company research |
| `APOLLO_API_KEY` | **Yes** (for Discover) | apollo.io | Lead discovery (people + company data) |
| `DATABASE_URL` | **Yes** | Vercel Dashboard | Postgres connection (auto-injected by Vercel) |

**Note:** Apollo API is required for lead discovery. Without it, the `/discover` page will show errors.

### Vercel Storage Setup

1. **Connect Neon Postgres:**
   - Go to Vercel Dashboard → **Storage**
   - Click **Connect Store** → **Neon**
   - Create new database or connect existing
   - Vercel auto-injects `DATABASE_URL` into your project

2. **Run Database Schema:**
   - In Vercel Dashboard → Storage → Neon → **SQL Editor**
   - Copy contents of `lib/db/schema.sql`
   - Execute to create tables

3. **Migrate Existing Data (optional):**
   - Once deployed, POST existing localStorage data to `/api/history/migrate`

---

## Plan / Launch

### Pre-Launch Checklist

- [ ] Set up Vercel Pro ($20/month) for password protection
- [ ] Connect GitHub repo to Vercel
- [ ] Add Neon Postgres storage
- [ ] Set `OPENAI_API_KEY` in Vercel environment variables
- [ ] Set `APOLLO_API_KEY` (if using Lead Discovery)
- [ ] Run database schema in Neon SQL Editor
- [ ] Configure Vercel password protection
- [ ] Add custom domain `letters.erpexperts.co.uk` (optional)
- [ ] Test letter generation with 3-5 real companies
- [ ] Verify history persistence works

### Deployment Steps

1. **Push to GitHub** → Vercel auto-deploys
2. **First deploy** will fail (no database) - this is normal
3. **Add Storage** → Neon → creates database
4. **Redeploy** after database is connected
5. **Run schema.sql** in Neon SQL Editor
6. **Test** the app thoroughly

### Rollback

Vercel keeps every deployment. To rollback:
- Go to Vercel Dashboard → Deployments
- Click previous working deployment → **Promote to Production**

---

## Scale

### Current Limits

| Resource | Limit | At Scale |
|----------|-------|----------|
| **Postgres Storage** | 256 MB (free tier) | Upgrade to paid Neon ($0.10/GB) |
| **API Calls** | No hard limit | Monitor OpenAI/Tavily costs |
| **Apollo Credits** | 1,000/month ($59 plan) | Upgrade to $99 plan for 2,500 credits |
| **Vercel Function Duration** | 60s (Pro) | Use Edge Runtime for unlimited |
| **Concurrent Generations** | 10 (serverless) | Add queue system if needed |

### Cost Projections

**Current (light usage):**
- Vercel Pro: $20/month
- OpenAI: ~$0.03 per letter (~$2-5/month)
- Neon: $0 (256MB free tier)
- Apollo: $59/month (optional)
- **Total: ~$82-85/month**

**At Scale (100 letters/day):**
- Vercel Pro: $20/month
- OpenAI: ~$90/month
- Neon: $5-10/month (data growth)
- Apollo: $99/month (higher tier)
- **Total: ~$215-230/month**

### Scaling Triggers

Upgrade when:
- Postgres hits 200MB storage (approaching 256MB limit)
- OpenAI costs exceed $50/month (move to Azure OpenAI for volume pricing)
- Apollo credits consistently hitting monthly cap
- >50 simultaneous users (add rate limiting, queue system)

### High Availability

Current setup:
- Vercel Edge = globally distributed, auto-scaling
- Neon Postgres = multi-region, automatic failover
- No single point of failure

Backup strategy:
- Neon automatic daily backups
- Can export history via `/api/history` endpoint

---

## New Features (v2 - Added 2025)

### Follow-up Sequence Generator

The system now supports automated follow-up sequences. When a letter is marked "sent", a 4-stage sequence is unlocked:

1. **Initial Letter** — Full three-part letter pack (already generated)
2. **Follow-up #1** — References previous letter, adds fresh angle/case study (7 days after)
3. **Follow-up #2** — Brief acknowledgment + gentle urgency (14 days after)
4. **Final Email** — Polite "breakup" that leaves door open (21 days after)

Each follow-up is generated with context from previous touchpoints to maintain continuity. The SequenceManager component in history shows progress and handles generation.

### Analytics Dashboard

Access via `/analytics`:

- **Conversion Funnel**: Generated → Sent → Responded → Meeting
- **Industry Performance**: Response rates by industry
- **Activity Over Time**: Weekly generation trends
- **Top Templates**: Best performing saved templates
- **Response Rate Tracking**: Weighted scoring (meetings count double)

### Template Library

Access via `/templates`:

- Save any generated letter as a reusable template
- Tag templates by industry (Manufacturing, Ecommerce, etc.)
- Tag by content type ("Strong Opening", "Great Case Study", etc.)
- Track usage count and response rates per template
- Search and filter templates
- "Use Template" pre-fills the generator with context

### Follow-up Reminders

Access via `/reminders`:

- Auto-created when letters are marked "sent"
- Configurable intervals (default: +7, +14, +21 days)
- Snooze, complete, or dismiss actions
- Overdue reminder highlighting in header
- Suggested actions based on industry

### Agentic Pipeline Generation (v3)

**API:** `/api/pipeline` — an alternative to the single-shot `/api/generate`.

Instead of one long prompt, the pipeline breaks generation into discrete structured steps:

1. **Research** — Jina + Tavily fetch
2. **Insight Extraction** — AI extracts 3 sharp operational insights from research
3. **Cover Letter** — structured generation with Zod schema
4. **Business Case** — structured generation with Zod schema (stats, pains, case study)
5. **Tech Map** — structured generation with Zod schema (table rows)
6. **Review & Polish** — AI critique and final polish pass

Each step streams NDJSON events to the frontend. The `PipelineOutput` component renders live progress. This approach produces more consistent, higher-quality output at the cost of slightly longer generation time.

### Shareable View Pages

Access via `/view/[id]`:

- Public (unauthenticated) shareable page for any generated pack
- Displays business case + tech map only (no cover letter)
- QR code generation for physical handouts
- View tracking with IP + user agent (stored in `pack_views` table)
- Copy link button with branded URL

### Inline Rewrite

In the `LetterOutput` component, each section has a rewrite button that calls `/api/rewrite`:

- Sends the current section + a rewrite instruction (e.g., "make it sharper", "add more specifics")
- Returns a regenerated version of that section only
- Preserves the rest of the pack untouched

### Search Management

Access via `/searches`:

- Browse all saved Apollo searches from Discover
- Expand a search to see its leads
- Review lead data completeness scores
- One-click "Generate Letter" from any lead
- Delete old searches

---

## What this system does

The portal accepts:

1. Company name
2. Website URL
3. Recipient name
4. Recipient job title
5. Optional notes from the user

From that, it must:

1. Research the company using the URL and public information
2. Infer how the business operates
3. Identify likely ERP related structural pain points
4. Map those pain points to specific NetSuite capabilities
5. Produce a short cover letter and a supporting business case page
6. Display the result in a form that is ready to review, copy, or download

The user should not need to do any manual research for the first draft.

---

## Core principle

Every output must be specific enough that the recipient would believe Ric personally took time to understand their business before writing.

If the same letter could be reused for another company with only minor edits, the output has failed.

---

## Voice and style

Write in the voice of a commercially sharp, experienced NetSuite operator.

The tone should be:

1. Direct
2. Calm
3. Specific
4. Intelligent
5. Human
6. Non robotic
7. Confident without sounding inflated

The output must read like a knowledgeable human business letter, not marketing copy, not SaaS copy, and not AI prose.

### Style rules

1. Prefer concrete specifics over abstract claims
2. Use short to medium length paragraphs
3. State operational facts first, then commercial implications
4. Describe pain as structural, not as incompetence or chaos
5. Make NetSuite feel like the logical answer to the business model
6. Avoid buzzwords, fluff, generic transformation language, and empty persuasion
7. Do not sound like a sales email
8. Do not over explain ERP terminology
9. Do not use bullet points in the body of the letter or business case prose
10. Do not write anything that sounds copy pasted from a generic ERP campaign

### Good tonal pattern

The GolfBays letter works because it begins with observed facts, then shows why the current setup no longer fits the complexity of the business, then bridges into a short analysis and call. That pattern should be preserved.

---

## What good looks like

Keep these qualities from the reference letter:

1. Opening paragraph names specific facts such as product, price point, channel, geography, and scale
2. Pain is framed as structural
3. Tone is direct and credible
4. The letter is short and easy to read
5. Ric signs off personally with authority and experience

Improve these areas:

1. Use company specific evidence where possible rather than generic benchmark boxes
2. Use named case studies when relevant
3. Make pain to solution mapping feel deduced, not templated
4. Make the technology stack description reflect actual or strongly inferred systems
5. Sharpen the commercial framing using numbers that fit the company where reasonably inferable

---

## Required output structure

The system must always generate a three part output. The GolfBays reference letter pack has three distinct pages. All three must be produced.

---

### Part 1: Cover letter

#### Letter header
Every cover letter must open with:

- ERP Experts logo / letterhead (rendered by the UI — not generated by the AI)
- The current date
- Recipient first name, job title, company name (from inputs)
- Subject line in exactly this format: "Re: Connecting [Company] technology stack: a short analysis"
- Salutation: "Dear [First name],"

#### Paragraph 1
Name 3 to 5 specific facts about the company.

Examples of the kinds of specifics to include:

1. What they sell
2. Typical price point or order value
3. How they sell
4. Relevant geographies
5. Scale indicators such as team size, sites, channels, warehouses, showrooms, or international footprint

This paragraph should make it obvious the company has outgrown a simpler operational setup, but do not literally say "you have outgrown your systems" unless it sounds natural in context.

Maximum three sentences.

#### Paragraph 2
Describe 2 to 3 likely pain points that logically follow from how the business operates.

These must be structural pains such as:

1. Finance reconciliation across disconnected systems
2. Inventory drift across warehouse, ecommerce, retail, field sales, or 3PL
3. Inability to see margin, stock, purchasing, fulfilment, or group performance in one place
4. Manual work caused by using separate systems for sales, finance, stock, reporting, and fulfilment
5. International complexity, multi currency, VAT, customs, entity reporting, or multi location coordination

Reference their likely systems by name if known or credibly inferable, such as Shopify, Xero, Sage, spreadsheets, 3PL platforms, CRM fragments, warehouse tools, or field sales processes.

#### Paragraph 3
Use this bridge almost exactly:

"I have enclosed a short analysis of how this plays out for [Company] and what the picture looks like with NetSuite at the centre of your stack."

Then close with:

"If it is relevant, I would welcome a brief call."

#### Sign-off
The letter must close with:

```
Yours sincerely,

Ric Wilson
Managing Director, ERP Experts
21 years NetSuite experience · 350+ completed projects
```

---

### Part 2: Business case

#### Page title and subtitle
The business case opens with:

- Title: "The business case for [Company]"
- Subtitle: "What staying on [their current setup] is costing, and what changing them is worth"

#### Opening paragraph
One to two sentences framing the structural problem in the context of their specific model. Do not start with a generic claim. Start with something specific to how this company operates. See the GolfBays reference: it opens with a statement about Shopify before it introduces the cost argument.

#### Callout statistics
Include two to three callout statistic boxes. These are displayed visually as highlighted data points, not inline prose.

Each callout must include:
1. A headline figure (number, percentage, or time)
2. A one to two sentence explanation tied to this company's situation — not a generic benchmark dropped without context
3. A source citation

Approved benchmark sources to draw from:
- APQC Financial Management Benchmarking Study (month-end close: 6–10 days for disconnected systems, under 5 days for top performers using integrated ERP)
- APQC / Stockton10 analysis (finance team labour cost of extended close cycles)
- Oracle NetSuite (63% of tech IPOs since 2011 were NetSuite customers)
- Aberdeen Group, Gartner, or similar analyst sources where credible and relevant

Do not invent statistics. Do not use a statistic without briefly explaining why it is relevant to this company's scale or model.

#### Pain expansion prose
Expand each pain point from the cover letter, one paragraph per pain point.

For each:
1. Describe what goes wrong in practical terms
2. Explain why it happens structurally
3. Explain what NetSuite changes
4. Keep the language plain and business focused

No bullet points. The prose should flow like a real business analysis.

#### Case study reference
Include a named ERP Experts case study where there is a credible fit:

1. Eco2Solar
2. Kynetec
3. Totalkare
4. Carallon

If none fits closely, use an anonymised "similar profile" example in the style of the GolfBays pack. The case study must include a concrete before and after — numbers, time savings, or capability gains where available.

#### Post-NetSuite picture paragraph
A short, specific paragraph describing exactly what the company's setup looks like after NetSuite. Name their actual or strongly inferred systems. Show clearly what integrates, what is replaced, what is eliminated, and what becomes visible or automated.

Examples from the GolfBays reference: Shopify connects natively, Xero or Sage is replaced entirely, spreadsheets are eliminated, international orders handled natively, the team sees the business as it is not as it was at month end.

#### Credentials and CTA
The business case must close with this block, which should appear near-verbatim:

"We have been implementing NetSuite since 2005. In 21 years and 350+ projects we have not abandoned a single implementation. We are not a large systems integrator — your project is led by a senior consultant with direct access to Ric, delivered at a fixed price, with UK-based aftercare that means you are not left to manage it alone."

Followed by:

"Book a 15-minute call with Ric Wilson, MD"
T: 01785 336 253 · E: hello@erpexperts.co.uk · W: www.erpexperts.co.uk

---

### Part 3: Technology integration map

This is a separate page — not a prose section. It is a structured table showing how NetSuite relates to each system in the company's current or inferred stack.

#### Page title and subtitle
- Title: "[Company]: technology integration map"
- Subtitle: "How NetSuite sits at the centre of [Company]'s technology stack: what integrates, what gets replaced, and what gets eliminated."

#### The table
The AI must generate a table with three columns:

| System | Relationship | What it means for [Company] |
|---|---|---|

The Relationship column must use one of three values only: **Integrate**, **Replace**, or **Eliminate**. Add **Native** for capabilities that NetSuite handles internally (e.g., multi-currency, VAT).

Each row must name a specific system (real or strongly inferred), assign the correct relationship, and write one to two sentences explaining what that means in practical terms for this company specifically.

Typical rows for an ecommerce or product business:
- Shopify → Integrate
- Xero / Sage → Replace
- Excel / Spreadsheets → Eliminate
- ShipStation / 3PL → Integrate
- Warehouse / physical locations → Integrate
- International orders → Native

The table must reflect what is actually known or credibly inferred about this company, not a generic template. Do not include systems that have no basis in the research.

#### CTA
The map page closes with the same call to action:

"Book a 15-minute call with Ric Wilson"
T: 01785 336 253 · E: hello@erpexperts.co.uk · W: www.erpexperts.co.uk

---

## Research expectations

Before drafting, infer the company's operating model from available public information.

You should determine, as far as possible:

1. What they sell
2. Who they sell to
3. Whether they are ecommerce, wholesale, direct, retail, field sales, project based, subscription based, manufacturing, distribution, or a hybrid
4. Whether they trade internationally
5. Whether they appear to hold stock
6. Whether they operate multiple locations
7. Whether they are likely using systems such as Shopify, Xero, Sage, spreadsheets, 3PL tools, warehouse tools, or disconnected reporting
8. Whether they are at a scale where manual reconciliation is likely painful
9. Whether there are clues about fulfilment, finance complexity, stock movement, demand planning, margin visibility, or reporting fragmentation

Do not invent facts. Infer carefully from the evidence.

When a fact is unknown, use restrained business inference rather than false certainty.

### Acceptable inference
"Given the mix of ecommerce, trade supply, and international fulfilment, it is likely that stock, shipping status, and finance are being managed across separate systems."

### Unacceptable fabrication
"You currently reconcile Shopify into Xero every Friday using spreadsheets."

---

## Pain point logic

Pain points must be deduced from the business model.

They should never read like generic ERP copy.

### Good examples

1. A multi channel retailer with high value orders likely struggles with stock and margin visibility across storefront, warehouse, and finance
2. A company shipping internationally likely faces friction around currency, VAT, landed cost, and reporting consistency
3. A product business using ecommerce plus trade sales likely ends up reconciling orders, fulfilment, and finance across separate systems
4. A services or project business with purchasing and delivery complexity likely lacks one live view of job profitability and committed cost
5. A growing firm with several entities, locations, or product lines likely closes the month late because reporting is assembled manually from disconnected sources

### Bad examples

1. "Businesses often waste time on admin"
2. "ERP helps you scale"
3. "Data silos are a challenge for modern companies"
4. "Manual processes reduce efficiency"

Be concrete. Always tie pain to how the company actually appears to operate.

---

## NetSuite mapping rules

Every pain point must map cleanly to a specific NetSuite capability in plain English.

Examples:

1. Disconnected ecommerce, finance, and stock
   NetSuite becomes the central operational and financial system, with Shopify or other commerce channels integrated into one live record

2. Manual month end and fragmented reporting
   Finance moves into NetSuite, replacing separate accounting tools and reducing reconciliation work

3. Inventory drift across locations or channels
   NetSuite gives one live stock view across warehouse, showroom, vans, retail sites, or 3PL

4. International complexity
   NetSuite handles multi currency, tax, entity level reporting, and cross border operational visibility in one system

5. Spreadsheet dependence
   Stock control, reporting, and operational workflows move out of offline files and into the core platform

Do not present NetSuite as magic. Present it as infrastructure that fits the complexity of the business better than the current setup.

---

## Ric Wilson persona

Unless told otherwise, the letter should be written as if signed by Ric Wilson, Managing Director of ERP Experts.

Important authority signals to preserve:

1. 21 years NetSuite experience
2. 350 plus completed projects
3. Senior led delivery
4. Fixed price delivery
5. UK based aftercare
6. Direct access and accountability

These cues are part of why the reference letter lands credibly.

---

## Output constraints

1. The cover letter should be concise
2. The business case should be fuller but still readable in one sitting
3. Avoid repetitive phrasing between the letter and the business case
4. Do not use generic AI language
5. Do not use clichés
6. Do not over qualify every point with hesitant language
7. Do not use fake precision where no evidence exists
8. Do not include obvious placeholders in final output
9. Do not make the recipient feel accused or criticised
10. Do not sound like a template engine

---

## Internal quality check before finalising

Before returning output, check:

1. **Does the salutation use the actual first name?** (e.g., "Dear Sarah," NOT "Dear Chief Growth Officer,")
2. **Does the opening paragraph HOOK with insight?** Lead with operational pain the prospect feels, not facts they already know
3. **Does the first paragraph contain real company specific observations?**
4. **Are the pain points consequences of this company's actual model?**
5. **Does the business case reference a SPECIFIC named case study?** (Eco2Solar, Kynetec, Totalkare, or Carallon) with concrete before/after
6. **Could this letter plausibly be sent to a different company with minor edits?**
7. **Does the NetSuite explanation solve the pains in plain language?**
8. **Does the tech map make industry-reasonable inferences?** ("likely using Xero" not "definitely using Xero")
9. **Does the post NetSuite picture clearly show what integrates, what is replaced, and what disappears?**
10. **Is the tone human, senior, and commercially credible?**
11. **Is there any sentence that sounds generic, inflated, or robotic?**
12. **Would a busy operations or finance leader actually read this and think it sounds informed?**

If any answer is weak, rewrite before returning.

---

## Failure modes to avoid

1. Generic outreach copy
2. Empty ERP jargon
3. Invented details presented as fact
4. Pain points that could apply to literally any company
5. Repeating the same idea across multiple paragraphs
6. Case study references with no logical fit
7. Overly long openings
8. Overly polished marketing language
9. Sounding like a bot that "analysed the website"
10. Making the business sound dysfunctional rather than simply constrained by current architecture

---

## Git workflow

The user always wants commits pushed to the GitHub remote immediately after they are created. Vercel auto-deploys from `master`, so a local commit that is not pushed will not trigger a deployment.

**Rule:** After every `git commit`, immediately run `git push origin master` unless the user explicitly says not to.

---

## Ideal outcome

Within roughly one minute of input, the user receives a two part letter pack that feels researched, specific, commercially sharp, and individually written for the target company.

The recipient should feel that Ric understands how their business actually works and is pointing to a system problem that is already visible inside their operation. NetSuite should come through not as a pitch, but as the logical architecture for the next stage of complexity and growth.
