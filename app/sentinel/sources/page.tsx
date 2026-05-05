import SourceDirectory from "@/components/sentinel/source-directory"
import SentinelSubNav from "@/components/sentinel/sub-nav"
import { getSentinelSources } from "@/lib/atom-data"

export const dynamic = "force-static"

export default function SourcesPage() {
  const data = getSentinelSources()

  if (!data) {
    return (
      <div className="atlas-brand">
        <p className="p-8 text-sm" style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}>
          Source register unavailable.
        </p>
      </div>
    )
  }

  const { rows, summary } = data

  return (
    <div className="atlas-brand space-y-6">
      <div className="space-y-3">
        <SentinelSubNav />
        <div>
          <h1
            className="text-2xl sm:text-[28px] font-bold tracking-tight"
            style={{ color: "var(--atlas-gray-900)" }}
          >
            Source Directory
          </h1>
          <p
            className="text-[13px] mt-1 leading-relaxed max-w-3xl"
            style={{ color: "var(--atlas-gray-900)", opacity: 0.7 }}
          >
            Every input that fed the Sentinel intelligence layer — {summary.counts.total_sources.toLocaleString()} sources spanning Avoma transcripts, HubSpot deals, and the official product roadmap. Filter, search, and click any row for the full source detail.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Total Sources" value={summary.counts.total_sources} accent="var(--atlas-blue-500)" />
        <Stat label="Avoma Transcripts" value={summary.counts.avoma_transcripts} accent="var(--atlas-purple-500)" />
        <Stat label="HubSpot Deals" value={summary.counts.hubspot_deals} accent="var(--atlas-orangellow-500)" />
        <Stat label="Roadmap Items" value={summary.counts.roadmap_items} accent="var(--atlas-magenta-500)" />
        <Stat label="Overlap Rate" value={`${summary.overlap_rate_percent}%`} accent="var(--atlas-blue-900)" caption="aligned + adjacent" />
      </div>

      <SourceDirectory rows={rows} />
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
  caption,
}: {
  label: string
  value: string | number
  accent: string
  caption?: string
}) {
  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{ background: "white", border: "1px solid var(--atlas-gray-300)" }}
    >
      <div className="flex items-center gap-2">
        <span className="inline-block w-1.5 h-3 rounded-full" style={{ background: accent }} aria-hidden />
        <p
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}
        >
          {label}
        </p>
      </div>
      <p className="text-2xl font-extrabold mt-1.5 tracking-tight" style={{ color: "var(--atlas-gray-900)" }}>
        {value}
      </p>
      {caption && (
        <p className="text-[11px] mt-1" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>
          {caption}
        </p>
      )}
    </div>
  )
}
