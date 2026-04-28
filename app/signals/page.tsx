import { getMergedPRs, getWeeklyEvents, getRegressions, getInstrumentationGaps, type AtomPR } from "@/lib/atom-data"
import { loadHypotheses } from "@/lib/rice"
import { wowTrend, wowColor } from "@/lib/utils"

export const dynamic = "force-static"

const POD_EVENTS: Record<string, string[]> = {
  "WFM 1": ["employee_task_clicked", "employee_task_saved", "employee_submitted", "employee_created"],
  "WFM 2": ["addExpense_aiFeedbackBannerShown", "addExpense_upserted", "addExpenseLine_upserted", "expenseDetail_upserted", "addExpense_aiExpenseExtractionFeedback", "addExpense_aiExpenseExtractionFeedbackDismissed"],
  "PAY": ["sso_login_attempt", "sso_login_success", "sso_login_failed", "mfa_sms_setup_phone"],
  "FNM 1": [],
  "FNM 2": [],
  "Data Platform": [],
}

const URGENCY_STYLES = {
  P1: { badge: "bg-red-600 text-white", row: "border-red-300 bg-red-50" },
  P2: { badge: "bg-amber-500 text-white", row: "border-amber-200 bg-amber-50" },
  P3: { badge: "bg-gray-200 text-gray-600", row: "border-gray-200 bg-gray-50" },
}

const OUTCOME_BADGE: Record<string, string> = {
  retention: "bg-blue-100 text-blue-700",
  revenue: "bg-green-100 text-green-700",
  efficiency: "bg-cyan-100 text-cyan-700",
  risk: "bg-red-100 text-red-700",
  migration: "bg-violet-100 text-violet-700",
}

const LEGACY_BADGE: Record<string, { label: string; style: string }> = {
  "accelerates-sunset": { label: "↑ sunset", style: "bg-green-100 text-green-700" },
  "delays-sunset": { label: "↓ blocks sunset", style: "bg-red-100 text-red-700" },
  neutral: { label: "legacy neutral", style: "bg-gray-100 text-gray-500" },
}

const SIGNAL_COLORS: Record<string, string> = {
  friction: "bg-red-50 text-red-700 border-red-200",
  "new-capability": "bg-blue-50 text-blue-700 border-blue-200",
  gap: "bg-amber-50 text-amber-700 border-amber-200",
  migration: "bg-purple-50 text-purple-700 border-purple-200",
}


export default async function SignalsPage() {
  const prs = getMergedPRs()
  const events = getWeeklyEvents()
  const hypotheses = loadHypotheses()
  const regressions = getRegressions(20)
  const gaps = getInstrumentationGaps()

  const eventMap = Object.fromEntries(events.map((e: { event: string; thisWeek: number; lastWeek: number }) => [e.event, e]))
  const pods = Object.keys(POD_EVENTS)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Signal Feed</h1>
        <p className="text-gray-500 text-sm mt-1">Per-pod engineering activity × PostHog correlation</p>
      </div>

      {/* ── Regression Alerts ── */}
      {regressions.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 overflow-hidden">
          <div className="px-5 py-3 border-b border-red-200 flex items-center gap-2">
            <span className="text-red-700 font-semibold text-sm">Regression Alerts</span>
            <span className="text-xs bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded font-medium">{regressions.length} events down &gt;20% WoW</span>
          </div>
          <div className="divide-y divide-red-100">
            {regressions.map((r) => (
              <div key={r.event} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-red-800">{r.event}</p>
                  <p className="text-xs text-red-600 mt-0.5">{r.pod} · dropped {r.dropPct}% — {r.lastWeek.toLocaleString()} → {r.thisWeek.toLocaleString()}</p>
                </div>
                <span className="text-sm font-semibold text-red-700">−{r.dropPct}%</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-2 bg-red-50 border-t border-red-100">
            <p className="text-xs text-red-600">No shipped PR this week explains these drops. Investigate broken flows or data pipeline issues.</p>
          </div>
        </div>
      )}

      {/* ── Instrumentation Gaps ── */}
      {gaps.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-200 flex items-center gap-2">
            <span className="text-amber-700 font-semibold text-sm">Shipped Blind</span>
            <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-medium">{gaps.length} PRs with no PostHog tracking</span>
          </div>
          <div className="divide-y divide-amber-100">
            {gaps.map((g) => (
              <div key={`${g.repo}-${g.prNumber}`} className="px-5 py-3">
                <div className="flex items-start gap-3">
                  <span className="text-amber-400 text-lg shrink-0">◎</span>
                  <div>
                    <a href={`/pr/${g.repo}/${g.prNumber}`} className="text-sm font-medium text-amber-800 hover:underline">
                      {g.prTitle}
                    </a>
                    <p className="text-xs text-amber-600 mt-0.5">{g.team} · {g.newCapability}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-2 bg-amber-50 border-t border-amber-100">
            <p className="text-xs text-amber-600">These features shipped with no user behavior tracking. You cannot measure adoption or detect failures.</p>
          </div>
        </div>
      )}

      {/* ── Per-pod sections ── */}
      {pods.map((pod) => {
        const podPRs = prs.filter((pr) => pr.team === pod)
        const podEvents = POD_EVENTS[pod]
        const podHyps = hypotheses.filter((h) => h.pod === pod && h.status === "active")
        const podRegressions = regressions.filter(r => r.pod === pod)
        const hasData = podPRs.length > 0 || podEvents.length > 0

        return (
          <section key={pod} className="rounded-xl border border-gray-200 overflow-hidden bg-white">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{pod}</h2>
              <div className="flex gap-2 text-xs text-gray-500">
                <span>{podPRs.length} PRs</span>
                <span>·</span>
                <span>{podEvents.length > 0 ? `${podEvents.length} tracked events` : "No PostHog events"}</span>
                {podRegressions.length > 0 && <><span>·</span><span className="text-red-600 font-medium">{podRegressions.length} regressions</span></>}
                {podHyps.length > 0 && <><span>·</span><span className="text-violet-600 font-medium">{podHyps.length} active signals</span></>}
              </div>
            </div>

            <div className="p-5 space-y-5">
              {podHyps.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-gray-400 font-medium">Active Signals</p>
                  {podHyps.map((h) => (
                    <div key={h.id} className={`rounded-lg border px-4 py-3 text-sm ${SIGNAL_COLORS[h.signalType] || SIGNAL_COLORS.gap}`}>
                      <p className="font-medium">{h.title}</p>
                      <p className="text-xs mt-1 opacity-70">{h.evidence}</p>
                    </div>
                  ))}
                </div>
              )}

              {podEvents.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-gray-400 font-medium">PostHog (7d)</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {podEvents.map((ev) => {
                      const data = eventMap[ev]
                      const isRegression = podRegressions.some(r => r.event === ev)
                      return (
                        <div key={ev} className={`rounded-lg border px-3 py-2 ${isRegression ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                          <p className="font-mono text-xs text-gray-500 truncate">{ev}</p>
                          {data ? (
                            <div className="flex items-end gap-2 mt-1">
                              <span className={`text-lg font-semibold tabular-nums ${isRegression ? "text-red-700" : "text-gray-900"}`}>{data.thisWeek.toLocaleString()}</span>
                              <span className={`text-xs font-medium mb-0.5 ${wowColor(data.thisWeek, data.lastWeek, !ev.includes("failed"))}`}>
                                {wowTrend(data.thisWeek, data.lastWeek)}
                              </span>
                            </div>
                          ) : (
                            <p className="text-gray-400 text-xs mt-1">No events this week</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Data gap — no PostHog events instrumented for this pod. Cannot measure user outcomes.
                </div>
              )}

              {podPRs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-gray-400 font-medium">Shipped (7d)</p>
                  <div className="space-y-2">
                    {podPRs
                      .sort((a: AtomPR, b: AtomPR) => {
                        const order = { P1: 0, P2: 1, P3: 2 }
                        return (order[a.translation.urgencyTier || "P3"]) - (order[b.translation.urgencyTier || "P3"])
                      })
                      .map((pr: AtomPR) => {
                      const t = pr.translation
                      const tier = t.urgencyTier || "P3"
                      const { badge, row } = URGENCY_STYLES[tier]
                      return (
                        <div key={`${pr.repo}-${pr.number}`} className={`rounded-lg border px-4 py-3 ${row}`}>
                          <div className="flex items-start gap-2">
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${badge}`}>{tier}</span>
                            <div className="flex-1 min-w-0">
                              <a href={`/pr/${pr.repo}/${pr.number}`} className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium leading-snug">
                                {pr.title}
                              </a>
                              <div className="flex gap-1.5 flex-wrap mt-1">
                                {t.outcomeType && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${OUTCOME_BADGE[t.outcomeType] || "bg-gray-100 text-gray-600"}`}>
                                    {t.outcomeType}
                                  </span>
                                )}
                                {t.legacyImpact && t.legacyImpact !== "neutral" && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${LEGACY_BADGE[t.legacyImpact]?.style}`}>
                                    {LEGACY_BADGE[t.legacyImpact]?.label}
                                  </span>
                                )}
                                {t.instrumentationGap && (
                                  <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-amber-100 text-amber-700">no tracking</span>
                                )}
                                {t.targetPersona && (
                                  <span className="text-xs text-gray-400">{t.targetPersona}</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-700 mt-1.5 leading-snug">{t.userImpact}</p>
                              {t.recommendedAction && (
                                <p className="text-xs font-medium text-gray-900 mt-1.5 border-l-2 border-gray-400 pl-2">
                                  → {t.recommendedAction}
                                </p>
                              )}
                              {t.ignoreCost && (
                                <p className="text-xs text-red-600 mt-1">If ignored: {t.ignoreCost}</p>
                              )}
                              {t.reviewerRisks && t.reviewerRisks.length > 0 && (
                                <div className="mt-1.5 space-y-0.5">
                                  {t.reviewerRisks.slice(0, 2).map((risk: string, i: number) => (
                                    <p key={i} className="text-xs text-amber-700 flex gap-1 items-start">
                                      <span className="shrink-0">⚠</span>{risk}
                                    </p>
                                  ))}
                                </div>
                              )}
                              {t.nextOpportunity && (
                                <p className="text-xs text-blue-600 mt-1.5 italic">Opportunity: {t.nextOpportunity}</p>
                              )}
                            </div>
                            <span className="text-gray-400 text-xs shrink-0 mt-0.5">{pr.repo}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {!hasData && (
                <p className="text-gray-400 text-sm">No signals this week.</p>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
