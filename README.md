# Atom — Atlas HXM Product Intelligence Layer

**Live:** https://atom-atlas-hxm-product-intelligence.vercel.app

---

## The problem

Atlas HXM's CPO and PMs operate across 6 product pods, 4 GitHub repos, multiple Linear cycles, and PostHog event streams. The information exists — but it's fragmented across tools and in a format that requires engineering context to interpret.

Today:
- A PR merges. A PM has no idea what it changed, who it affects, or whether it broke something.
- A PostHog event drops 40% week-over-week. No one knows if it's a regression or expected behavior.
- A sprint ends. Half the tickets are "off-roadmap" reactive work. No one caught it until planning.
- A feature ships. There are zero PostHog events. Adoption is invisible.

The result: PMs make prioritization decisions without the signal. Engineers make architectural calls without PM context. The gap between "what we shipped" and "what it means for users" grows every sprint.

---

## What Atom does

Atom is a product intelligence layer that closes this gap. It reads GitHub, PostHog, and Linear — and translates raw engineering activity into decisions.

Every signal Atom surfaces answers four questions:
1. **What happened?** (in plain language, not diff syntax)
2. **Who is affected and how?** (WSE persona, reach, behavior impact)
3. **What is the risk if we ignore it?** (explicit ignore cost, 2-week horizon)
4. **What should we do right now?** (one verb-first recommended action)

Atom also tells you when work is off the 2026 roadmap, when a feature shipped with zero observability, and when a cycle is slipping before the sprint review.

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
| **Roadmap alignment** | Is this PR connected to a RoadMap2026-labeled Linear ticket? |

---

## Views

| View | Purpose |
|------|---------|
| **Exec** | SSO health, exceptions, rage clicks, pod PR velocity — 7-day WoW |
| **Weekly Brief** | Claude-generated narrative: traffic light, P1 actions this week, regressions, production risks, instrumentation gaps, product opportunities |
| **Signals** | Per-pod PRs sorted by urgency. Regression alerts (events down >20% WoW with no PR explaining the drop). Instrumentation gap warnings. |
| **Cycles** | Linear cycle state per pod: completion %, slip risk, key in-progress items, merged PRs, stale tickets — with roadmap alignment badges on every issue |
| **RICE Backlog** | Hypothesis scoring: (Reach × Impact% × Confidence%) ÷ Effort, calibrated to 2,600+ WSE base. Non-linear effort scale: 1w=÷1, 2w=÷3, 3w=÷5, 4w=÷7 |
| **Compete** | Deel, Remote, Globalization Partners — signals, Atlas advantages, watch items |
| **PR Detail** | Full analysis: diff, reviewer decisions, CI status, risk tier, recommended action, ignore cost, next opportunity, Linear cycle context, PostHog observability |

---

## Architecture

```
Atom (Claude Code + MCP sessions)     Vercel App (Next.js App Router)
─────────────────────────────────     ───────────────────────────────
PostHog MCP  ──┐                      /          Exec
GitHub CLI   ──┤──► data/             /brief     Weekly Brief
Linear MCP   ──┘    atom-output/      /signals   Signal Feed
                    exec-metrics.json /cycles    Cycle Intelligence
GitHub Actions ───► merged-prs.json  /rice       RICE Backlog
(daily 6pm EST)     weekly-events.json /compete  Competitive Intel
                    linear-cycles.json /pr/[r]/[n] PR Detail (live)
                    rice-scores.json
```

Atom writes static JSON. The Vercel app reads them — no PostHog or Linear API keys needed in the deployed app. PR detail pages call the GitHub API live via `/api/translate-pr` and use Claude for real-time translation. GitHub Actions runs `scripts/refresh.mjs` daily to pull merged PRs and re-translate with Claude, committing only `merged-prs.json`.

---

## Roadmap alignment

Linear issues with the `RoadMap2026` label are considered roadmap work. Every in-progress ticket and merged PR in the Cycles view is tagged:

- **`2026`** (green) — has the RoadMap2026 label, planned work
- **`off-roadmap`** (amber) — no label, unplanned or reactive work

The PR detail page shows a prominent roadmap note for every PR with a detected Linear ID. Cross-pod signals fire when off-roadmap work exceeds a threshold across multiple pods (currently 11/16 active tickets are off-roadmap).

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
| FNM 1 | Take Home Pay, virtual expense cards, Sage sync | (uninstrumented — gap) |
| FNM 2 | GTN mapping, recon file import, Partner Connect | (uninstrumented — gap) |
| Data Platform | Data warehouse, pipelines, external schemas | (uninstrumented — gap) |

---

## RICE calibration (Atlas HXM context)

Formula: `(Reach × Impact% × Confidence%) ÷ Effort`

- **Reach**: WSEs directly impacted (Atlas base: ~2,600 active WSEs)
- **Impact%**: Share of reach meaningfully affected (e.g. 40% = significant friction for most of reach)
- **Confidence%**: Evidence quality — 90% = confirmed PostHog data, 60% = hypothesis, 40% = intuition
- **Effort** (non-linear divisor): 3d=÷0.5, 1w=÷1, 2w=÷3, 3w=÷5, 4w=÷7

| Score | Label | Action |
|-------|-------|--------|
| 600+ | Ship it | Prioritize immediately |
| 300–599 | Strong | Next cycle |
| 100–299 | Validate | Run experiment first |
| 40–99 | Monitor | Watch signal, don't build yet |
| <40 | Hypothesis | Needs more evidence |

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
| `NEXT_PUBLIC_BASE_URL` | Vercel only | Self-referencing API for PR detail live translation |
| `POSTHOG_API_KEY` | Not needed | Atom uses PostHog MCP in Claude Code sessions — not called from the app |
| `LINEAR_API_KEY` | Not needed | Atom uses Linear MCP in Claude Code sessions — not called from the app |

---

## Deploying to Vercel

1. Connect this repo to Vercel
2. Add `ANTHROPIC_API_KEY` and `GITHUB_TOKEN` as environment variables
3. Set `NEXT_PUBLIC_BASE_URL` to your Vercel deployment URL
4. Deploy — committed JSON files under `data/atom-output/` serve as the seed dataset immediately

---

## Data refresh

### Automated (GitHub Actions)
`scripts/refresh.mjs` runs daily at 6pm EST via `.github/workflows/atom-refresh.yml`. It fetches merged PRs from all Atlas repos for the past 7 days, translates each with Claude, and commits updated `data/atom-output/merged-prs.json`. Only `ANTHROPIC_API_KEY` is required (the `GITHUB_TOKEN` is provided automatically by Actions).

### Manual (Claude Code + MCP)
Open a Claude Code session with PostHog, Linear, and GitHub MCPs active. Atom queries each source, runs Claude translations, and writes updated `data/atom-output/*.json` files. Commit and push — Vercel auto-deploys. Recommended: weekly before sprint planning, or after Linear cycle rollover.

---

## Audit status (Reforge intelligence layer framework)

| Dimension | Score | What was built | Next gap |
|-----------|-------|----------------|----------|
| Decision Velocity | Developing | P1/P2/P3 urgency tiers + recommended actions on every signal | SLA tracking, acknowledgment workflow |
| Signal-to-Outcome | Developing | outcomeType + ignoreCost on every PR | ARR linkage, customer segment mapping |
| Strategic Alignment | Developing | Linear cycle matching, RoadMap2026 label detection, off-roadmap flagging per pod | Automated label check in refresh script |
| Pod Behavior Change | Weak | — | Linear auto-create for P1 signals, Slack push |
| Learning Loop | Weak | — | Signal feedback mechanism, accuracy tracking |
| Stakeholder Confidence | Developing | Weekly Brief is exec-readable, traffic light | Board artifact format |
| Anti-Noise | Developing | Signals sorted P1→P3, infra labeled, Brief clusters themes | Hard filter for infra-only PRs |
| Workflow Integration | Weak | — | Linear + Slack integration |
| Migration & Sunset | Developing | `legacyImpact` tag on every PR | Feature parity gap tracker, sunset cost calc |
| Revenue & Cost | Weak | — | ARR per customer segment, cost-of-ignoring with $ value |

---

## Tech stack

- Next.js App Router, TypeScript, Tailwind CSS
- Anthropic Claude (claude-sonnet-4-6) for PR translation and brief generation
- PostHog, GitHub API, Linear as data sources (via MCP in Claude Code sessions)
- GitHub Actions for daily automated PR refresh
- Vercel for hosting
