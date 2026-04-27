# Atom — Atlas HXM Product Intelligence Layer

Atom translates raw engineering activity into product signals for Atlas HXM's CPO and PMs. It correlates GitHub PR merges with PostHog behavioral data and Linear roadmap context, then surfaces them as prioritized insights on a Vercel dashboard.

## What it does

- **Exec View** — SSO health, exception counts, rage click proxy, pod PR velocity (7-day WoW)
- **Signal Feed** — Per-pod breakdown of shipped PRs correlated with their PostHog event coverage gaps
- **RICE Backlog** — Hypothesis-driven opportunity scoring calibrated to Atlas HXM's 2,600+ WSE base
- **Competitor Intel** — Lightweight tracking of Deel, Remote, and Globalization Partners
- **PR Detail** — Claude-powered plain-language translation of any PR diff into user impact, friction fixed, new capability, and watch items

## Architecture

```
Atom (Claude Code + MCP)          Vercel App (Next.js 14)
────────────────────────          ───────────────────────
PostHog MCP  ──┐                  app/page.tsx (exec view)
GitHub CLI   ──┤─► data/          app/signals/page.tsx
Linear MCP   ──┘   atom-output/   app/rice/page.tsx
                   *.json         app/compete/page.tsx
                                  app/pr/[repo]/[number]/page.tsx
```

Atom writes static JSON files. The Vercel app reads them — no PostHog or Linear API keys needed in the deployed app.

## Pod taxonomy

| Pod | Owns |
|-----|------|
| WFM 1 | Census verification, HRSD, assignee flows |
| WFM 2 | Expense management, AI extraction, contribution splits |
| PAY | SSO/MFA, payroll auth, identity |
| FNM 1 | Take Home Pay, virtual expense cards, Ramp integration |
| FNM 2 | GTN mapping, recon file import, Partner Connect |
| Data Platform | Data warehouse, pipelines, external schemas |

## RICE calibration

- **Reach**: % of 2,600 WSEs affected (5% = 130 WSEs = meaningful)
- **Impact**: 1-5 scale (5 = prevents WSE loss, 4 = fixes critical friction, 3 = improves retention, 2 = nice to have, 1 = edge case)
- **Confidence**: PM conviction (100% = proven, 80% = strong signal, 60% = hypothesis, 40% = intuition)
- **Effort**: Dev-weeks (1 = small, 2 = medium, 5 = large, 10 = quarter)

## Running locally

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.local.example .env.local
# Edit .env.local with your keys

# Start dev server
npm run dev
```

Open http://localhost:3000 to see the dashboard.

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes | PR diff translation via Claude |
| `GITHUB_TOKEN` | Yes | PR data fetching |
| `POSTHOG_API_KEY` | Optional | Live PostHog queries (Atom uses MCP instead) |
| `POSTHOG_PROJECT_ID` | Optional | PostHog project (52189 = Atlas Web Prod) |
| `LINEAR_API_KEY` | Optional | Linear roadmap queries |
| `NEXT_PUBLIC_BASE_URL` | Vercel only | Self-referencing API calls on PR detail page |

## Deploying to Vercel

1. Connect this repo to Vercel
2. Add `ANTHROPIC_API_KEY` and `GITHUB_TOKEN` as environment variables
3. Set `NEXT_PUBLIC_BASE_URL` to your Vercel deployment URL
4. Deploy — the static JSON files under `data/atom-output/` are committed and served directly

## Data refresh

Static JSON files under `data/atom-output/` are populated by running Atom (Claude Code session with PostHog + Linear + GitHub MCPs active). Re-run weekly or on demand, commit the updated files, and redeploy.

## Tech stack

- Next.js 14 App Router, TypeScript, Tailwind CSS
- Anthropic Claude (claude-sonnet-4-6) for PR translation
- PostHog, GitHub, Linear as data sources via MCP
- Vercel for hosting
