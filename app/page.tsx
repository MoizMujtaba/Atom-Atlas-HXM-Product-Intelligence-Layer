import { getExecMetrics, getWeeklyEvents, getMergedPRs } from "@/lib/atom-data"
import MetricCard from "@/components/metric-card"
import { wowTrend, wowColor } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function ExecPage() {
  const metrics = getExecMetrics()
  const events = getWeeklyEvents()
  const prs = getMergedPRs()

  const podActivity = prs.reduce<Record<string, number>>((acc, pr) => {
    acc[pr.team] = (acc[pr.team] || 0) + 1
    return acc
  }, {})

  const topEvents = events.slice(0, 8)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Executive View</h1>
        <p className="text-gray-500 text-sm mt-1">Last 7 days · Atlas HXM · 2,600+ WSEs</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-gray-400">Business Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="SSO Success Rate"
            value={metrics ? `${metrics.ssoSuccessRate}%` : "—"}
            trend={metrics ? wowTrend(metrics.ssoSuccessRate, metrics.ssoSuccessRatePrev) + " WoW" : undefined}
            trendColor={metrics ? wowColor(metrics.ssoSuccessRate, metrics.ssoSuccessRatePrev) : undefined}
            sub="Target: 97%+"
            alert={!!metrics && metrics.ssoSuccessRate < 95}
          />
          <MetricCard
            label="SSO Failures"
            value={metrics?.ssoFailed ?? "—"}
            trend={metrics ? wowTrend(metrics.ssoFailed, metrics.ssoAttemptsPrev - metrics.ssoSuccessPrev) + " WoW" : undefined}
            trendColor={metrics ? wowColor(metrics.ssoFailed, metrics.ssoAttemptsPrev - metrics.ssoSuccessPrev, false) : undefined}
            alert={!!metrics && metrics.ssoFailed > 100}
          />
          <MetricCard
            label="Exceptions"
            value={metrics?.exceptions ?? "—"}
            trend={metrics ? wowTrend(metrics.exceptions, metrics.exceptionsPrev) + " WoW" : undefined}
            trendColor={metrics ? wowColor(metrics.exceptions, metrics.exceptionsPrev, false) : undefined}
          />
          <MetricCard
            label="Rage Clicks"
            value={metrics?.rageclicks ?? "—"}
            trend={metrics ? wowTrend(metrics.rageclicks, metrics.rageclicksPrev) + " WoW" : undefined}
            trendColor={metrics ? wowColor(metrics.rageclicks, metrics.rageclicksPrev, false) : undefined}
            sub="Friction proxy"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-gray-400">Pod Activity — PRs Merged (7d)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(podActivity)
            .sort((a, b) => b[1] - a[1])
            .map(([pod, count]) => (
              <MetricCard key={pod} label={pod} value={count} sub="PRs merged" />
            ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-gray-400">Key Event Volume (7d)</h2>
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Event</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">This Week</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Last Week</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">WoW</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topEvents.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-sm">PostHog API key not configured</td></tr>
              )}
              {topEvents.map((e: { event: string; thisWeek: number; lastWeek: number }) => {
                const isNegative = e.event.includes("failed") || e.event.includes("exception") || e.event.includes("rage")
                const trend = wowTrend(e.thisWeek, e.lastWeek)
                const color = wowColor(e.thisWeek, e.lastWeek, !isNegative)
                return (
                  <tr key={e.event} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{e.event}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-900">{e.thisWeek.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-400">{e.lastWeek.toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right font-medium ${color}`}>{trend}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-gray-400">Shipped This Week</h2>
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">PR</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Pod</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Repo</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Merged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prs.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-sm">No PRs found</td></tr>
              )}
              {prs.slice(0, 15).map((pr) => (
                <tr key={`${pr.repo}-${pr.number}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <a href={`/pr/${pr.repo}/${pr.number}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                      {pr.title.length > 60 ? pr.title.slice(0, 60) + "…" : pr.title}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">{pr.team}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{pr.repo}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(pr.mergedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
