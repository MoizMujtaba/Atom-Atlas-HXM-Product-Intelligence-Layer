import Link from "next/link"
import { notFound } from "next/navigation"
import SentinelSubNav from "@/components/sentinel/sub-nav"
import { getSentinelSources, type SentinelSourceRow } from "@/lib/atom-data"

export const dynamic = "force-static"
export const dynamicParams = false

export function generateStaticParams() {
  const data = getSentinelSources()
  if (!data) return []
  return data.rows.map((row) => ({ id: encodeURIComponent(row.row_id) }))
}

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        className="text-[10px] font-bold uppercase tracking-wider"
        style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}
      >
        {label}
      </p>
      <div className="text-[13px] mt-1 leading-relaxed" style={{ color: "var(--atlas-gray-900)" }}>
        {children}
      </div>
    </div>
  )
}

function formatAmount(value: SentinelSourceRow["deal_amount"]): string | null {
  if (value === null || value === undefined || value === "") return null
  if (typeof value === "number") return `$${value.toLocaleString()}`
  return String(value)
}

export default async function SourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const decoded = decodeURIComponent(id)
  const data = getSentinelSources()
  if (!data) notFound()

  const row = data.rows.find((r) => r.row_id === decoded)
  if (!row) notFound()

  const sys = SYSTEM_COLORS[row.source_system] ?? { bg: "var(--atlas-gray-300)", fg: "var(--atlas-gray-900)" }
  const ol = OVERLAP_COLORS[row.roadmap_overlap] ?? OVERLAP_COLORS.unknown
  const amount = formatAmount(row.deal_amount)

  return (
    <div className="atlas-brand space-y-6">
      <div className="space-y-3">
        <SentinelSubNav />
        <Link
          href="/sentinel/sources"
          className="text-[12px] font-semibold inline-block"
          style={{ color: "var(--atlas-blue-500)" }}
        >
          ← Back to Source Directory
        </Link>
      </div>

      <article
        className="rounded-2xl overflow-hidden"
        style={{ background: "white", border: "1px solid var(--atlas-gray-300)" }}
      >
        <div className="h-1 w-full" style={{ background: ol.fg }} aria-hidden />
        <div className="px-6 py-6 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: sys.bg, color: sys.fg }}
            >
              {row.source_system}
            </span>
            <span
              className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ background: ol.bg, color: ol.fg }}
            >
              {row.roadmap_overlap}
            </span>
            {row.confidence && row.confidence !== "none" && (
              <span
                className="text-[10.5px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{
                  border: "1px solid var(--atlas-gray-300)",
                  color: "var(--atlas-gray-900)",
                  opacity: 0.8,
                }}
              >
                {row.confidence} confidence
              </span>
            )}
            <span className="text-[11px] tabular-nums" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>
              {row.source_date || "—"}
            </span>
          </div>

          <h1
            className="text-[22px] sm:text-[26px] font-bold leading-tight tracking-tight"
            style={{ color: "var(--atlas-gray-900)" }}
          >
            {row.title || "(untitled)"}
          </h1>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Company / Counterparty">{row.company_or_counterparty || "—"}</Field>
            <Field label="Stage / Purpose">{row.stage_or_purpose || "—"}</Field>
            <Field label="Owner / Organizer">{row.owner_or_organizer || "—"}</Field>
            <Field label="Source Type">{row.source_type || "—"}</Field>
            {amount && <Field label="Deal Amount">{amount}</Field>}
            {row.outcome_signal && <Field label="Outcome Signal">{row.outcome_signal}</Field>}
            <Field label="Roadmap Theme">{row.roadmap_theme || "—"}</Field>
            <Field label="Roadmap Vertical">{row.roadmap_vertical || "—"}</Field>
          </div>

          {row.description && (
            <div
              className="rounded-xl px-4 py-3"
              style={{
                background: "var(--atlas-gray-50)",
                border: "1px solid var(--atlas-gray-300)",
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}
              >
                Description
              </p>
              <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: "var(--atlas-gray-900)" }}>
                {row.description}
              </p>
            </div>
          )}

          {row.notes && (
            <div
              className="rounded-xl px-4 py-3"
              style={{
                background: "rgba(218,230,254,0.35)",
                border: "1px solid var(--atlas-blue-100)",
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--atlas-blue-500)" }}
              >
                Notes
              </p>
              <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: "var(--atlas-gray-900)" }}>
                {row.notes}
              </p>
            </div>
          )}

          {row.roadmap_basis && (
            <div
              className="rounded-xl px-4 py-3"
              style={{
                background: "rgba(230,223,251,0.4)",
                border: "1px solid var(--atlas-purple-100)",
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--atlas-purple-500)" }}
              >
                Roadmap Match Basis
              </p>
              <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: "var(--atlas-gray-900)" }}>
                {row.roadmap_basis}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {row.source_link && (
              <a
                href={row.source_link}
                target="_blank"
                rel="noreferrer"
                className="text-[12px] font-semibold px-3 py-1.5 rounded-full"
                style={{
                  background: "var(--atlas-blue-900)",
                  color: "white",
                }}
              >
                ↗ Open primary source
              </a>
            )}
            {row.secondary_link && row.secondary_link !== row.source_link && (
              <a
                href={row.secondary_link}
                target="_blank"
                rel="noreferrer"
                className="text-[12px] font-semibold px-3 py-1.5 rounded-full"
                style={{
                  background: "var(--atlas-gray-50)",
                  color: "var(--atlas-blue-500)",
                  border: "1px solid var(--atlas-gray-300)",
                }}
              >
                ↗ Secondary link
              </a>
            )}
          </div>

          <p
            className="text-[10px] uppercase tracking-wider pt-2"
            style={{ color: "var(--atlas-gray-900)", opacity: 0.45 }}
          >
            Source ID · {row.row_id}
          </p>
        </div>
      </article>
    </div>
  )
}
