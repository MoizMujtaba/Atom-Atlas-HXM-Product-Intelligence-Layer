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

  const [pr, files, reviews, comments] = await Promise.all([
    ghFetch(`/repos/${org}/${repo}/pulls/${number}`),
    ghFetch(`/repos/${org}/${repo}/pulls/${number}/files`),
    ghFetch(`/repos/${org}/${repo}/pulls/${number}/reviews`),
    ghFetch(`/repos/${org}/${repo}/pulls/${number}/comments`),
  ])

  if (!pr) return NextResponse.json({ error: "PR not found" }, { status: 404 })

  const allComments = [
    ...(reviews || []).map((r: { body?: string; user?: { login?: string } }) => ({
      body: r.body || "",
      user: r.user?.login || "reviewer",
    })),
    ...(comments || []).map((c: { body?: string; user?: { login?: string } }) => ({
      body: c.body || "",
      user: c.user?.login || "reviewer",
    })),
  ].filter(c => c.body.length > 0)

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
    },
    files: (files || []).map((f: { filename: string; status: string; additions: number; deletions: number; patch?: string }) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch,
    })),
    comments: allComments,
    translation,
  })
}
