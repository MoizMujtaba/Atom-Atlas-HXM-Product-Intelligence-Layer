import { getMergedPRs, getWeeklyEvents, getRegressions, getBrief, getLastRefreshed } from "@/lib/atom-data"
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

  if (!brief) return <p className="text-gray-500 p-8">Brief unavailable — run a sync to generate.</p>

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
            <span className="text-xs text-gray-400">Weekly Brief · {briefDate}</span>
          </div>
          <div className="text-right">
            {lastRefreshed && (
              <p className="text-xs text-gray-400">
                Data as of {new Date(lastRefreshed).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            {source === "live" && (
              <p className="text-xs text-amber-600 mt-0.5">Generated live — click Sync to cache</p>
            )}
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 leading-snug">{brief.headline}</h1>
        <p className="text-gray-600 mt-3 text-base leading-relaxed">{brief.summary}</p>
      </div>

      <div className={`rounded-xl border p-4 flex items-start gap-4 ${signal.bg}`}>
        <div className={`w-4 h-4 rounded-full shrink-0 mt-0.5 ${signal.dot}`} />
        <div>
          <p className={`text-sm font-semibold ${signal.text}`}>{brief.execSignal}</p>
          {brief.weekSignalReason && (
            <p className={`text-xs mt-1 ${signal.text} opacity-75`}>{brief.weekSignalReason}</p>
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
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            Possible Regressions
          </h2>
          <div className="space-y-2">
            {brief.regressions.map((r: { event: string; drop: number; hypothesis: string }, i: number) => (
              <div key={i} className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-mono text-red-800">{r.event}</span>
                  <span className="text-sm font-semibold text-red-700">-{r.drop}%</span>
                </div>
                <p className="text-sm text-red-700">{r.hypothesis}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {brief.topRisks?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Production Risks
          </h2>
          <div className="space-y-2">
            {brief.topRisks.map((r: { title: string; reason: string; recommendedAction?: string }, i: number) => (
              <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 space-y-1">
                <p className="text-sm font-medium text-amber-800">{r.title}</p>
                <p className="text-sm text-amber-700">{r.reason}</p>
                {r.recommendedAction && (
                  <p className="text-xs font-medium text-amber-900 border-l-2 border-amber-400 pl-2 mt-1">
                    {r.recommendedAction}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {brief.instrumentationGaps?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
            Shipped Blind
          </h2>
          <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
            {brief.instrumentationGaps.map((gap: string, i: number) => (
              <div key={i} className="px-4 py-3 text-sm text-gray-700 flex gap-2 items-start">
                <span className="text-amber-400 shrink-0">o</span>
                <span>{gap}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {brief.opportunities?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            Product Opportunities
          </h2>
          <div className="space-y-2">
            {brief.opportunities.map((o: { idea: string; outcomeType?: string; fromPR: string; estimatedEffort?: string }, i: number) => (
              <div key={i} className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 space-y-1">
                <div className="flex items-start gap-2">
                  {o.outcomeType && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${OUTCOME_BADGE[o.outcomeType] || "bg-gray-100 text-gray-600"}`}>
                      {o.outcomeType}
                    </span>
                  )}
                  <p className="text-sm font-medium text-blue-900">{o.idea}</p>
                </div>
                {o.estimatedEffort && <p className="text-xs text-blue-600">{o.estimatedEffort}</p>}
                <p className="text-xs text-blue-500">Surfaced by: {o.fromPR}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="text-xs text-gray-400 border-t border-gray-100 pt-4 flex items-center justify-between">
        <span>Atom · {source === "cached" ? "pre-generated by daily refresh" : "live generation"}</span>
        {lastRefreshed && (
          <span>Last sync: {new Date(lastRefreshed).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        )}
      </div>
    </div>
  )
}
