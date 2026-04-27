import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface AtomTranslation {
  signalType: "friction" | "new-capability" | "error-handling" | "feature-flag" | "navigation" | "migration" | "infrastructure"
  userImpact: string
  targetPersona: string
  podConfirmed: string
  migrationSignal: boolean
  frictionFixed: string | null
  newCapability: string | null
  productionRisk: "high" | "medium" | "low"
  productionRiskReason: string
  reviewerRisks: string[]
  instrumentationGap: boolean
  nextOpportunity: string | null
  watchItems: string[]
}

export async function translatePRDiff(
  title: string,
  body: string,
  files: { filename: string; patch?: string }[],
  comments: { body: string; user: string; isReview?: boolean; decision?: string }[]
): Promise<AtomTranslation> {
  const fileList = files.map(f => f.filename).join("\n")
  const patches = files
    .filter(f => f.patch)
    .slice(0, 6)
    .map(f => `--- ${f.filename} ---\n${f.patch?.slice(0, 1000)}`)
    .join("\n\n")

  const reviewDecisions = comments
    .filter(c => c.decision && c.decision !== "COMMENTED")
    .map(c => `${c.user}: ${c.decision}`)
    .join("\n")

  const commentText = comments
    .slice(0, 15)
    .map(c => `[${c.isReview ? "REVIEW" : "COMMENT"}] ${c.user}: ${c.body}`)
    .join("\n\n")

  const prompt = `You are Atom, a product intelligence layer for Atlas HXM — an HCM/payroll/workforce management SaaS for global employment (EOR), serving 2,600+ WSEs (Workforce Service Employees).

Pods: WFM 1 (census verification, HRSD, assignee flows), WFM 2 (expenses, AI extraction, contribution splits), PAY (SSO, MFA, payroll auth), FNM 1 (Take Home Pay, virtual expense cards, Ramp), FNM 2 (GTN mapping, recon, Partner Connect), Data Platform (warehouse, pipelines).

User personas: WSE (worker), Client Admin (employer HR), HRSD Reviewer (Atlas internal), Partner (integration).

Analyze this GitHub PR for product intelligence. Extract what matters for a Product Manager:
- What user problem is solved or what capability shipped?
- Which persona is affected and how?
- What did reviewers flag as risks or concerns (read their comments carefully)?
- What is the production failure risk and why?
- Is this shipping new user behavior WITHOUT PostHog tracking (instrumentation gap)?
- What should a PM build next, given what just shipped?

PR TITLE: ${title}
PR DESCRIPTION: ${body || "(no description)"}

REVIEW DECISIONS:
${reviewDecisions || "(no formal decisions)"}

FILES CHANGED:
${fileList}

DIFF PATCHES (sample):
${patches || "(no patches available)"}

REVIEW COMMENTS (read carefully — these contain risks a PM needs to know):
${commentText || "(no review comments)"}

Respond with a JSON object matching this exact shape:
{
  "signalType": one of: "friction" | "new-capability" | "error-handling" | "feature-flag" | "navigation" | "migration" | "infrastructure",
  "userImpact": "One clear sentence: what can a user now do, or what pain is fixed? Be specific about the workflow.",
  "targetPersona": "Which specific user type is affected: WSE / Client Admin / HRSD Reviewer / Partner / All",
  "podConfirmed": "Pod name based on PR prefix and file paths",
  "migrationSignal": true/false,
  "frictionFixed": "What specific user pain point was removed, or null",
  "newCapability": "What new user action is now possible in plain language, or null",
  "productionRisk": "high" | "medium" | "low",
  "productionRiskReason": "Why this risk level — e.g. 'multi-step DB transaction with no rollback', 'touches auth flow', 'UI-only change'",
  "reviewerRisks": ["Specific risk or concern flagged by a reviewer in the comments — quote or paraphrase the actual concern", ...],
  "instrumentationGap": true if this PR ships new user-visible behavior (new UI, new action, new flow) with NO PostHog event tracking added in the diff,
  "nextOpportunity": "What a PM should consider building next based on what just shipped, or null if no obvious follow-on",
  "watchItems": ["Specific metric or behavior to monitor in PostHog this week", ...]
}

If reviewerRisks is empty because there were no meaningful concerns in the comments, return [].
Return only valid JSON, no markdown.`

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 700,
    messages: [{ role: "user", content: prompt }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : "{}"
  try {
    return JSON.parse(text)
  } catch {
    return {
      signalType: "infrastructure",
      userImpact: "Could not parse translation.",
      targetPersona: "Unknown",
      podConfirmed: "Unknown",
      migrationSignal: false,
      frictionFixed: null,
      newCapability: null,
      productionRisk: "low",
      productionRiskReason: "Parse error",
      reviewerRisks: [],
      instrumentationGap: false,
      nextOpportunity: null,
      watchItems: [],
    }
  }
}

export interface WeeklyBrief {
  headline: string
  summary: string
  regressions: { event: string; drop: number; hypothesis: string }[]
  topRisks: { title: string; reason: string }[]
  instrumentationGaps: string[]
  opportunities: { idea: string; fromPR: string }[]
  execSignal: string
}

export async function generateWeeklyBrief(
  prs: Array<{ title: string; team: string; translation: Record<string, unknown> }>,
  events: Array<{ event: string; thisWeek: number; lastWeek: number }>,
  regressions: Array<{ event: string; thisWeek: number; lastWeek: number; pod: string }>
): Promise<WeeklyBrief> {
  const prSummary = prs.map(p =>
    `[${p.team}] ${p.title} → ${(p.translation.userImpact as string) || "no translation"} (risk: ${(p.translation.productionRisk as string) || "unknown"}, instrumentation gap: ${p.translation.instrumentationGap ?? false})`
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

Write a weekly product brief for the CPO based on this week's engineering activity and behavioral data.

SHIPPED THIS WEEK (${prs.length} PRs):
${prSummary}

POSTHOG EVENT TRENDS:
${eventSummary}

REGRESSION ALERTS (events dropped >20% WoW with no clear PR explanation):
${regressionSummary || "None detected"}

Write a JSON brief with this exact shape:
{
  "headline": "One punchy sentence summarizing the most important thing that happened this week",
  "summary": "2-3 sentences: what the engineering team shipped, what the data shows, what the PM should care about",
  "regressions": [{ "event": "event name", "drop": percentage_as_number, "hypothesis": "why this might have dropped — user behavior change, broken flow, or seasonal?" }],
  "topRisks": [{ "title": "short risk title", "reason": "why it's a risk and what could happen in production" }],
  "instrumentationGaps": ["plain language description of a feature that shipped blind — no PostHog tracking added"],
  "opportunities": [{ "idea": "specific product idea or next step", "fromPR": "which PR or signal surfaced this" }],
  "execSignal": "One sentence for the exec: is this week green, amber, or red — and why?"
}

Keep it concrete. Don't pad. Return only valid JSON.`

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 900,
    messages: [{ role: "user", content: prompt }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : "{}"
  try {
    return JSON.parse(text)
  } catch {
    return {
      headline: "Weekly brief unavailable",
      summary: "Could not generate brief.",
      regressions: [],
      topRisks: [],
      instrumentationGaps: [],
      opportunities: [],
      execSignal: "Data unavailable",
    }
  }
}
