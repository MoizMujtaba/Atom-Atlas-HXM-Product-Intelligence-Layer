import { getMergedPRs, getWeeklyEvents, getRegressions } from "@/lib/atom-data"
import { generateWeeklyBrief } from "@/lib/claude"

export const dynamic = "force-dynamic"

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

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono bg-gray-900 text-white px-2 py-0.5 rounded">ATOM</span>
          <span className="text-xs text-gray-400">{today}</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 leading-snug">{brief.headline}</h1>
        <p className="text-gray-600 mt-3 text-base leading-relaxed">{brief.summary}</p>
      </div>

      {/* Exec Signal */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
        <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-1">Exec Signal</p>
        <p className="text-gray-900 font-medium">{brief.execSignal}</p>
      </div>

      {/* Regressions */}
      {brief.regressions?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            Possible Regressions
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
            Production Risks to Watch
          </h2>
          <div className="space-y-2">
            {brief.topRisks.map((r, i) => (
              <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-medium text-amber-800">{r.title}</p>
                <p className="text-sm text-amber-700 mt-0.5">{r.reason}</p>
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
            Shipped Blind — No Tracking Added
          </h2>
          <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
            {brief.instrumentationGaps.map((gap, i) => (
              <div key={i} className="px-4 py-3 text-sm text-gray-700 flex gap-2 items-start">
                <span className="text-amber-400 shrink-0">◎</span>
                <span>{gap}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">Add PostHog events to measure adoption and detect regressions early.</p>
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
              <div key={i} className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-sm font-medium text-blue-900">{o.idea}</p>
                <p className="text-xs text-blue-600 mt-0.5">Surfaced by: {o.fromPR}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PM Playbook */}
      <section className="space-y-4 border-t border-gray-200 pt-6">
        <h2 className="text-sm font-semibold text-gray-900">PM Playbook — Questions for Your Pods This Week</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              pod: "All Pods",
              questions: [
                "Which PRs shipped new user-visible behavior this week with no PostHog event?",
                "Did any event volume drop >20% with no PR explaining it?",
                "Which reviewer concerns from code review are now in production?",
              ],
            },
            {
              pod: "WFM 1",
              questions: [
                "Are WSEs successfully seeing their assigned fields after the auto-routing fix?",
                "Is the assigneeUserId null issue causing silent misrouting?",
                "Are HRSD reviewers using the flag + due date feature?",
              ],
            },
            {
              pod: "WFM 2",
              questions: [
                "Why did expenseDetail_upserted drop 46% WoW — is the save flow broken?",
                "Contribution splits shipped with no PostHog event — how will you know if admins are using it?",
                "Is the AI expense extraction feedback loop generating training signal?",
              ],
            },
            {
              pod: "PAY",
              questions: [
                "SSO failure rate is up 23% — is this new visibility or a genuine regression?",
                "Are all 8 new SSO events firing in PostHog?",
                "mfa_sms_setup_phone is down 24% — is OTP send error recovery working?",
              ],
            },
            {
              pod: "FNM 1",
              questions: [
                "Virtual expense card flow uses both Stripe and Ramp handlers — which is live?",
                "Are card provisioning background jobs completing without queue lag?",
                "Are admins seeing the correct THP error message + last sync timestamp?",
              ],
            },
            {
              pod: "FNM 2 + Data Platform",
              questions: [
                "GTN mapping and recon import have no PostHog events — add gtn_mapping_triggered.",
                "Is the Partner Connect fix verified in production?",
                "What data pipeline jobs ran this week — any sync failures?",
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
