import { loadHypotheses } from "@/lib/rice"
import { calcRICE, riceLabel } from "@/lib/utils"
import RiceForm from "@/components/rice-form"

export const dynamic = "force-static"

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
        <p className="text-gray-500 text-sm mt-1">Signal-derived hypotheses · (Reach × Impact% × Confidence%) ÷ Effort · Effort scale: 1w=÷1, 2w=÷3, 3w=÷5, 4w=÷7</p>
      </div>

      <div className="flex gap-4 text-xs">
        {[
          { label: "Ship it", range: "600+", color: "text-green-600" },
          { label: "Strong", range: "300–599", color: "text-emerald-600" },
          { label: "Validate", range: "100–299", color: "text-amber-600" },
          { label: "Monitor", range: "40–99", color: "text-orange-500" },
          { label: "Hypothesis", range: "<40", color: "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className={`font-semibold ${s.color}`}>{s.label}</span>
            <span className="text-gray-400">{s.range}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-gray-500 font-medium w-1/3">Hypothesis</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Pod</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Type</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">R</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">I%</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">C%</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">÷E</th>
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
                <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 max-w-xs">
                    <p className="text-gray-900 font-medium leading-snug">{h.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{h.source}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">{h.pod}</span>
                  </td>
                  <td className="px-4 py-4 text-gray-500 text-xs hidden md:table-cell">{TYPE_LABELS[h.signalType]}</td>
                  <td className="px-4 py-4 text-right tabular-nums text-gray-700 hidden lg:table-cell">{h.reach.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right tabular-nums text-gray-700 hidden lg:table-cell">{h.impact}%</td>
                  <td className="px-4 py-4 text-right tabular-nums text-gray-700 hidden lg:table-cell">{h.confidence}%</td>
                  <td className="px-4 py-4 text-right tabular-nums text-gray-700 hidden lg:table-cell">÷{h.effort}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={`text-2xl font-black tabular-nums leading-none ${lightColor}`}>{score}</span>
                      <span className={`text-xs font-semibold ${lightColor} opacity-75`}>{label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
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

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Add Hypothesis</h2>
        <RiceForm />
      </section>
    </div>
  )
}
