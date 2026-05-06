import { getMergedPRs, getWeeklyEvents, getRegressions, getBrief, getLastRefreshed } from "@/lib/atom-data"
import { generateWeeklyBrief } from "@/lib/claude"

export const dynamic = "force-dynamic"

const SIGNAL_LIGHT: Record<string, { bg: string; text: string; subtext: string; dot: string }> = {
  green: { bg: "bg-green-50 border-green-200", text: "text-green-800", subtext: "text-green-700", dot: "bg-green-500" },
  amber: { bg: "bg-amber-50 border-amber-200", text: "text-amber-800", subtext: "text-amber-700", dot: "bg-amber-400" },
  red: { bg: "bg-red-50 border-red-200", text: "text-red-800", subtext: "text-red-700", dot: "bg-red-500" },
}

const OUTCOME_BADGE: Record<string, string> = {
  retention: "bg-blue-100 text-blue-700",
  revenue: "bg-green-100 text-green-700",
  efficiency: "bg-cyan-100 text-cyan-700",
  risk: "bg-red-100 text-red-700",
  migration: "bg-violet-100 text-violet-700",
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
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Weekly Brief</h2>
      </div>
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-gray-500">Brief unavailable — run a sync to generate.</p>
        <p className="text-xs text-gray-400 mt-1">Click the Sync button in the top nav to pull fresh data.</p>
      </div>
    </div>
  )

  const lastRefreshed = getLastRefreshed()
  const briefDate = brief.generatedAt
    ? new Date(brief.generatedAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })

  const signal = SIGNAL_LIGHT[brief.weekSignal || "amber"]

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-gray-900 text-white px-2 py-0.5 rounded">ATOM</span>
            <span className="text-xs text-gray-500">Weekly Brief · {briefDate}</span>
          </div>
          <div className="text-right">
            {lastRefreshed && (
              <p className="text-xs text-gray-500">
                Data as of {new Date(lastRefreshed).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            {source === "live" && (
              <p className="text-xs text-amber-600 mt-0.5">Generated live — click Sync to cache</p>
            )}
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight mt-2">{brief.headline}</h1>
        <p className="text-gray-600 mt-3 text-base leading-relaxed">{brief.summary}</p>
      </div>

      <div className={`rounded-xl border p-4 flex items-start gap-4 shadow-sm ${signal.bg}`}>
        <div className={`w-4 h-4 rounded-full shrink-0 mt-0.5 ${signal.dot}`} />
        <div>
          <p className={`text-sm font-semibold ${signal.text}`}>{brief.execSignal}</p>
          {brief.weekSignalReason && (
            <p className={`text-xs mt-1 ${signal.subtext}`}>{brief.weekSignalReason}</p>
          )}
        </div>
      </div>

      {brief.p1Actions?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Act This Week</h2>
          <div className="rounded-xl border border-gray-900 bg-gray-900 overflow-hidden">
            {brief.p1Actions.map((action: string, i: number) => (
              <div key={i} className={`px-4 py-3 flex gap-3 items-start ${i > 0 ? "border-t border-gray-700" : ""}`}>
                <span className="text-xs font-bold text-red-400 shrink-0 mt-0.5">P1</span>
                <p className="text-sm text-white">{action}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {brief.regressions?.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-red-200 flex items-center gap-2">
            <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-bold">Regressions</span>
            <span className="text-xs bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded font-medium">
              {brief.regressions.length} event{brief.regressions.length > 1 ? "s" : ""} down
            </span>
          </div>
          <div className="divide-y divide-red-100">
            {brief.regressions.map((r: { event: string; drop: number; hypothesis: string }, i: number) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4 mb-1.5">
                  <code className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-mono">{r.event}</code>
                  <span className="text-sm font-bold text-red-700 shrink-0">−{r.drop}%</span>
                </div>
                <p className="text-sm text-red-700">{r.hypothesis}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {brief.topRisks?.length > 0 && (
        <div className="rounded-xl border border-amber-200 overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
            <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded font-bold">Risks</span>
            <span className="text-sm font-semibold text-amber-900">Production Risks</span>
          </div>
          <div className="divide-y divide-amber-100 bg-white">
            {brief.topRisks.map((r: { title: string; reason: string; recommendedAction?: string }, i: number) => (
              <div key={i} className="px-5 py-4 space-y-1">
                <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                <p className="text-sm text-gray-600">{r.reason}</p>
                {r.recommendedAction && (
                  <p className="text-xs font-medium text-amber-900 mt-1.5">
                    <span className="text-amber-500 mr-1">→</span>{r.recommendedAction}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {brief.instrumentationGaps?.length > 0 && (
        <div className="rounded-xl border border-amber-200 overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
            <span className="text-amber-700 font-semibold text-sm">Shipped Blind</span>
            <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-medium">
              {brief.instrumentationGaps.length} gap{brief.instrumentationGaps.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="divide-y divide-amber-100 bg-amber-50">
            {brief.instrumentationGaps.map((gap: string, i: number) => (
              <div key={i} className="px-5 py-3 text-sm text-amber-800 flex gap-2 items-start">
                <span className="text-amber-400 shrink-0 mt-0.5">◎</span>
                <span>{gap}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {brief.opportunities?.length > 0 && (
        <div className="rounded-xl border border-blue-200 overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-200 flex items-center gap-2">
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-bold">Opportunities</span>
            <span className="text-sm font-semibold text-blue-900">Product Opportunities</span>
          </div>
          <div className="divide-y divide-blue-100 bg-white">
            {brief.opportunities.map((o: { idea: string; outcomeType?: string; fromPR: string; estimatedEffort?: string }, i: number) => (
              <div key={i} className="px-5 py-4 space-y-1">
                <div className="flex items-start gap-2">
                  {o.outcomeType && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${OUTCOME_BADGE[o.outcomeType] || "bg-gray-100 text-gray-600"}`}>
                      {o.outcomeType}
                    </span>
                  )}
                  <p className="text-sm font-medium text-gray-900">{o.idea}</p>
                </div>
                {o.estimatedEffort && <p className="text-xs text-blue-600">{o.estimatedEffort}</p>}
                <p className="text-xs text-gray-500">Surfaced by: {o.fromPR}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 border-t border-gray-100 pt-4 flex items-center justify-between">
        <span>Atom · {source === "cached" ? "pre-generated by daily refresh" : "live generation"}</span>
        {lastRefreshed && (
          <span>Last sync: {new Date(lastRefreshed).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        )}
      </div>
    </div>
  )
}
