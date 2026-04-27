import { getMergedPRs, getWeeklyEvents, getRegressions } from "@/lib/atom-data"
import { generateWeeklyBrief } from "@/lib/claude"

export const dynamic = "force-dynamic"

const SIGNAL_LIGHT: Record<string, { bg: string; text: string; dot: string }> = {
  green: { bg: "bg-green-50 border-green-200", text: "text-green-800", dot: "bg-green-500" },
  amber: { bg: "bg-amber-50 border-amber-200", text: "text-amber-800", dot: "bg-amber-400" },
  red: { bg: "bg-red-50 border-red-200", text: "text-red-800", dot: "bg-red-500" },
}

const OUTCOME_BADGE: Record<string, string> = {
  retention: "bg-blue-100 text-blue-700",
  revenue: "bg-green-100 text-green-700",
  efficiency: "bg-cyan-100 text-cyan-700",
  risk: "bg-red-100 text-red-700",
  migration: "bg-violet-100 text-violet-700",
}

export default async function BriefPage() {
  const prs = getMergedPRs()
  const events = getWeeklyEvents()
  const regressions = getRegressions(20)

  const brief = await generateWeeklyBrief(
    prs.map(p => ({ title: p.title, team: p.team, translation: p.translation as unknown as Record<string, unknown> })),
    events,
    regressions
  )

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  const signal = SIGNAL_LIGHT[brief.weekSignal || "amber"]

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono bg-gray-900 text-white px-2 py-0.5 rounded">ATOM</span>
          <span className="text-xs text-gray-400">Weekly Brief · {today}</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 leading-snug">{brief.headline}</h1>
        <p className="text-gray-600 mt-3 text-base leading-relaxed">{brief.summary}</p>
      </div>

      {/* Traffic light + exec signal */}
      <div className={`rounded-xl border p-4 flex items-start gap-4 ${signal.bg}`}>
        <div className={`w-4 h-4 rounded-full shrink-0 mt-0.5 ${signal.dot}`} />
        <div>
          <p className={`text-sm font-semibold ${signal.text}`}>{brief.execSignal}</p>
          {brief.weekSignalReason && (
            <p className={`text-xs mt-1 ${signal.text} opacity-75`}>{brief.weekSignalReason}</p>
          )}
        </div>
      </div>

      {/* P1 Actions — must come first */}
      {brief.p1Actions?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Act This Week</h2>
          <div className="rounded-xl border border-gray-900 bg-gray-900 overflow-hidden">
            {brief.p1Actions.map((action, i) => (
              <div key={i} className={`px-4 py-3 flex gap-3 items-start ${i > 0 ? "border-t border-gray-700" : ""}`}>
                <span className="text-xs font-bold text-red-400 shrink-0 mt-0.5">P1</span>
                <p className="text-sm text-white">{action}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Regressions */}
      {brief.regressions?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            Possible Regressions — Investigate Before Next Sprint
          </h2>
          <div className="space-y-2">
            {brief.regressions.map((r, i) => (
              <div key={i} className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-mono text-red-800">{r.event}</span>
                  <span className="text-sm font-semibold text-red-700">−{r.drop}%</span>
                </div>
                <p className="text-sm text-red-700">{r.hypothesis}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Risks */}
      {brief.topRisks?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Production Risks
          </h2>
          <div className="space-y-2">
            {brief.topRisks.map((r, i) => (
              <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 space-y-1">
                <p className="text-sm font-medium text-amber-800">{r.title}</p>
                <p className="text-sm text-amber-700">{r.reason}</p>
                {r.recommendedAction && (
                  <p className="text-xs font-medium text-amber-900 border-l-2 border-amber-400 pl-2 mt-1">
                    → {r.recommendedAction}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Instrumentation Gaps */}
      {brief.instrumentationGaps?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
            Shipped Blind — You Cannot Measure These
          </h2>
          <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
            {brief.instrumentationGaps.map((gap, i) => (
              <div key={i} className="px-4 py-3 text-sm text-gray-700 flex gap-2 items-start">
                <span className="text-amber-400 shrink-0">◎</span>
                <span>{gap}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PM Opportunities */}
      {brief.opportunities?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            Product Opportunities
          </h2>
          <div className="space-y-2">
            {brief.opportunities.map((o, i) => (
              <div key={i} className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 space-y-1">
                <div className="flex items-start gap-2">
                  {o.outcomeType && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${OUTCOME_BADGE[o.outcomeType] || "bg-gray-100 text-gray-600"}`}>
                      {o.outcomeType}
                    </span>
                  )}
                  <p className="text-sm font-medium text-blue-900">{o.idea}</p>
                </div>
                {o.estimatedEffort && (
                  <p className="text-xs text-blue-600">{o.estimatedEffort}</p>
                )}
                <p className="text-xs text-blue-500">Surfaced by: {o.fromPR}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PM Playbook — hard-coded based on current data */}
      <section className="space-y-4 border-t border-gray-200 pt-6">
        <h2 className="text-sm font-semibold text-gray-900">PM Calibration Questions — Pod by Pod</h2>
        <p className="text-xs text-gray-400">Ask these before your next sprint planning. Each question targets a signal in this week&apos;s data.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              pod: "WFM 1",
              questions: [
                "Are WSEs actually seeing their auto-assigned fields — or is the casing bug silently misrouting them?",
                "Is the useEffect in CommentThreadPopover causing race conditions in prod? Check error logs.",
                "Are HRSD reviewers using the flag + due date feature? What's the flag submission success rate?",
              ],
            },
            {
              pod: "WFM 2",
              questions: [
                "expenseDetail_upserted dropped 46% WoW with no PR explaining it — is the save flow broken?",
                "Contribution splits shipped with zero PostHog instrumentation. How will you know if admins adopt it?",
                "AI feedback dismissal spiked 1500% (1→16 events). Is the banner shown in wrong contexts?",
              ],
            },
            {
              pod: "PAY",
              questions: [
                "SSO failures up 23% — is this new event visibility from PAY-1405 or a real regression? Check pre/post-deploy failure rate.",
                "Validate all 8 new SSO events are firing. Check PostHog for SSO_SETUP_STARTED and SSO_ENABLED.",
                "mfa_sms_setup_phone down 24% WoW — is MFA recovery working or are users abandoning?",
              ],
            },
            {
              pod: "FNM 1",
              questions: [
                "Virtual expense cards: are both Stripe and Ramp webhook handlers live? Which provider is actually provisioning?",
                "THP API change ships a last-sync timestamp — is TakeHomePaySyncLogs ever empty? What's the null rate?",
                "Check card provisioning queue depth — background worker lag means users wait for card activation.",
              ],
            },
            {
              pod: "FNM 2",
              questions: [
                "GTN mapping has no PostHog events — add gtn_mapping_triggered and recon_file_imported before next sprint.",
                "Partner Connect fix is unlabeled — what regression did it fix? Get the PR description filled in.",
              ],
            },
            {
              pod: "Data Platform",
              questions: [
                "No PRs this week — is the pod blocked, on planned infra work, or supporting other pods?",
                "What data pipeline jobs ran this week? Any sync failures or schema drift on external data sources?",
              ],
            },
          ].map((block) => (
            <div key={block.pod} className="rounded-lg border border-gray-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{block.pod}</p>
              <ul className="space-y-2">
                {block.questions.map((q, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2 items-start">
                    <span className="text-gray-300 shrink-0 mt-0.5">?</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="text-xs text-gray-400 border-t border-gray-100 pt-4">
        Generated by Atom · {prs.length} PRs analyzed · {events.length} events tracked · {regressions.length} regressions detected
      </div>
    </div>
  )
}
