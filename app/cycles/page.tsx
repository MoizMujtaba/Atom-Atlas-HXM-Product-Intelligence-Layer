import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

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
  mergedPRsThisWeek: { linearId: string; prNumber: number; linearStatus: string | null; stale: boolean; note?: string }[]
  keyInProgress: { id: string; title: string; assignee: string; isProdBlocker?: boolean }[]
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

const URGENCY_STYLES = {
  P1: { badge: "bg-red-600 text-white", card: "border-red-200 bg-red-50", title: "text-red-900", detail: "text-red-700" },
  P2: { badge: "bg-amber-500 text-white", card: "border-amber-200 bg-amber-50", title: "text-amber-900", detail: "text-amber-700" },
  P3: { badge: "bg-gray-200 text-gray-600", card: "border-gray-200 bg-gray-50", title: "text-gray-700", detail: "text-gray-500" },
}

const SLIP_STYLES = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-green-100 text-green-700 border-green-200",
}

function CompletionBar({ pct, endsAt }: { pct: number; endsAt: string }) {
  const daysLeft = Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86400000)
  const isOverdue = daysLeft < 0
  const isUrgent = daysLeft <= 1
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{pct}% complete</span>
        <span className={isUrgent ? "text-red-600 font-medium" : ""}>
          {isOverdue ? "cycle ended" : daysLeft === 0 ? "ends today" : daysLeft === 1 ? "1 day left" : `${daysLeft}d left`}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isUrgent && pct < 60 ? "bg-red-500" : pct >= 70 ? "bg-green-500" : "bg-blue-500"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}

export default function CyclesPage() {
  const data = loadCycles()

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-400">
        No cycle data available. Run Atom to pull Linear cycle data.
      </div>
    )
  }

  const { pods, crossPodSignals, plannedVsShipped, generatedAt } = data

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Cycle Intelligence</h1>
        <p className="text-gray-500 text-sm mt-1">Linear cycles × GitHub PRs — planned vs shipped, slip risks, stale tickets</p>
        <p className="text-xs text-gray-400 mt-0.5">Last synced {new Date(generatedAt).toLocaleString()}</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pods tracked", value: pods.length },
          { label: "PRs mapped to cycle", value: `${plannedVsShipped.mappedToLinear}/${plannedVsShipped.totalMergedPRs}` },
          { label: "Stale Linear tickets", value: plannedVsShipped.staleTickets, alert: true },
          { label: "P1 signals this cycle", value: plannedVsShipped.p1Signals, alert: plannedVsShipped.p1Signals > 0 },
        ].map((m) => (
          <div key={m.label} className={`rounded-xl border px-4 py-4 ${m.alert ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"}`}>
            <p className="text-xs text-gray-500 mb-1">{m.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${m.alert ? "text-red-700" : "text-gray-900"}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Cross-pod signals */}
      {crossPodSignals.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-medium">Cross-Pod Signals</h2>
          <div className="space-y-2">
            {crossPodSignals.map((s, i) => {
              const style = URGENCY_STYLES[s.urgency]
              return (
                <div key={i} className={`rounded-xl border px-5 py-4 ${style.card}`}>
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${style.badge}`}>{s.urgency}</span>
                    <div>
                      <p className={`text-sm font-semibold ${style.title}`}>{s.title}</p>
                      <p className={`text-sm mt-1 ${style.detail}`}>{s.detail}</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {s.affectedPods.map(pod => (
                          <span key={pod} className="text-xs bg-white bg-opacity-60 border border-current border-opacity-20 px-1.5 py-0.5 rounded">{pod}</span>
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
        <h2 className="text-xs uppercase tracking-widest text-gray-400 font-medium">Pod Cycles</h2>
        {pods.map((pod) => {
          const signals = pod.signals || []
          const keyInProgress = pod.keyInProgress || []
          const mergedPRsThisWeek = pod.mergedPRsThisWeek || []
          const p1Signals = signals.filter(s => s.urgency === "P1")
          const otherSignals = signals.filter(s => s.urgency !== "P1")
          const daysLeft = Math.ceil((new Date(pod.cycleEnds).getTime() - Date.now()) / 86400000)

          return (
            <div key={pod.pod} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              {/* Pod header */}
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{pod.pod}</h3>
                      <span className="text-xs text-gray-400">Cycle {pod.cycleNumber}{pod.cycleName ? ` · ${pod.cycleName}` : ""}</span>
                      {p1Signals.length > 0 && (
                        <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">{p1Signals.length} P1</span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-2 text-xs text-gray-500">
                      <span className="text-green-600 font-medium">{pod.completedIssues} done</span>
                      <span>{pod.devCompleted} dev complete</span>
                      <span>{pod.inReview} in review</span>
                      <span>{pod.inProgress} in progress</span>
                      <span>{pod.todo} todo</span>
                      <span>·</span>
                      <span>{pod.totalIssues} total</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${SLIP_STYLES[pod.slipRisk]}`}>
                      {pod.slipRisk} slip risk
                    </span>
                    <p className="text-xs text-gray-400 mt-1">ends {new Date(pod.cycleEnds).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <CompletionBar pct={pod.completionPct} endsAt={pod.cycleEnds} />
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* P1 signals inline */}
                {p1Signals.length > 0 && (
                  <div className="space-y-2">
                    {p1Signals.map((s, i) => (
                      <div key={i} className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-bold bg-red-600 text-white px-1.5 py-0.5 rounded shrink-0">P1</span>
                          <div>
                            <p className="text-sm font-semibold text-red-900">{s.title}</p>
                            <p className="text-sm text-red-700 mt-0.5">{s.detail}</p>
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
                      <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-2">Key In Progress</p>
                      <div className="space-y-1.5">
                        {keyInProgress.map((item) => (
                          <div key={item.id} className={`rounded-lg px-3 py-2 text-sm ${item.isProdBlocker ? "bg-red-50 border border-red-200" : "bg-gray-50 border border-gray-200"}`}>
                            <div className="flex items-start gap-1.5">
                              {item.isProdBlocker && <span className="text-red-500 text-xs shrink-0 mt-0.5">PROD</span>}
                              <div>
                                <span className="font-mono text-xs text-gray-400">{item.id}</span>
                                <p className={`text-xs mt-0.5 leading-snug ${item.isProdBlocker ? "text-red-800 font-medium" : "text-gray-700"}`}>{item.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{item.assignee}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Merged PRs */}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-2">PRs Merged This Week</p>
                    {mergedPRsThisWeek.length === 0 ? (
                      <p className="text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">No PRs merged</p>
                    ) : (
                      <div className="space-y-1.5">
                        {mergedPRsThisWeek.map((pr, i) => (
                          <div key={i} className={`rounded-lg px-3 py-2 text-sm border ${pr.stale ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
                            <div className="flex items-center gap-2">
                              <a href={`/pr/${pod.pod === "PAY" || pod.pod === "WFM 1" || pod.pod === "WFM 2" ? "Atlas-Webapp" : pod.pod === "FNM 1" ? "Payments-Backend" : "Atlas-Frontend"}/${pr.prNumber}`}
                                className="font-mono text-xs text-blue-600 hover:underline">
                                #{pr.prNumber}
                              </a>
                              <span className="font-mono text-xs text-gray-700">{pr.linearId}</span>
                              {pr.stale ? (
                                <span className="text-xs text-amber-700 font-medium">Linear still &quot;{pr.linearStatus}&quot; — close ticket</span>
                              ) : (
                                <span className="text-xs text-green-700">✓ {pr.linearStatus}</span>
                              )}
                            </div>
                            {pr.note && <p className="text-xs text-gray-400 mt-0.5">{pr.note}</p>}
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
                      const style = URGENCY_STYLES[s.urgency]
                      return (
                        <div key={i} className={`rounded-lg border px-4 py-3 ${style.card}`}>
                          <div className="flex items-start gap-2">
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${style.badge}`}>{s.urgency}</span>
                            <div>
                              <p className={`text-sm font-semibold ${style.title}`}>{s.title}</p>
                              <p className={`text-sm mt-0.5 ${style.detail}`}>{s.detail}</p>
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
    </div>
  )
}
