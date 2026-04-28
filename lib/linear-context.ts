import fs from "fs"
import path from "path"

interface CycleSignal {
  type: string
  urgency: "P1" | "P2" | "P3"
  title: string
  detail: string
}

interface LinearIssue {
  id: string
  title: string
  assignee: string
  isProdBlocker?: boolean
}

interface CyclePod {
  pod: string
  cycleNumber: number
  cycleName?: string
  cycleEnds: string
  completionPct: number
  slipRisk: "high" | "medium" | "low"
  slipRiskReason?: string
  mergedPRsThisWeek: { linearId: string; prNumber: number; linearStatus: string | null; stale: boolean; hasRoadmapLabel?: boolean }[]
  keyInProgress: LinearIssue[]
  signals: CycleSignal[]
}

interface LinearCycles {
  pods: CyclePod[]
  crossPodSignals: { urgency: string; title: string; detail: string; affectedPods: string[] }[]
}

function loadCycles(): LinearCycles | null {
  try {
    const p = path.join(process.cwd(), "data", "atom-output", "linear-cycles.json")
    return JSON.parse(fs.readFileSync(p, "utf-8"))
  } catch {
    return null
  }
}

/** Extract Linear issue ID from a PR title like "FNM1-805: BE - Update..." → "FNM1-805" */
export function extractLinearId(prTitle: string): string | null {
  const match = prTitle.match(/^([A-Z]+-\d+)/i)
  return match ? match[1].toUpperCase() : null
}

/** Derive pod name from Linear ID prefix */
export function podFromLinearId(id: string): string {
  const prefix = id.split("-")[0].toUpperCase()
  const map: Record<string, string> = {
    WFM1: "WFM 1", WFM2: "WFM 2", WFM3: "WFM 3",
    PAY: "PAY", FNM1: "FNM 1", FNM2: "FNM 2",
    DATA: "Data Platform",
  }
  return map[prefix] || "Platform"
}

export interface PRLinearContext {
  linearId: string | null
  pod: string
  matchedIssue: { linearId: string; prNumber: number; linearStatus: string | null; stale: boolean; hasRoadmapLabel?: boolean } | null
  cycleNumber: number | null
  cycleEnds: string | null
  completionPct: number | null
  slipRisk: string | null
  slipRiskReason: string | null
  relatedInFlight: LinearIssue[]
  cycleSignals: CycleSignal[]
  linkedToRoadmap: boolean
  roadmapNote: string
}

export interface PRPostHogContext {
  hasEvents: boolean
  events: { event: string; thisWeek: number; lastWeek: number }[]
  proposedEvents: { event: string; reason: string }[]
  gap: string
}

const FNM1_PROPOSED_EVENTS = [
  { event: "take_home_pay_viewed", reason: "Tell you if WSEs are actually accessing their THP data — currently you cannot measure adoption" },
  { event: "take_home_pay_empty_state_shown", reason: "Measure how often G2N data is missing per country/pay period — the FNM1-805 fix shows this error but you cannot track frequency" },
  { event: "g2n_sync_triggered", reason: "Track when operators manually trigger G2N syncs vs waiting for automatic sync" },
  { event: "payment_disbursement_initiated", reason: "Funnel entry for the submit-for-disbursement flow (FNM1-760) — currently completely blind" },
  { event: "expense_card_requested", reason: "WSE card adoption funnel start — FNM1-653 ships the card but you cannot measure uptake" },
  { event: "expense_card_activated", reason: "Conversion from card request to active card — critical for Ramp integration success" },
  { event: "invoice_export_failed", reason: "Surface Sage export failures in PostHog before customers report them — FNM1-807/815 are PROD blockers discovered via support, not telemetry" },
]

const FNM2_PROPOSED_EVENTS = [
  { event: "gtn_mapping_triggered", reason: "Track how often operators run GTN mapping — FNM2-983 deploys to PROD this week with no visibility" },
  { event: "gtn_recon_approved", reason: "Measure approval rate and time-to-approve on GTN reconciliation" },
  { event: "gtn_file_uploaded", reason: "Track GTN file upload success/failure rate per pay group" },
  { event: "recon_file_imported", reason: "Track recon file imports added by FNM2-778 (PR 109)" },
]

const POD_PROPOSED_EVENTS: Record<string, typeof FNM1_PROPOSED_EVENTS> = {
  "FNM 1": FNM1_PROPOSED_EVENTS,
  "FNM 2": FNM2_PROPOSED_EVENTS,
  "Data Platform": [
    { event: "data_pipeline_run_triggered", reason: "Track when data pipelines are triggered manually" },
    { event: "schema_sync_completed", reason: "Surface external data schema sync outcomes" },
  ],
}

const POD_EVENTS: Record<string, string[]> = {
  "WFM 1": ["employee_task_clicked", "employee_task_saved", "employee_submitted", "employee_created"],
  "WFM 2": ["addExpense_aiFeedbackBannerShown", "addExpense_upserted", "addExpenseLine_upserted", "expenseDetail_upserted"],
  "PAY": ["sso_login_attempt", "sso_login_success", "sso_login_failed", "mfa_sms_setup_phone"],
}

export function getLinearContext(prTitle: string): PRLinearContext {
  const linearId = extractLinearId(prTitle)
  const pod = linearId ? podFromLinearId(linearId) : "Platform"
  const cycles = loadCycles()

  const defaultResult: PRLinearContext = {
    linearId,
    pod,
    matchedIssue: null,
    cycleNumber: null,
    cycleEnds: null,
    completionPct: null,
    slipRisk: null,
    slipRiskReason: null,
    relatedInFlight: [],
    cycleSignals: [],
    linkedToRoadmap: false,
    roadmapNote: linearId
      ? `${linearId} was not found in any current cycle — this may be from a previous cycle or unplanned work.`
      : "No Linear issue ID detected in PR title.",
  }

  if (!cycles || !linearId) return defaultResult

  const podCycle = cycles.pods.find(p => p.pod === pod)
  if (!podCycle) return { ...defaultResult, roadmapNote: `${pod} has no current cycle data in Atom.` }

  const matchedIssue = podCycle.mergedPRsThisWeek.find(m => m.linearId === linearId) || null

  const isRoadmap = matchedIssue?.hasRoadmapLabel === true

  let roadmapNote: string
  if (!matchedIssue) {
    roadmapNote = `${linearId} was not found in ${pod} cycle ${podCycle.cycleNumber}'s merged PR list. It may belong to a previous cycle.`
  } else if (isRoadmap) {
    roadmapNote = `${linearId} is on the 2026 Roadmap.${matchedIssue.stale ? ` PR is merged but Linear still shows "${matchedIssue.linearStatus}" — close the ticket.` : " Status matches."}`
  } else {
    roadmapNote = `${linearId} is NOT on the 2026 Roadmap (RoadMap2026 label missing). This PR is off-roadmap work — confirm this was intentional and not roadmap drift.`
  }

  return {
    linearId,
    pod,
    matchedIssue,
    cycleNumber: podCycle.cycleNumber,
    cycleEnds: podCycle.cycleEnds,
    completionPct: podCycle.completionPct,
    slipRisk: podCycle.slipRisk,
    slipRiskReason: podCycle.slipRiskReason || null,
    relatedInFlight: podCycle.keyInProgress,
    cycleSignals: podCycle.signals,
    linkedToRoadmap: isRoadmap,
    roadmapNote,
  }
}

export function getPostHogContext(pod: string, weeklyEvents: { event: string; thisWeek: number; lastWeek: number }[]): PRPostHogContext {
  const podEventNames = POD_EVENTS[pod] || []
  const events = weeklyEvents.filter(e => podEventNames.includes(e.event))
  const hasEvents = events.length > 0
  const proposed = POD_PROPOSED_EVENTS[pod] || []

  const gap = hasEvents
    ? `${pod} has ${events.length} tracked event(s) in PostHog. The specific flows touched by this PR are not yet instrumented.`
    : `${pod} has zero PostHog events in the last 30 days. This entire pod's user flows are completely blind — you cannot measure adoption, detect regressions, or validate that shipped features are working.`

  return { hasEvents, events, proposedEvents: proposed, gap }
}
