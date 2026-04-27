# Atom — Atlas HXM Product Intelligence Layer

Atom translates raw engineering activity into actionable product intelligence for Atlas HXM's CPO and PMs. It correlates GitHub PR merges with PostHog behavioral data, surfaces regression signals, detects instrumentation gaps, and generates a weekly PM brief — so every signal comes with a recommended action, not just an observation.

**Live:** https://atom-atlas-hxm-product-intelligence.vercel.app

---

## What makes it an intelligence layer, not a dashboard

Every signal Atom surfaces includes:

| Field | What it means |
|-------|--------------|
| **Urgency tier** (P1/P2/P3) | P1 = act within 48 hours |
| **Recommended action** | One verb-first sentence: what to do, not what happened |
| **Outcome type** | Retention / Revenue / Efficiency / Risk / Migration |
| **Ignore cost** | What breaks in 2 weeks if this signal is not acted on |
| **Legacy impact** | Does this accelerate or block the webapp sunset? |
| **Reviewer risks** | Concerns flagged in code review that are now live in production |
| **Instrumentation gap** | Did new UX ship with no PostHog tracking? |

---

## Views

| View | Purpose |
|------|---------|
| **Exec** | SSO health, exceptions, rage clicks, pod PR velocity — 7-day WoW |
| **Weekly Brief** | Claude-generated narrative: traffic light, P1 actions this week, regressions, production risks, instrumentation gaps, product opportunities |
| **Signals** | Per-pod PRs sorted by urgency. Regression alerts (events down >20% WoW with no PR explaining the drop). Instrumentation gap warnings. |
| **RICE Backlog** | Hypothesis scoring: (Reach × Impact × Confidence%) / Effort, calibrated to 2,600+ WSE base |
| **Compete** | Deel, Remote, Globalization Partners — signals, Atlas advantages, watch items |
| **PR Detail** | Full analysis: diff, reviewer decisions, CI status, risk tier, recommended action, ignore cost, next opportunity |

---

## Architecture

```
Atom (Claude Code + MCP sessions)     Vercel App (Next.js 14)
─────────────────────────────────     ───────────────────────
PostHog MCP  ──┐                      /          Exec
GitHub CLI   ──┤──► data/             /brief     Weekly Brief
Linear MCP   ──┘    atom-output/      /signals   Signal Feed
                    exec-metrics.json /rice       RICE Backlog
                    weekly-events.json /compete   Competitive Intel
                    merged-prs.json   /pr/[r]/[n] PR Detail (live API)
```

Atom writes static JSON. The Vercel app reads them — no PostHog or Linear API keys needed in the deployed app. PR detail pages call the GitHub API live via `/api/translate-pr` and use Claude for real-time translation.

---

## Signal intelligence model

Each PR is analyzed by Claude (claude-sonnet-4-6) with the full diff, all review comments, reviewer decisions, and CI status. Claude returns:

```json
{
  "urgencyTier": "P1",
  "recommendedAction": "Check PostHog for expenseDetail_upserted drop before next sprint.",
  "outcomeType": "retention",
  "ignoreCost": "If undetected for 2 weeks, the expense save flow silently fails for all WFM 2 users.",
  "legacyImpact": "neutral",
  "productionRisk": "high",
  "productionRiskReason": "Multi-step DB transaction with no rollback — partial failure leaves fields inconsistent.",
  "reviewerRisks": ["useEffect in CommentThreadPopover flagged for race conditions"],
  "instrumentationGap": true,
  "targetPersona": "HRSD Reviewer",
  "nextOpportunity": "Build a flagged-field resolution rate dashboard for census verification admins."
}
```

---

## Pod taxonomy

| Pod | Owns | Key PostHog events |
|-----|------|--------------------|
| WFM 1 | Census verification, HRSD, assignee flows | `employee_task_*`, `employee_submitted`, `employee_created` |
| WFM 2 | Expense management, AI extraction, contribution splits | `addExpense_*`, `addExpenseLine_*`, `expenseDetail_*` |
| PAY | SSO/MFA, payroll auth, identity | `sso_login_*`, `mfa_sms_setup_phone` |
| FNM 1 | Take Home Pay, virtual expense cards, Ramp | (uninstrumented — gap) |
| FNM 2 | GTN mapping, recon file import, Partner Connect | (uninstrumented — gap) |
| Data Platform | Data warehouse, pipelines, external schemas | (uninstrumented — gap) |

---

## RICE calibration (Atlas HXM context)

- **Reach**: % of 2,600 WSEs affected (5% = 130 WSEs = meaningful signal)
- **Impact**: 1–5 (5 = prevents WSE churn, 4 = fixes critical friction, 3 = improves retention, 2 = marginal, 1 = edge case)
- **Confidence**: PM conviction score (100% = proven data, 80% = strong signal, 60% = hypothesis, 40% = intuition)
- **Effort**: Dev-weeks (1 = small, 2 = medium, 5 = large, 10 = full quarter)

---

## Running locally

```bash
npm install
cp .env.local.example .env.local   # fill in your keys
npm run dev
```

Open http://localhost:3000.

---

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes | PR translation and weekly brief generation |
| `GITHUB_TOKEN` | Yes | PR data, review comments, CI check status |
| `POSTHOG_API_KEY` | Optional | Live PostHog queries (Atom uses MCP in Claude Code sessions) |
| `POSTHOG_PROJECT_ID` | Optional | PostHog project ID (52189 = Atlas Web Prod) |
| `LINEAR_API_KEY` | Optional | Cycle backlog matching — planned vs shipped gap detection |
| `NEXT_PUBLIC_BASE_URL` | Vercel only | Self-referencing API for PR detail live translation |

---

## Deploying to Vercel

1. Connect this repo to Vercel
2. Add `ANTHROPIC_API_KEY` and `GITHUB_TOKEN` as environment variables
3. Set `NEXT_PUBLIC_BASE_URL` to your Vercel deployment URL (e.g. `https://atom-atlas-hxm-product-intelligence.vercel.app`)
4. Deploy — committed JSON files under `data/atom-output/` serve as the seed dataset immediately

---

## Data refresh

Run a Claude Code session with PostHog + Linear + GitHub MCPs active. Atom queries each source, runs Claude translations on new PRs, and writes updated `data/atom-output/*.json` files. Commit and redeploy to Vercel. Recommended: weekly before sprint planning.

---

## Audit status (Reforge intelligence layer framework)

| Dimension | Score | What was built | Next gap |
|-----------|-------|----------------|----------|
| Decision Velocity | Developing | P1/P2/P3 urgency tiers + recommended actions on every signal | SLA tracking, acknowledgment workflow |
| Signal-to-Outcome | Developing | outcomeType + ignoreCost on every PR | ARR linkage, customer segment mapping |
| Strategic Alignment | Weak | — | Linear cycle matching (needs `LINEAR_API_KEY`) |
| Pod Behavior Change | Weak | — | Linear auto-create for P1 signals, Slack push |
| Learning Loop | Weak | — | Signal feedback mechanism, accuracy tracking |
| Stakeholder Confidence | Developing | Weekly Brief is exec-readable, traffic light | Board artifact format |
| Anti-Noise | Developing | Signals sorted P1→P3, infra labeled, Brief clusters themes | Hard filter for infra-only PRs |
| Workflow Integration | Weak | — | Linear + Slack integration |
| Migration & Sunset | Developing | `legacyImpact` tag on every PR | Feature parity gap tracker, sunset cost calc |
| Revenue & Cost | Weak | — | ARR per customer segment, cost-of-ignoring with $ value |

---

## Tech stack

- Next.js 14 App Router, TypeScript, Tailwind CSS
- Anthropic Claude (claude-sonnet-4-6) for PR translation and brief generation
- PostHog, GitHub API, Linear as data sources
- Vercel for hosting
