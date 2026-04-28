import { NextResponse } from "next/server"

const OWNER = "MoizMujtaba"
const REPO = "Atom-Atlas-HXM-Product-Intelligence-Layer"
const WORKFLOW = "atom-refresh.yml"
const GH_BASE = "https://api.github.com"

function ghHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  }
}

// POST — trigger workflow_dispatch
export async function POST() {
  if (!process.env.GITHUB_TOKEN) {
    return NextResponse.json({ error: "GITHUB_TOKEN not set" }, { status: 500 })
  }
  const res = await fetch(
    `${GH_BASE}/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    { method: "POST", headers: ghHeaders(), body: JSON.stringify({ ref: "main" }) }
  )
  if (res.status === 204) return NextResponse.json({ ok: true })
  const text = await res.text()
  return NextResponse.json({ error: text }, { status: res.status })
}

// GET — latest workflow run status
export async function GET() {
  if (!process.env.GITHUB_TOKEN) {
    return NextResponse.json({ status: "unknown" })
  }
  const res = await fetch(
    `${GH_BASE}/repos/${OWNER}/${REPO}/actions/runs?workflow_id=${WORKFLOW}&per_page=1`,
    { headers: ghHeaders(), cache: "no-store" }
  )
  if (!res.ok) return NextResponse.json({ status: "unknown" })
  const data = await res.json()
  const run = data.workflow_runs?.[0]
  if (!run) return NextResponse.json({ status: "idle" })
  return NextResponse.json({
    status: run.status,         // queued | in_progress | completed
    conclusion: run.conclusion, // success | failure | null
    startedAt: run.run_started_at,
    url: run.html_url,
  })
}
