#!/usr/bin/env node
/**
 * Atom daily refresh script — GitHub PRs + Claude translations only
 *
 * Linear cycles   → refreshed via Linear MCP in Claude Code
 * PostHog events  → refreshed via PostHog MCP in Claude Code
 * Merged PRs      → this script (GitHub API + Anthropic)
 *
 * Run via: node scripts/refresh.mjs
 * Or automatically via GitHub Actions at 6pm EST
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import Anthropic from "@anthropic-ai/sdk"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, "..", "data", "atom-output")

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

const ORG = "atlashxm"
const REPOS = ["Atlas-Webapp", "Atlas-Frontend", "Payments-Backend", "Atlas-HCM-BE"]

const TEAM_KEY_MAP = {
  WFM1: "WFM 1", WFM2: "WFM 2", WFM3: "WFM 3",
  PAY: "PAY", FNM1: "FNM 1", FNM2: "FNM 2",
  DATA: "Data Platform",
}

function detectTeam(title) {
  for (const [key, pod] of Object.entries(TEAM_KEY_MAP)) {
    if (title.toUpperCase().startsWith(key + "-")) return pod
  }
  return "Platform"
}

// ── GitHub ────────────────────────────────────────────────────────────────────

async function ghFetch(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
  })
  if (!res.ok) return null
  return res.json()
}

async function getMergedPRs() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const all = []
  await Promise.all(REPOS.map(async (repo) => {
    const prs = await ghFetch(`/repos/${ORG}/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=40`)
    if (!prs) return
    for (const pr of prs) {
      if (pr.merged_at && pr.merged_at > since) {
        all.push({ number: pr.number, title: pr.title, repo, team: detectTeam(pr.title), mergedAt: pr.merged_at, url: pr.html_url, author: pr.user?.login })
      }
    }
  }))
  return all.sort((a, b) => new Date(b.mergedAt) - new Date(a.mergedAt))
}

async function getPRDetails(repo, number) {
  const [files, reviews, comments] = await Promise.all([
    ghFetch(`/repos/${ORG}/${repo}/pulls/${number}/files`),
    ghFetch(`/repos/${ORG}/${repo}/pulls/${number}/reviews`),
    ghFetch(`/repos/${ORG}/${repo}/pulls/${number}/comments`),
  ])
  return { files: files || [], reviews: reviews || [], comments: comments || [] }
}

// ── Claude translation ────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

async function translatePR(title, files, allComments) {
  const fileList = files.map(f => f.filename).join("\n")
  const patches = files.filter(f => f.patch).slice(0, 6)
    .map(f => `--- ${f.filename} ---\n${f.patch?.slice(0, 1000)}`).join("\n\n")
  const reviewDecisions = allComments.filter(c => c.decision && c.decision !== "COMMENTED")
    .map(c => `${c.user}: ${c.decision}`).join("\n")
  const commentText = allComments.slice(0, 15)
    .map(c => `[${c.isReview ? "REVIEW" : "COMMENT"}] ${c.user}: ${c.body}`).join("\n\n")

  const prompt = `You are Atom, a product intelligence layer for Atlas HXM — an HCM/payroll/workforce management SaaS for global employment (EOR), serving 2,600+ WSEs.

Pods: WFM 1 (census verification, HRSD, assignee flows), WFM 2 (expenses, AI extraction, contribution splits), PAY (SSO, MFA, payroll auth), FNM 1 (Take Home Pay, virtual expense cards, Ramp), FNM 2 (GTN mapping, recon, Partner Connect), Data Platform (warehouse, pipelines).

PR TITLE: ${title}
REVIEW DECISIONS:\n${reviewDecisions || "(none)"}
FILES CHANGED:\n${fileList}
DIFF PATCHES (sample):\n${patches || "(none)"}
REVIEW COMMENTS:\n${commentText || "(none)"}

Respond with JSON only:
{
  "signalType": "friction"|"new-capability"|"error-handling"|"feature-flag"|"navigation"|"migration"|"infrastructure",
  "userImpact": "One sentence what user can now do or pain fixed",
  "targetPersona": "WSE|Client Admin|HRSD Reviewer|Partner|All",
  "podConfirmed": "pod name",
  "migrationSignal": true/false,
  "frictionFixed": "specific pain removed or null",
  "newCapability": "new user action enabled or null",
  "productionRisk": "high"|"medium"|"low",
  "productionRiskReason": "specific code evidence",
  "reviewerRisks": ["specific risk from reviewer or omit"],
  "instrumentationGap": true if new user-visible behavior ships with no PostHog event,
  "nextOpportunity": "PM product idea or null",
  "watchItems": ["specific PostHog metric to check"],
  "urgencyTier": "P1"|"P2"|"P3",
  "recommendedAction": "verb-first action for PM in 48h",
  "outcomeType": "retention"|"revenue"|"efficiency"|"risk"|"migration",
  "ignoreCost": "concrete consequence of ignoring for 2 weeks",
  "legacyImpact": "accelerates-sunset"|"neutral"|"delays-sunset"
}
Return only valid JSON.`

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })
    const raw = message.content[0].type === "text" ? message.content[0].text : "{}"
    const stripped = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
    const match = stripped.match(/\{[\s\S]*\}/)
    return JSON.parse(match ? match[0] : stripped)
  } catch {
    return null
  }
}

// ── Weekly Brief ──────────────────────────────────────────────────────────────

function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8")) } catch { return fallback }
}

async function generateBrief(prs) {
  const events = readJSON("weekly-events.json", [])
  const regressions = []
  const POD_EVENTS = {
    "WFM 1": ["employee_task_clicked", "employee_task_saved", "employee_submitted", "employee_created"],
    "WFM 2": ["addExpense_aiFeedbackBannerShown", "addExpense_upserted", "addExpenseLine_upserted", "expenseDetail_upserted"],
    "PAY": ["sso_login_attempt", "sso_login_success", "sso_login_failed", "mfa_sms_setup_phone"],
  }
  for (const [pod, podEvents] of Object.entries(POD_EVENTS)) {
    for (const ev of podEvents) {
      const data = events.find(e => e.event === ev)
      if (!data || data.lastWeek === 0) continue
      const drop = Math.round(((data.lastWeek - data.thisWeek) / data.lastWeek) * 100)
      if (drop >= 20) regressions.push({ event: ev, thisWeek: data.thisWeek, lastWeek: data.lastWeek, pod })
    }
  }

  const prSummary = prs.filter(p => p.translation).map(p =>
    `[${p.team}] ${p.title} → ${p.translation.userImpact || "no translation"} (risk: ${p.translation.productionRisk || "unknown"}, gap: ${p.translation.instrumentationGap ?? false})`
  ).join("\n")

  const eventSummary = events.slice(0, 12).map(e => {
    const pct = e.lastWeek > 0 ? Math.round(((e.thisWeek - e.lastWeek) / e.lastWeek) * 100) : 0
    return `${e.event}: ${e.thisWeek} this week (${pct > 0 ? "+" : ""}${pct}% WoW)`
  }).join("\n")

  const regressionSummary = regressions.map(r => {
    const pct = Math.round(((r.thisWeek - r.lastWeek) / r.lastWeek) * 100)
    return `${r.event} in ${r.pod}: ${pct}% WoW (${r.lastWeek} → ${r.thisWeek})`
  }).join("\n")

  const prompt = `You are Atom, product intelligence layer for Atlas HXM — global HCM SaaS for 2,600+ WSEs.

Write a weekly product brief for the VP Product. Surface 3–5 signals that require a decision. Cluster themes. Tell PM exactly what to do.

SHIPPED THIS WEEK (${prs.length} PRs):
${prSummary || "(none)"}

POSTHOG EVENT TRENDS:
${eventSummary || "(no event data)"}

REGRESSION ALERTS (>20% WoW drop):
${regressionSummary || "None detected"}

Return JSON only:
{
  "headline": "One punchy sentence — the most important thing that happened or needs attention this week",
  "summary": "2-3 sentences MAX: cluster the week into 1-2 themes, name the data signal that validates or contradicts, state what must be decided",
  "weekSignal": "green" | "amber" | "red",
  "weekSignalReason": "Why this color — cite one specific metric or event",
  "regressions": [{ "event": "event name", "drop": number, "hypothesis": "why this might have dropped" }],
  "topRisks": [{ "title": "risk title", "reason": "specific consequence", "recommendedAction": "what PM does in 48h" }],
  "instrumentationGaps": ["feature shipped blind and why it matters"],
  "opportunities": [{ "idea": "specific buildable idea", "outcomeType": "retention|revenue|efficiency|risk|migration", "fromPR": "which PR", "estimatedEffort": "short estimate" }],
  "p1Actions": ["verb-first action PM must take this week — max 3"],
  "execSignal": "One sentence for a VP: traffic light + the one number that matters most"
}

Suppress noise. Return only valid JSON.`

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 900,
      messages: [{ role: "user", content: prompt }],
    })
    const raw = message.content[0].type === "text" ? message.content[0].text : "{}"
    const stripped = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
    const match = stripped.match(/\{[\s\S]*\}/)
    const brief = JSON.parse(match ? match[0] : stripped)
    return { ...brief, generatedAt: new Date().toISOString() }
  } catch {
    return null
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const startedAt = new Date().toISOString()
  console.log("Atom refresh starting at", startedAt)

  console.log("Fetching merged PRs from GitHub...")
  const mergedPRs = await getMergedPRs()
  console.log(`Found ${mergedPRs.length} PRs merged in the last 7 days`)

  console.log("Translating PRs with Claude...")
  const translatedPRs = []
  for (const pr of mergedPRs) {
    process.stdout.write(`  ${pr.repo}#${pr.number} ${pr.title.slice(0, 50)}... `)
    try {
      const { files, reviews, comments } = await getPRDetails(pr.repo, pr.number)
      const reviewDecisions = reviews
        .map(r => ({ body: r.body || "", user: r.user?.login || "reviewer", isReview: true, decision: r.state || "COMMENTED" }))
        .filter(r => r.body.length > 0 || r.decision !== "COMMENTED")
      const diffComments = comments
        .map(c => ({ body: c.body || "", user: c.user?.login || "reviewer", isReview: false, path: c.path }))
        .filter(c => c.body.length > 0)
      const translation = await translatePR(pr.title, files, [...reviewDecisions, ...diffComments])
      translatedPRs.push({ ...pr, fileCount: files.length, translation })
      console.log(translation ? "ok" : "parse failed")
    } catch (e) {
      console.log("error:", e.message)
      translatedPRs.push({ ...pr, fileCount: 0, translation: null })
    }
    await new Promise(r => setTimeout(r, 500))
  }

  fs.writeFileSync(path.join(DATA_DIR, "merged-prs.json"), JSON.stringify(translatedPRs, null, 2))
  console.log(`✓ ${translatedPRs.length} PRs written to merged-prs.json`)

  console.log("Generating weekly brief with Claude...")
  const brief = await generateBrief(translatedPRs)
  if (brief) {
    fs.writeFileSync(path.join(DATA_DIR, "brief.json"), JSON.stringify(brief, null, 2))
    console.log("✓ brief.json written")
  } else {
    console.log("✗ Brief generation failed — skipping")
  }

  fs.writeFileSync(
    path.join(DATA_DIR, "last-refreshed.json"),
    JSON.stringify({ refreshedAt: startedAt }, null, 2)
  )
  console.log("✓ last-refreshed.json written")
  console.log("Refresh complete.")
}

main().catch(err => { console.error("Refresh failed:", err); process.exit(1) })
