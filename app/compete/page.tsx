import { getCompetitorIntel } from "@/lib/atom-data"

export const dynamic = "force-static"

const URGENCY_COLOR: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
}

const SCORE_LABEL_COLOR: Record<string, string> = {
  "Ship it": "bg-green-100 text-green-700",
  "Strong": "bg-blue-100 text-blue-700",
  "Validate": "bg-amber-100 text-amber-700",
  "Monitor": "bg-gray-100 text-gray-600",
  "Hypothesis": "bg-gray-100 text-gray-500",
}

const TYPE_BADGE: Record<string, string> = {
  "product-launch": "bg-blue-100 text-blue-700",
  "ai-feature": "bg-blue-100 text-blue-700",
  "acquisition": "bg-green-100 text-green-700",
  "partnership": "bg-green-100 text-green-700",
  "expansion": "bg-green-100 text-green-700",
  "milestone": "bg-green-100 text-green-700",
  "pricing": "bg-gray-100 text-gray-600",
  "marketing": "bg-gray-100 text-gray-600",
}

export default function CompetePage() {
  const intel = getCompetitorIntel()

  if (!intel) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">Competitive Intelligence</h1>
        <p className="text-gray-500 text-sm">No competitor data yet. Run the Atom refresh session to populate.</p>
      </div>
    )
  }

  const generatedDate = new Date(intel.generatedAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Competitive Intelligence</h1>
          <p className="text-gray-500 text-sm mt-1">
            {intel.competitors.map(c => c.name).join(" · ")} — updated {generatedDate}
          </p>
        </div>
      </div>

      {/* Cross-competitor themes */}
      {intel.crossCompetitorThemes.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Market-Wide Themes</h2>
            <p className="text-xs text-gray-500 mt-0.5">Patterns across 5 competitors — where the market is moving</p>
          </div>
          <div className="divide-y divide-gray-100">
            {intel.crossCompetitorThemes.map((theme, i) => (
              <div key={i} className="px-5 py-3 flex items-start gap-4">
                <span className={`mt-0.5 shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${URGENCY_COLOR[theme.urgency] ?? "bg-gray-100 text-gray-600"}`}>
                  {theme.urgency}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{theme.theme}</p>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                    <span>Market: <span className="text-gray-700">{theme.status}</span></span>
                    <span className="text-gray-300">|</span>
                    <span>Atlas: <span className={theme.atlasStatus.toLowerCase().includes("none") || theme.atlasStatus.toLowerCase().includes("zero") || theme.atlasStatus.toLowerCase().includes("no ") ? "text-red-600 font-medium" : "text-gray-700"}>{theme.atlasStatus}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitor cards — full-width stacked */}
      <div className="space-y-5">
        {intel.competitors.map((c) => (
          <div key={c.name} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">{c.name}</h2>
            </div>

            <div className="divide-y divide-gray-100">
              {/* Recent moves */}
              {c.recentMoves.length > 0 && (
                <div className="p-5 space-y-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Recent Moves</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {c.recentMoves.map((move, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${TYPE_BADGE[move.type] ?? "bg-gray-100 text-gray-600"}`}>
                            {move.type.replace(/-/g, " ")}
                          </span>
                          <span className="text-xs text-gray-500">{move.date}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-800">{move.title}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{move.detail}</p>
                        <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 leading-relaxed">
                          <span className="font-medium">Atlas implication:</span> {move.atlasImplication}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* G2 complaints */}
              {c.g2Complaints.length > 0 && (
                <div className="p-5 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">G2 Complaints</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                    {c.g2Complaints.map((complaint, i) => (
                      <li key={i} className="text-xs text-green-700 flex gap-1.5">
                        <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                        {complaint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Atlas play — most actionable, always last */}
              <div className="px-5 py-4 bg-gray-900">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Atlas play</p>
                <p className="text-sm text-white leading-relaxed">{c.atlasOpportunity}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* RICE Gap Analysis */}
      {intel.riceGapAnalysis.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Competitive Gap → RICE Backlog</h2>
            <p className="text-xs text-gray-500 mt-0.5">Atlas capabilities missing vs. market. (Reach × Impact% × Confidence%) ÷ Effort</p>
          </div>
          <div className="divide-y divide-gray-100">
            {intel.riceGapAnalysis
              .sort((a, b) => b.score - a.score)
              .map((item) => (
                <div key={item.id} className="px-5 py-3 flex items-start gap-4">
                  <div className="text-center shrink-0 w-14">
                    <p className="text-2xl font-black text-gray-900 tabular-nums leading-none">{item.score}</p>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${SCORE_LABEL_COLOR[item.label] ?? "bg-gray-100 text-gray-600"}`}>
                      {item.label}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <span className="text-xs text-gray-500">{item.competitor}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.rationale}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
