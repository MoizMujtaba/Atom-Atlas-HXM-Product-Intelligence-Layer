import { getExecMetrics, getWeeklyEvents, getMergedPRs, getLinearCycles, getCompetitorIntel } from "@/lib/atom-data"
import { wowTrend, wowColor } from "@/lib/utils"

export const dynamic = "force-static"

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
      <div className={`h-full rounded ${color}`} style={{ width: `${Math.max(pct, 2)}%` }} />
    </div>
  )
}

function MiniEventBar({ thisWeek, lastWeek, negative }: { thisWeek: number; lastWeek: number; negative: boolean }) {
  const max = Math.max(thisWeek, lastWeek, 1)
  const prevH = Math.round((lastWeek / max) * 32)
  const thisH = Math.round((thisWeek / max) * 32)
  const up = thisWeek >= lastWeek
  const good = negative ? !up : up
  return (
    <div className="flex items-end gap-0.5 h-8 shrink-0">
      <div className="w-2.5 bg-gray-200 rounded-sm" style={{ height: `${prevH}px` }} />
      <div className={`w-2.5 rounded-sm ${good ? "bg-green-400" : "bg-red-400"}`} style={{ height: `${thisH}px` }} />
    </div>
  )
}

export default async function ExecPage() {
  const metrics = getExecMetrics()
  const events = getWeeklyEvents()
  const prs = getMergedPRs()
  const cycles = getLinearCycles()
  const compete = getCompetitorIntel()

  // ── Roadmap fidelity per pod ──────────────────────────────────────────────
  const podFidelity = (cycles?.pods ?? []).map(pod => {
    const ki = pod.keyInProgress ?? []
    const total = ki.length
    const onRoadmap = ki.filter(i => i.hasRoadmapLabel === true).length
    const pct = total > 0 ? Math.round((onRoadmap / total) * 100) : 0
    return { pod: pod.pod, pct, onRoadmap, total, slipRisk: pod.slipRisk, completionPct: pod.completionPct, cycleEnds: pod.cycleEnds }
  }).filter(p => p.total > 0).sort((a, b) => b.pct - a.pct)

  const overallFidelity = cycles
    ? Math.round(((cycles.plannedVsShipped.totalInProgress ?? 0) - (cycles.plannedVsShipped.offRoadmapInProgress ?? 0)) / Math.max(cycles.plannedVsShipped.totalInProgress ?? 1, 1) * 100)
    : null

  // ── Work origin breakdown ─────────────────────────────────────────────────
  const allIssues = (cycles?.pods ?? []).flatMap(p => p.keyInProgress ?? [])
  const originCounts = {
    "pm-scoped": allIssues.filter(i => i.origin === "pm-scoped").length,
    "pm-escalated": allIssues.filter(i => i.origin === "pm-escalated").length,
    "engineering-initiated": allIssues.filter(i => i.origin === "engineering-initiated").length,
    "engineering-sub-task": allIssues.filter(i => i.origin === "engineering-sub-task").length,
  }
  const totalOrigin = allIssues.length

  // ── P1 signals ────────────────────────────────────────────────────────────
  const p1Signals = [
    ...(cycles?.pods ?? []).flatMap(p => (p.signals ?? []).filter(s => s.urgency === "P1").map(s => ({ ...s, pod: p.pod }))),
    ...(cycles?.crossPodSignals ?? []).filter(s => s.urgency === "P1").map(s => ({ ...s, pod: s.affectedPods.join(", ") })),
  ]

  // ── Top events ────────────────────────────────────────────────────────────
  const topEvents = events.slice(0, 6)

  // ── Latest competitor move ────────────────────────────────────────────────
  const latestMove = compete?.competitors
    .flatMap(c => c.recentMoves.map(m => ({ ...m, competitor: c.name })))
    .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null

  // ── Overall status ────────────────────────────────────────────────────────
  const hasHighSlip = podFidelity.some(p => p.slipRisk === "high")
  const status = p1Signals.length >= 3 || hasHighSlip ? "red" : p1Signals.length >= 1 || (overallFidelity ?? 100) < 70 ? "amber" : "green"
  const statusLabel = status === "red" ? "Needs Attention" : status === "amber" ? "Watch" : "On Track"
  const statusStyle = status === "red" ? "bg-red-600" : status === "amber" ? "bg-amber-500" : "bg-green-500"

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Executive View</h1>
          <p className="text-gray-500 text-sm mt-1">
            {metrics?.period ?? "Current cycle"} · Atlas HXM · 2,600+ WSEs
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-sm font-semibold ${statusStyle}`}>
          <span className="w-2 h-2 rounded-full bg-white opacity-80" />
          {statusLabel}
        </div>
      </div>

      {/* Headline KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Roadmap Fidelity",
            value: overallFidelity != null ? `${overallFidelity}%` : "—",
            sub: "of active work on 2026 roadmap",
            alert: (overallFidelity ?? 100) < 60,
            good: (overallFidelity ?? 0) >= 75,
          },
          {
            label: "P1 Signals Open",
            value: p1Signals.length,
            sub: "require action within 48h",
            alert: p1Signals.length > 0,
            good: p1Signals.length === 0,
          },
          {
            label: "Cycle Slip Risk",
            value: podFidelity.filter(p => p.slipRisk === "high").length > 0
              ? `${podFidelity.filter(p => p.slipRisk === "high").length} pod${podFidelity.filter(p => p.slipRisk === "high").length > 1 ? "s" : ""}`
              : podFidelity.filter(p => p.slipRisk === "medium").length > 0 ? "Medium" : "Low",
            sub: podFidelity.filter(p => p.slipRisk === "high").map(p => p.pod).join(", ") || "All pods on track",
            alert: hasHighSlip,
            good: !hasHighSlip && podFidelity.every(p => p.slipRisk === "low"),
          },
          {
            label: "SSO Success Rate",
            value: metrics ? `${metrics.ssoSuccessRate}%` : "—",
            sub: metrics ? `${wowTrend(metrics.ssoSuccessRate, metrics.ssoSuccessRatePrev)} WoW · target 97%+` : "target 97%+",
            alert: !!metrics && metrics.ssoSuccessRate < 95,
            good: !!metrics && metrics.ssoSuccessRate >= 97,
          },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-4 bg-white ${k.alert ? "border-red-200 bg-red-50" : k.good ? "border-green-200" : "border-gray-200"}`}>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{k.label}</p>
            <p className={`text-3xl font-bold tabular-nums ${k.alert ? "text-red-700" : k.good ? "text-green-700" : "text-gray-900"}`}>{k.value}</p>
            <p className="text-xs text-gray-400 mt-1 leading-snug">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Roadmap Fidelity by Pod */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Roadmap Fidelity by Pod</h2>
            <p className="text-xs text-gray-400 mt-0.5">Share of in-progress tickets with RoadMap2026 label</p>
          </div>
          {podFidelity.length === 0 && <p className="text-sm text-gray-400">No cycle data</p>}
          <div className="space-y-3">
            {podFidelity.map(p => {
              const barColor = p.pct >= 75 ? "bg-green-500" : p.pct >= 50 ? "bg-amber-400" : "bg-red-400"
              const textColor = p.pct >= 75 ? "text-green-700" : p.pct >= 50 ? "text-amber-700" : "text-red-600"
              return (
                <div key={p.pod} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 font-medium w-24 shrink-0">{p.pod}</span>
                    <div className="flex-1 mx-3">
                      <Bar pct={p.pct} color={barColor} />
                    </div>
                    <span className={`font-bold w-10 text-right tabular-nums ${textColor}`}>{p.pct}%</span>
                    <span className="text-gray-400 w-16 text-right text-xs">{p.onRoadmap}/{p.total} items</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 pt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500 inline-block" />≥75%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" />50–74%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400 inline-block" />&lt;50%</span>
          </div>
        </div>

        {/* Work Origin Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Work Origin</h2>
            <p className="text-xs text-gray-400 mt-0.5">What initiated each in-progress ticket</p>
          </div>
          {totalOrigin === 0 && <p className="text-sm text-gray-400">No data</p>}
          {totalOrigin > 0 && (
            <>
              {/* Stacked bar */}
              <div className="flex h-8 rounded overflow-hidden gap-px">
                {originCounts["pm-scoped"] > 0 && (
                  <div className="bg-green-500 flex items-center justify-center text-white text-xs font-bold" style={{ width: `${(originCounts["pm-scoped"] / totalOrigin) * 100}%` }}>
                    {originCounts["pm-scoped"]}
                  </div>
                )}
                {originCounts["pm-escalated"] > 0 && (
                  <div className="bg-blue-400 flex items-center justify-center text-white text-xs font-bold" style={{ width: `${(originCounts["pm-escalated"] / totalOrigin) * 100}%` }}>
                    {originCounts["pm-escalated"]}
                  </div>
                )}
                {originCounts["engineering-initiated"] > 0 && (
                  <div className="bg-amber-400 flex items-center justify-center text-white text-xs font-bold" style={{ width: `${(originCounts["engineering-initiated"] / totalOrigin) * 100}%` }}>
                    {originCounts["engineering-initiated"]}
                  </div>
                )}
                {originCounts["engineering-sub-task"] > 0 && (
                  <div className="bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-bold" style={{ width: `${(originCounts["engineering-sub-task"] / totalOrigin) * 100}%` }}>
                    {originCounts["engineering-sub-task"]}
                  </div>
                )}
              </div>
              {/* Legend */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "PM-scoped", count: originCounts["pm-scoped"], color: "bg-green-500", sub: "requirements written by product" },
                  { label: "PM-escalated", count: originCounts["pm-escalated"], color: "bg-blue-400", sub: "product created from support/customer" },
                  { label: "Eng-initiated", count: originCounts["engineering-initiated"], color: "bg-amber-400", sub: "engineer self-created, no PM spec" },
                  { label: "Eng sub-task", count: originCounts["engineering-sub-task"], color: "bg-gray-300", sub: "technical breakdown of PM ticket" },
                ].map(o => (
                  <div key={o.label} className="flex items-start gap-2">
                    <span className={`w-2.5 h-2.5 rounded-sm shrink-0 mt-0.5 ${o.color}`} />
                    <div>
                      <p className="text-xs font-medium text-gray-700">{o.label} <span className="text-gray-900 font-bold">{o.count}</span></p>
                      <p className="text-xs text-gray-400 leading-snug">{o.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cycle Health */}
      {cycles && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Cycle Health</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {cycles.pods.map(pod => {
              const daysLeft = Math.ceil((new Date(pod.cycleEnds).getTime() - Date.now()) / 86400000)
              const slipStyle = pod.slipRisk === "high" ? "border-red-200 bg-red-50" : pod.slipRisk === "medium" ? "border-amber-200 bg-amber-50" : "border-gray-200"
              const pctColor = pod.completionPct >= 70 ? "text-green-700" : pod.completionPct >= 40 ? "text-amber-700" : "text-red-700"
              const barColor = pod.completionPct >= 70 ? "bg-green-500" : pod.completionPct >= 40 ? "bg-amber-400" : "bg-red-400"
              const p1Count = (pod.signals ?? []).filter(s => s.urgency === "P1").length
              return (
                <div key={pod.pod} className={`rounded-lg border p-3 space-y-2 ${slipStyle}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-800">{pod.pod}</span>
                    <div className="flex items-center gap-1.5">
                      {p1Count > 0 && <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">{p1Count} P1</span>}
                      <span className={`text-xs font-medium ${daysLeft <= 1 ? "text-red-600" : daysLeft <= 3 ? "text-amber-600" : "text-gray-400"}`}>
                        {daysLeft < 0 ? "ended" : daysLeft === 0 ? "today" : `${daysLeft}d`}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={`font-bold ${pctColor}`}>{pod.completionPct}%</span>
                      <span className="text-gray-400">Cycle {pod.cycleNumber}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pod.completionPct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* P1 Signals */}
      {p1Signals.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-red-900">P1 Signals — Action Required Within 48h</h2>
          <div className="space-y-2">
            {p1Signals.map((s, i) => (
              <div key={i} className="rounded-lg border border-red-200 bg-white px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-bold shrink-0 mt-0.5">P1</span>
                  <div>
                    <p className="text-sm font-semibold text-red-900">{s.title}</p>
                    <p className="text-xs text-red-700 mt-0.5">{s.detail}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.pod}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Business Health */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Platform Health — 7d</h2>
          <div className="space-y-3">
            {[
              {
                label: "SSO Success Rate",
                value: metrics ? `${metrics.ssoSuccessRate}%` : "—",
                prev: metrics?.ssoSuccessRatePrev,
                curr: metrics?.ssoSuccessRate,
                negative: false,
                target: "target 97%+",
                alert: !!metrics && metrics.ssoSuccessRate < 95,
              },
              {
                label: "Exceptions",
                value: metrics ? metrics.exceptions.toLocaleString() : "—",
                prev: metrics?.exceptionsPrev,
                curr: metrics?.exceptions,
                negative: true,
                target: "lower is better",
              },
              {
                label: "Rage Clicks",
                value: metrics ? metrics.rageclicks.toLocaleString() : "—",
                prev: metrics?.rageclicksPrev,
                curr: metrics?.rageclicks,
                negative: true,
                target: "friction proxy",
              },
              {
                label: "Page Views",
                value: metrics ? metrics.pageviews.toLocaleString() : "—",
                prev: metrics?.pageviewsPrev,
                curr: metrics?.pageviews,
                negative: false,
                target: "engagement signal",
              },
            ].map(m => {
              const trend = m.curr != null && m.prev != null ? wowTrend(m.curr, m.prev) : null
              const tColor = m.curr != null && m.prev != null ? wowColor(m.curr, m.prev, !m.negative) : "text-gray-400"
              return (
                <div key={m.label} className={`flex items-center justify-between rounded-lg px-3 py-2.5 border ${m.alert ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                  <div>
                    <p className="text-xs text-gray-500">{m.label}</p>
                    <p className={`text-lg font-bold tabular-nums ${m.alert ? "text-red-700" : "text-gray-900"}`}>{m.value}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {m.curr != null && m.prev != null && (
                      <MiniEventBar thisWeek={m.curr} lastWeek={m.prev} negative={m.negative} />
                    )}
                    <div className="text-right">
                      {trend && <p className={`text-sm font-semibold ${tColor}`}>{trend}</p>}
                      <p className="text-xs text-gray-400">{m.target}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* PostHog Event Volume */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Key Event Volume — 7d</h2>
          {topEvents.length === 0 ? (
            <p className="text-sm text-gray-400">No event data</p>
          ) : (
            <div className="space-y-2">
              {topEvents.map(e => {
                const isNeg = e.event.includes("failed") || e.event.includes("exception") || e.event.includes("rage")
                const trend = wowTrend(e.thisWeek, e.lastWeek)
                const tColor = wowColor(e.thisWeek, e.lastWeek, !isNeg)
                const max = Math.max(e.thisWeek, e.lastWeek, 1)
                const barPct = Math.round((e.thisWeek / max) * 100)
                const prevPct = Math.round((e.lastWeek / max) * 100)
                const barColor = isNeg
                  ? (e.thisWeek < e.lastWeek ? "bg-green-400" : "bg-red-400")
                  : (e.thisWeek >= e.lastWeek ? "bg-blue-400" : "bg-amber-400")
                return (
                  <div key={e.event} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-gray-600 truncate max-w-[180px]">{e.event}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`font-semibold ${tColor}`}>{trend}</span>
                        <span className="text-gray-500 tabular-nums">{e.thisWeek.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="relative h-1.5 w-full rounded overflow-hidden bg-gray-100">
                      <div className="absolute inset-y-0 left-0 bg-gray-300 rounded" style={{ width: `${prevPct}%` }} />
                      <div className={`absolute inset-y-0 left-0 rounded ${barColor} opacity-90`} style={{ width: `${barPct}%` }} />
                    </div>
                  </div>
                )
              })}
              <p className="text-xs text-gray-400 pt-1">Gray = last week · color = this week</p>
            </div>
          )}
        </div>
      </div>

      {/* Competitive Pulse */}
      {latestMove && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900">Competitive Pulse</h2>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Latest move</span>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-blue-900 uppercase tracking-wide">{latestMove.competitor} · {new Date(latestMove.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                <p className="text-sm font-semibold text-blue-900 mt-0.5">{latestMove.title}</p>
                <p className="text-xs text-blue-700 mt-1 leading-snug">{latestMove.detail}</p>
              </div>
            </div>
            <div className="rounded bg-blue-100 border border-blue-200 px-3 py-2">
              <p className="text-xs font-semibold text-blue-900">Atlas implication</p>
              <p className="text-xs text-blue-800 mt-0.5 leading-snug">{latestMove.atlasImplication}</p>
            </div>
          </div>
          <a href="/compete" className="text-xs text-blue-600 hover:underline">View full competitive intel →</a>
        </div>
      )}

      {/* Shipped This Week */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Shipped This Week</h2>
        {prs.length === 0 ? (
          <p className="text-sm text-gray-400">No PRs found</p>
        ) : (
          <div className="space-y-2">
            {prs.slice(0, 12).map(pr => {
              const tier = pr.translation?.urgencyTier
              const tierStyle = tier === "P1" ? "bg-red-600 text-white" : tier === "P2" ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600"
              const risk = pr.translation?.productionRisk
              return (
                <div key={`${pr.repo}-${pr.number}`} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 hover:bg-white transition-colors">
                  <div className="flex gap-1.5 shrink-0 mt-0.5">
                    {tier && <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${tierStyle}`}>{tier}</span>}
                    {risk === "high" && <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-red-100 text-red-700 border border-red-200">high risk</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <a href={`/pr/${pr.repo}/${pr.number}`} className="text-sm text-blue-600 hover:underline font-medium leading-snug line-clamp-1">
                      {pr.title}
                    </a>
                    <p className="text-xs text-gray-400 mt-0.5">{pr.team} · {pr.repo} · {new Date(pr.mergedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
