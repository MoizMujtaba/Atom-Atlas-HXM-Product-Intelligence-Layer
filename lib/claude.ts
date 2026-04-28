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
  // Decision layer
  urgencyTier: "P1" | "P2" | "P3"
  recommendedAction: string
  outcomeType: "retention" | "revenue" | "efficiency" | "risk" | "migration"
  ignoreCost: string
  legacyImpact: "accelerates-sunset" | "neutral" | "delays-sunset"
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
  "productionRiskReason": "Why this risk level — cite specific code evidence: transaction boundaries, auth surface, async jobs, UI-only",
  "reviewerRisks": ["Specific risk or concern flagged by a reviewer — quote or paraphrase the actual concern, or omit if none"],
  "instrumentationGap": true if new user-visible behavior ships with NO PostHog event in the diff,
  "nextOpportunity": "Specific product idea a PM should now consider, or null",
  "watchItems": ["Specific PostHog metric or behavior to check this week"],
  "urgencyTier": "P1" if production risk is high OR regression is detected OR >200 WSEs affected, "P2" if new capability shipped without tracking or medium risk, "P3" otherwise,
  "recommendedAction": "One sentence: the single most important thing a PM should do in the next 48 hours because of this PR. Start with a verb.",
  "outcomeType": one of: "retention" (WSE or client retention at risk or protected), "revenue" (expansion, upsell, or ARR risk), "efficiency" (reduces internal cost, support load, or engineering debt), "risk" (security, reliability, compliance), "migration" (legacy-to-webapp progress or setback),
  "ignoreCost": "What specifically happens if a PM ignores this signal for 2 weeks? Be concrete.",
  "legacyImpact": "accelerates-sunset" if this moves work to the webapp and off the legacy app, "delays-sunset" if it adds new work to legacy or creates new technical debt there, "neutral" otherwise
}

Return only valid JSON, no markdown.`

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  })

  const raw = message.content[0].type === "text" ? message.content[0].text : "{}"

  // Strip markdown fences if present, then extract the first {...} block
  const stripped = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
  const jsonMatch = stripped.match(/\{[\s\S]*\}/)
  const text = jsonMatch ? jsonMatch[0] : stripped

  try {
    return JSON.parse(text)
  } catch {
    return {
      signalType: "infrastructure" as const,
      userImpact: "Translation parse failed — Claude response was not valid JSON.",
      targetPersona: "Unknown",
      podConfirmed: "Unknown",
      migrationSignal: false,
      frictionFixed: null,
      newCapability: null,
      productionRisk: "low" as const,
      productionRiskReason: "Parse error — raw response saved for debug",
      reviewerRisks: [],
      instrumentationGap: false,
      nextOpportunity: null,
      watchItems: [],
      urgencyTier: "P3" as const,
      recommendedAction: "Review this PR manually — Claude returned malformed JSON. Check token limits or retry.",
      outcomeType: "efficiency" as const,
      ignoreCost: "Unknown until manual review.",
      legacyImpact: "neutral" as const,
      _rawResponse: raw.slice(0, 500),
    } as AtomTranslation & { _rawResponse?: string }
  }
}

export interface WeeklyBrief {
  headline: string
  summary: string
  weekSignal: "green" | "amber" | "red"
  weekSignalReason: string
  regressions: { event: string; drop: number; hypothesis: string }[]
  topRisks: { title: string; reason: string; recommendedAction?: string }[]
  instrumentationGaps: string[]
  opportunities: { idea: string; outcomeType?: string; fromPR: string; estimatedEffort?: string }[]
  p1Actions: string[]
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

Write a weekly product brief for the CPO. Your job is NOT to list everything that happened. Your job is to surface the 3–5 signals that require a decision, cluster related work into themes, and tell the PM exactly what to do.

SHIPPED THIS WEEK (${prs.length} PRs):
${prSummary}

POSTHOG EVENT TRENDS:
${eventSummary}

REGRESSION ALERTS (events dropped >20% WoW with no clear PR explanation):
${regressionSummary || "None detected"}

Write a JSON brief with this exact shape:
{
  "headline": "One punchy sentence — the most important thing that happened or broke this week",
  "summary": "2-3 sentences MAX: cluster the week's PRs into 1-2 themes, name the data signal that validates or contradicts them, state what the PM must decide",
  "weekSignal": "green" | "amber" | "red",
  "weekSignalReason": "Why this color — cite one specific metric or event",
  "regressions": [{ "event": "event name", "drop": percentage_as_number, "hypothesis": "specific reason this might have dropped — broken flow, data issue, or user behavior?" }],
  "topRisks": [{ "title": "concise risk title", "reason": "specific production or user consequence", "recommendedAction": "what PM should do in next 48h" }],
  "instrumentationGaps": ["name the feature that shipped blind and why it matters for measurement"],
  "opportunities": [{ "idea": "specific, buildable product idea", "outcomeType": "retention|revenue|efficiency|risk|migration", "fromPR": "which PR surfaced this", "estimatedEffort": "1-2 sentence effort estimate" }],
  "p1Actions": ["verb-first action a PM must take this week — max 3 items"],
  "execSignal": "One sentence for a VP or board: traffic light + the one number that matters most this week"
}

Suppress noise. If a signal is interesting but requires no PM decision, omit it. Return only valid JSON.`

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
      weekSignal: "amber" as const,
      weekSignalReason: "Data unavailable",
      regressions: [],
      topRisks: [],
      instrumentationGaps: [],
      opportunities: [],
      p1Actions: [],
      execSignal: "Data unavailable",
    }
  }
}
