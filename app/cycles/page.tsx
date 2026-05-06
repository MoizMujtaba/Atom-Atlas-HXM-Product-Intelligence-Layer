import fs from "fs"
import path from "path"
import AtomHero from "@/components/atom-hero"
import StatTile from "@/components/stat-tile"
import PieChart from "@/components/sentinel/pie-chart"
import BarChart from "@/components/bar-chart"

export const dynamic = "force-static"

interface CycleSignal {
  type: string
  urgency: "P1" | "P2" | "P3"
  title: string
  detail: string
  isProdBlocker?: boolean
}

interface CyclePod {
  pod: string
  cycleNumber: number
  cycleName?: string
  cycleEnds: string
  totalIssues: number
  completedIssues: number
  devCompleted: number
  inReview: number
  inProgress: number
  todo: number
  completionPct: number
  slipRisk: "high" | "medium" | "low"
  slipRiskReason?: string
  mergedPRsThisWeek: { linearId: string; prNumber: number; linearStatus: string | null; stale: boolean; note?: string; hasRoadmapLabel?: boolean }[]
  keyInProgress: { id: string; title: string; assignee: string; isProdBlocker?: boolean; hasRoadmapLabel?: boolean }[]
  signals: CycleSignal[]
}

interface CrossPodSignal {
  urgency: "P1" | "P2" | "P3"
  title: string
  detail: string
  affectedPods: string[]
}

interface LinearCycles {
  generatedAt: string
  pods: CyclePod[]
  crossPodSignals: CrossPodSignal[]
  plannedVsShipped: {
    totalPlannedThisWeek: number
    totalMergedPRs: number
    mappedToLinear: number
    unmapped: number
    staleTickets: number
    offRoadmapInProgress?: number
    totalInProgress?: number
    p1Signals: number
    p2Signals: number
    p3Signals: number
  }
}

function loadCycles(): LinearCycles | null {
  try {
    const p = path.join(process.cwd(), "data", "atom-output", "linear-cycles.json")
    return JSON.parse(fs.readFileSync(p, "utf-8"))
  } catch {
    return null
  }
}

const URGENCY_BADGE: Record<string, { bg: string; fg: string }> = {
  P1: { bg: "var(--atlas-coral-500)", fg: "white" },
  P2: { bg: "var(--atlas-orangellow-500)", fg: "white" },
  P3: { bg: "var(--atlas-gray-300)", fg: "var(--atlas-gray-900)" },
}

const URGENCY_CARD: Record<string, { border: string; bg: string; title: string; detail: string }> = {
  P1: { border: "var(--atlas-coral-100)", bg: "var(--atlas-coral-100)", title: "#7A1818", detail: "#7A1818" },
  P2: { border: "var(--atlas-orangellow-100)", bg: "var(--atlas-orangellow-100)", title: "#5A3A0B", detail: "#5A3A0B" },
  P3: { border: "var(--atlas-gray-300)", bg: "var(--atlas-gray-50)", title: "var(--atlas-gray-900)", detail: "var(--atlas-gray-900)" },
}

const SLIP_STYLE: Record<string, { bg: string; fg: string; border: string }> = {
  high: { bg: "var(--atlas-coral-100)", fg: "#7A1818", border: "var(--atlas-coral-500)" },
  medium: { bg: "var(--atlas-orangellow-100)", fg: "#5A3A0B", border: "var(--atlas-orangellow-500)" },
  low: { bg: "var(--atlas-blue-100)", fg: "var(--atlas-blue-900)", border: "var(--atlas-blue-250)" },
}

function CompletionBar({ pct, endsAt }: { pct: number; endsAt: string }) {
  const daysLeft = Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86400000)
  const isOverdue = daysLeft < 0
  const isUrgent = daysLeft <= 1
  const barColor =
    isUrgent && pct < 60 ? "var(--atlas-coral-500)" :
    pct >= 70 ? "var(--atlas-blue-500)" :
    "var(--atlas-purple-500)"

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>
        <span>{pct}% complete</span>
        <span style={isUrgent ? { color: "var(--atlas-coral-500)", fontWeight: 600, opacity: 1 } : {}}>
          {isOverdue ? "cycle ended" : daysLeft === 0 ? "ends today" : daysLeft === 1 ? "1 day left" : `${daysLeft}d left`}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--atlas-gray-300)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
        />
      </div>
    </div>
  )
}

export default function CyclesPage() {
  const data = loadCycles()

  if (!data) {
    return (
      <>
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid var(--atlas-gray-300)", background: "white" }}>
          <div className="px-5 py-3 border-b" style={{ background: "var(--atlas-gray-50)", borderColor: "var(--atlas-gray-300)" }}>
            <h1 className="text-sm font-semibold" style={{ color: "var(--atlas-gray-900)" }}>Cycle Intelligence</h1>
          </div>
          <div className="px-5 py-10 text-center">
            <p className="text-sm" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>No cycle data available.</p>
            <p className="text-[11px] mt-1" style={{ color: "var(--atlas-gray-900)", opacity: 0.4 }}>Click Sync in the top nav to pull Linear cycle data.</p>
          </div>
        </div>
      </>
    )
  }

  const { pods, crossPodSignals, plannedVsShipped, generatedAt } = data

  return (
    <>
      {/* Hero */}
      <AtomHero
        pill="ATLAS HXM · CYCLE INTELLIGENCE"
        date={`Last synced ${new Date(generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
        headline="Linear cycles × GitHub PRs — planned vs shipped."
        subline="Slip risks, stale tickets, and off-roadmap work surfaced across all pods."
        stats={
          <div className="space-y-2 min-w-[160px]">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--atlas-blue-250)" }}>
              Cycle Summary
            </p>
            <p className="text-sm text-white">
              <span className="font-semibold">{pods.length}</span> pods active
            </p>
            <p className="text-sm text-white">
              <span className="font-semibold">{plannedVsShipped.mappedToLinear}/{plannedVsShipped.totalMergedPRs}</span> PRs mapped
            </p>
            {plannedVsShipped.p1Signals > 0 && (
              <p className="text-sm" style={{ color: "var(--atlas-coral-500)" }}>
                <span className="font-semibold">{plannedVsShipped.p1Signals}</span> P1 signals
              </p>
            )}
          </div>
        }
      />

      {/* Chart cards row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pod completion bar chart */}
        <div className="rounded-2xl px-5 py-5 shadow-sm" style={{ background: "white", border: "1px solid var(--atlas-gray-300)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}>
            Completion · By Pod
          </p>
          <h3 className="text-base font-semibold mt-0.5 mb-4" style={{ color: "var(--atlas-gray-900)" }}>
            Cycle progress across all pods
          </h3>
          <BarChart
            max={100}
            data={pods.map(p => ({
              label: p.pod,
              value: p.completionPct,
              suffix: "%",
              color: p.completionPct >= 70
                ? "var(--atlas-blue-500)"
                : p.slipRisk === "high"
                ? "#FF595A"
                : "#FF782C",
            }))}
          />
        </div>

        {/* Slip risk donut */}
        <div className="rounded-2xl px-5 py-5 shadow-sm" style={{ background: "white", border: "1px solid var(--atlas-gray-300)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}>
            Slip Risk Distribution
          </p>
          <h3 className="text-base font-semibold mt-0.5 mb-4" style={{ color: "var(--atlas-gray-900)" }}>
            How many pods are at risk
          </h3>
          <PieChart
            data={[
              { label: "High risk", value: pods.filter(p => p.slipRisk === "high").length, color: "#FF595A" },
              { label: "Medium risk", value: pods.filter(p => p.slipRisk === "medium").length, color: "#FF782C" },
              { label: "Low risk", value: pods.filter(p => p.slipRisk === "low").length, color: "#0559FA" },
            ].filter(d => d.value > 0)}
            title="Pod slip risk"
            size={180}
          />
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile
          label="Pods Active"
          value={pods.length}
          accent="var(--atlas-blue-500)"
          caption="Linear cycles in flight"
        />
        <StatTile
          label="PRs Mapped"
          value={`${plannedVsShipped.mappedToLinear}/${plannedVsShipped.totalMergedPRs}`}
          accent="var(--atlas-purple-500)"
          caption="Linked to Linear tickets"
        />
        {plannedVsShipped.offRoadmapInProgress != null && (
          <StatTile
            label="Off-Roadmap"
            value={`${plannedVsShipped.offRoadmapInProgress}/${plannedVsShipped.totalInProgress}`}
            accent="var(--atlas-orangellow-500)"
            caption="In progress but off-plan"
          />
        )}
        <StatTile
          label="P1 Signals"
          value={plannedVsShipped.p1Signals}
          accent="var(--atlas-coral-500)"
          caption="Require immediate action"
          dark={plannedVsShipped.p1Signals > 0}
        />
      </div>

      {/* Cross-pod signals */}
      {crossPodSignals.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.65 }}>
            Cross-Pod Signals
          </h2>
          <div className="space-y-2">
            {crossPodSignals.map((s, i) => {
              const style = URGENCY_CARD[s.urgency]
              const badge = URGENCY_BADGE[s.urgency]
              return (
                <div key={i} className="rounded-2xl border px-5 py-4" style={{ borderColor: style.border, background: style.bg }}>
                  <div className="flex items-start gap-3">
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{ background: badge.bg, color: badge.fg }}
                    >
                      {s.urgency}
                    </span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: style.title }}>{s.title}</p>
                      <p className="text-sm mt-1" style={{ color: style.detail, opacity: 0.85 }}>{s.detail}</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {s.affectedPods.map(pod => (
                          <span
                            key={pod}
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(255,255,255,0.6)", color: style.title, border: "1px solid rgba(0,0,0,0.08)" }}
                          >
                            {pod}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Per-pod sections */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.65 }}>
          Pod Cycles
        </h2>
        {pods.map((pod) => {
          const signals = pod.signals || []
          const keyInProgress = pod.keyInProgress || []
          const mergedPRsThisWeek = pod.mergedPRsThisWeek || []
          const p1Signals = signals.filter(s => s.urgency === "P1")
          const otherSignals = signals.filter(s => s.urgency !== "P1")
          const offRoadmapInProgress = keyInProgress.filter(i => i.hasRoadmapLabel === false).length
          const offRoadmapMerged = mergedPRsThisWeek.filter(p => p.hasRoadmapLabel === false).length
          const slip = SLIP_STYLE[pod.slipRisk]

          return (
            <div key={pod.pod} className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid var(--atlas-gray-300)", background: "white" }}>
              {/* Pod header */}
              <div className="px-5 py-4 border-b" style={{ background: "var(--atlas-gray-50)", borderColor: "var(--atlas-gray-300)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold" style={{ color: "var(--atlas-gray-900)" }}>{pod.pod}</h3>
                      <span className="text-xs" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>
                        Cycle {pod.cycleNumber}{pod.cycleName ? ` · ${pod.cycleName}` : ""}
                      </span>
                      {p1Signals.length > 0 && (
                        <span
                          className="text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{ background: "var(--atlas-coral-500)", color: "white" }}
                        >
                          {p1Signals.length} P1
                        </span>
                      )}
                      {offRoadmapInProgress > 0 && (
                        <span
                          className="text-xs font-medium px-1.5 py-0.5 rounded"
                          style={{ background: "var(--atlas-orangellow-500)", color: "white" }}
                        >
                          {offRoadmapInProgress} off-roadmap
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-2 text-xs flex-wrap" style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}>
                      <span style={{ color: "var(--atlas-blue-500)", fontWeight: 600, opacity: 1 }}>{pod.completedIssues} done</span>
                      <span>{pod.devCompleted} dev complete</span>
                      <span>{pod.inReview} in review</span>
                      <span>{pod.inProgress} in progress</span>
                      <span>{pod.todo} todo</span>
                      <span>·</span>
                      <span>{pod.totalIssues} total</span>
                      {(offRoadmapInProgress > 0 || offRoadmapMerged > 0) && (
                        <span style={{ color: "var(--atlas-orangellow-500)", fontWeight: 600, opacity: 1 }}>
                          · {offRoadmapInProgress + offRoadmapMerged} off-roadmap
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded border"
                      style={{ background: slip.bg, color: slip.fg, borderColor: slip.border }}
                    >
                      {pod.slipRisk} slip risk
                    </span>
                    <p className="text-xs mt-1" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>
                      ends {new Date(pod.cycleEnds).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <CompletionBar pct={pod.completionPct} endsAt={pod.cycleEnds} />
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* P1 signals inline */}
                {p1Signals.length > 0 && (
                  <div className="space-y-2">
                    {p1Signals.map((s, i) => (
                      <div key={i} className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--atlas-coral-100)", background: "var(--atlas-coral-100)" }}>
                        <div className="flex items-start gap-2">
                          <span
                            className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                            style={{ background: "var(--atlas-coral-500)", color: "white" }}
                          >
                            P1
                          </span>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "#7A1818" }}>{s.title}</p>
                            <p className="text-sm mt-0.5" style={{ color: "#7A1818", opacity: 0.85 }}>{s.detail}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Key In Progress */}
                  {keyInProgress.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}>
                        Key In Progress
                      </p>
                      <div className="space-y-1.5">
                        {keyInProgress.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl px-3 py-2 text-sm border"
                            style={{
                              borderColor: item.isProdBlocker ? "var(--atlas-coral-100)" : "var(--atlas-gray-300)",
                              background: item.isProdBlocker ? "var(--atlas-coral-100)" : "var(--atlas-gray-50)",
                            }}
                          >
                            <div className="flex items-start gap-1.5">
                              {item.isProdBlocker && (
                                <span className="text-xs shrink-0 mt-0.5 font-bold" style={{ color: "var(--atlas-coral-500)" }}>PROD</span>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono text-xs" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>{item.id}</span>
                                  {item.hasRoadmapLabel === false && (
                                    <span
                                      className="text-xs px-1 rounded font-medium leading-4"
                                      style={{ background: "var(--atlas-orangellow-100)", color: "#5A3A0B", border: "1px solid rgba(255,120,44,0.25)" }}
                                    >
                                      off-roadmap
                                    </span>
                                  )}
                                  {item.hasRoadmapLabel === true && (
                                    <span
                                      className="text-xs px-1 rounded font-medium leading-4"
                                      style={{ background: "var(--atlas-blue-100)", color: "var(--atlas-blue-900)", border: "1px solid var(--atlas-blue-250)" }}
                                    >
                                      2026
                                    </span>
                                  )}
                                </div>
                                <p
                                  className="text-xs mt-0.5 leading-snug"
                                  style={{ color: item.isProdBlocker ? "#7A1818" : "var(--atlas-gray-900)", fontWeight: item.isProdBlocker ? 600 : 400 }}
                                >
                                  {item.title}
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>{item.assignee}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Merged PRs */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}>
                      PRs Merged This Week
                    </p>
                    {mergedPRsThisWeek.length === 0 ? (
                      <p
                        className="text-sm rounded-xl px-3 py-2"
                        style={{ background: "var(--atlas-gray-50)", border: "1px solid var(--atlas-gray-300)", color: "var(--atlas-gray-900)", opacity: 0.4 }}
                      >
                        No PRs merged
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {mergedPRsThisWeek.map((pr, i) => (
                          <div
                            key={i}
                            className="rounded-xl px-3 py-2 text-sm border"
                            style={{
                              borderColor: pr.stale ? "var(--atlas-orangellow-100)" : "var(--atlas-blue-100)",
                              background: pr.stale ? "var(--atlas-orangellow-100)" : "var(--atlas-blue-100)",
                            }}
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <a
                                href={`/pr/${pod.pod === "PAY" || pod.pod === "WFM 1" || pod.pod === "WFM 2" ? "Atlas-Webapp" : pod.pod === "FNM 1" ? "Payments-Backend" : "Atlas-Frontend"}/${pr.prNumber}`}
                                className="font-mono text-xs hover:underline"
                                style={{ color: "var(--atlas-blue-500)" }}
                              >
                                #{pr.prNumber}
                              </a>
                              <span className="font-mono text-xs" style={{ color: "var(--atlas-gray-900)", opacity: 0.7 }}>{pr.linearId}</span>
                              {pr.hasRoadmapLabel === true && (
                                <span
                                  className="text-xs px-1 rounded font-medium"
                                  style={{ background: "var(--atlas-blue-500)", color: "white" }}
                                >
                                  2026
                                </span>
                              )}
                              {pr.hasRoadmapLabel === false && (
                                <span
                                  className="text-xs px-1 rounded font-medium"
                                  style={{ background: "var(--atlas-orangellow-500)", color: "white" }}
                                >
                                  off-roadmap
                                </span>
                              )}
                              {pr.stale ? (
                                <span className="text-xs font-medium" style={{ color: "#5A3A0B" }}>
                                  Linear still &quot;{pr.linearStatus}&quot; — close ticket
                                </span>
                              ) : (
                                <span className="text-xs" style={{ color: "var(--atlas-blue-900)" }}>✓ {pr.linearStatus || "no status"}</span>
                              )}
                            </div>
                            {pr.note && <p className="text-xs mt-0.5" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>{pr.note}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* P2/P3 signals */}
                {otherSignals.length > 0 && (
                  <div className="space-y-2">
                    {otherSignals.map((s, i) => {
                      const style = URGENCY_CARD[s.urgency]
                      const badge = URGENCY_BADGE[s.urgency]
                      return (
                        <div key={i} className="rounded-xl border px-4 py-3" style={{ borderColor: style.border, background: style.bg }}>
                          <div className="flex items-start gap-2">
                            <span
                              className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                              style={{ background: badge.bg, color: badge.fg }}
                            >
                              {s.urgency}
                            </span>
                            <div>
                              <p className="text-sm font-semibold" style={{ color: style.title }}>{s.title}</p>
                              <p className="text-sm mt-0.5" style={{ color: style.detail, opacity: 0.85 }}>{s.detail}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </section>
    </>
  )
}
