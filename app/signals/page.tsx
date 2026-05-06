import { getMergedPRs, getWeeklyEvents, getRegressions, getInstrumentationGaps, type AtomPR } from "@/lib/atom-data"
import { loadHypotheses } from "@/lib/rice"
import { wowTrend, wowColor } from "@/lib/utils"
import AtomHero from "@/components/atom-hero"
import StatTile from "@/components/stat-tile"
import PieChart from "@/components/sentinel/pie-chart"
import BarChart from "@/components/bar-chart"

export const dynamic = "force-static"

const POD_EVENTS: Record<string, string[]> = {
  "WFM 1": ["employee_task_clicked", "employee_task_saved", "employee_submitted", "employee_created"],
  "WFM 2": ["addExpense_aiFeedbackBannerShown", "addExpense_upserted", "addExpenseLine_upserted", "expenseDetail_upserted", "addExpense_aiExpenseExtractionFeedback", "addExpense_aiExpenseExtractionFeedbackDismissed"],
  "PAY": ["sso_login_attempt", "sso_login_success", "sso_login_failed", "mfa_sms_setup_phone"],
  "FNM 1": [],
  "FNM 2": [],
  "Data Platform": [],
}

const URGENCY_BADGE: Record<string, { bg: string; fg: string }> = {
  P1: { bg: "var(--atlas-coral-500)", fg: "white" },
  P2: { bg: "var(--atlas-orangellow-500)", fg: "white" },
  P3: { bg: "var(--atlas-gray-300)", fg: "var(--atlas-gray-900)" },
}

const URGENCY_SECTION: Record<string, { border: string; headerBg: string; headerText: string; label: string; sublabel: string }> = {
  P1: {
    border: "var(--atlas-coral-100)",
    headerBg: "var(--atlas-coral-100)",
    headerText: "#7A1818",
    label: "P1",
    sublabel: "Act within 48 hours",
  },
  P2: {
    border: "var(--atlas-orangellow-100)",
    headerBg: "var(--atlas-orangellow-100)",
    headerText: "#5A3A0B",
    label: "P2",
    sublabel: "Next sprint",
  },
  P3: {
    border: "var(--atlas-gray-300)",
    headerBg: "var(--atlas-gray-50)",
    headerText: "var(--atlas-gray-900)",
    label: "P3",
    sublabel: "Monitor — no immediate action",
  },
}

const OUTCOME_BADGE: Record<string, { bg: string; fg: string }> = {
  retention: { bg: "var(--atlas-blue-100)", fg: "var(--atlas-blue-900)" },
  revenue: { bg: "var(--atlas-blue-100)", fg: "var(--atlas-blue-500)" },
  efficiency: { bg: "var(--atlas-purple-100)", fg: "var(--atlas-purple-900)" },
  risk: { bg: "var(--atlas-coral-100)", fg: "#7A1818" },
  migration: { bg: "var(--atlas-magenta-100)", fg: "var(--atlas-magenta-900)" },
}

function signalAge(mergedAt: string): string {
  const days = Math.floor((Date.now() - new Date(mergedAt).getTime()) / 86400000)
  if (days === 0) return "today"
  if (days === 1) return "1d ago"
  return `${days}d ago`
}

function ageColor(mergedAt: string, tier: string): string {
  const days = Math.floor((Date.now() - new Date(mergedAt).getTime()) / 86400000)
  if (tier === "P1" && days >= 2) return "text-red-600 font-semibold"
  if (tier === "P1" && days >= 1) return "text-amber-600 font-medium"
  return ""
}

function PRCard({ pr }: { pr: AtomPR }) {
  const t = pr.translation
  const tier = (t.urgencyTier || "P3") as "P1" | "P2" | "P3"
  const badge = URGENCY_BADGE[tier]
  const age = signalAge(pr.mergedAt)
  const ageStyle = ageColor(pr.mergedAt, tier)

  const rowBg =
    tier === "P1" ? "var(--atlas-coral-100)" :
    tier === "P2" ? "var(--atlas-orangellow-100)" :
    "var(--atlas-gray-50)"

  const rowBorder =
    tier === "P1" ? "var(--atlas-coral-100)" :
    tier === "P2" ? "var(--atlas-orangellow-100)" :
    "var(--atlas-gray-300)"

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: `1px solid ${rowBorder}`, background: "white" }}>
      <div className="px-4 py-3" style={{ background: rowBg }}>
        <div className="flex items-start gap-2">
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5"
            style={{ background: badge.bg, color: badge.fg }}
          >
            {tier}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <a
                href={`/pr/${pr.repo}/${pr.number}`}
                className="text-sm font-medium leading-snug hover:underline transition-colors"
                style={{ color: "var(--atlas-blue-500)" }}
              >
                {pr.title}
              </a>
              <div className="flex items-center gap-2 shrink-0 text-xs">
                <span
                  className={ageStyle}
                  style={ageStyle ? {} : { color: "var(--atlas-gray-900)", opacity: 0.55 }}
                >
                  {age}
                </span>
                <span style={{ color: "var(--atlas-gray-300)" }}>·</span>
                <span style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>{pr.team}</span>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap mt-1.5">
              {t.outcomeType && (() => {
                const b = OUTCOME_BADGE[t.outcomeType] || { bg: "var(--atlas-gray-300)", fg: "var(--atlas-gray-900)" }
                return (
                  <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: b.bg, color: b.fg }}>
                    {t.outcomeType}
                  </span>
                )
              })()}
              {t.legacyImpact && t.legacyImpact === "accelerates-sunset" && (
                <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "var(--atlas-blue-100)", color: "var(--atlas-blue-900)" }}>
                  ↑ sunset
                </span>
              )}
              {t.legacyImpact && t.legacyImpact === "delays-sunset" && (
                <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "var(--atlas-coral-100)", color: "#7A1818" }}>
                  ↓ blocks sunset
                </span>
              )}
              {t.instrumentationGap && (
                <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "var(--atlas-orangellow-100)", color: "#5A3A0B" }}>
                  no tracking
                </span>
              )}
              {t.targetPersona && (
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--atlas-gray-50)", color: "var(--atlas-gray-900)", opacity: 0.6 }}>
                  {t.targetPersona}
                </span>
              )}
            </div>
            <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--atlas-gray-900)", opacity: 0.7 }}>{t.userImpact}</p>
          </div>
        </div>
      </div>
      {t.recommendedAction && (
        <div className="flex items-start gap-2 px-4 py-2.5 border-t" style={{ background: "var(--atlas-blue-900)", borderColor: "var(--atlas-blue-900)" }}>
          <span className="text-[10px] font-bold uppercase tracking-wider shrink-0 mt-0.5" style={{ color: "var(--atlas-blue-250)" }}>→</span>
          <p className="text-xs font-semibold text-white leading-relaxed">{t.recommendedAction}</p>
        </div>
      )}
      {(t.ignoreCost || (t.reviewerRisks && t.reviewerRisks.length > 0)) && (
        <div className="px-4 py-2 border-t space-y-1" style={{ background: "var(--atlas-gray-50)", borderColor: "var(--atlas-gray-300)" }}>
          {t.ignoreCost && (
            <p className="text-xs leading-snug" style={{ color: "var(--atlas-coral-500)" }}>
              <span className="font-medium">If ignored:</span> {t.ignoreCost}
            </p>
          )}
          {t.reviewerRisks?.slice(0, 1).map((risk: string, i: number) => (
            <p key={i} className="text-xs flex gap-1 items-start" style={{ color: "#5A3A0B" }}>
              <span className="shrink-0">⚠</span>{risk}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export default async function SignalsPage() {
  const prs = getMergedPRs()
  const events = getWeeklyEvents()
  const hypotheses = loadHypotheses()
  const regressions = getRegressions(20)
  const gaps = getInstrumentationGaps()

  const eventMap = Object.fromEntries(events.map((e: { event: string; thisWeek: number; lastWeek: number }) => [e.event, e]))

  const sortByDate = (a: AtomPR, b: AtomPR) => new Date(b.mergedAt).getTime() - new Date(a.mergedAt).getTime()
  const p1s = prs.filter(pr => pr.translation.urgencyTier === "P1").sort(sortByDate)
  const p2s = prs.filter(pr => pr.translation.urgencyTier === "P2").sort(sortByDate)
  const p3s = prs.filter(pr => !pr.translation.urgencyTier || pr.translation.urgencyTier === "P3").sort(sortByDate)

  const totalPRs = prs.length
  const p1Stale = p1s.filter(pr => Math.floor((Date.now() - new Date(pr.mergedAt).getTime()) / 86400000) >= 2)

  if (totalPRs === 0 && regressions.length === 0 && gaps.length === 0) return (
    <div className="atlas-brand">
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid var(--atlas-gray-300)", background: "white" }}>
        <div className="px-5 py-3 border-b" style={{ background: "var(--atlas-gray-50)", borderColor: "var(--atlas-gray-300)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--atlas-gray-900)" }}>Signal Feed</h2>
        </div>
        <div className="px-5 py-10 text-center">
          <p className="text-sm" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>No signals this week.</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--atlas-gray-900)", opacity: 0.4 }}>Run a sync to pull the latest PRs and events.</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="atlas-brand space-y-8">
      {/* Hero */}
      <AtomHero
        pill="ATLAS HXM · SIGNAL FEED"
        headline={`${totalPRs} engineering signals this week.`}
        subline="Merged PRs translated to product impact — sorted by urgency, P1 first."
        stats={
          <div className="space-y-2 min-w-[140px]">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--atlas-blue-250)" }}>
              Urgency Mix
            </p>
            {p1s.length > 0 && (
              <p className="text-sm text-white"><span className="font-semibold">{p1s.length}</span> P1 — act now</p>
            )}
            {p2s.length > 0 && (
              <p className="text-sm text-white"><span className="font-semibold">{p2s.length}</span> P2 — next sprint</p>
            )}
            {p3s.length > 0 && (
              <p className="text-sm" style={{ color: "var(--atlas-blue-250)" }}><span className="font-semibold">{p3s.length}</span> P3 — monitor</p>
            )}
          </div>
        }
      />

      {/* Chart cards row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Urgency mix donut */}
        <div className="rounded-2xl px-5 py-5 shadow-sm" style={{ background: "white", border: "1px solid var(--atlas-gray-300)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}>
            Signal Urgency Mix
          </p>
          <h3 className="text-base font-semibold mt-0.5 mb-4" style={{ color: "var(--atlas-gray-900)" }}>
            Where attention is needed
          </h3>
          <PieChart
            data={[
              { label: "P1 — act now", value: p1s.length, color: "#FF595A" },
              { label: "P2 — next sprint", value: p2s.length, color: "#FF782C" },
              { label: "P3 — monitor", value: p3s.length, color: "#E9E9E9" },
            ].filter(d => d.value > 0)}
            title="Signal urgency distribution"
            size={180}
          />
        </div>

        {/* Pod activity bar chart */}
        <div className="rounded-2xl px-5 py-5 shadow-sm" style={{ background: "white", border: "1px solid var(--atlas-gray-300)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}>
            Signal Volume · By Pod
          </p>
          <h3 className="text-base font-semibold mt-0.5 mb-4" style={{ color: "var(--atlas-gray-900)" }}>
            Which pods are shipping most
          </h3>
          <BarChart
            data={(() => {
              const podCounts: Record<string, number> = {}
              prs.forEach(pr => { podCounts[pr.team] = (podCounts[pr.team] ?? 0) + 1 })
              return Object.entries(podCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([label, value], i) => ({
                  label,
                  value,
                  color: ["#0559FA","#5827E3","#BA33CA","#FF782C","#FF595A","#82ACFC","#AB93F1","#DD98E5"][i % 8],
                }))
            })()}
          />
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="P1 Signals" value={p1s.length} accent="var(--atlas-coral-500)" caption="Act within 48h" dark={p1s.length > 0} />
        <StatTile label="P2 Signals" value={p2s.length} accent="var(--atlas-orangellow-500)" caption="Next sprint" />
        <StatTile label="Regressions" value={regressions.length} accent="var(--atlas-magenta-500)" caption="Events down >20% WoW" />
        <StatTile label="Shipped Blind" value={gaps.length} accent="var(--atlas-purple-500)" caption="PRs with no tracking" />
      </div>

      {/* Stale P1 warning */}
      {p1Stale.length > 0 && (
        <div
          className="rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm"
          style={{ border: "1px solid var(--atlas-coral-100)", background: "var(--atlas-coral-100)" }}
        >
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "var(--atlas-coral-500)" }} />
          <p className="text-sm font-medium" style={{ color: "#7A1818" }}>
            {p1Stale.length} P1 signal{p1Stale.length > 1 ? "s have" : " has"} been open for 2+ days without action.
            P1s require response within 48h.
          </p>
        </div>
      )}

      {/* Regression Alerts */}
      {regressions.length > 0 && (
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid var(--atlas-coral-100)", background: "var(--atlas-coral-100)" }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,89,90,0.2)" }}>
            <span className="font-semibold text-sm" style={{ color: "#7A1818" }}>Regression Alerts</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(255,89,90,0.15)", color: "#7A1818", border: "1px solid rgba(255,89,90,0.3)" }}
            >
              {regressions.length} events down &gt;20% WoW
            </span>
          </div>
          <div>
            {regressions.map((r) => (
              <div
                key={r.event}
                className="px-5 py-3 flex items-center justify-between"
                style={{ borderTop: "1px solid rgba(255,89,90,0.12)" }}
              >
                <div>
                  <code className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(255,89,90,0.15)", color: "#7A1818" }}>
                    {r.event}
                  </code>
                  <p className="text-xs mt-1" style={{ color: "#7A1818", opacity: 0.8 }}>
                    {r.pod} · dropped {r.dropPct}% — {r.lastWeek.toLocaleString()} → {r.thisWeek.toLocaleString()}
                  </p>
                </div>
                <span className="text-sm font-bold" style={{ color: "#7A1818" }}>−{r.dropPct}%</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-2 border-t" style={{ borderColor: "rgba(255,89,90,0.15)" }}>
            <p className="text-xs" style={{ color: "#7A1818", opacity: 0.75 }}>No shipped PR explains these drops. Investigate broken flows or data pipeline issues.</p>
          </div>
        </div>
      )}

      {/* Instrumentation Gaps */}
      {gaps.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--atlas-orangellow-100)" }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ background: "var(--atlas-orangellow-100)", borderColor: "rgba(255,120,44,0.2)" }}>
            <span className="font-semibold text-sm" style={{ color: "#5A3A0B" }}>Shipped Blind</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(255,120,44,0.15)", color: "#5A3A0B", border: "1px solid rgba(255,120,44,0.3)" }}
            >
              {gaps.length} PRs with no PostHog tracking
            </span>
          </div>
          <div style={{ background: "white" }}>
            {gaps.map((g) => (
              <div
                key={`${g.repo}-${g.prNumber}`}
                className="px-5 py-3 flex items-start gap-3"
                style={{ borderTop: "1px solid var(--atlas-orangellow-100)" }}
              >
                <span className="text-lg shrink-0" style={{ color: "var(--atlas-orangellow-500)" }}>◎</span>
                <div>
                  <a href={`/pr/${g.repo}/${g.prNumber}`} className="text-sm font-medium hover:underline" style={{ color: "#5A3A0B" }}>
                    {g.prTitle}
                  </a>
                  <p className="text-xs mt-0.5" style={{ color: "#5A3A0B", opacity: 0.7 }}>{g.team} · {g.newCapability}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-2 border-t" style={{ borderColor: "var(--atlas-orangellow-100)" }}>
            <p className="text-xs" style={{ color: "#5A3A0B", opacity: 0.75 }}>These features shipped with no user behavior tracking. You cannot measure adoption or detect failures.</p>
          </div>
        </div>
      )}

      {/* All clear */}
      {p1s.length === 0 && regressions.length === 0 && (
        <div
          className="rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm"
          style={{ border: "1px solid var(--atlas-blue-100)", background: "var(--atlas-blue-100)" }}
        >
          <span className="text-xl shrink-0" style={{ color: "var(--atlas-blue-500)" }}>✓</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--atlas-blue-900)" }}>No P1 signals this week</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--atlas-blue-900)", opacity: 0.7 }}>No regressions or critical issues detected. All clear.</p>
          </div>
        </div>
      )}

      {/* Signal sections: P1, P2, P3 */}
      {(["P1", "P2", "P3"] as const).map((tier) => {
        const tierPRs = tier === "P1" ? p1s : tier === "P2" ? p2s : p3s
        if (tierPRs.length === 0) return null
        const s = URGENCY_SECTION[tier]
        return (
          <div key={tier} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${s.border}` }}>
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ background: s.headerBg, borderColor: s.border }}>
              <div className="flex items-center gap-2">
                <span
                  className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{ background: URGENCY_BADGE[tier].bg, color: URGENCY_BADGE[tier].fg }}
                >
                  {s.label}
                </span>
                <span className="text-sm font-semibold" style={{ color: s.headerText }}>{s.sublabel}</span>
              </div>
              <span className="text-xs" style={{ color: s.headerText, opacity: 0.7 }}>
                {tierPRs.length} signal{tierPRs.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="p-4 space-y-3" style={{ background: "white" }}>
              {tierPRs.map(pr => <PRCard key={`${pr.repo}-${pr.number}`} pr={pr} />)}
            </div>
          </div>
        )
      })}

      {/* PostHog Event Boards */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.65 }}>
          PostHog Event Boards · 7d by Pod
        </h2>
        <div className="space-y-4">
          {Object.entries(POD_EVENTS).map(([pod, podEvents]) => {
            const podRegressions = regressions.filter(r => r.pod === pod)
            const podHyps = hypotheses.filter(h => h.pod === pod && h.status === "active")
            if (podEvents.length === 0 && podHyps.length === 0) return null
            return (
              <div key={pod} className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--atlas-gray-300)", background: "white" }}>
                <div className="px-5 py-3 border-b flex items-center justify-between" style={{ background: "var(--atlas-gray-50)", borderColor: "var(--atlas-gray-300)" }}>
                  <span className="text-sm font-semibold" style={{ color: "var(--atlas-gray-900)" }}>{pod}</span>
                  {podRegressions.length > 0 && (
                    <span className="text-xs font-medium" style={{ color: "var(--atlas-coral-500)" }}>
                      {podRegressions.length} regression{podRegressions.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  {podEvents.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {podEvents.map((ev) => {
                        const data = eventMap[ev]
                        const isRegression = podRegressions.some(r => r.event === ev)
                        return (
                          <div
                            key={ev}
                            className="rounded-xl border px-3 py-2"
                            style={{
                              borderColor: isRegression ? "var(--atlas-coral-100)" : "var(--atlas-gray-300)",
                              background: isRegression ? "var(--atlas-coral-100)" : "var(--atlas-gray-50)",
                            }}
                          >
                            <p className="font-mono text-xs truncate" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>{ev}</p>
                            {data ? (
                              <div className="flex items-end gap-2 mt-1">
                                <span
                                  className="text-lg font-semibold tabular-nums"
                                  style={{ color: isRegression ? "var(--atlas-coral-500)" : "var(--atlas-gray-900)" }}
                                >
                                  {data.thisWeek.toLocaleString()}
                                </span>
                                <span className={`text-xs font-medium mb-0.5 ${wowColor(data.thisWeek, data.lastWeek, !ev.includes("failed"))}`}>
                                  {wowTrend(data.thisWeek, data.lastWeek)}
                                </span>
                              </div>
                            ) : (
                              <p className="text-xs mt-1" style={{ color: "var(--atlas-gray-900)", opacity: 0.4 }}>No events this week</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {podHyps.length > 0 && (
                    <div className="space-y-2">
                      {podHyps.map(h => (
                        <div
                          key={h.id}
                          className="rounded-xl border px-3 py-2"
                          style={{ borderColor: "var(--atlas-blue-100)", background: "rgba(218,230,254,0.35)" }}
                        >
                          <p className="font-medium text-xs" style={{ color: "var(--atlas-blue-900)" }}>{h.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--atlas-blue-900)", opacity: 0.65 }}>{h.evidence}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
