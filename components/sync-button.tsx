"use client"
import { useState, useEffect, useCallback } from "react"

type State = "idle" | "triggering" | "running" | "done" | "error"

export default function SyncButton() {
  const [state, setState] = useState<State>("idle")
  const [startedAt, setStartedAt] = useState<string | null>(null)

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/sync", { cache: "no-store" })
      const data = await res.json()
      if (data.status === "in_progress" || data.status === "queued") {
        setState("running")
        setStartedAt(data.startedAt)
        setTimeout(checkStatus, 8000)
      } else if (data.status === "completed") {
        setState(data.conclusion === "success" ? "done" : "error")
        setStartedAt(data.startedAt)
        if (data.conclusion === "success") {
          // Reload after a short delay to pick up new data from Vercel redeploy
          setTimeout(() => window.location.reload(), 30000)
        }
      }
    } catch {
      // silent — don't crash the nav
    }
  }, [])

  useEffect(() => { checkStatus() }, [checkStatus])

  async function trigger() {
    setState("triggering")
    try {
      const res = await fetch("/api/sync", { method: "POST" })
      if (res.ok) {
        setState("running")
        setTimeout(checkStatus, 5000)
      } else {
        setState("error")
        setTimeout(() => setState("idle"), 4000)
      }
    } catch {
      setState("error")
      setTimeout(() => setState("idle"), 4000)
    }
  }

  const disabled = state === "triggering" || state === "running"

  const elapsed = startedAt
    ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
    : null

  return (
    <button
      onClick={trigger}
      disabled={disabled}
      title={
        state === "running" && elapsed != null
          ? `Sync running — ${elapsed}s elapsed. Vercel will redeploy when done.`
          : state === "done"
          ? "Sync complete — page will refresh shortly"
          : "Trigger a data refresh via GitHub Actions"
      }
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-medium transition-colors border ${
        state === "done"
          ? "border-green-300 bg-green-50 text-green-700"
          : state === "error"
          ? "border-red-200 bg-red-50 text-red-600"
          : state === "running" || state === "triggering"
          ? "border-gray-200 bg-gray-50 text-gray-400 cursor-wait"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
      }`}
    >
      {(state === "running" || state === "triggering") && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
      )}
      {state === "done" && <span className="shrink-0">✓</span>}
      {state === "idle" && (
        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )}
      {state === "idle" ? "Sync" :
       state === "triggering" ? "Starting…" :
       state === "running" ? "Syncing…" :
       state === "done" ? "Synced" : "Failed"}
    </button>
  )
}
