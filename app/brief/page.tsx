import { getMergedPRs, getWeeklyEvents, getRegressions, getBrief, getLastRefreshed } from "@/lib/atom-data"
import { generateWeeklyBrief } from "@/lib/claude"
import AtomHero from "@/components/atom-hero"
import StatTile from "@/components/stat-tile"

export const dynamic = "force-dynamic"

const SIGNAL_ACCENT: Record<string, string> = {
  green: "var(--atlas-blue-500)",
  amber: "var(--atlas-orangellow-500)",
  red: "var(--atlas-coral-500)",
}

const OUTCOME_BADGE: Record<string, { bg: string; fg: string }> = {
  retention: { bg: "var(--atlas-blue-100)", fg: "var(--atlas-blue-900)" },
  revenue: { bg: "var(--atlas-blue-100)", fg: "var(--atlas-blue-500)" },
  efficiency: { bg: "var(--atlas-purple-100)", fg: "var(--atlas-purple-900)" },
  risk: { bg: "var(--atlas-coral-100)", fg: "#7A1818" },
  migration: { bg: "var(--atlas-magenta-100)", fg: "var(--atlas-magenta-900)" },
}

export default async function BriefPage() {
  let brief = getBrief()
  let source: "cached" | "live" = "cached"

  if (!brief) {
    source = "live"
    const prs = getMergedPRs()
    const events = getWeeklyEvents()
    const regressions = getRegressions(20)
    const generated = await generateWeeklyBrief(
      prs.map(p => ({ title: p.title, team: p.team, translation: p.translation as unknown as Record<string, unknown> })),
      events,
      regressions
    )
    brief = generated as unknown as typeof brief
  }

  if (!brief) return (
    <div className="atlas-brand">
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid var(--atlas-gray-300)", background: "white" }}>
        <div className="px-5 py-3 border-b" style={{ background: "var(--atlas-gray-50)", borderColor: "var(--atlas-gray-300)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--atlas-gray-900)" }}>Weekly Brief</h2>
        </div>
        <div className="px-5 py-10 text-center">
          <p className="text-sm" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>Brief unavailable — run a sync to generate.</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--atlas-gray-900)", opacity: 0.4 }}>Click the Sync button in the top nav to pull fresh data.</p>
        </div>
      </div>
    </div>
  )

  const lastRefreshed = getLastRefreshed()
  const briefDate = brief.generatedAt
    ? new Date(brief.generatedAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })

  const signalAccent = SIGNAL_ACCENT[brief.weekSignal || "amber"]

  return (
    <div className="atlas-brand space-y-8">
      {/* Hero */}
      <AtomHero
        pill="ATLAS HXM · WEEKLY BRIEF"
        date={briefDate}
        headline={brief.headline}
        subline={brief.summary}
        stats={
          <div className="space-y-2 min-w-[160px]">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--atlas-blue-250)" }}>
              At a Glance
            </p>
            <p className="text-sm text-white">
              <span className="font-semibold">{brief.p1Actions?.length ?? 0}</span> P1 actions
            </p>
            <p className="text-sm text-white">
              <span className="font-semibold">{brief.regressions?.length ?? 0}</span> regressions
            </p>
            <p className="text-sm" style={{ color: "var(--atlas-blue-250)" }}>
              <span className="font-semibold capitalize">{brief.weekSignal ?? "amber"}</span> signal
            </p>
            {source === "live" && (
              <p className="text-[11px] mt-1" style={{ color: "var(--atlas-orangellow-500)" }}>Generated live</p>
            )}
          </div>
        }
      />

      {/* Stat tiles */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Week Signal"
          value={(brief.weekSignal ?? "amber").toUpperCase()}
          accent={signalAccent}
          caption={brief.weekSignalReason}
        />
        <StatTile
          label="P1 Actions"
          value={brief.p1Actions?.length ?? 0}
          accent="var(--atlas-coral-500)"
          caption="Act this week"
        />
        <StatTile
          label="Regressions"
          value={brief.regressions?.length ?? 0}
          accent="var(--atlas-orangellow-500)"
          caption="Events down week-over-week"
        />
      </div>

      {/* Exec signal */}
      <div
        className="rounded-2xl px-5 py-4 shadow-sm"
        style={{ background: "white", border: "1px solid var(--atlas-gray-300)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold"
            style={{ background: signalAccent + "22", color: signalAccent }}
            aria-hidden
          >
            ✦
          </span>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: signalAccent }}>
            Exec Signal
          </p>
        </div>
        <p className="text-[15px] font-semibold leading-snug" style={{ color: "var(--atlas-gray-900)" }}>
          {brief.execSignal}
        </p>
        {brief.weekSignalReason && (
          <p className="text-[12.5px] mt-2 leading-relaxed" style={{ color: "var(--atlas-gray-900)", opacity: 0.7 }}>
            {brief.weekSignalReason}
          </p>
        )}
      </div>

      {/* P1 Actions */}
      {brief.p1Actions?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.65 }}>
            Act This Week
          </h2>
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: "var(--atlas-blue-900)" }}>
            {brief.p1Actions.map((action: string, i: number) => (
              <div
                key={i}
                className="px-4 py-3 flex gap-3 items-start"
                style={i > 0 ? { borderTop: "1px solid rgba(255,255,255,0.08)" } : {}}
              >
                <span className="text-xs font-bold shrink-0 mt-0.5" style={{ color: "var(--atlas-coral-500)" }}>P1</span>
                <p className="text-sm text-white">{action}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Regressions */}
      {brief.regressions?.length > 0 && (
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid var(--atlas-coral-100)", background: "var(--atlas-coral-100)" }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,89,90,0.2)" }}>
            <span
              className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
              style={{ background: "var(--atlas-coral-500)" }}
            >
              Regressions
            </span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: "white", color: "#7A1818", border: "1px solid var(--atlas-coral-100)" }}
            >
              {brief.regressions.length} event{brief.regressions.length > 1 ? "s" : ""} down
            </span>
          </div>
          <div>
            {brief.regressions.map((r: { event: string; drop: number; hypothesis: string }, i: number) => (
              <div
                key={i}
                className="px-5 py-4"
                style={i > 0 ? { borderTop: "1px solid rgba(255,89,90,0.15)" } : {}}
              >
                <div className="flex items-start justify-between gap-4 mb-1.5">
                  <code
                    className="text-xs px-1.5 py-0.5 rounded font-mono"
                    style={{ background: "rgba(255,89,90,0.15)", color: "#7A1818" }}
                  >
                    {r.event}
                  </code>
                  <span className="text-sm font-bold shrink-0" style={{ color: "#7A1818" }}>−{r.drop}%</span>
                </div>
                <p className="text-sm" style={{ color: "#7A1818", opacity: 0.85 }}>{r.hypothesis}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risks */}
      {brief.topRisks?.length > 0 && (
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid var(--atlas-orangellow-100)" }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ background: "var(--atlas-orangellow-100)", borderColor: "rgba(255,120,44,0.2)" }}>
            <span
              className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
              style={{ background: "var(--atlas-orangellow-500)" }}
            >
              Risks
            </span>
            <span className="text-sm font-semibold" style={{ color: "#5A3A0B" }}>Production Risks</span>
          </div>
          <div style={{ background: "white" }}>
            {brief.topRisks.map((r: { title: string; reason: string; recommendedAction?: string }, i: number) => (
              <div
                key={i}
                className="px-5 py-4 space-y-1"
                style={i > 0 ? { borderTop: "1px solid var(--atlas-orangellow-100)" } : {}}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--atlas-gray-900)" }}>{r.title}</p>
                <p className="text-sm" style={{ color: "var(--atlas-gray-900)", opacity: 0.7 }}>{r.reason}</p>
                {r.recommendedAction && (
                  <p className="text-xs font-medium mt-1.5" style={{ color: "#5A3A0B" }}>
                    <span className="mr-1" style={{ color: "var(--atlas-orangellow-500)" }}>→</span>
                    {r.recommendedAction}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipped Blind */}
      {brief.instrumentationGaps?.length > 0 && (
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid var(--atlas-orangellow-100)" }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ background: "var(--atlas-orangellow-100)", borderColor: "rgba(255,120,44,0.2)" }}>
            <span className="font-semibold text-sm" style={{ color: "#5A3A0B" }}>Shipped Blind</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(255,120,44,0.15)", color: "#5A3A0B", border: "1px solid rgba(255,120,44,0.25)" }}
            >
              {brief.instrumentationGaps.length} gap{brief.instrumentationGaps.length > 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ background: "var(--atlas-orangellow-100)" }}>
            {brief.instrumentationGaps.map((gap: string, i: number) => (
              <div
                key={i}
                className="px-5 py-3 text-sm flex gap-2 items-start"
                style={i > 0 ? { borderTop: "1px solid rgba(255,120,44,0.15)" } : {}}
              >
                <span className="shrink-0 mt-0.5" style={{ color: "var(--atlas-orangellow-500)" }}>◎</span>
                <span style={{ color: "#5A3A0B" }}>{gap}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opportunities */}
      {brief.opportunities?.length > 0 && (
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid var(--atlas-blue-100)" }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ background: "var(--atlas-blue-100)", borderColor: "var(--atlas-blue-250)" }}>
            <span
              className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
              style={{ background: "var(--atlas-blue-500)" }}
            >
              Opportunities
            </span>
            <span className="text-sm font-semibold" style={{ color: "var(--atlas-blue-900)" }}>Product Opportunities</span>
          </div>
          <div style={{ background: "white" }}>
            {brief.opportunities.map((o: { idea: string; outcomeType?: string; fromPR: string; estimatedEffort?: string }, i: number) => (
              <div
                key={i}
                className="px-5 py-4 space-y-1"
                style={i > 0 ? { borderTop: "1px solid var(--atlas-blue-100)" } : {}}
              >
                <div className="flex items-start gap-2">
                  {o.outcomeType && (() => {
                    const badge = OUTCOME_BADGE[o.outcomeType!] || { bg: "var(--atlas-gray-300)", fg: "var(--atlas-gray-900)" }
                    return (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-medium shrink-0"
                        style={{ background: badge.bg, color: badge.fg }}
                      >
                        {o.outcomeType}
                      </span>
                    )
                  })()}
                  <p className="text-sm font-medium" style={{ color: "var(--atlas-gray-900)" }}>{o.idea}</p>
                </div>
                {o.estimatedEffort && (
                  <p className="text-xs" style={{ color: "var(--atlas-blue-500)" }}>{o.estimatedEffort}</p>
                )}
                <p className="text-xs" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>Surfaced by: {o.fromPR}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer
        className="pt-6 mt-2 border-t flex items-center justify-between text-[11px]"
        style={{ borderColor: "var(--atlas-gray-300)", color: "var(--atlas-gray-900)", opacity: 0.55 }}
      >
        <span>Atom · {source === "cached" ? "pre-generated by daily refresh" : "live generation"}</span>
        {lastRefreshed && (
          <span>Last sync: {new Date(lastRefreshed).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        )}
      </footer>
    </div>
  )
}
