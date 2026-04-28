import { notFound } from "next/navigation"
import { detectTeam } from "@/lib/github"
import type { AtomTranslation } from "@/lib/claude"
import type { PRLinearContext, PRPostHogContext } from "@/lib/linear-context"

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

const RISK_BADGE: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-300",
  medium: "bg-amber-100 text-amber-700 border-amber-300",
  low: "bg-green-100 text-green-700 border-green-300",
}

const REVIEW_DECISION_BADGE: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-700",
  CHANGES_REQUESTED: "bg-red-100 text-red-700",
  COMMENTED: "bg-gray-100 text-gray-600",
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

  const { pr, files, reviews, comments, ciChecks, translation, linearContext, posthogContext }: {
    pr: { number: number; title: string; body: string; url: string; mergedAt: string; author: string; baseBranch: string }
    files: { filename: string; additions: number; deletions: number; status: string }[]
    reviews: { user: string; body: string; decision: string; submittedAt: string }[]
    comments: { user: string; body: string; path?: string }[]
    ciChecks: { name: string; conclusion: string | null; status: string }[]
    translation: AtomTranslation
    linearContext: PRLinearContext
    posthogContext: PRPostHogContext
  } = data

  const translationFailed = translation?.userImpact?.includes("Translation parse failed") ||
    translation?.userImpact?.includes("Could not parse")

  const team = detectTeam(pr.title)
  const signalStyle = SIGNAL_COLORS[translation.signalType] || SIGNAL_COLORS.infrastructure
  const riskStyle = RISK_BADGE[translation.productionRisk || "low"]
  const failedChecks = ciChecks?.filter(c => c.conclusion === "failure" || c.conclusion === "timed_out") || []
  const passedChecks = ciChecks?.filter(c => c.conclusion === "success") || []

  const approvals = reviews.filter(r => r.decision === "APPROVED")
  const changesRequested = reviews.filter(r => r.decision === "CHANGES_REQUESTED")
  const reviewComments = reviews.filter(r => r.decision === "COMMENTED" && r.body)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 text-sm">
        <a href="/signals" className="text-gray-400 hover:text-gray-600">← Signals</a>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 flex-wrap">
          <span className="font-mono">{repo}</span>
          <span>·</span>
          <span>#{pr.number}</span>
          <span>·</span>
          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">{team}</span>
          {pr.mergedAt && <><span>·</span><span>Merged {new Date(pr.mergedAt).toLocaleDateString()}</span></>}
          {pr.baseBranch && <><span>·</span><span className="font-mono">→ {pr.baseBranch}</span></>}
        </div>
        <h1 className="text-xl font-semibold text-gray-900 leading-snug">{pr.title}</h1>
        {pr.author && <p className="text-gray-500 text-sm mt-1">by {pr.author}</p>}
      </div>

      {/* CI Status */}
      {ciChecks?.length > 0 && (
        <div className={`flex items-center gap-3 text-sm rounded-lg border px-4 py-2.5 ${
          failedChecks.length > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
        }`}>
          <span className={`font-medium ${failedChecks.length > 0 ? "text-red-700" : "text-green-700"}`}>
            CI: {failedChecks.length > 0 ? `${failedChecks.length} failing` : `${passedChecks.length} passing`}
          </span>
          {failedChecks.length > 0 && (
            <span className="text-red-600 text-xs">{failedChecks.map(c => c.name).join(", ")}</span>
          )}
        </div>
      )}

      {/* Translation Failure Explanation */}
      {translationFailed && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-amber-600 text-white px-2 py-0.5 rounded">ATOM</span>
            <span className="text-sm font-semibold text-amber-900">Why did translation fail?</span>
          </div>
          <p className="text-sm text-amber-800">
            Atom sends PR diffs and review comments to Claude for analysis. Occasionally Claude wraps its response in markdown code fences (<code className="bg-amber-100 px-1 rounded font-mono text-xs">```json ... ```</code>) or the response is cut off mid-JSON if the PR is large. When either happens, JSON parsing fails and you see this error.
          </p>
          <p className="text-sm text-amber-800">
            <strong>What to do:</strong> Open the PR on GitHub and review manually. The Linear context and PostHog intelligence below are still generated from the PR title and cycle data — they are reliable even when Claude translation fails.
          </p>
          {(translation as AtomTranslation & { _rawResponse?: string })._rawResponse && (
            <details className="mt-2">
              <summary className="text-xs text-amber-700 cursor-pointer">Show raw Claude response (debug)</summary>
              <pre className="text-xs text-amber-800 mt-2 bg-amber-100 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                {(translation as AtomTranslation & { _rawResponse?: string })._rawResponse}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Atom Translation */}
      <div className={`rounded-xl border p-5 space-y-4 ${translationFailed ? "border-gray-200 bg-gray-50 opacity-60" : signalStyle}`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono bg-gray-900 text-white px-2 py-0.5 rounded">ATOM</span>
          <span className="text-xs uppercase tracking-wide font-medium opacity-70">{translation.signalType}</span>
          {translation.urgencyTier && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
              translation.urgencyTier === "P1" ? "bg-red-600 text-white border-red-600" :
              translation.urgencyTier === "P2" ? "bg-amber-500 text-white border-amber-500" :
              "bg-gray-100 text-gray-600 border-gray-300"
            }`}>{translation.urgencyTier}</span>
          )}
          {translation.outcomeType && (
            <span className={`text-xs px-2 py-0.5 rounded font-medium border ${
              translation.outcomeType === "retention" ? "bg-blue-100 text-blue-700 border-blue-200" :
              translation.outcomeType === "revenue" ? "bg-green-100 text-green-700 border-green-200" :
              translation.outcomeType === "risk" ? "bg-red-100 text-red-700 border-red-200" :
              translation.outcomeType === "migration" ? "bg-violet-100 text-violet-700 border-violet-200" :
              "bg-cyan-100 text-cyan-700 border-cyan-200"
            }`}>{translation.outcomeType}</span>
          )}
          {translation.productionRisk && (
            <span className={`text-xs border px-2 py-0.5 rounded font-medium ${riskStyle}`}>
              {translation.productionRisk} risk
            </span>
          )}
          {translation.legacyImpact && translation.legacyImpact !== "neutral" && (
            <span className={`text-xs border px-2 py-0.5 rounded font-medium ${
              translation.legacyImpact === "accelerates-sunset" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
            }`}>{translation.legacyImpact === "accelerates-sunset" ? "↑ accelerates sunset" : "↓ blocks sunset"}</span>
          )}
          {translation.instrumentationGap && (
            <span className="text-xs bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded font-medium">
              no PostHog tracking
            </span>
          )}
        </div>

        {translation.recommendedAction && (
          <div className="rounded-lg bg-white bg-opacity-60 border border-current border-opacity-20 px-4 py-3">
            <p className="text-xs uppercase tracking-wide opacity-60 font-medium mb-1">Recommended Action (next 48h)</p>
            <p className="text-sm font-semibold">{translation.recommendedAction}</p>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold mb-1">User Impact</p>
          <p className="text-sm">{translation.userImpact}</p>
          {translation.targetPersona && (
            <p className="text-xs mt-1 opacity-70">Affects: {translation.targetPersona}</p>
          )}
        </div>

        {translation.ignoreCost && (
          <div>
            <p className="text-xs uppercase tracking-wide opacity-60 font-medium mb-1">If You Ignore This</p>
            <p className="text-sm">{translation.ignoreCost}</p>
          </div>
        )}

        {translation.productionRiskReason && (
          <div>
            <p className="text-xs uppercase tracking-wide opacity-60 font-medium mb-1">Production Risk</p>
            <p className="text-sm">{translation.productionRiskReason}</p>
          </div>
        )}

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

        {translation.reviewerRisks && translation.reviewerRisks.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wide opacity-60 font-medium mb-2">Reviewer Risks (from code review)</p>
            <ul className="space-y-1.5">
              {translation.reviewerRisks.map((risk: string, i: number) => (
                <li key={i} className="text-sm flex gap-2 items-start">
                  <span className="shrink-0 mt-0.5">⚠</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {translation.nextOpportunity && (
          <div>
            <p className="text-xs uppercase tracking-wide opacity-60 font-medium mb-1">PM Opportunity</p>
            <p className="text-sm italic">{translation.nextOpportunity}</p>
          </div>
        )}

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

      {/* Linear Context */}
      {linearContext && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-gray-900 text-white px-2 py-0.5 rounded">LINEAR</span>
            <span className="text-sm font-semibold text-gray-900">Cycle Intelligence</span>
            {linearContext.linearId && (
              <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{linearContext.linearId}</span>
            )}
            <span className="text-xs text-gray-400">{linearContext.pod}</span>
          </div>

          <div className={`rounded-lg px-4 py-3 text-sm border ${linearContext.linkedToRoadmap ? "bg-green-50 border-green-200 text-green-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
            {linearContext.roadmapNote}
          </div>

          {linearContext.cycleNumber && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                <p className="text-xs text-gray-400 mb-0.5">Cycle</p>
                <p className="text-lg font-bold text-gray-900">#{linearContext.cycleNumber}</p>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                <p className="text-xs text-gray-400 mb-0.5">Complete</p>
                <p className={`text-lg font-bold ${(linearContext.completionPct ?? 0) >= 70 ? "text-green-700" : (linearContext.completionPct ?? 0) >= 40 ? "text-amber-700" : "text-red-700"}`}>
                  {linearContext.completionPct}%
                </p>
              </div>
              <div className={`rounded-lg border px-3 py-2 ${linearContext.slipRisk === "high" ? "bg-red-50 border-red-200" : linearContext.slipRisk === "medium" ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
                <p className="text-xs text-gray-400 mb-0.5">Slip Risk</p>
                <p className={`text-lg font-bold capitalize ${linearContext.slipRisk === "high" ? "text-red-700" : linearContext.slipRisk === "medium" ? "text-amber-700" : "text-green-700"}`}>
                  {linearContext.slipRisk}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                <p className="text-xs text-gray-400 mb-0.5">Ends</p>
                <p className="text-sm font-bold text-gray-900">
                  {linearContext.cycleEnds ? new Date(linearContext.cycleEnds).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                </p>
              </div>
            </div>
          )}

          {linearContext.slipRiskReason && (
            <p className="text-xs text-gray-500 italic">{linearContext.slipRiskReason}</p>
          )}

          {linearContext.relatedInFlight.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-2">Related In-Flight ({linearContext.pod})</p>
              <div className="space-y-1.5">
                {linearContext.relatedInFlight.map((issue) => (
                  <div key={issue.id} className={`rounded-lg px-3 py-2 text-sm border ${issue.isProdBlocker ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                    <div className="flex items-start gap-2">
                      {issue.isProdBlocker && <span className="text-xs text-red-500 font-bold shrink-0 mt-0.5">PROD</span>}
                      <span className="font-mono text-xs text-gray-400 shrink-0">{issue.id}</span>
                      <span className={`text-xs leading-snug ${issue.isProdBlocker ? "text-red-800 font-medium" : "text-gray-700"}`}>{issue.title}</span>
                      <span className="text-xs text-gray-400 ml-auto shrink-0">{issue.assignee}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {linearContext.cycleSignals.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-2">Cycle Signals</p>
              <div className="space-y-1.5">
                {linearContext.cycleSignals.slice(0, 3).map((s, i) => (
                  <div key={i} className={`rounded-lg px-3 py-2 text-xs border ${
                    s.urgency === "P1" ? "bg-red-50 border-red-200 text-red-800" :
                    s.urgency === "P2" ? "bg-amber-50 border-amber-200 text-amber-800" :
                    "bg-gray-50 border-gray-200 text-gray-700"
                  }`}>
                    <span className="font-bold mr-2">{s.urgency}</span>{s.title} — {s.detail}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PostHog Intelligence */}
      {posthogContext && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-gray-900 text-white px-2 py-0.5 rounded">POSTHOG</span>
            <span className="text-sm font-semibold text-gray-900">Observability</span>
            {!posthogContext.hasEvents && (
              <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded font-medium">0 events tracked</span>
            )}
          </div>

          <div className={`rounded-lg px-4 py-3 text-sm border ${posthogContext.hasEvents ? "bg-blue-50 border-blue-200 text-blue-800" : "bg-red-50 border-red-200 text-red-800"}`}>
            {posthogContext.gap}
          </div>

          {posthogContext.events.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-2">Event Trends (30d)</p>
              <div className="space-y-1.5">
                {posthogContext.events.map((e, i) => {
                  const pct = e.lastWeek > 0 ? Math.round(((e.thisWeek - e.lastWeek) / e.lastWeek) * 100) : 0
                  return (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs">
                      <span className="font-mono text-gray-700">{e.event}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">{e.thisWeek.toLocaleString()} this week</span>
                        <span className={`font-medium ${pct > 0 ? "text-green-600" : pct < -10 ? "text-red-600" : "text-gray-500"}`}>
                          {pct > 0 ? "+" : ""}{pct}% WoW
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {posthogContext.proposedEvents.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-2">Proposed Events — Ship these to gain visibility</p>
              <div className="space-y-2">
                {posthogContext.proposedEvents.map((e, i) => (
                  <div key={i} className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
                    <p className="text-xs font-mono text-amber-900 font-medium">{e.event}</p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-snug">{e.reason}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-lg bg-gray-900 text-gray-100 px-4 py-3 text-xs space-y-1">
                <p className="font-semibold text-white">RICE: Instrument {linearContext?.pod} flows</p>
                <p><span className="text-gray-400">Reach:</span> 2,600+ WSEs — entire payments/THP flow is dark</p>
                <p><span className="text-gray-400">Impact:</span> 3 — cannot detect regressions, validate shipped features, or quantify adoption</p>
                <p><span className="text-gray-400">Confidence:</span> 90% — 0 events tracked + payment page exceptions confirm the blindspot</p>
                <p><span className="text-gray-400">Effort:</span> 1 sprint — add PostHog client calls to existing view renders and submit handlers</p>
                <p className="mt-2 text-green-400 font-semibold">Score ≈ 7,020 — highest-leverage untracked work in {linearContext?.pod}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Decisions */}
      {(approvals.length > 0 || changesRequested.length > 0) && (
        <div className="space-y-2">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-medium">Code Review</h2>
          <div className="flex flex-wrap gap-2">
            {approvals.map((r, i) => (
              <span key={i} className={`text-xs px-3 py-1 rounded-full font-medium ${REVIEW_DECISION_BADGE.APPROVED}`}>
                ✓ {r.user} approved
              </span>
            ))}
            {changesRequested.map((r, i) => (
              <span key={i} className={`text-xs px-3 py-1 rounded-full font-medium ${REVIEW_DECISION_BADGE.CHANGES_REQUESTED}`}>
                ✗ {r.user} requested changes
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Files */}
        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-medium">Files Changed ({files.length})</h2>
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {files.map((f, i) => (
                <div key={i} className="px-4 py-2 flex items-center gap-2 hover:bg-gray-50">
                  <span className={`text-xs w-10 text-right tabular-nums ${f.additions > 0 ? "text-green-600" : "text-gray-300"}`}>+{f.additions}</span>
                  <span className={`text-xs w-10 text-right tabular-nums ${f.deletions > 0 ? "text-red-500" : "text-gray-300"}`}>-{f.deletions}</span>
                  <span className="text-xs text-gray-600 font-mono truncate">{f.filename}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Review Comments (inline diff comments) */}
        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-medium">
            Inline Comments ({comments.length}){reviewComments.length > 0 && ` + ${reviewComments.length} review notes`}
          </h2>
          {comments.length === 0 && reviewComments.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-gray-400 text-sm">No review comments</div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {[...reviewComments, ...comments].map((c, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs text-gray-500 font-medium">{c.user}</p>
                      {"path" in c && c.path && (
                        <span className="text-xs font-mono text-gray-400 truncate max-w-[140px]">{c.path}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 leading-snug whitespace-pre-wrap">{c.body}</p>
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
