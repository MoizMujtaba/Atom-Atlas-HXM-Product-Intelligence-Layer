import fs from "fs"
import path from "path"

export const revalidate = 3600

interface Competitor {
  name: string
  slug: string
  content: string
}

function loadCompetitors(): Competitor[] {
  const dir = path.join(process.cwd(), "data", "competitors")
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const content = fs.readFileSync(path.join(dir, f), "utf-8")
      const name = content.match(/^# (.+)/m)?.[1] || f.replace(".md", "")
      return { name, slug: f.replace(".md", ""), content }
    })
}

function parseSection(content: string, heading: string): string {
  const regex = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`)
  return content.match(regex)?.[1]?.trim() || ""
}

function parseBullets(text: string): string[] {
  return text.split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2))
}

export default function CompetePage() {
  const competitors = loadCompetitors()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Competitive Intelligence</h1>
        <p className="text-gray-500 text-sm mt-1">Deel · Remote · Globalization Partners — updated manually, automated in v2</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {competitors.map((c) => {
          const recent = parseBullets(parseSection(c.content, "Recent Signals \\(Q2 2026\\)"))
          const gaps = parseBullets(parseSection(c.content, "Known Gaps vs Atlas"))
          const watch = parseBullets(parseSection(c.content, "Watch Items"))
          const positioning = parseSection(c.content, "Positioning")

          return (
            <div key={c.slug} className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col">
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">{c.name}</h2>
                {positioning && <p className="text-xs text-gray-500 mt-1 italic">{positioning}</p>}
              </div>
              <div className="p-5 space-y-5 flex-1">
                {recent.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-2">Recent Signals</p>
                    <ul className="space-y-1.5">
                      {recent.map((r, i) => (
                        <li key={i} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-gray-400 mt-0.5 shrink-0">•</span>{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {gaps.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-2">Atlas Advantages</p>
                    <ul className="space-y-1.5">
                      {gaps.map((g, i) => (
                        <li key={i} className="text-sm text-green-700 flex gap-2">
                          <span className="text-green-500 mt-0.5 shrink-0">✓</span>{g}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {watch.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-2">Watch Items</p>
                    <ul className="space-y-1.5">
                      {watch.map((w, i) => (
                        <li key={i} className="text-sm text-amber-700 flex gap-2">
                          <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>{w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <p className="text-sm text-gray-600">
          <span className="text-gray-900 font-medium">v2 roadmap:</span> Auto-scrape Deel/Remote/GP changelogs weekly. Parse G2 reviews for feature requests. Flag gaps where competitors shipped something on Atlas roadmap Q3+.
        </p>
      </div>
    </div>
  )
}
