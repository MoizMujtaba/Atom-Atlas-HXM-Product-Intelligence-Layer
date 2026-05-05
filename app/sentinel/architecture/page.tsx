import SentinelSubNav from "@/components/sentinel/sub-nav"

export const dynamic = "force-static"

export default function ArchitecturePage() {
  return (
    <div className="atlas-brand space-y-6">
      <div className="space-y-3">
        <SentinelSubNav />
        <div>
          <h1
            className="text-2xl sm:text-[28px] font-bold tracking-tight"
            style={{ color: "var(--atlas-gray-900)" }}
          >
            Sentinel Architecture
          </h1>
          <p
            className="text-[13px] mt-1 leading-relaxed max-w-3xl"
            style={{ color: "var(--atlas-gray-900)", opacity: 0.7 }}
          >
            How customer voice flows from raw call transcripts and CRM records into approved product intelligence
            published in Atom.
          </p>
        </div>
      </div>

      <ArchitectureDiagram />

      <div className="grid gap-4 lg:grid-cols-3">
        <Layer
          step="1"
          accent="var(--atlas-purple-500)"
          tint="var(--atlas-purple-100)"
          title="Capture"
          subtitle="Raw customer voice + CRM truth"
          bullets={[
            "Avoma transcripts — qualification, demo, discovery, vendor reviews",
            "HubSpot deals — last 90 days of pipeline, including outcome and amount",
            "Atlas product roadmap — official quarterly plan with vertical and theme",
          ]}
        />
        <Layer
          step="2"
          accent="var(--atlas-blue-500)"
          tint="var(--atlas-blue-100)"
          title="Synapse Normalization"
          subtitle="Local-only working layer"
          bullets={[
            "Deduplicate, classify by source system, attach metadata",
            "Match each source against roadmap themes and verticals",
            "Score roadmap overlap: aligned, adjacent, gap, unknown",
            "Compute confidence based on signal density and outcome",
          ]}
        />
        <Layer
          step="3"
          accent="var(--atlas-magenta-500)"
          tint="var(--atlas-magenta-100)"
          title="Sentinel Publication"
          subtitle="Approved signals only"
          bullets={[
            "Promote approved signals to Atom (the product intelligence app)",
            "Hold back drafts until evidence and source linkage are clean",
            "Surface action lenses: Needs Product, Needs Marketing, Aligned, Gap",
            "Persist a directory of every reviewed source for full traceability",
          ]}
        />
      </div>

      <div
        className="rounded-2xl px-6 py-5"
        style={{ background: "white", border: "1px solid var(--atlas-gray-300)" }}
      >
        <h2 className="text-base font-semibold" style={{ color: "var(--atlas-gray-900)" }}>
          Trust boundary
        </h2>
        <p
          className="text-[13px] mt-1.5 leading-relaxed max-w-3xl"
          style={{ color: "var(--atlas-gray-900)", opacity: 0.75 }}
        >
          Synapse holds raw transcripts, deal data, and unreviewed normalization. Atom only renders signals that
          have been approved with confidence ≥ medium and at least one verifiable source link. The directory
          exposes every source the layer reviewed — including drafts and unmapped rows — so reviewers can audit
          the full chain.
        </p>
      </div>
    </div>
  )
}

function Layer({
  step,
  title,
  subtitle,
  bullets,
  accent,
  tint,
}: {
  step: string
  title: string
  subtitle: string
  bullets: string[]
  accent: string
  tint: string
}) {
  return (
    <div
      className="rounded-2xl px-5 py-5 h-full"
      style={{ background: "white", border: "1px solid var(--atlas-gray-300)" }}
    >
      <div className="flex items-center gap-3">
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-[13px] font-bold"
          style={{ background: tint, color: accent }}
        >
          {step}
        </span>
        <div>
          <h3 className="text-[15px] font-semibold" style={{ color: "var(--atlas-gray-900)" }}>
            {title}
          </h3>
          <p className="text-[11px] uppercase tracking-wider" style={{ color: accent }}>
            {subtitle}
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {bullets.map((b, i) => (
          <li
            key={i}
            className="text-[12.5px] leading-relaxed pl-3.5 relative"
            style={{ color: "var(--atlas-gray-900)" }}
          >
            <span
              className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full"
              style={{ background: accent }}
              aria-hidden
            />
            {b}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ArchitectureDiagram() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "white", border: "1px solid var(--atlas-gray-300)" }}
    >
      <div className="px-6 pt-5 pb-1">
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--atlas-gray-900)", opacity: 0.6 }}>
          System Diagram
        </p>
        <h2 className="text-base font-semibold mt-1" style={{ color: "var(--atlas-gray-900)" }}>
          Sources → Synapse → Sentinel → Atom
        </h2>
      </div>
      <div className="px-4 pb-5 pt-2 overflow-x-auto">
        <svg
          viewBox="0 0 980 380"
          className="w-full h-auto"
          role="img"
          aria-label="Sentinel architecture diagram"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#160629" />
            </marker>
            <linearGradient id="atomGrad" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#06195E" />
              <stop offset="100%" stopColor="#1E046A" />
            </linearGradient>
          </defs>

          {/* Source column */}
          <SourceNode x={20} y={30} fill="#5827E3" tint="#E6DFFB" label="Avoma" sub="100 transcripts" />
          <SourceNode x={20} y={140} fill="#FF782C" tint="#F6D991" label="HubSpot" sub="431 deals · 90d" />
          <SourceNode x={20} y={250} fill="#0559FA" tint="#DAE6FE" label="Atlas Roadmap" sub="31 items · current quarter" />

          {/* Synapse node */}
          <g>
            <rect x="280" y="80" width="240" height="220" rx="14" fill="#F8F8F8" stroke="#E9E9E9" strokeWidth={1.5} />
            <text x="400" y="110" textAnchor="middle" fontSize="11" fontWeight="700" fill="#160629" letterSpacing="1.2">
              SYNAPSE · LOCAL ONLY
            </text>
            <text x="400" y="138" textAnchor="middle" fontSize="14" fontWeight="700" fill="#160629">
              Normalization Layer
            </text>
            <SubBox x={300} y={158} w={200} label="Deduplicate + classify" tint="#E6DFFB" fg="#1E046A" />
            <SubBox x={300} y={195} w={200} label="Roadmap theme match" tint="#DAE6FE" fg="#06195E" />
            <SubBox x={300} y={232} w={200} label="Overlap + confidence score" tint="#F5E0F7" fg="#48114F" />
            <SubBox x={300} y={269} w={200} label="Approval gate" tint="#FFC6C5" fg="#7A1818" />
          </g>

          {/* Sentinel node */}
          <g>
            <rect x="600" y="80" width="180" height="220" rx="14" fill="url(#atomGrad)" />
            <text x="690" y="112" textAnchor="middle" fontSize="11" fontWeight="700" fill="#82ACFC" letterSpacing="1.2">
              SENTINEL
            </text>
            <text x="690" y="138" textAnchor="middle" fontSize="14" fontWeight="700" fill="white">
              Published Signals
            </text>
            <text x="690" y="170" textAnchor="middle" fontSize="11.5" fill="#DAE6FE">
              Approved + sourced
            </text>
            <text x="690" y="190" textAnchor="middle" fontSize="11.5" fill="#DAE6FE">
              Lensed by overlap
            </text>
            <text x="690" y="210" textAnchor="middle" fontSize="11.5" fill="#DAE6FE">
              Action-routed
            </text>
            <rect x="620" y="240" width="140" height="42" rx="8" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" />
            <text x="690" y="258" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#82ACFC" letterSpacing="1.2">
              FOR PEOPLE,
            </text>
            <text x="690" y="273" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#82ACFC" letterSpacing="1.2">
              BY PEOPLE
            </text>
          </g>

          {/* Atom UI */}
          <g>
            <rect x="840" y="100" width="120" height="180" rx="14" fill="white" stroke="#E9E9E9" strokeWidth={1.5} />
            <text x="900" y="128" textAnchor="middle" fontSize="11" fontWeight="700" fill="#160629" letterSpacing="1.2">
              ATOM
            </text>
            <text x="900" y="148" textAnchor="middle" fontSize="11.5" fill="#160629" opacity="0.7">
              Insights
            </text>
            <text x="900" y="170" textAnchor="middle" fontSize="11.5" fill="#160629" opacity="0.7">
              Directory
            </text>
            <text x="900" y="192" textAnchor="middle" fontSize="11.5" fill="#160629" opacity="0.7">
              Architecture
            </text>
            <line x1="855" y1="210" x2="945" y2="210" stroke="#E9E9E9" />
            <text x="900" y="232" textAnchor="middle" fontSize="10" fill="#0559FA" fontWeight="700">
              GTM-facing
            </text>
            <text x="900" y="248" textAnchor="middle" fontSize="10" fill="#0559FA" fontWeight="700">
              Product-facing
            </text>
          </g>

          {/* Arrows */}
          <line x1="220" y1="70" x2="278" y2="160" stroke="#160629" strokeWidth={1.5} markerEnd="url(#arrow)" />
          <line x1="220" y1="180" x2="278" y2="190" stroke="#160629" strokeWidth={1.5} markerEnd="url(#arrow)" />
          <line x1="220" y1="290" x2="278" y2="220" stroke="#160629" strokeWidth={1.5} markerEnd="url(#arrow)" />
          <line x1="522" y1="190" x2="598" y2="190" stroke="#160629" strokeWidth={1.5} markerEnd="url(#arrow)" />
          <line x1="782" y1="190" x2="838" y2="190" stroke="#160629" strokeWidth={1.5} markerEnd="url(#arrow)" />

          {/* Labels for the trust boundary */}
          <line x1="560" y1="40" x2="560" y2="340" stroke="#FF595A" strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
          <text x="565" y="52" fontSize="9.5" fontWeight="700" fill="#FF595A" letterSpacing="1.2">
            TRUST BOUNDARY · APPROVAL GATE
          </text>
        </svg>
      </div>
    </div>
  )
}

function SourceNode({ x, y, fill, tint, label, sub }: { x: number; y: number; fill: string; tint: string; label: string; sub: string }) {
  return (
    <g>
      <rect x={x} y={y} width={200} height={80} rx={12} fill="white" stroke="#E9E9E9" strokeWidth={1.5} />
      <rect x={x} y={y} width={6} height={80} rx={3} fill={fill} />
      <rect x={x + 18} y={y + 14} width={36} height={20} rx={10} fill={tint} />
      <text x={x + 36} y={y + 28} textAnchor="middle" fontSize="10" fontWeight="700" fill={fill}>
        SRC
      </text>
      <text x={x + 64} y={y + 30} fontSize="14" fontWeight="700" fill="#160629">
        {label}
      </text>
      <text x={x + 18} y={y + 56} fontSize="11.5" fill="#160629" opacity="0.7">
        {sub}
      </text>
    </g>
  )
}

function SubBox({ x, y, w, label, tint, fg }: { x: number; y: number; w: number; label: string; tint: string; fg: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={28} rx={8} fill={tint} />
      <text x={x + w / 2} y={y + 18} textAnchor="middle" fontSize="11" fontWeight="600" fill={fg}>
        {label}
      </text>
    </g>
  )
}
