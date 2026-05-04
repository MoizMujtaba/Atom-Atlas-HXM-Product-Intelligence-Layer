import type { ProductIntelligenceSignal } from "@/lib/atom-data"

const OVERLAP_BADGE: Record<ProductIntelligenceSignal["roadmapOverlap"], { label: string; bg: string; fg: string; ring: string }> = {
  aligned: {
    label: "Aligned",
    bg: "var(--atlas-blue-100)",
    fg: "var(--atlas-blue-900)",
    ring: "var(--atlas-blue-500)",
  },
  adjacent: {
    label: "Adjacent",
    bg: "var(--atlas-purple-100)",
    fg: "var(--atlas-purple-900)",
    ring: "var(--atlas-purple-500)",
  },
  gap: {
    label: "Gap",
    bg: "var(--atlas-magenta-100)",
    fg: "var(--atlas-magenta-900)",
    ring: "var(--atlas-magenta-500)",
  },
  unknown: {
    label: "Unmapped",
    bg: "var(--atlas-gray-300)",
    fg: "var(--atlas-gray-900)",
    ring: "var(--atlas-gray-900)",
  },
}

const CONFIDENCE_RING: Record<ProductIntelligenceSignal["confidence"], string> = {
  high: "var(--atlas-blue-900)",
  medium: "var(--atlas-purple-250)",
  low: "var(--atlas-gray-300)",
}

type OutcomeKind = "won" | "lost" | "open"

function outcomeKind(outcome: string): OutcomeKind {
  const v = outcome.toLowerCase()
  if (v.includes("closed won")) return "won"
  if (v.includes("closed lost")) return "lost"
  return "open"
}

const OUTCOME_STYLE: Record<OutcomeKind, { label: string; bg: string; fg: string; border: string }> = {
  won: {
    label: "Closed Won",
    bg: "var(--atlas-blue-100)",
    fg: "var(--atlas-blue-900)",
    border: "var(--atlas-blue-500)",
  },
  lost: {
    label: "Closed Lost",
    bg: "var(--atlas-coral-100)",
    fg: "#7A1818",
    border: "var(--atlas-coral-500)",
  },
  open: {
    label: "Open",
    bg: "var(--atlas-orangellow-100)",
    fg: "#5A3A0B",
    border: "var(--atlas-orangellow-500)",
  },
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function SignalCard({ signal }: { signal: ProductIntelligenceSignal }) {
  const overlap = OVERLAP_BADGE[signal.roadmapOverlap]
  const kind = outcomeKind(signal.dealOutcome)
  const outcome = OUTCOME_STYLE[kind]
  const confidenceColor = CONFIDENCE_RING[signal.confidence]

  return (
    <article
      className="rounded-2xl bg-white shadow-sm overflow-hidden border"
      style={{ borderColor: "var(--atlas-gray-300)" }}
    >
      <div
        className="h-1 w-full"
        style={{ background: overlap.ring }}
        aria-hidden
      />

      <div className="px-5 py-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--atlas-blue-500)" }}
            >
              {signal.company}
            </p>
            <h3
              className="text-[15px] font-semibold leading-snug mt-1"
              style={{ color: "var(--atlas-gray-900)" }}
            >
              {signal.title}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: overlap.bg, color: overlap.fg }}
            >
              {overlap.label}
            </span>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{
                color: confidenceColor,
                border: `1px solid ${confidenceColor}`,
              }}
            >
              {signal.confidence} conf.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span
            className="font-medium px-2 py-0.5 rounded-full"
            style={{
              background: outcome.bg,
              color: outcome.fg,
              border: `1px solid ${outcome.border}`,
            }}
          >
            {outcome.label}
          </span>
          <span
            className="px-2 py-0.5 rounded-full"
            style={{
              background: "var(--atlas-purple-100)",
              color: "var(--atlas-purple-900)",
            }}
          >
            {signal.theme}
          </span>
          <span style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>
            Captured {formatDate(signal.capturedAt)}
          </span>
        </div>

        <p
          className="text-[13px] leading-relaxed"
          style={{ color: "var(--atlas-gray-900)", opacity: 0.85 }}
        >
          {signal.dealOutcome}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div
            className="rounded-lg border px-3 py-2.5"
            style={{
              borderColor: "var(--atlas-blue-100)",
              background: "rgba(218,230,254,0.35)",
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--atlas-blue-500)" }}
            >
              Product Signal
            </p>
            <p
              className="mt-1 text-[13px] leading-relaxed"
              style={{ color: "var(--atlas-gray-900)" }}
            >
              {signal.productSignal}
            </p>
          </div>
          <div
            className="rounded-lg border px-3 py-2.5"
            style={{
              borderColor: "var(--atlas-purple-100)",
              background: "rgba(230,223,251,0.4)",
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--atlas-purple-500)" }}
            >
              Marketing Signal
            </p>
            <p
              className="mt-1 text-[13px] leading-relaxed"
              style={{ color: "var(--atlas-gray-900)" }}
            >
              {signal.marketingSignal}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {signal.sourceLinks.map((link) => (
            <a
              key={`${signal.id}-${link.url}`}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors"
              style={{
                background: "var(--atlas-gray-50)",
                color: "var(--atlas-blue-500)",
                border: "1px solid var(--atlas-gray-300)",
              }}
            >
              ↗ {link.label}
            </a>
          ))}
        </div>
      </div>

      <div
        className="px-5 py-3.5 border-t"
        style={{
          background: "var(--atlas-blue-900)",
          borderColor: "var(--atlas-blue-900)",
        }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "var(--atlas-blue-250)" }}
        >
          Recommended Action
        </p>
        <p className="text-[13px] mt-1 leading-relaxed text-white">{signal.recommendedAction}</p>
      </div>
    </article>
  )
}
