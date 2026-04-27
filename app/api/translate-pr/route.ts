import { NextRequest, NextResponse } from "next/server"
import { translatePRDiff } from "@/lib/claude"

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!

async function ghFetch(path: string, accept = "application/vnd.github+json") {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: accept },
  })
  if (!res.ok) return null
  return accept === "application/vnd.github.diff" ? res.text() : res.json()
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const repo = searchParams.get("repo")
  const number = searchParams.get("number")

  if (!repo || !number) {
    return NextResponse.json({ error: "Missing repo or number" }, { status: 400 })
  }

  const org = "atlashxm"

  const [pr, files, reviews, inlineComments, checks] = await Promise.all([
    ghFetch(`/repos/${org}/${repo}/pulls/${number}`),
    ghFetch(`/repos/${org}/${repo}/pulls/${number}/files`),
    ghFetch(`/repos/${org}/${repo}/pulls/${number}/reviews`),
    ghFetch(`/repos/${org}/${repo}/pulls/${number}/comments`),
    ghFetch(`/repos/${org}/${repo}/commits/${
      // We'll get commit SHA from PR, but need PR first — handle below
      "HEAD"
    }/check-runs`).then(() => null).catch(() => null), // best-effort
  ])

  if (!pr) return NextResponse.json({ error: "PR not found" }, { status: 404 })

  // Fetch CI checks for the PR head commit
  const ciChecks = pr.head?.sha
    ? await ghFetch(`/repos/${org}/${repo}/commits/${pr.head.sha}/check-runs`)
    : null

  // Formal review decisions (APPROVED, CHANGES_REQUESTED, COMMENTED)
  const reviewDecisions = (reviews || []).map((r: {
    body?: string
    user?: { login?: string }
    state?: string
    submitted_at?: string
  }) => ({
    body: r.body || "",
    user: r.user?.login || "reviewer",
    isReview: true,
    decision: r.state || "COMMENTED",
    submittedAt: r.submitted_at,
  })).filter((r: { body: string; decision: string }) => r.body.length > 0 || r.decision !== "COMMENTED")

  // Inline diff comments
  const diffComments = (inlineComments || []).map((c: {
    body?: string
    user?: { login?: string }
    path?: string
    position?: number
  }) => ({
    body: c.body || "",
    user: c.user?.login || "reviewer",
    isReview: false,
    decision: undefined,
    path: c.path,
    position: c.position,
  })).filter((c: { body: string }) => c.body.length > 0)

  const allComments = [...reviewDecisions, ...diffComments]

  const ciSummary = ciChecks?.check_runs
    ? (ciChecks.check_runs as Array<{ name: string; conclusion: string | null; status: string }>)
        .map(c => ({ name: c.name, conclusion: c.conclusion, status: c.status }))
    : []

  const translation = await translatePRDiff(
    pr.title,
    pr.body || "",
    files || [],
    allComments
  )

  return NextResponse.json({
    pr: {
      number: pr.number,
      title: pr.title,
      body: pr.body,
      url: pr.html_url,
      mergedAt: pr.merged_at,
      author: pr.user?.login,
      headSha: pr.head?.sha,
      baseBranch: pr.base?.ref,
    },
    files: (files || []).map((f: { filename: string; status: string; additions: number; deletions: number; patch?: string }) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch,
    })),
    reviews: reviewDecisions,
    comments: diffComments,
    ciChecks: ciSummary,
    translation,
  })
}
