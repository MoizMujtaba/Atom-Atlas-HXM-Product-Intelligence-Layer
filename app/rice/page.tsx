import { loadHypotheses } from "@/lib/rice"
import { calcRICE, riceLabel } from "@/lib/utils"
import RiceForm from "@/components/rice-form"
import AtomHero from "@/components/atom-hero"
import StatTile from "@/components/stat-tile"
import PieChart from "@/components/sentinel/pie-chart"
import BarChart from "@/components/bar-chart"

export const dynamic = "force-static"

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  active: { bg: "var(--atlas-blue-100)", fg: "var(--atlas-blue-900)" },
  "in-observation": { bg: "var(--atlas-orangellow-100)", fg: "#5A3A0B" },
  shipped: { bg: "var(--atlas-blue-100)", fg: "var(--atlas-blue-500)" },
  dismissed: { bg: "var(--atlas-gray-300)", fg: "var(--atlas-gray-900)" },
}

const TYPE_LABELS: Record<string, string> = {
  friction: "Friction",
  "new-capability": "New Capability",
  gap: "Gap",
  competitor: "Competitor",
  migration: "Migration",
}

// Maps RICE label → Atlas accent color
const SCORE_ACCENT: Record<string, string> = {
  "Ship it": "var(--atlas-blue-500)",
  "Strong": "var(--atlas-blue-250)",
  "Validate": "var(--atlas-purple-500)",
  "Monitor": "var(--atlas-orangellow-500)",
  "Hypothesis": "var(--atlas-gray-300)",
}

const SCORE_TEXT: Record<string, string> = {
  "Ship it": "var(--atlas-blue-500)",
  "Strong": "var(--atlas-blue-500)",
  "Validate": "var(--atlas-purple-500)",
  "Monitor": "var(--atlas-orangellow-500)",
  "Hypothesis": "var(--atlas-gray-900)",
}

export default async function RicePage() {
  const hypotheses = loadHypotheses()
  const sorted = [...hypotheses].sort((a, b) => b.score - a.score)

  const scored = sorted.map(h => ({ ...h, _label: riceLabel(calcRICE(h.reach, h.impact, h.confidence, h.effort)).label }))
  const shipItCount = scored.filter(h => h._label === "Ship it").length
  const strongCount = scored.filter(h => h._label === "Strong").length
  const validateCount = scored.filter(h => h._label === "Validate").length
  const monitorCount = scored.filter(h => h._label === "Monitor").length
  const hypothesisCount = scored.filter(h => h._label === "Hypothesis").length

  const typeCounts = Object.entries(
    sorted.reduce<Record<string, number>>((acc, h) => {
      acc[h.signalType] = (acc[h.signalType] ?? 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1])

  return (
    <div className="atlas-brand space-y-8">
      {/* Hero */}
      <AtomHero
        pill="ATLAS HXM · RICE BACKLOG"
        headline="Signal-derived hypotheses, scored for priority."
        subline="(Reach × Impact% × Confidence%) ÷ Effort. Effort scale: 1w=÷1, 2w=÷3, 3w=÷5, 4w=÷7."
        stats={
          <div className="space-y-2 min-w-[140px]">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--atlas-blue-250)" }}>
              Score Bands
            </p>
            <p className="text-sm text-white"><span className="font-semibold">{shipItCount}</span> Ship it (600+)</p>
            <p className="text-sm text-white"><span className="font-semibold">{strongCount}</span> Strong (300–599)</p>
            <p className="text-sm" style={{ color: "var(--atlas-blue-250)" }}>
              <span className="font-semibold">{validateCount}</span> Validate (100–299)
            </p>
          </div>
        }
      />

      {/* Chart cards row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Score band donut */}
        <div className="rounded-2xl px-5 py-5 shadow-sm" style={{ background: "white", border: "1px solid var(--atlas-gray-300)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}>
            Score Band Distribution
          </p>
          <h3 className="text-base font-semibold mt-0.5 mb-4" style={{ color: "var(--atlas-gray-900)" }}>
            Where hypotheses cluster
          </h3>
          <PieChart
            data={[
              { label: "Ship it (600+)", value: shipItCount, color: "#0559FA" },
              { label: "Strong (300–599)", value: strongCount, color: "#82ACFC" },
              { label: "Validate (100–299)", value: validateCount, color: "#5827E3" },
              { label: "Monitor (40–99)", value: monitorCount, color: "#FF782C" },
              { label: "Hypothesis (<40)", value: hypothesisCount, color: "#E9E9E9" },
            ].filter(d => d.value > 0)}
            title="RICE score band distribution"
            size={180}
          />
        </div>

        {/* Signal type bar chart */}
        <div className="rounded-2xl px-5 py-5 shadow-sm" style={{ background: "white", border: "1px solid var(--atlas-gray-300)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}>
            Signal Type Breakdown
          </p>
          <h3 className="text-base font-semibold mt-0.5 mb-4" style={{ color: "var(--atlas-gray-900)" }}>
            What's driving the backlog
          </h3>
          <BarChart
            data={typeCounts.map(([label, value], i) => ({
              label: TYPE_LABELS[label] ?? label,
              value,
              color: ["#0559FA","#5827E3","#BA33CA","#FF782C","#FF595A"][i % 5],
            }))}
          />
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Total Hypotheses" value={hypotheses.length} accent="var(--atlas-blue-500)" caption="In the backlog" />
        <StatTile label="Ship It" value={shipItCount} accent="var(--atlas-blue-500)" caption="Score 600+" dark={shipItCount > 0} />
        <StatTile label="Strong" value={strongCount} accent="var(--atlas-blue-250)" caption="Score 300–599" />
        <StatTile label="Validate" value={validateCount} accent="var(--atlas-purple-500)" caption="Score 100–299" />
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid var(--atlas-gray-300)" }}>
        <div className="px-5 py-3 border-b flex items-center gap-4 flex-wrap" style={{ background: "var(--atlas-gray-50)", borderColor: "var(--atlas-gray-300)" }}>
          {[
            { label: "Ship it", range: "600+", accent: "var(--atlas-blue-500)" },
            { label: "Strong", range: "300–599", accent: "var(--atlas-blue-250)" },
            { label: "Validate", range: "100–299", accent: "var(--atlas-purple-500)" },
            { label: "Monitor", range: "40–99", accent: "var(--atlas-orangellow-500)" },
            { label: "Hypothesis", range: "<40", accent: "var(--atlas-gray-300)" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-xs">
              <span className="inline-block w-1.5 h-3 rounded-full" style={{ background: s.accent }} aria-hidden />
              <span className="font-semibold" style={{ color: "var(--atlas-gray-900)" }}>{s.label}</span>
              <span style={{ color: "var(--atlas-gray-900)", opacity: 0.45 }}>{s.range}</span>
            </div>
          ))}
        </div>
        <table className="w-full text-sm" style={{ background: "white" }}>
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--atlas-gray-300)", background: "var(--atlas-gray-50)" }}>
              <th className="text-left px-4 py-3 font-medium w-1/3" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>Hypothesis</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>Pod</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>Type</th>
              <th className="text-right px-4 py-3 font-medium hidden lg:table-cell" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>R</th>
              <th className="text-right px-4 py-3 font-medium hidden lg:table-cell" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>I%</th>
              <th className="text-right px-4 py-3 font-medium hidden lg:table-cell" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>C%</th>
              <th className="text-right px-4 py-3 font-medium hidden lg:table-cell" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>÷E</th>
              <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>Score</th>
              <th className="text-center px-4 py-3 font-medium" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((h, i) => {
              const score = calcRICE(h.reach, h.impact, h.confidence, h.effort)
              const { label } = riceLabel(score)
              const textColor = SCORE_TEXT[label] ?? "var(--atlas-gray-900)"
              const status = STATUS_STYLE[h.status] ?? STATUS_STYLE.dismissed
              return (
                <tr
                  key={h.id}
                  className="transition-colors"
                  style={i > 0 ? { borderTop: "1px solid var(--atlas-gray-300)" } : {}}
                >
                  <td className="px-4 py-4 max-w-xs">
                    <p className="font-medium leading-snug" style={{ color: "var(--atlas-gray-900)" }}>{h.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>{h.source}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{ background: "var(--atlas-gray-50)", color: "var(--atlas-gray-900)", border: "1px solid var(--atlas-gray-300)" }}
                    >
                      {h.pod}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs hidden md:table-cell" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>
                    {TYPE_LABELS[h.signalType]}
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums text-xs hidden lg:table-cell" style={{ color: "var(--atlas-gray-900)", opacity: 0.7 }}>
                    {h.reach.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums text-xs hidden lg:table-cell" style={{ color: "var(--atlas-gray-900)", opacity: 0.7 }}>
                    {h.impact}%
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums text-xs hidden lg:table-cell" style={{ color: "var(--atlas-gray-900)", opacity: 0.7 }}>
                    {h.confidence}%
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums text-xs hidden lg:table-cell" style={{ color: "var(--atlas-gray-900)", opacity: 0.7 }}>
                    ÷{h.effort}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-2xl font-black tabular-nums leading-none" style={{ color: textColor }}>{score}</span>
                      <span className="text-xs font-semibold" style={{ color: textColor }}>{label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{ background: status.bg, color: status.fg }}
                    >
                      {h.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add Hypothesis */}
      <section className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid var(--atlas-gray-300)" }}>
        <div className="px-5 py-3 border-b" style={{ background: "var(--atlas-gray-50)", borderColor: "var(--atlas-gray-300)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--atlas-gray-900)" }}>Add Hypothesis</h2>
        </div>
        <div className="p-5" style={{ background: "white" }}>
          <RiceForm />
        </div>
      </section>
    </div>
  )
}
