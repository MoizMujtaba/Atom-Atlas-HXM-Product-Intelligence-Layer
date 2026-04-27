import { getMergedPRs, getWeeklyEvents } from "@/lib/atom-data"
import { loadHypotheses } from "@/lib/rice"
import { wowTrend, wowColor } from "@/lib/utils"

export const dynamic = "force-dynamic"

const POD_EVENTS: Record<string, string[]> = {
  "WFM 1": ["employee_task_clicked", "employee_task_saved", "employee_submitted", "employee_created"],
  "WFM 2": ["addExpense_aiFeedbackBannerShown", "addExpense_upserted", "addExpenseLine_upserted", "expenseDetail_upserted", "addExpense_aiExpenseExtractionFeedback", "addExpense_aiExpenseExtractionFeedbackDismissed"],
  "PAY": ["sso_login_attempt", "sso_login_success", "sso_login_failed", "mfa_sms_setup_phone"],
  "FNM 1": [],
  "FNM 2": [],
  "Data Platform": [],
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

  const eventMap = Object.fromEntries(events.map((e: { event: string; thisWeek: number; lastWeek: number }) => [e.event, e]))
  const pods = Object.keys(POD_EVENTS)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Signal Feed</h1>
        <p className="text-gray-500 text-sm mt-1">Per-pod engineering activity × PostHog correlation</p>
      </div>

      {pods.map((pod) => {
        const podPRs = prs.filter((pr) => pr.team === pod)
        const podEvents = POD_EVENTS[pod]
        const podHyps = hypotheses.filter((h) => h.pod === pod && h.status === "active")
        const hasData = podPRs.length > 0 || podEvents.length > 0

        return (
          <section key={pod} className="rounded-xl border border-gray-200 overflow-hidden bg-white">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{pod}</h2>
              <div className="flex gap-2 text-xs text-gray-500">
                <span>{podPRs.length} PRs</span>
                <span>·</span>
                <span>{podEvents.length > 0 ? `${podEvents.length} tracked events` : "No PostHog events"}</span>
                {podHyps.length > 0 && <><span>·</span><span className="text-red-600 font-medium">{podHyps.length} active signals</span></>}
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
                      return (
                        <div key={ev} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                          <p className="font-mono text-xs text-gray-500 truncate">{ev}</p>
                          {data ? (
                            <div className="flex items-end gap-2 mt-1">
                              <span className="text-lg font-semibold tabular-nums text-gray-900">{data.thisWeek.toLocaleString()}</span>
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
                  <div className="space-y-1">
                    {podPRs.map((pr) => (
                      <div key={`${pr.repo}-${pr.number}`} className="flex items-start gap-3 text-sm py-1">
                        <span className="text-gray-400 font-mono text-xs mt-0.5 shrink-0">#{pr.number}</span>
                        <a href={`/pr/${pr.repo}/${pr.number}`} className="text-blue-600 hover:text-blue-800 hover:underline leading-snug">
                          {pr.title}
                        </a>
                        <span className="ml-auto text-gray-400 text-xs shrink-0">{pr.repo}</span>
                      </div>
                    ))}
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
