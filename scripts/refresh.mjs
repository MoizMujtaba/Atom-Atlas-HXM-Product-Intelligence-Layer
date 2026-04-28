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

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Atom refresh starting at", new Date().toISOString())
  console.log("Scope: merged-prs.json only (Linear + PostHog refreshed via MCP)")

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
  console.log(`Done — ${translatedPRs.length} PRs written to merged-prs.json`)
}

main().catch(err => { console.error("Refresh failed:", err); process.exit(1) })
