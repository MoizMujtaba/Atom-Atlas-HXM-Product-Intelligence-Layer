import fs from "fs"
import path from "path"

const OUT = path.join(process.cwd(), "data", "atom-output")

function read<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(OUT, file), "utf-8"))
  } catch {
    return fallback
  }
}

export interface ExecMetrics {
  generatedAt: string
  period: string
  ssoAttempts: number
  ssoSuccess: number
  ssoFailed: number
  ssoSuccessRate: number
  ssoAttemptsPrev: number
  ssoSuccessPrev: number
  ssoSuccessRatePrev: number
  exceptions: number
  exceptionsPrev: number
  rageclicks: number
  rageclicksPrev: number
  pageviews: number
  pageviewsPrev: number
}

export function getExecMetrics(): ExecMetrics | null {
  return read<ExecMetrics | null>("exec-metrics.json", null)
}

export function getWeeklyEvents() {
  return read<{ event: string; thisWeek: number; lastWeek: number }[]>("weekly-events.json", [])
}

export function getMergedPRs() {
  return read<AtomPR[]>("merged-prs.json", [])
}

export interface AtomTranslation {
  signalType: string
  userImpact: string
  targetPersona?: string
  podConfirmed?: string
  migrationSignal: boolean
  frictionFixed: string | null
  newCapability: string | null
  productionRisk?: "high" | "medium" | "low"
  productionRiskReason?: string
  reviewerRisks?: string[]
  instrumentationGap?: boolean
  nextOpportunity?: string | null
  watchItems: string[]
  // Decision layer
  urgencyTier?: "P1" | "P2" | "P3"
  recommendedAction?: string
  outcomeType?: "retention" | "revenue" | "efficiency" | "risk" | "migration"
  ignoreCost?: string
  legacyImpact?: "accelerates-sunset" | "neutral" | "delays-sunset"
}

export interface AtomPR {
  number: number
  repo: string
  team: string
  title: string
  url: string
  mergedAt: string
  author: string | null
  fileCount: number | null
  translation: AtomTranslation
}

// ── Derived signals ──────────────────────────────────────────────────────────

const POD_EVENTS: Record<string, string[]> = {
  "WFM 1": ["employee_task_clicked", "employee_task_saved", "employee_submitted", "employee_created"],
  "WFM 2": ["addExpense_aiFeedbackBannerShown", "addExpense_upserted", "addExpenseLine_upserted", "expenseDetail_upserted", "addExpense_aiExpenseExtractionFeedback", "addExpense_aiExpenseExtractionFeedbackDismissed"],
  "PAY": ["sso_login_attempt", "sso_login_success", "sso_login_failed", "mfa_sms_setup_phone"],
  "FNM 1": [],
  "FNM 2": [],
  "Data Platform": [],
}

export interface RegressionSignal {
  event: string
  thisWeek: number
  lastWeek: number
  dropPct: number
  pod: string
}

export interface InstrumentationGap {
  prTitle: string
  prNumber: number
  repo: string
  team: string
  newCapability: string
}

export function getRegressions(threshold = 20): RegressionSignal[] {
  const events = getWeeklyEvents()
  const prs = getMergedPRs()
  const regressions: RegressionSignal[] = []

  for (const [pod, podEventNames] of Object.entries(POD_EVENTS)) {
    for (const ev of podEventNames) {
      const data = events.find(e => e.event === ev)
      if (!data || data.lastWeek === 0) continue
      const dropPct = Math.round(((data.lastWeek - data.thisWeek) / data.lastWeek) * 100)
      if (dropPct < threshold) continue

      // Only flag as regression if no PR in this pod shipped this week that could explain it
      const podPRs = prs.filter(p => p.team === pod)
      const hasFrictionFix = podPRs.some(p =>
        p.translation.frictionFixed && ev.split("_").some(word => p.translation.frictionFixed?.toLowerCase().includes(word.toLowerCase()))
      )
      if (!hasFrictionFix) {
        regressions.push({ event: ev, thisWeek: data.thisWeek, lastWeek: data.lastWeek, dropPct, pod })
      }
    }
  }

  return regressions.sort((a, b) => b.dropPct - a.dropPct)
}

export interface CycleIssue {
  id: string
  title: string
  assignee: string
  isProdBlocker?: boolean
  hasRoadmapLabel?: boolean
  origin?: string
  createdBy?: string
}

export interface CyclePodData {
  pod: string
  cycleNumber: number
  cycleEnds: string
  completionPct: number
  slipRisk: "high" | "medium" | "low"
  slipRiskReason?: string
  keyInProgress: CycleIssue[]
  mergedPRsThisWeek: { linearId: string; prNumber: number; hasRoadmapLabel?: boolean }[]
  signals: { type: string; urgency: "P1" | "P2" | "P3"; title: string; detail: string }[]
}

export interface LinearCyclesData {
  generatedAt: string
  pods: CyclePodData[]
  crossPodSignals: { urgency: string; title: string; detail: string; affectedPods: string[] }[]
  plannedVsShipped: {
    totalMergedPRs: number
    offRoadmapInProgress?: number
    totalInProgress?: number
    p1Signals: number
    staleTickets: number
  }
}

export function getLinearCycles(): LinearCyclesData | null {
  return read<LinearCyclesData | null>("linear-cycles.json", null)
}

export interface CompetitorMove {
  date: string
  type: string
  title: string
  detail: string
  atlasImplication: string
}

export interface CompetitorData {
  name: string
  recentMoves: CompetitorMove[]
  g2Complaints: string[]
  atlasOpportunity: string
}

export interface CompetitorIntel {
  generatedAt: string
  competitors: CompetitorData[]
  crossCompetitorThemes: { theme: string; status: string; atlasStatus: string; urgency: string }[]
  riceGapAnalysis: { id: string; title: string; competitor: string; score: number; label: string; rationale: string }[]
}

export function getCompetitorIntel(): CompetitorIntel | null {
  return read<CompetitorIntel | null>("competitor-intel.json", null)
}

export interface WeeklyBriefData {
  generatedAt: string
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

export function getBrief(): WeeklyBriefData | null {
  return read<WeeklyBriefData | null>("brief.json", null)
}

export function getLastRefreshed(): string | null {
  const data = read<{ refreshedAt: string } | null>("last-refreshed.json", null)
  return data?.refreshedAt ?? null
}

export function getInstrumentationGaps(): InstrumentationGap[] {
  const prs = getMergedPRs()
  const gaps: InstrumentationGap[] = []

  for (const pr of prs) {
    const t = pr.translation
    // Explicitly flagged by Claude, or inferred: has new capability but no tracking data
    if (t.instrumentationGap || (t.newCapability && t.signalType === "new-capability")) {
      // Check if there's any PostHog event in weekly-events that could correspond
      const events = getWeeklyEvents()
      const podEvents = POD_EVENTS[pr.team] || []
      const hasTracking = podEvents.some(ev => events.find(e => e.event === ev && e.thisWeek > 0))
      if (!hasTracking || t.instrumentationGap) {
        gaps.push({
          prTitle: pr.title,
          prNumber: pr.number,
          repo: pr.repo,
          team: pr.team,
          newCapability: t.newCapability || "New capability shipped without PostHog tracking",
        })
      }
    }
  }

  return gaps
}

export interface ProductIntelligenceSourceLink {
  label: string
  url: string
}

export interface ProductIntelligenceSignal {
  id: string
  title: string
  sourceType: string
  sourceLinks: ProductIntelligenceSourceLink[]
  company: string
  dealOutcome: string
  theme: string
  roadmapOverlap: "aligned" | "adjacent" | "gap" | "unknown"
  productSignal: string
  marketingSignal: string
  recommendedAction: string
  approvalStatus: "approved" | "draft"
  confidence: "high" | "medium" | "low"
  capturedAt: string
}

export interface ProductIntelligenceData {
  generatedAt: string
  reviewedSourceCount: number
  approvedSignalCount: number
  draftHeldBackCount: number
  signals: ProductIntelligenceSignal[]
}

export function getProductIntelligence(): ProductIntelligenceData | null {
  return read<ProductIntelligenceData | null>("product-intelligence.json", null)
}

export type SentinelOverlap = "aligned" | "adjacent" | "gap" | "unknown"
export type SentinelConfidence = "high" | "medium" | "low" | "none"

export interface SentinelSourceRow {
  row_id: string
  source_system: "Avoma" | "HubSpot" | "Roadmap" | string
  source_type: string
  source_date: string
  title: string
  company_or_counterparty: string
  stage_or_purpose: string
  owner_or_organizer: string
  source_link: string
  secondary_link: string
  description: string
  notes: string
  deal_amount: string | number | null
  outcome_signal: string
  roadmap_overlap: SentinelOverlap
  roadmap_theme: string
  roadmap_vertical: string
  roadmap_basis: string
  confidence: SentinelConfidence | string
}

export interface SentinelSourceSummary {
  generated_at: string
  source_window_start: string
  source_window_end: string
  counts: {
    total_sources: number
    customer_sources: number
    avoma_transcripts: number
    hubspot_deals: number
    roadmap_items: number
  }
  future_dated_customer_sources: number
  counts_by_system: Record<string, number>
  overlap_counts: Record<string, number>
  overlap_rate_percent: number
  confidence_counts: Record<string, number>
  top_roadmap_themes: { theme: string; count: number }[]
  avoma_stage_counts: { stage: string; count: number }[]
}

export interface SentinelSourceData {
  summary: SentinelSourceSummary
  rows: SentinelSourceRow[]
}

export function getSentinelSources(): SentinelSourceData | null {
  return read<SentinelSourceData | null>("sentinel-sources.json", null)
}
