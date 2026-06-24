# Atom — Atlas HXM Product Intelligence Layer

**Live:** https://atom-atlas-hxm-product-intelligence.vercel.app

---

## The problem

Atlas HXM operates across 6 product pods, 4 GitHub repos, multiple Linear cycles, and PostHog event streams. The information needed to make good decisions exists — but it's fragmented across tools and requires significant manual effort to correlate.

Today:
- A PR merges. Its user impact and production risk aren't visible until someone reads the diff.
- A PostHog event drops 40% week-over-week. It's unclear if it's a regression, a data issue, or expected behavior from a recent change.
- A cycle ends. Work that wasn't on the original roadmap gets surfaced in retrospect rather than in real time.
- A feature ships. There are no PostHog events. Whether it's being adopted — or working at all — is unknown.

The result: decisions get made with incomplete information on all sides. The gap between "what shipped" and "what it means for the product and users" compounds over time.

---

## What Atom does

Atom is a product intelligence layer that closes this gap. It reads GitHub, PostHog, and Linear — and translates raw engineering activity into shared context for the whole team.

Every signal Atom surfaces answers four questions:
1. **What happened?** (in plain language, not diff syntax)
2. **Who is affected and how?** (WSE persona, reach, behavior impact)
3. **What is the risk if we ignore it?** (explicit ignore cost, 2-week horizon)
4. **What should we do right now?** (one verb-first recommended action)

Atom also surfaces when work falls outside the 2026 roadmap (so the team can make an informed call on whether it's intentional), when a feature shipped with zero PostHog observability, and when a cycle is slipping before the sprint review.

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
| **Weekly Brief** | Pre-generated narrative: traffic light, P1 actions this week, regressions, production risks, instrumentation gaps, product opportunities |
| **Signals** | Per-pod PRs sorted by urgency (P1→P2→P3). Regression alerts (events down >20% WoW with no PR explaining the drop). Instrumentation gap warnings. |
| **Cycles** | Linear cycle state per pod: completion %, slip risk, key in-progress items, merged PRs, stale tickets — with roadmap alignment badges on every issue |
| **RICE Backlog** | Hypothesis scoring: (Reach × Impact% × Confidence%) ÷ Effort, calibrated to 2,600+ WSE base. Non-linear effort scale: 1w=÷1, 2w=÷3, 3w=÷5, 4w=÷7 |
| **Compete** | Deel, Remote, Globalization Partners — signals, Atlas advantages, watch items |
| **PR Detail** | Full analysis: diff, reviewer decisions, CI status, risk tier, recommended action, ignore cost, next opportunity, Linear cycle context, PostHog observability |

---

## Sentinel — Customer Voice Intelligence

**Sentinel** bridges the gap between raw customer data and actionable product intelligence. It captures customer voice from call transcripts and CRM records, normalizes them against the roadmap, and surfaces only approved, sourced signals in Atom.

### What Sentinel does

Every insight Atom publishes about customer needs, market gaps, or alignment signals originates in Sentinel. The system:

1. **Captures** raw customer voice from three sources:
   - Avoma transcripts (qualification, demo, discovery, vendor reviews)
   - HubSpot deals (last 90 days of pipeline with outcome and amount)
   - Atlas product roadmap (official quarterly plan with vertical and theme)

2. **Normalizes** (Synapse layer — local-only working layer):
   - Deduplicate and classify by source system
   - Match each source against roadmap themes and verticals
   - Score roadmap overlap: aligned, adjacent, gap, unknown
   - Compute confidence based on signal density and deal outcome

3. **Publishes** (Sentinel layer — approved signals only):
   - Promote approved signals to Atom (approved + confidence ≥ medium + verifiable source)
   - Hold back drafts until evidence and source linkage are clean
   - Surface action lenses: Needs Product, Needs Marketing, Aligned, Gap
   - Persist a directory of every reviewed source for full traceability

### Accessing Sentinel

| View | Purpose | URL |
|------|---------|-----|
| **Insights** | Approved signals categorized by roadmap theme, smart signals (top themes, gap pressure, conversation gravity), pie charts by source system and overlap type | `/sentinel` |
| **Source Directory** | Complete input register: 562 sources (100 Avoma transcripts, 431 HubSpot deals, 31 roadmap items). Search, filter by system/overlap/theme, switch table/card view, click any source for full details | `/sentinel/sources` |
| **Source Detail** | Full metadata for any input: company, stage/purpose, owner, deal amount, outcome signal, roadmap match basis, confidence level, source links | `/sentinel/sources/[source-id]` |
| **Architecture** | System diagram (Sources → Synapse → Sentinel → Atom) with flow visualization, trust boundary, and explanation of each layer | `/sentinel/architecture` |

### Trust boundary

Synapse holds raw transcripts, deal data, and unreviewed normalization. Atom only renders signals that have been approved with confidence ≥ medium and at least one verifiable source link. The directory exposes every source the layer reviewed — including drafts and unmapped rows — so reviewers can audit the full chain.

### Smart signals

The Insights hub auto-derives key metrics from the full 562-source library:

- **Top themes** — roadmap themes with the highest signal density
- **Gap pressure** — customer asks that fall outside the roadmap
- **Conversation gravity** — themes surfaced across multiple source systems (Avoma + HubSpot alignment)
- **Overlap distribution** — pie charts showing what % of sources are aligned, adjacent, gap, or unknown

---

## Architecture

```
Atom (Claude Code + MCP sessions)     Vercel App (Next.js App Router)
─────────────────────────────────     ───────────────────────────────
PostHog MCP  ──┐                      /          → redirect to /brief
GitHub CLI   ──┤──► data/             /brief     Weekly Brief (cached)
Linear MCP   ──┘    atom-output/      /signals   Signal Feed (P1→P2→P3)
                    brief.json        /cycles    Cycle Intelligence
GitHub Actions ───► merged-prs.json  /rice       RICE Backlog
(daily 6pm EST)     weekly-events.json /compete  Competitive Intel
                    linear-cycles.json /pr/[r]/[n] PR Detail (live)
                    exec-metrics.json
                    last-refreshed.json
```

Atom writes static JSON. The Vercel app reads them at build time — no PostHog or Linear API keys needed in the deployed app. The Weekly Brief loads instantly from `brief.json` (pre-generated during refresh) rather than calling Claude on each page load. PR detail pages call the GitHub API live via `/api/translate-pr`. A Sync button in the nav triggers the GitHub Actions workflow on demand via `workflow_dispatch`. GitHub Actions runs `scripts/refresh.mjs` daily to pull merged PRs, translate with Claude, and generate `brief.json` + `last-refreshed.json`.

---

## Roadmap alignment

Linear issues with the `RoadMap2026` label are considered roadmap work. Every in-progress ticket and merged PR in the Cycles view is tagged to give the team a shared view of planned vs reactive work:

- **`2026`** (green) — has the RoadMap2026 label, planned roadmap work
- **`off-roadmap`** (amber) — no label; may be reactive, a PROD fire, an engineering architecture decision, or work that needs a label added

The intent is not to penalise unplanned work — PROD blockers, customer escalations, and engineering improvements are often the right call. The goal is to make the split visible so leadership can have an informed conversation about trade-offs, rather than discovering the picture at sprint review.

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
`scripts/refresh.mjs` runs daily at 6pm EST via `.github/workflows/atom-refresh.yml`. It fetches merged PRs from all Atlas repos for the past 7 days, translates each with Claude, generates `brief.json` and `last-refreshed.json`, then commits all updated files. Only `ANTHROPIC_API_KEY` is required (the `GITHUB_TOKEN` is provided automatically by Actions).

### On-demand (Sync button)
The **Sync** button in the top nav triggers `workflow_dispatch` on the same GitHub Actions workflow. Status is polled every 8 seconds (queued → running → done). Page auto-reloads 30 seconds after the workflow completes with fresh data.

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
