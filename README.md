# ERP Experts Letter Portal

Internal sales tool for generating personalised NetSuite outreach letter packs.

## What it does

Enter five fields about a prospect and the system researches the company automatically. Within roughly one minute it produces a three-part outreach pack:

1. **Cover letter** — specific, commercially sharp, signed by Ric Wilson
2. **Business case** — pain points, callout stats, named case study, post-NetSuite picture
3. **Technology integration map** — table showing what NetSuite integrates, replaces, or eliminates

The output is ready to review, copy, or download as PDF/DOCX.

## Tech stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- OpenAI GPT-4o via Vercel AI SDK
- Jina Reader + Tavily Search for web research
- Vercel Postgres (Neon) for persistent history
- Vercel Pro hosting with password protection

## Project structure

```
/
├── app/               # Next.js pages and API routes
│   ├── api/           # Backend endpoints (generate, discover, history, etc.)
│   ├── (pages)/       # Frontend pages
│   └── ...
├── components/        # React components
├── lib/               # Business logic, prompts, research, DB layer
│   ├── db/            # Database schema and queries
│   └── prompts/       # Modular AI prompts
├── docs/              # Documentation and plans
├── public/            # Static assets
└── CLAUDE.md          # Full project specification (read by Claude Code)
```

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** — Complete project specification, voice rules, output format, and architecture
- **[docs/PROJECT_SPEC.md](./docs/PROJECT_SPEC.md)** — Original project brief
- **[docs/CHANGES.md](./docs/CHANGES.md)** — Feature enhancement log
- **[docs/plans/](./docs/plans/)** — Implementation plans

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | Yes | Letter generation & lead ranking |
| `TAVILY_API_KEY` | No | Supplementary company research |
| `APOLLO_API_KEY` | Yes (for Discover) | Lead discovery via Apollo.io |
| `DATABASE_URL` | Yes | Postgres connection (auto-injected by Vercel) |

Copy `.env.example` to `.env.local` and fill in your keys.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Vercel auto-deploys every push to `master`. See [CLAUDE.md](./CLAUDE.md) for detailed deployment steps.

## NetSuite Content

Marketing materials and collateral are stored locally in `NetSuite Content/` but are **not tracked in Git** (159MB+ of PDFs/PPTX/ZIPs).

---

Internal tool — confidential to ERP Experts.
