import SignalCard from "@/components/sentinel/signal-card"
import PieChart from "@/components/sentinel/pie-chart"
import SentinelSubNav from "@/components/sentinel/sub-nav"
import {
  getProductIntelligence,
  getSentinelSources,
  type ProductIntelligenceSignal,
} from "@/lib/atom-data"

export const dynamic = "force-static"

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function overlapLabel(rate: number): string {
  return `${Math.round(rate * 100)}%`
}

type ThemeCluster = "Compliance & Country" | "Pricing & Proposal" | "Qualification & Buying Journey" | "Other"

const CLUSTER_FOR_THEME: Record<string, ThemeCluster> = {
  "Compliance feasibility pre-check": "Compliance & Country",
  "Country rule complexity": "Compliance & Country",
  "Country-specific payroll explanation": "Compliance & Country",
  "Risk and liability assessment": "Compliance & Country",
  "Pricing transparency": "Pricing & Proposal",
  "Proposal friction": "Pricing & Proposal",
  "Demo and proposal detail": "Pricing & Proposal",
  "Platform demo and proposal": "Pricing & Proposal",
  "Qualification expectations": "Qualification & Buying Journey",
  "Lost after early alignment": "Qualification & Buying Journey",
}

function clusterFor(signal: ProductIntelligenceSignal): ThemeCluster {
  return CLUSTER_FOR_THEME[signal.theme] ?? "Other"
}

function outcomeKind(outcome: string): "won" | "lost" | "open" {
  const v = outcome.toLowerCase()
  if (v.includes("closed won")) return "won"
  if (v.includes("closed lost")) return "lost"
  return "open"
}

function StatTile({
  label,
  value,
  accent,
  caption,
  dark,
}: {
  label: string
  value: string | number
  accent: string
  caption?: string
  dark?: boolean
}) {
  return (
    <div
      className="rounded-2xl px-4 py-4 shadow-sm border"
      style={{
        background: dark ? "var(--atlas-blue-900)" : "white",
        borderColor: dark ? "var(--atlas-blue-900)" : "var(--atlas-gray-300)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-1.5 h-3 rounded-full"
          style={{ background: accent }}
          aria-hidden
        />
        <p
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: dark ? "var(--atlas-blue-250)" : "var(--atlas-gray-900)", opacity: dark ? 1 : 0.6 }}
        >
          {label}
        </p>
      </div>
      <p
        className="text-3xl font-extrabold mt-2 tracking-tight"
        style={{ color: dark ? "white" : "var(--atlas-gray-900)" }}
      >
        {value}
      </p>
      {caption && (
        <p
          className="text-[11px] mt-1"
          style={{ color: dark ? "var(--atlas-blue-250)" : "var(--atlas-gray-900)", opacity: dark ? 1 : 0.55 }}
        >
          {caption}
        </p>
      )}
    </div>
  )
}

function SmartSignal({
  accent,
  tint,
  eyebrow,
  headline,
  detail,
}: {
  accent: string
  tint: string
  eyebrow: string
  headline: string
  detail: string
}) {
  return (
    <div
      className="rounded-2xl px-5 py-4 shadow-sm h-full"
      style={{ background: "white", border: "1px solid var(--atlas-gray-300)" }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold"
          style={{ background: tint, color: accent }}
          aria-hidden
        >
          ✦
        </span>
        <p
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: accent }}
        >
          {eyebrow}
        </p>
      </div>
      <h3
        className="text-[16px] font-bold mt-2 leading-tight"
        style={{ color: "var(--atlas-gray-900)" }}
      >
        {headline}
      </h3>
      <p
        className="text-[12.5px] mt-2 leading-relaxed"
        style={{ color: "var(--atlas-gray-900)", opacity: 0.75 }}
      >
        {detail}
      </p>
    </div>
  )
}

function Cluster({
  title,
  badge,
  badgeBg,
  badgeFg,
  description,
  signals,
}: {
  title: string
  badge: string
  badgeBg: string
  badgeFg: string
  description: string
  signals: ProductIntelligenceSignal[]
}) {
  if (signals.length === 0) return null
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
            style={{ background: badgeBg, color: badgeFg }}
          >
            {badge}
          </span>
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--atlas-gray-900)" }}
          >
            {title}
          </h2>
        </div>
        <span
          className="text-[11px] font-medium"
          style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}
        >
          {signals.length} signal{signals.length === 1 ? "" : "s"}
        </span>
      </div>
      <p
        className="text-[13px] leading-relaxed -mt-1"
        style={{ color: "var(--atlas-gray-900)", opacity: 0.7 }}
      >
        {description}
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {signals.map((signal) => (
          <SignalCard key={`${title}-${signal.id}`} signal={signal} />
        ))}
      </div>
    </section>
  )
}

export default function SentinelPage() {
  const data = getProductIntelligence()
  const sourceData = getSentinelSources()

  if (!data) {
    return (
      <div className="atlas-brand">
        <p className="p-8 text-sm" style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}>
          Sentinel seed data unavailable.
        </p>
      </div>
    )
  }

  const approvedSignals = data.signals.filter((s) => s.approvalStatus === "approved")
  const draftSignals = data.signals.filter((s) => s.approvalStatus === "draft")

  const alignedSignals = approvedSignals.filter((s) => s.roadmapOverlap === "aligned")
  const adjacentSignals = approvedSignals.filter((s) => s.roadmapOverlap === "adjacent")
  const gapSignals = approvedSignals.filter((s) => s.roadmapOverlap === "gap")

  const wonSignals = approvedSignals.filter((s) => outcomeKind(s.dealOutcome) === "won")
  const lostSignals = approvedSignals.filter((s) => outcomeKind(s.dealOutcome) === "lost")
  const openSignals = approvedSignals.filter((s) => outcomeKind(s.dealOutcome) === "open")

  const overlapRate = approvedSignals.length > 0 ? alignedSignals.length / approvedSignals.length : 0

  const clusters: { key: ThemeCluster; description: string; badgeBg: string; badgeFg: string }[] = [
    {
      key: "Compliance & Country",
      description:
        "Buyer expectations on country rules, statutory benefits, and risk posture. The fastest place to win — or lose — credibility against direct EOR competitors.",
      badgeBg: "var(--atlas-blue-100)",
      badgeFg: "var(--atlas-blue-900)",
    },
    {
      key: "Pricing & Proposal",
      description:
        "How the buying journey breaks (or holds) at the pricing, proposal, and platform-walkthrough stage. Sharp signal for sales enablement and proposal templates.",
      badgeBg: "var(--atlas-purple-100)",
      badgeFg: "var(--atlas-purple-900)",
    },
    {
      key: "Qualification & Buying Journey",
      description:
        "Patterns from qualification calls and post-mortem deals — what buyers expected up-front and where momentum stalled despite early alignment.",
      badgeBg: "var(--atlas-magenta-100)",
      badgeFg: "var(--atlas-magenta-900)",
    },
    {
      key: "Other",
      description: "Signals that don't yet fit a defined cluster. Review for cluster expansion.",
      badgeBg: "var(--atlas-gray-300)",
      badgeFg: "var(--atlas-gray-900)",
    },
  ]

  // Smart signals computed from the FULL source register (562 sources)
  const summary = sourceData?.summary
  const topThemes = summary?.top_roadmap_themes ?? []
  const totalThemed = topThemes.reduce((s, t) => s + t.count, 0)
  const topTheme = topThemes[0]
  const overlapPct = summary?.overlap_rate_percent ?? Math.round(overlapRate * 100)
  const totalSources = summary?.counts.total_sources ?? approvedSignals.length
  const gapCount = summary?.overlap_counts?.gap ?? gapSignals.length
  const unmappedCount = summary?.overlap_counts?.unknown ?? 0

  // Smart signal: top closing-won/lost stage (Avoma)
  const topAvomaStage = summary?.avoma_stage_counts?.[0]

  return (
    <div className="atlas-brand space-y-10">
      <SentinelSubNav />

      {/* Brand band hero */}
      <section
        className="rounded-2xl overflow-hidden shadow-sm"
        style={{
          background:
            "linear-gradient(135deg, var(--atlas-blue-900) 0%, var(--atlas-purple-900) 60%, var(--atlas-magenta-900) 100%)",
        }}
      >
        <div className="px-6 py-7 sm:px-8 sm:py-9 text-white">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="text-[10px] font-bold tracking-[0.18em] px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(255,255,255,0.16)", color: "white" }}
                >
                  ATLAS HXM · SENTINEL
                </span>
                <span className="text-[12px]" style={{ color: "var(--atlas-blue-250)" }}>
                  Seed batch · {formatDate(data.generatedAt)}
                </span>
              </div>
              <h1 className="text-[26px] sm:text-[30px] font-bold mt-4 leading-tight tracking-tight">
                Customer voice signals, mapped to roadmap overlap.
              </h1>
              <p
                className="mt-3 text-sm leading-relaxed"
                style={{ color: "var(--atlas-blue-250)" }}
              >
                Seeded from qualification, demo, discovery, and quote-review calls. Sentinel publishes only
                approved signals to Atom and keeps draft-only normalization in the local Synapse workspace.
              </p>
              <p
                className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--atlas-blue-250)" }}
              >
                For People, By People
              </p>
            </div>
            <div
              className="rounded-xl px-4 py-4 shrink-0 backdrop-blur"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--atlas-blue-250)" }}>
                Seed Stats
              </p>
              <p className="text-sm text-white mt-2">
                <span className="font-semibold">{data.reviewedSourceCount}</span> reviewed
              </p>
              <p className="text-sm text-white">
                <span className="font-semibold">{data.approvedSignalCount}</span> published
              </p>
              <p className="text-sm" style={{ color: "var(--atlas-blue-250)" }}>
                <span className="font-semibold">{data.draftHeldBackCount}</span> held back locally
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Smart signals derived from the FULL 562-source register */}
      {summary && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.65 }}>
              Smart Signals · Full Source Library
            </h2>
            <a
              href="/sentinel/sources"
              className="ml-auto text-[12px] font-semibold"
              style={{ color: "var(--atlas-blue-500)" }}
            >
              Browse all {totalSources.toLocaleString()} sources →
            </a>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <SmartSignal
              accent="var(--atlas-blue-500)"
              tint="var(--atlas-blue-100)"
              eyebrow="Top theme"
              headline={topTheme?.theme ?? "—"}
              detail={
                topTheme
                  ? `${topTheme.count} of ${totalSources.toLocaleString()} sources (${Math.round((topTheme.count / totalSources) * 100)}%) point at this category — the densest category in the library.`
                  : "No themed sources yet."
              }
            />
            <SmartSignal
              accent="var(--atlas-magenta-500)"
              tint="var(--atlas-magenta-100)"
              eyebrow="Roadmap gap pressure"
              headline={`${gapCount} gap · ${unmappedCount} unmapped`}
              detail={`${overlapPct}% of customer-voice sources overlap with the current roadmap. The remaining ${unmappedCount.toLocaleString()} unmapped + ${gapCount} explicit gaps are where buyer expectations are running ahead of what we're building.`}
            />
            <SmartSignal
              accent="var(--atlas-purple-500)"
              tint="var(--atlas-purple-100)"
              eyebrow="Conversation gravity"
              headline={topAvomaStage ? `${topAvomaStage.stage}` : "—"}
              detail={
                topAvomaStage
                  ? `${topAvomaStage.count} of the last 100 Avoma transcripts. This is where the most customer-voice signal is actually being captured — invest enablement here first.`
                  : "No Avoma stage data yet."
              }
            />
          </div>

          {/* Pie chart: theme categorization */}
          <div
            className="rounded-2xl px-5 py-5"
            style={{ background: "white", border: "1px solid var(--atlas-gray-300)" }}
          >
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}>
                  Categorization · Roadmap Themes
                </p>
                <h3 className="text-base font-semibold mt-0.5" style={{ color: "var(--atlas-gray-900)" }}>
                  Where customer voice is concentrated
                </h3>
              </div>
              <span className="text-[11px]" style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}>
                {totalThemed.toLocaleString()} of {totalSources.toLocaleString()} sources mapped to a theme
              </span>
            </div>
            <PieChart
              data={topThemes.map((t) => ({ label: t.theme, value: t.count }))}
              title="Roadmap theme distribution"
              size={240}
            />
          </div>

          {/* Pie chart: source system + overlap */}
          <div className="grid gap-4 md:grid-cols-2">
            <div
              className="rounded-2xl px-5 py-5"
              style={{ background: "white", border: "1px solid var(--atlas-gray-300)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}>
                Source System Mix
              </p>
              <h3 className="text-base font-semibold mt-0.5 mb-4" style={{ color: "var(--atlas-gray-900)" }}>
                Where signals come from
              </h3>
              <PieChart
                data={Object.entries(summary.counts_by_system).map(([label, value], i) => ({
                  label,
                  value: value as number,
                  color: ["#5827E3", "#FF782C", "#0559FA", "#BA33CA"][i % 4],
                }))}
                size={200}
              />
            </div>
            <div
              className="rounded-2xl px-5 py-5"
              style={{ background: "white", border: "1px solid var(--atlas-gray-300)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}>
                Roadmap Overlap Mix
              </p>
              <h3 className="text-base font-semibold mt-0.5 mb-4" style={{ color: "var(--atlas-gray-900)" }}>
                Alignment of full library
              </h3>
              <PieChart
                data={[
                  { label: "Aligned", value: summary.overlap_counts.aligned ?? 0, color: "#0559FA" },
                  { label: "Adjacent", value: summary.overlap_counts.adjacent ?? 0, color: "#5827E3" },
                  { label: "Gap", value: summary.overlap_counts.gap ?? 0, color: "#BA33CA" },
                  { label: "Unknown", value: summary.overlap_counts.unknown ?? 0, color: "#E9E9E9" },
                ]}
                size={200}
              />
            </div>
          </div>
        </section>
      )}

      {/* Roadmap overlap stats — approved seed batch */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.65 }}>
            Approved Seed Batch · Overlap
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Aligned"
            value={alignedSignals.length}
            accent="var(--atlas-blue-500)"
            caption="On-roadmap, ready to story"
          />
          <StatTile
            label="Adjacent"
            value={adjacentSignals.length}
            accent="var(--atlas-purple-500)"
            caption="Near-fit, needs framing"
          />
          <StatTile
            label="Gap"
            value={gapSignals.length}
            accent="var(--atlas-magenta-500)"
            caption="Outrunning the roadmap"
          />
          <StatTile
            label="Overlap Rate"
            value={overlapLabel(overlapRate)}
            accent="var(--atlas-blue-250)"
            caption="aligned / approved"
            dark
          />
        </div>
      </section>

      {/* Outcome categorization */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.65 }}>
            Deal Outcome Mix
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Closed Won"
            value={wonSignals.length}
            accent="var(--atlas-blue-500)"
            caption="Proof points + winning patterns"
          />
          <StatTile
            label="Open"
            value={openSignals.length}
            accent="var(--atlas-orangellow-500)"
            caption="Active deals — drive enablement now"
          />
          <StatTile
            label="Closed Lost"
            value={lostSignals.length}
            accent="var(--atlas-coral-500)"
            caption="Loss themes to neutralize"
          />
        </div>
      </section>

      {/* Note */}
      <div
        className="rounded-xl px-4 py-3 text-[13px] leading-relaxed"
        style={{
          background: "var(--atlas-blue-100)",
          color: "var(--atlas-blue-900)",
          border: "1px solid var(--atlas-blue-250)",
        }}
      >
        Signals are categorized by <strong>theme cluster</strong> below — not mutually exclusive queues. A
        single signal may inform Product, Marketing, and Sales Enablement at once.
      </div>

      {/* Theme clusters */}
      <div className="space-y-10">
        {clusters.map((cluster) => {
          const signals = approvedSignals.filter((s) => clusterFor(s) === cluster.key)
          return (
            <Cluster
              key={cluster.key}
              title={cluster.key}
              badge={cluster.key}
              badgeBg={cluster.badgeBg}
              badgeFg={cluster.badgeFg}
              description={cluster.description}
              signals={signals}
            />
          )
        })}
      </div>

      {/* Approval queue */}
      {draftSignals.length > 0 && (
        <Cluster
          title="Approval Queue"
          badge="Draft · Held Back"
          badgeBg="var(--atlas-orangellow-100)"
          badgeFg="#5A3A0B"
          description="Drafts are intentionally kept out of the published dataset until they have better evidence or cleaner source linkage."
          signals={draftSignals}
        />
      )}

      <footer
        className="pt-8 mt-2 border-t flex items-center justify-between text-[11px]"
        style={{ borderColor: "var(--atlas-gray-300)", color: "var(--atlas-gray-900)", opacity: 0.55 }}
      >
        <span>Atlas HXM · Sentinel · Product Intelligence Layer</span>
        <span>For People, By People</span>
      </footer>
    </div>
  )
}
