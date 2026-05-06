import { getCompetitorIntel } from "@/lib/atom-data"
import AtomHero from "@/components/atom-hero"
import StatTile from "@/components/stat-tile"
import PieChart from "@/components/sentinel/pie-chart"
import BarChart from "@/components/bar-chart"

export const dynamic = "force-static"

const URGENCY_ACCENT: Record<string, string> = {
  critical: "var(--atlas-coral-500)",
  high: "var(--atlas-orangellow-500)",
  medium: "var(--atlas-purple-500)",
  low: "var(--atlas-gray-300)",
}

const URGENCY_BADGE: Record<string, { bg: string; fg: string }> = {
  critical: { bg: "var(--atlas-coral-100)", fg: "#7A1818" },
  high: { bg: "var(--atlas-orangellow-100)", fg: "#5A3A0B" },
  medium: { bg: "var(--atlas-purple-100)", fg: "var(--atlas-purple-900)" },
  low: { bg: "var(--atlas-gray-300)", fg: "var(--atlas-gray-900)" },
}

const SCORE_TEXT: Record<string, string> = {
  "Ship it": "var(--atlas-blue-500)",
  "Strong": "var(--atlas-blue-250)",
  "Validate": "var(--atlas-purple-500)",
  "Monitor": "var(--atlas-orangellow-500)",
  "Hypothesis": "var(--atlas-gray-900)",
}

const TYPE_BADGE: Record<string, { bg: string; fg: string }> = {
  "product-launch": { bg: "var(--atlas-blue-100)", fg: "var(--atlas-blue-900)" },
  "ai-feature": { bg: "var(--atlas-blue-100)", fg: "var(--atlas-blue-900)" },
  "acquisition": { bg: "var(--atlas-blue-100)", fg: "var(--atlas-blue-500)" },
  "partnership": { bg: "var(--atlas-blue-100)", fg: "var(--atlas-blue-500)" },
  "expansion": { bg: "var(--atlas-blue-100)", fg: "var(--atlas-blue-500)" },
  "milestone": { bg: "var(--atlas-blue-100)", fg: "var(--atlas-blue-500)" },
  "pricing": { bg: "var(--atlas-gray-300)", fg: "var(--atlas-gray-900)" },
  "marketing": { bg: "var(--atlas-gray-300)", fg: "var(--atlas-gray-900)" },
}

export default function CompetePage() {
  const intel = getCompetitorIntel()

  if (!intel) {
    return (
      <>
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid var(--atlas-gray-300)", background: "white" }}>
          <div className="px-5 py-3 border-b" style={{ background: "var(--atlas-gray-50)", borderColor: "var(--atlas-gray-300)" }}>
            <h1 className="text-sm font-semibold" style={{ color: "var(--atlas-gray-900)" }}>Competitive Intelligence</h1>
          </div>
          <div className="px-5 py-10 text-center">
            <p className="text-sm" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>No competitor data yet.</p>
            <p className="text-[11px] mt-1" style={{ color: "var(--atlas-gray-900)", opacity: 0.4 }}>Run the Atom refresh session to populate competitor intel.</p>
          </div>
        </div>
      </>
    )
  }

  const generatedDate = new Date(intel.generatedAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  })

  const criticalThemes = intel.crossCompetitorThemes.filter(t => t.urgency === "critical").length
  const highThemes = intel.crossCompetitorThemes.filter(t => t.urgency === "high").length
  const mediumThemes = intel.crossCompetitorThemes.filter(t => t.urgency === "medium").length
  const lowThemes = intel.crossCompetitorThemes.filter(t => t.urgency === "low").length

  const moveTypeCounts = intel.competitors.reduce<Record<string, number>>((acc, c) => {
    c.recentMoves.forEach(m => { acc[m.type] = (acc[m.type] ?? 0) + 1 })
    return acc
  }, {})

  return (
    <>
      {/* Hero */}
      <AtomHero
        pill="ATLAS HXM · COMPETITIVE INTEL"
        date={`Updated ${generatedDate}`}
        headline="Market moves, G2 gaps, and Atlas plays."
        subline={`Tracking ${intel.competitors.map(c => c.name).join(", ")} — where they're moving and where Atlas wins.`}
        stats={
          <div className="space-y-2 min-w-[140px]">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--atlas-blue-250)" }}>
              Threat Summary
            </p>
            <p className="text-sm text-white">
              <span className="font-semibold">{intel.competitors.length}</span> competitors tracked
            </p>
            {criticalThemes > 0 && (
              <p className="text-sm" style={{ color: "var(--atlas-coral-500)" }}>
                <span className="font-semibold">{criticalThemes}</span> critical theme{criticalThemes > 1 ? "s" : ""}
              </p>
            )}
            {highThemes > 0 && (
              <p className="text-sm" style={{ color: "var(--atlas-orangellow-500)" }}>
                <span className="font-semibold">{highThemes}</span> high-urgency
              </p>
            )}
          </div>
        }
      />

      {/* Chart cards row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Theme urgency donut */}
        <div className="rounded-2xl px-5 py-5 shadow-sm" style={{ background: "white", border: "1px solid var(--atlas-gray-300)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}>
            Theme Urgency Mix
          </p>
          <h3 className="text-base font-semibold mt-0.5 mb-4" style={{ color: "var(--atlas-gray-900)" }}>
            Where the market is moving fastest
          </h3>
          <PieChart
            data={[
              { label: "Critical", value: criticalThemes, color: "#FF595A" },
              { label: "High", value: highThemes, color: "#FF782C" },
              { label: "Medium", value: mediumThemes, color: "#5827E3" },
              { label: "Low", value: lowThemes, color: "#E9E9E9" },
            ].filter(d => d.value > 0)}
            title="Competitive theme urgency"
            size={180}
          />
        </div>

        {/* Competitor move types bar chart */}
        <div className="rounded-2xl px-5 py-5 shadow-sm" style={{ background: "white", border: "1px solid var(--atlas-gray-300)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}>
            Competitor Activity · Move Types
          </p>
          <h3 className="text-base font-semibold mt-0.5 mb-4" style={{ color: "var(--atlas-gray-900)" }}>
            What competitors are doing most
          </h3>
          <BarChart
            data={Object.entries(moveTypeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([label, value], i) => ({
                label: label.replace(/-/g, " "),
                value,
                color: ["#0559FA","#5827E3","#BA33CA","#FF782C","#FF595A"][i % 5],
              }))}
          />
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Competitors" value={intel.competitors.length} accent="var(--atlas-blue-500)" caption="Tracked this cycle" />
        <StatTile label="Critical Themes" value={criticalThemes} accent="var(--atlas-coral-500)" caption="Market-wide urgency" dark={criticalThemes > 0} />
        <StatTile label="High Urgency" value={highThemes} accent="var(--atlas-orangellow-500)" caption="Watch closely" />
        <StatTile label="RICE Gaps" value={intel.riceGapAnalysis.length} accent="var(--atlas-purple-500)" caption="Capabilities missing vs market" />
      </div>

      {/* Cross-competitor themes */}
      {intel.crossCompetitorThemes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.65 }}>
            Market-Wide Themes
          </h2>
          <p className="text-[13px] -mt-1 leading-relaxed" style={{ color: "var(--atlas-gray-900)", opacity: 0.7 }}>
            Patterns across {intel.competitors.length} competitors — where the market is moving.
          </p>
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid var(--atlas-gray-300)", background: "white" }}>
            {intel.crossCompetitorThemes.map((theme, i) => {
              const badge = URGENCY_BADGE[theme.urgency] ?? { bg: "var(--atlas-gray-300)", fg: "var(--atlas-gray-900)" }
              const hasGap = theme.atlasStatus.toLowerCase().includes("none") || theme.atlasStatus.toLowerCase().includes("zero") || theme.atlasStatus.toLowerCase().includes("no ")
              return (
                <div
                  key={i}
                  className="px-5 py-3 flex items-start gap-4"
                  style={i > 0 ? { borderTop: "1px solid var(--atlas-gray-300)" } : {}}
                >
                  <span
                    className="mt-0.5 shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    style={{ background: badge.bg, color: badge.fg }}
                  >
                    {theme.urgency}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--atlas-gray-900)" }}>{theme.theme}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>
                      <span>Market: <span style={{ color: "var(--atlas-gray-900)", opacity: 1 }}>{theme.status}</span></span>
                      <span style={{ color: "var(--atlas-gray-300)" }}>|</span>
                      <span>
                        Atlas:{" "}
                        <span style={{ color: hasGap ? "var(--atlas-coral-500)" : "var(--atlas-gray-900)", fontWeight: hasGap ? 600 : 400, opacity: 1 }}>
                          {theme.atlasStatus}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Competitor cards */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.65 }}>
          Competitor Profiles
        </h2>
        <div className="space-y-5">
          {intel.competitors.map((c) => (
            <div key={c.name} className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid var(--atlas-gray-300)" }}>
              <div className="px-5 py-3 border-b" style={{ background: "var(--atlas-gray-50)", borderColor: "var(--atlas-gray-300)" }}>
                <h3 className="text-sm font-semibold" style={{ color: "var(--atlas-gray-900)" }}>{c.name}</h3>
              </div>

              <div style={{ background: "white" }}>
                {/* Recent moves */}
                {c.recentMoves.length > 0 && (
                  <div className="p-4 space-y-4" style={{ borderBottom: "1px solid var(--atlas-gray-300)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}>
                      Recent Moves
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {c.recentMoves.map((move, i) => {
                        const typeBadge = TYPE_BADGE[move.type] ?? { bg: "var(--atlas-gray-300)", fg: "var(--atlas-gray-900)" }
                        return (
                          <div key={i} className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                                style={{ background: typeBadge.bg, color: typeBadge.fg }}
                              >
                                {move.type.replace(/-/g, " ")}
                              </span>
                              <span className="text-xs" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>{move.date}</span>
                            </div>
                            <p className="text-sm font-medium" style={{ color: "var(--atlas-gray-900)" }}>{move.title}</p>
                            <p className="text-xs leading-relaxed" style={{ color: "var(--atlas-gray-900)", opacity: 0.65 }}>{move.detail}</p>
                            <p
                              className="text-xs rounded px-2 py-1 leading-relaxed"
                              style={{ background: "var(--atlas-orangellow-100)", color: "#5A3A0B" }}
                            >
                              <span className="font-medium">Atlas implication:</span> {move.atlasImplication}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* G2 complaints */}
                {c.g2Complaints.length > 0 && (
                  <div className="p-4 space-y-2" style={{ borderBottom: "1px solid var(--atlas-gray-300)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}>
                      G2 Complaints
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                      {c.g2Complaints.map((complaint, i) => (
                        <li key={i} className="text-xs flex gap-1.5" style={{ color: "var(--atlas-blue-500)" }}>
                          <span className="shrink-0 mt-0.5" style={{ color: "var(--atlas-blue-500)" }}>✓</span>
                          <span style={{ color: "var(--atlas-gray-900)", opacity: 0.8 }}>{complaint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Atlas play */}
                <div className="px-5 py-3" style={{ background: "var(--atlas-blue-900)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--atlas-blue-250)" }}>
                    Atlas play
                  </p>
                  <p className="text-sm text-white leading-relaxed">{c.atlasOpportunity}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RICE Gap Analysis */}
      {intel.riceGapAnalysis.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.65 }}>
            Competitive Gap → RICE Backlog
          </h2>
          <p className="text-[13px] -mt-1 leading-relaxed" style={{ color: "var(--atlas-gray-900)", opacity: 0.7 }}>
            Atlas capabilities missing vs. market. (Reach × Impact% × Confidence%) ÷ Effort
          </p>
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid var(--atlas-gray-300)", background: "white" }}>
            {intel.riceGapAnalysis
              .sort((a, b) => b.score - a.score)
              .map((item, i) => {
                const textColor = SCORE_TEXT[item.label] ?? "var(--atlas-gray-900)"
                return (
                  <div
                    key={item.id}
                    className="px-5 py-3 flex items-start gap-4"
                    style={i > 0 ? { borderTop: "1px solid var(--atlas-gray-300)" } : {}}
                  >
                    <div className="text-center shrink-0 w-14">
                      <p className="text-2xl font-black tabular-nums leading-none" style={{ color: textColor }}>{item.score}</p>
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium mt-0.5"
                        style={{ color: textColor, background: textColor + "18" }}
                      >
                        {item.label}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium" style={{ color: "var(--atlas-gray-900)" }}>{item.title}</p>
                        <span className="text-xs" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>{item.competitor}</span>
                      </div>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--atlas-gray-900)", opacity: 0.65 }}>{item.rationale}</p>
                    </div>
                  </div>
                )
              })}
          </div>
        </section>
      )}
    </>
  )
}
