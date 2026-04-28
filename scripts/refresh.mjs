#!/usr/bin/env node
/**
 * Atom daily refresh script
 * Regenerates data/atom-output/*.json from Linear, PostHog, GitHub, and Claude
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
const LINEAR_API_KEY = process.env.LINEAR_API_KEY
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

const ORG = "atlashxm"
const REPOS = ["Atlas-Webapp", "Atlas-Frontend", "Payments-Backend", "Atlas-HCM-BE"]
const POSTHOG_PROJECT = "52189"
const POSTHOG_HOST = "https://eu.posthog.com"

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

async function ghFetch(path, accept = "application/vnd.github+json") {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: accept },
  })
  if (!res.ok) return null
  return accept === "application/vnd.github.diff" ? res.text() : res.json()
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

async function translatePR(title, body, files, allComments) {
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
PR DESCRIPTION: ${body || "(no description)"}
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

// ── Linear ────────────────────────────────────────────────────────────────────

async function linearQuery(query) {
  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: LINEAR_API_KEY },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) return null
  const json = await res.json()
  return json.data
}

async function getLinearCycles() {
  const data = await linearQuery(`{
    teams(first: 20) {
      nodes {
        id name key
        activeCycle {
          id number name startsAt endsAt
          issues(first: 150) {
            nodes {
              id identifier title priority
              state { name type }
              assignee { displayName }
              labels { nodes { name } }
            }
          }
        }
      }
    }
  }`)
  return data?.teams?.nodes || []
}

function calcSlipRisk(completionPct, daysLeft) {
  if (daysLeft <= 0) return completionPct < 80 ? "high" : "medium"
  if (daysLeft <= 3) return completionPct < 50 ? "high" : completionPct < 70 ? "medium" : "low"
  if (daysLeft <= 7) return completionPct < 30 ? "high" : completionPct < 50 ? "medium" : "low"
  return completionPct < 20 ? "medium" : "low"
}

function slipRiskReason(completionPct, daysLeft, slipRisk) {
  if (slipRisk === "high") return `${completionPct}% complete with ${Math.max(0, daysLeft)} day(s) remaining — cycle unlikely to finish on time.`
  if (slipRisk === "medium") return `${completionPct}% complete with ${daysLeft} day(s) remaining — pace needs to accelerate.`
  return `${completionPct}% complete with ${daysLeft} day(s) remaining — on track.`
}

function buildPodCycle(team, cycle, mergedPRsThisWeek) {
  const issues = cycle.issues?.nodes || []
  const stateCount = (type) => issues.filter(i => i.state?.type === type).length
  const stateNameCount = (name) => issues.filter(i => i.state?.name?.toLowerCase().includes(name.toLowerCase())).length

  const completedIssues = stateCount("completed")
  const devCompleted = stateNameCount("dev complete") + stateNameCount("dev done")
  const inReview = stateNameCount("in review") + stateNameCount("review")
  const inProgress = stateCount("started") - devCompleted - inReview
  const todo = stateCount("unstarted") + stateCount("backlog")
  const totalIssues = issues.length
  const completionPct = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0

  const cycleEnds = cycle.endsAt ? cycle.endsAt.split("T")[0] : ""
  const daysLeft = cycleEnds ? Math.ceil((new Date(cycleEnds).getTime() - Date.now()) / 86400000) : 0
  const slipRisk = calcSlipRisk(completionPct, daysLeft)

  const podKey = Object.entries(TEAM_KEY_MAP).find(([, v]) => v === (TEAM_KEY_MAP[team.key] || team.name))?.[0]
  const podName = TEAM_KEY_MAP[team.key] || team.name

  // Key in progress: started issues with highest priority
  const keyInProgress = issues
    .filter(i => i.state?.type === "started")
    .sort((a, b) => (a.priority || 9) - (b.priority || 9))
    .slice(0, 5)
    .map(i => ({
      id: i.identifier,
      title: i.title,
      assignee: i.assignee?.displayName || "Unassigned",
      isProdBlocker: i.labels?.nodes?.some(l => l.name?.toLowerCase().includes("prod") || l.name?.toLowerCase().includes("blocker")) || undefined,
    }))

  // Signals
  const signals = []
  if (completionPct === 0 && totalIssues > 0) {
    signals.push({ type: "slip-risk", urgency: "P1", title: `${podName} cycle ${cycle.number} has 0% completion`, detail: `${totalIssues} issues in scope, none completed yet.` })
  } else if (slipRisk === "high") {
    signals.push({ type: "slip-risk", urgency: "P1", title: `${podName} cycle ${cycle.number} at high slip risk`, detail: slipRiskReason(completionPct, daysLeft, slipRisk) })
  } else if (slipRisk === "medium") {
    signals.push({ type: "slip-risk", urgency: "P2", title: `${podName} pace needs attention`, detail: slipRiskReason(completionPct, daysLeft, slipRisk) })
  }

  const staleCount = mergedPRsThisWeek.filter(pr => pr.stale).length
  if (staleCount > 0) {
    signals.push({ type: "stale-tickets", urgency: "P2", title: `${staleCount} stale Linear ticket(s) in ${podName}`, detail: `PR merged but Linear status not updated. Close the ticket(s) to keep velocity data accurate.` })
  }

  const prodBlockers = keyInProgress.filter(i => i.isProdBlocker)
  if (prodBlockers.length > 0) {
    signals.push({ type: "prod-blocker", urgency: "P1", title: `${prodBlockers.length} PROD blocker(s) in ${podName}`, detail: prodBlockers.map(i => `${i.id}: ${i.title}`).join("; ") })
  }

  return {
    pod: podName,
    cycleNumber: cycle.number,
    cycleName: cycle.name || undefined,
    cycleEnds,
    totalIssues,
    completedIssues,
    devCompleted,
    inReview,
    inProgress: Math.max(0, inProgress),
    todo,
    completionPct,
    slipRisk,
    slipRiskReason: slipRiskReason(completionPct, daysLeft, slipRisk),
    mergedPRsThisWeek,
    keyInProgress,
    signals,
  }
}

// ── PostHog ───────────────────────────────────────────────────────────────────

async function phQuery(hogql) {
  const res = await fetch(`${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT}/query/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${POSTHOG_API_KEY}` },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query: hogql } }),
  })
  if (!res.ok) return null
  const json = await res.json()
  return json.results || []
}

async function getWeeklyEvents() {
  const [thisWeek, lastWeek] = await Promise.all([
    phQuery(`SELECT event, count() as cnt FROM events WHERE timestamp >= now() - interval 7 day AND timestamp < now() GROUP BY event ORDER BY cnt DESC LIMIT 30`),
    phQuery(`SELECT event, count() as cnt FROM events WHERE timestamp >= now() - interval 14 day AND timestamp < now() - interval 7 day GROUP BY event ORDER BY cnt DESC LIMIT 30`),
  ])
  if (!thisWeek || !lastWeek) return []

  const lastMap = new Map(lastWeek.map(([e, c]) => [e, c]))
  return thisWeek.map(([event, cnt]) => ({
    event,
    thisWeek: cnt,
    lastWeek: lastMap.get(event) || 0,
  }))
}

async function getExecMetrics(events) {
  const get = (name) => events.find(e => e.event === name)
  const ssoAttempts = get("sso_login_attempt")?.thisWeek || 0
  const ssoSuccess = get("sso_login_success")?.thisWeek || 0
  const ssoFailed = get("sso_login_failed")?.thisWeek || 0
  const ssoAttemptsPrev = get("sso_login_attempt")?.lastWeek || 0
  const ssoSuccessPrev = get("sso_login_success")?.lastWeek || 0
  const exceptions = get("$exception")?.thisWeek || 0
  const exceptionsPrev = get("$exception")?.lastWeek || 0
  const pageviews = get("$pageview")?.thisWeek || 0
  const pageviewsPrev = get("$pageview")?.lastWeek || 0
  const rageclicks = get("$rageclick")?.thisWeek || 0
  const rageclicksPrev = get("$rageclick")?.lastWeek || 0

  const now = new Date()
  const weekStart = new Date(now - 7 * 86400000)
  const period = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}–${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`

  return {
    generatedAt: now.toISOString(),
    period,
    ssoAttempts, ssoSuccess, ssoFailed,
    ssoSuccessRate: ssoAttempts > 0 ? Math.round((ssoSuccess / ssoAttempts) * 100) : 0,
    ssoAttemptsPrev, ssoSuccessPrev,
    ssoSuccessRatePrev: ssoAttemptsPrev > 0 ? Math.round((ssoSuccessPrev / ssoAttemptsPrev) * 100) : 0,
    exceptions, exceptionsPrev,
    rageclicks, rageclicksPrev,
    pageviews, pageviewsPrev,
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔄 Atom refresh starting at", new Date().toISOString())

  // 1. Merged PRs from GitHub
  console.log("📦 Fetching merged PRs from GitHub...")
  const mergedPRs = await getMergedPRs()
  console.log(`   Found ${mergedPRs.length} PRs merged in the last 7 days`)

  // 2. Translate each PR with Claude
  console.log("🤖 Translating PRs with Claude...")
  const translatedPRs = []
  for (const pr of mergedPRs) {
    process.stdout.write(`   ${pr.repo}#${pr.number} ${pr.title.slice(0, 50)}... `)
    try {
      const { files, reviews, comments } = await getPRDetails(pr.repo, pr.number)
      const reviewDecisions = reviews.map(r => ({ body: r.body || "", user: r.user?.login || "reviewer", isReview: true, decision: r.state || "COMMENTED", submittedAt: r.submitted_at })).filter(r => r.body.length > 0 || r.decision !== "COMMENTED")
      const diffComments = comments.map(c => ({ body: c.body || "", user: c.user?.login || "reviewer", isReview: false, decision: undefined, path: c.path })).filter(c => c.body.length > 0)
      const translation = await translatePR(pr.title, "", files, [...reviewDecisions, ...diffComments])
      translatedPRs.push({ ...pr, fileCount: files.length, translation })
      console.log(translation ? "✓" : "✗ (parse failed)")
    } catch (e) {
      console.log("✗ (error)", e.message)
      translatedPRs.push({ ...pr, fileCount: 0, translation: null })
    }
    // Respect rate limits
    await new Promise(r => setTimeout(r, 500))
  }

  // 3. Linear cycles
  console.log("📊 Fetching Linear cycles...")
  const teams = await getLinearCycles()
  console.log(`   Found ${teams.length} teams`)

  // Build a map of linearId → merged PR for cross-referencing
  const prByLinearId = new Map()
  for (const pr of mergedPRs) {
    const match = pr.title.match(/^([A-Z]+-\d+)/i)
    if (match) prByLinearId.set(match[1].toUpperCase(), pr)
  }

  const pods = []
  let totalStaleTickets = 0
  let p1Signals = 0, p2Signals = 0, p3Signals = 0

  for (const team of teams) {
    const podName = TEAM_KEY_MAP[team.key]
    if (!podName || !team.activeCycle) continue

    const cycle = team.activeCycle
    const issues = cycle.issues?.nodes || []

    // Match merged PRs to this pod's cycle issues
    const mergedInPod = mergedPRs.filter(pr => {
      const m = pr.title.match(/^([A-Z]+-\d+)/i)
      if (!m) return false
      const linearId = m[1].toUpperCase()
      return issues.some(i => i.identifier?.toUpperCase() === linearId)
    })

    const mergedPRsThisWeek = mergedInPod.map(pr => {
      const m = pr.title.match(/^([A-Z]+-\d+)/i)
      const linearId = m ? m[1].toUpperCase() : ""
      const issue = issues.find(i => i.identifier?.toUpperCase() === linearId)
      const linearStatus = issue?.state?.name || null
      const stale = linearStatus ? !["Done", "Completed", "Cancelled", "Merged"].some(s => linearStatus.toLowerCase().includes(s.toLowerCase())) : false
      if (stale) totalStaleTickets++
      return { linearId, prNumber: pr.number, linearStatus, stale }
    })

    const podCycle = buildPodCycle(team, cycle, mergedPRsThisWeek)
    pods.push(podCycle)

    podCycle.signals.forEach(s => {
      if (s.urgency === "P1") p1Signals++
      else if (s.urgency === "P2") p2Signals++
      else p3Signals++
    })
  }

  // Cross-pod signals
  const crossPodSignals = []
  const stalePods = pods.filter(p => p.mergedPRsThisWeek.some(pr => pr.stale)).map(p => p.pod)
  if (stalePods.length > 0) {
    crossPodSignals.push({ urgency: "P1", title: `${totalStaleTickets} merged PRs are stale in Linear — velocity data unreliable`, detail: "PR merged but Linear tickets not closed. Update tickets to maintain accurate cycle health data.", affectedPods: stalePods })
  }
  const darkPods = pods.filter(p => ["FNM 1", "FNM 2", "Data Platform"].includes(p.pod)).map(p => p.pod)
  if (darkPods.length > 0) {
    crossPodSignals.push({ urgency: "P2", title: `${darkPods.length} pod(s) have zero PostHog instrumentation`, detail: "FNM 1, FNM 2, and Data Platform have no custom events tracked. You cannot measure adoption, detect regressions, or validate shipped features.", affectedPods: darkPods })
  }
  const highRiskPods = pods.filter(p => p.slipRisk === "high")
  if (highRiskPods.length > 0) {
    crossPodSignals.push({ urgency: "P1", title: `${highRiskPods.length} pod(s) at high cycle slip risk`, detail: highRiskPods.map(p => `${p.pod}: ${p.completionPct}% complete`).join(", "), affectedPods: highRiskPods.map(p => p.pod) })
  }

  const linearCycles = {
    generatedAt: new Date().toISOString(),
    pods,
    crossPodSignals,
    plannedVsShipped: {
      totalPlannedThisWeek: pods.reduce((s, p) => s + p.totalIssues, 0),
      totalMergedPRs: mergedPRs.length,
      mappedToLinear: mergedPRs.filter(pr => pr.title.match(/^[A-Z]+-\d+/i)).length,
      unmapped: mergedPRs.filter(pr => !pr.title.match(/^[A-Z]+-\d+/i)).length,
      staleTickets: totalStaleTickets,
      p1Signals, p2Signals, p3Signals,
    },
  }

  // 4. PostHog events
  console.log("📈 Fetching PostHog event trends...")
  const weeklyEvents = await getWeeklyEvents()
  console.log(`   Found ${weeklyEvents.length} events`)
  const execMetrics = await getExecMetrics(weeklyEvents)

  // 5. Write all files
  console.log("💾 Writing data files...")
  fs.writeFileSync(path.join(DATA_DIR, "merged-prs.json"), JSON.stringify(translatedPRs, null, 2))
  fs.writeFileSync(path.join(DATA_DIR, "linear-cycles.json"), JSON.stringify(linearCycles, null, 2))
  fs.writeFileSync(path.join(DATA_DIR, "weekly-events.json"), JSON.stringify(weeklyEvents, null, 2))
  fs.writeFileSync(path.join(DATA_DIR, "exec-metrics.json"), JSON.stringify(execMetrics, null, 2))

  console.log("✅ Atom refresh complete")
  console.log(`   ${translatedPRs.length} PRs translated`)
  console.log(`   ${pods.length} pods synced`)
  console.log(`   ${weeklyEvents.length} PostHog events`)
  console.log(`   ${p1Signals} P1 signals, ${p2Signals} P2, ${p3Signals} P3`)
}

main().catch(err => { console.error("❌ Refresh failed:", err); process.exit(1) })
