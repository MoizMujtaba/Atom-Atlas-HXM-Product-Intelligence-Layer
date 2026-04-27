import { loadHypotheses } from "@/lib/rice"
import { calcRICE, riceLabel } from "@/lib/utils"
import RiceForm from "@/components/rice-form"

export const dynamic = "force-dynamic"

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-100 text-blue-700",
  "in-observation": "bg-amber-100 text-amber-700",
  shipped: "bg-green-100 text-green-700",
  dismissed: "bg-gray-100 text-gray-500",
}

const TYPE_LABELS: Record<string, string> = {
  friction: "Friction",
  "new-capability": "New Capability",
  gap: "Gap",
  competitor: "Competitor",
  migration: "Migration",
}

export default async function RicePage() {
  const hypotheses = loadHypotheses()
  const sorted = [...hypotheses].sort((a, b) => b.score - a.score)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">RICE Backlog</h1>
        <p className="text-gray-500 text-sm mt-1">Signal-derived hypotheses scored by pod PMs · Formula: (Reach × Impact × Confidence%) / Effort</p>
      </div>

      <div className="flex gap-4 text-xs">
        {[
          { label: "Ship it", range: "300+", color: "text-green-600" },
          { label: "Strong", range: "200–299", color: "text-emerald-600" },
          { label: "Validate", range: "100–199", color: "text-amber-600" },
          { label: "Monitor", range: "50–99", color: "text-orange-500" },
          { label: "Hypothesis", range: "<50", color: "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className={`font-semibold ${s.color}`}>{s.label}</span>
            <span className="text-gray-400">{s.range}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Hypothesis</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Pod</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Type</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">R</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">I</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">C%</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">E</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Score</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((h) => {
              const score = calcRICE(h.reach, h.impact, h.confidence, h.effort)
              const { label, color } = riceLabel(score)
              const lightColor = color
                .replace("text-green-400", "text-green-600")
                .replace("text-emerald-400", "text-emerald-600")
                .replace("text-yellow-400", "text-amber-600")
                .replace("text-orange-400", "text-orange-500")
                .replace("text-zinc-500", "text-gray-400")
              return (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-gray-900 leading-snug">{h.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{h.source}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">{h.pod}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{TYPE_LABELS[h.signalType]}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">{h.reach.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">{h.impact}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">{h.confidence}%</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">{h.effort}w</td>
                  <td className={`px-4 py-3 text-right font-bold tabular-nums ${lightColor}`}>{score}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[h.status]}`}>
                      {h.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Add Hypothesis</h2>
        <RiceForm />
      </section>
    </div>
  )
}
