"use client"
import Link from "next/link"
import { useMemo, useState } from "react"
import type { SentinelSourceRow } from "@/lib/atom-data"

const OVERLAP_COLORS: Record<string, { bg: string; fg: string }> = {
  aligned: { bg: "var(--atlas-blue-100)", fg: "var(--atlas-blue-900)" },
  adjacent: { bg: "var(--atlas-purple-100)", fg: "var(--atlas-purple-900)" },
  gap: { bg: "var(--atlas-magenta-100)", fg: "var(--atlas-magenta-900)" },
  unknown: { bg: "var(--atlas-gray-300)", fg: "var(--atlas-gray-900)" },
}

const SYSTEM_COLORS: Record<string, { bg: string; fg: string }> = {
  Avoma: { bg: "var(--atlas-purple-100)", fg: "var(--atlas-purple-900)" },
  HubSpot: { bg: "var(--atlas-orangellow-100)", fg: "#5A3A0B" },
  Roadmap: { bg: "var(--atlas-blue-100)", fg: "var(--atlas-blue-900)" },
}

function clip(text: string, max: number): string {
  if (!text) return ""
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text
}

const PAGE_SIZE = 30

export default function SourceDirectory({ rows }: { rows: SentinelSourceRow[] }) {
  const [system, setSystem] = useState<string>("all")
  const [overlap, setOverlap] = useState<string>("all")
  const [theme, setTheme] = useState<string>("all")
  const [query, setQuery] = useState<string>("")
  const [view, setView] = useState<"table" | "cards">("table")
  const [page, setPage] = useState<number>(1)

  const themes = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.roadmap_theme).filter(Boolean))).sort()
  }, [rows])

  const systems = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.source_system))).sort()
  }, [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (system !== "all" && r.source_system !== system) return false
      if (overlap !== "all" && r.roadmap_overlap !== overlap) return false
      if (theme !== "all" && r.roadmap_theme !== theme) return false
      if (q) {
        const hay = (
          r.title +
          " " +
          r.company_or_counterparty +
          " " +
          r.description +
          " " +
          r.notes +
          " " +
          r.roadmap_theme
        ).toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [rows, system, overlap, theme, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const visible = filtered.slice(start, start + PAGE_SIZE)

  const reset = () => {
    setSystem("all")
    setOverlap("all")
    setTheme("all")
    setQuery("")
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div
        className="rounded-2xl px-4 py-3 flex flex-wrap items-center gap-2"
        style={{
          background: "white",
          border: "1px solid var(--atlas-gray-300)",
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
          placeholder="Search title, company, notes…"
          className="flex-1 min-w-[200px] px-3 py-1.5 rounded-full text-[13px] outline-none"
          style={{
            background: "var(--atlas-gray-50)",
            border: "1px solid var(--atlas-gray-300)",
            color: "var(--atlas-gray-900)",
          }}
        />
        <select
          value={system}
          onChange={(e) => {
            setSystem(e.target.value)
            setPage(1)
          }}
          className="px-3 py-1.5 rounded-full text-[12px] font-medium outline-none"
          style={{
            background: "var(--atlas-gray-50)",
            border: "1px solid var(--atlas-gray-300)",
            color: "var(--atlas-gray-900)",
          }}
        >
          <option value="all">All systems</option>
          {systems.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={overlap}
          onChange={(e) => {
            setOverlap(e.target.value)
            setPage(1)
          }}
          className="px-3 py-1.5 rounded-full text-[12px] font-medium outline-none"
          style={{
            background: "var(--atlas-gray-50)",
            border: "1px solid var(--atlas-gray-300)",
            color: "var(--atlas-gray-900)",
          }}
        >
          <option value="all">All overlap</option>
          <option value="aligned">Aligned</option>
          <option value="adjacent">Adjacent</option>
          <option value="gap">Gap</option>
          <option value="unknown">Unknown</option>
        </select>
        <select
          value={theme}
          onChange={(e) => {
            setTheme(e.target.value)
            setPage(1)
          }}
          className="px-3 py-1.5 rounded-full text-[12px] font-medium outline-none max-w-[200px]"
          style={{
            background: "var(--atlas-gray-50)",
            border: "1px solid var(--atlas-gray-300)",
            color: "var(--atlas-gray-900)",
          }}
        >
          <option value="all">All themes</option>
          {themes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          onClick={reset}
          className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
          style={{
            color: "var(--atlas-blue-500)",
          }}
        >
          Reset
        </button>
        <div
          className="ml-auto inline-flex rounded-full p-0.5"
          style={{
            background: "var(--atlas-gray-50)",
            border: "1px solid var(--atlas-gray-300)",
          }}
        >
          <button
            onClick={() => setView("table")}
            className="text-[11px] font-semibold px-3 py-1 rounded-full"
            style={
              view === "table"
                ? { background: "var(--atlas-blue-900)", color: "white" }
                : { color: "var(--atlas-gray-900)" }
            }
          >
            Table
          </button>
          <button
            onClick={() => setView("cards")}
            className="text-[11px] font-semibold px-3 py-1 rounded-full"
            style={
              view === "cards"
                ? { background: "var(--atlas-blue-900)", color: "white" }
                : { color: "var(--atlas-gray-900)" }
            }
          >
            Cards
          </button>
        </div>
      </div>

      <p className="text-[12px]" style={{ color: "var(--atlas-gray-900)", opacity: 0.65 }}>
        {filtered.length.toLocaleString()} of {rows.length.toLocaleString()} sources · page {safePage} of {totalPages}
      </p>

      {/* Table view */}
      {view === "table" && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--atlas-gray-300)", background: "white" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]" style={{ color: "var(--atlas-gray-900)" }}>
              <thead style={{ background: "var(--atlas-gray-50)" }}>
                <tr className="text-left">
                  <th className="px-3 py-2.5 font-semibold uppercase tracking-wider text-[10.5px]">System</th>
                  <th className="px-3 py-2.5 font-semibold uppercase tracking-wider text-[10.5px]">Date</th>
                  <th className="px-3 py-2.5 font-semibold uppercase tracking-wider text-[10.5px]">Title</th>
                  <th className="px-3 py-2.5 font-semibold uppercase tracking-wider text-[10.5px]">Stage / Purpose</th>
                  <th className="px-3 py-2.5 font-semibold uppercase tracking-wider text-[10.5px]">Theme</th>
                  <th className="px-3 py-2.5 font-semibold uppercase tracking-wider text-[10.5px]">Overlap</th>
                  <th className="px-3 py-2.5 font-semibold uppercase tracking-wider text-[10.5px]"></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const sys = SYSTEM_COLORS[r.source_system] ?? { bg: "var(--atlas-gray-300)", fg: "var(--atlas-gray-900)" }
                  const ol = OVERLAP_COLORS[r.roadmap_overlap] ?? OVERLAP_COLORS.unknown
                  return (
                    <tr key={r.row_id} style={{ borderTop: "1px solid var(--atlas-gray-300)" }}>
                      <td className="px-3 py-2.5 align-top">
                        <span
                          className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: sys.bg, color: sys.fg }}
                        >
                          {r.source_system}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 align-top tabular-nums" style={{ opacity: 0.7 }}>
                        {r.source_date || "—"}
                      </td>
                      <td className="px-3 py-2.5 align-top max-w-[340px]">
                        <Link
                          href={`/sentinel/sources/${encodeURIComponent(r.row_id)}`}
                          className="font-semibold hover:underline"
                          style={{ color: "var(--atlas-blue-500)" }}
                        >
                          {clip(r.title, 80) || "(untitled)"}
                        </Link>
                        <div className="text-[11px] mt-0.5" style={{ opacity: 0.65 }}>
                          {clip(r.company_or_counterparty, 70)}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 align-top text-[11.5px]" style={{ opacity: 0.8 }}>
                        {r.stage_or_purpose || "—"}
                      </td>
                      <td className="px-3 py-2.5 align-top text-[11.5px]" style={{ opacity: 0.8 }}>
                        {r.roadmap_theme || "—"}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <span
                          className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                          style={{ background: ol.bg, color: ol.fg }}
                        >
                          {r.roadmap_overlap}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 align-top text-right">
                        <Link
                          href={`/sentinel/sources/${encodeURIComponent(r.row_id)}`}
                          className="text-[11px] font-semibold"
                          style={{ color: "var(--atlas-blue-500)" }}
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-[13px]" style={{ opacity: 0.6 }}>
                      No sources match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Card view */}
      {view === "cards" && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((r) => {
            const sys = SYSTEM_COLORS[r.source_system] ?? { bg: "var(--atlas-gray-300)", fg: "var(--atlas-gray-900)" }
            const ol = OVERLAP_COLORS[r.roadmap_overlap] ?? OVERLAP_COLORS.unknown
            return (
              <Link
                key={r.row_id}
                href={`/sentinel/sources/${encodeURIComponent(r.row_id)}`}
                className="rounded-2xl p-4 block hover:shadow-md transition-shadow"
                style={{
                  background: "white",
                  border: "1px solid var(--atlas-gray-300)",
                }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: sys.bg, color: sys.fg }}
                  >
                    {r.source_system}
                  </span>
                  <span
                    className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                    style={{ background: ol.bg, color: ol.fg }}
                  >
                    {r.roadmap_overlap}
                  </span>
                  <span className="text-[11px] tabular-nums" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>
                    {r.source_date || "—"}
                  </span>
                </div>
                <h3
                  className="mt-2 text-[14px] font-semibold leading-snug"
                  style={{ color: "var(--atlas-gray-900)" }}
                >
                  {clip(r.title, 110) || "(untitled)"}
                </h3>
                <p className="text-[12px] mt-1" style={{ color: "var(--atlas-gray-900)", opacity: 0.65 }}>
                  {clip(r.company_or_counterparty, 80)}
                </p>
                {r.roadmap_theme && (
                  <p className="text-[11.5px] mt-2" style={{ color: "var(--atlas-purple-500)" }}>
                    {r.roadmap_theme}
                  </p>
                )}
              </Link>
            )
          })}
          {visible.length === 0 && (
            <div className="md:col-span-2 xl:col-span-3 text-center py-10 text-[13px]" style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}>
              No sources match the current filters.
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <button
          onClick={() => setPage(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
          className="text-[12px] font-semibold px-3 py-1.5 rounded-full disabled:opacity-40"
          style={{
            background: "white",
            border: "1px solid var(--atlas-gray-300)",
            color: "var(--atlas-gray-900)",
          }}
        >
          ← Prev
        </button>
        <span className="text-[12px]" style={{ color: "var(--atlas-gray-900)", opacity: 0.65 }}>
          Page {safePage} / {totalPages}
        </span>
        <button
          onClick={() => setPage(Math.min(totalPages, safePage + 1))}
          disabled={safePage === totalPages}
          className="text-[12px] font-semibold px-3 py-1.5 rounded-full disabled:opacity-40"
          style={{
            background: "white",
            border: "1px solid var(--atlas-gray-300)",
            color: "var(--atlas-gray-900)",
          }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
