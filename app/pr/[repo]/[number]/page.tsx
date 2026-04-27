import { notFound } from "next/navigation"
import { detectTeam } from "@/lib/github"

export const dynamic = "force-dynamic"

const SIGNAL_COLORS: Record<string, string> = {
  friction: "border-red-200 bg-red-50 text-red-700",
  "new-capability": "border-blue-200 bg-blue-50 text-blue-700",
  "error-handling": "border-orange-200 bg-orange-50 text-orange-700",
  "feature-flag": "border-purple-200 bg-purple-50 text-purple-700",
  navigation: "border-cyan-200 bg-cyan-50 text-cyan-700",
  migration: "border-violet-200 bg-violet-50 text-violet-700",
  infrastructure: "border-gray-200 bg-gray-50 text-gray-600",
}

async function getPRData(repo: string, number: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const res = await fetch(`${baseUrl}/api/translate-pr?repo=${repo}&number=${number}`, {
    cache: "no-store",
  })
  if (!res.ok) return null
  return res.json()
}

export default async function PRPage({
  params,
}: {
  params: Promise<{ repo: string; number: string }>
}) {
  const { repo, number } = await params
  const data = await getPRData(repo, number)
  if (!data) notFound()

  const { pr, files, comments, translation } = data
  const team = detectTeam(pr.title)
  const signalStyle = SIGNAL_COLORS[translation.signalType] || SIGNAL_COLORS.infrastructure

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 text-sm">
        <a href="/signals" className="text-gray-400 hover:text-gray-600">← Signals</a>
      </div>

      <div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span className="font-mono">{repo}</span>
          <span>·</span>
          <span>#{pr.number}</span>
          <span>·</span>
          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">{team}</span>
          {pr.mergedAt && <><span>·</span><span>Merged {new Date(pr.mergedAt).toLocaleDateString()}</span></>}
        </div>
        <h1 className="text-xl font-semibold text-gray-900 leading-snug">{pr.title}</h1>
        {pr.author && <p className="text-gray-500 text-sm mt-1">by {pr.author}</p>}
      </div>

      {/* Atom Translation */}
      <div className={`rounded-xl border p-5 space-y-4 ${signalStyle}`}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-gray-900 text-white px-2 py-0.5 rounded">ATOM</span>
          <span className="text-xs uppercase tracking-wide font-medium opacity-70">{translation.signalType}</span>
          {translation.migrationSignal && (
            <span className="text-xs bg-violet-100 text-violet-700 border border-violet-200 px-2 py-0.5 rounded font-medium">Migration signal</span>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold mb-1">User Impact</p>
          <p className="text-sm">{translation.userImpact}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {translation.frictionFixed && (
            <div>
              <p className="text-xs uppercase tracking-wide opacity-60 font-medium mb-1">Friction Fixed</p>
              <p className="text-sm">{translation.frictionFixed}</p>
            </div>
          )}
          {translation.newCapability && (
            <div>
              <p className="text-xs uppercase tracking-wide opacity-60 font-medium mb-1">New Capability</p>
              <p className="text-sm">{translation.newCapability}</p>
            </div>
          )}
        </div>

        {translation.watchItems?.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wide opacity-60 font-medium mb-1">Watch in PostHog</p>
            <ul className="space-y-1">
              {translation.watchItems.map((item: string, i: number) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="opacity-40 shrink-0">→</span>{item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-medium">Files Changed ({files.length})</h2>
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {files.map((f: { filename: string; additions: number; deletions: number }, i: number) => (
                <div key={i} className="px-4 py-2 flex items-center gap-2 hover:bg-gray-50">
                  <span className={`text-xs w-10 text-right tabular-nums ${f.additions > 0 ? "text-green-600" : "text-gray-300"}`}>+{f.additions}</span>
                  <span className={`text-xs w-10 text-right tabular-nums ${f.deletions > 0 ? "text-red-500" : "text-gray-300"}`}>-{f.deletions}</span>
                  <span className="text-xs text-gray-600 font-mono truncate">{f.filename}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-medium">Review Comments ({comments.length})</h2>
          {comments.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-gray-400 text-sm">No review comments</div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {comments.map((c: { user: string; body: string }, i: number) => (
                  <div key={i} className="px-4 py-3">
                    <p className="text-xs text-gray-400 font-medium mb-1">{c.user}</p>
                    <p className="text-sm text-gray-700 leading-snug">{c.body.slice(0, 200)}{c.body.length > 200 ? "…" : ""}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {pr.body && (
        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-medium">PR Description</h2>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
            {pr.body}
          </div>
        </div>
      )}

      <div className="pt-2">
        <a href={pr.url} target="_blank" rel="noopener" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
          View on GitHub →
        </a>
      </div>
    </div>
  )
}
