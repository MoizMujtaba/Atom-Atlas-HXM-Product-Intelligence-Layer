type Slice = {
  label: string
  value: number
  color: string
}

const ATLAS_PALETTE = [
  "#0559FA", // Blue 500
  "#5827E3", // Purple 500
  "#BA33CA", // Magenta 500
  "#FF782C", // Orangellow 500
  "#FF595A", // Coral 500
  "#82ACFC", // Blue 250
  "#AB93F1", // Purple 250
  "#DD98E5", // Magenta 250
  "#F6B942", // Orangellow 300
  "#FF8F77", // Coral 300
  "#06195E", // Blue 900
]

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const a = ((angle - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polarToCartesian(cx, cy, r, end)
  const e = polarToCartesian(cx, cy, r, start)
  const large = end - start <= 180 ? 0 : 1
  return `M ${cx} ${cy} L ${e.x} ${e.y} A ${r} ${r} 0 ${large} 0 ${s.x} ${s.y} Z`
}

export default function PieChart({
  data,
  title,
  size = 220,
}: {
  data: { label: string; value: number; color?: string }[]
  title?: string
  size?: number
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return null

  const slices: Slice[] = data.map((d, i) => ({
    label: d.label,
    value: d.value,
    color: d.color ?? ATLAS_PALETTE[i % ATLAS_PALETTE.length],
  }))

  let cursor = 0
  const arcs = slices.map((s) => {
    const start = cursor
    const sweep = (s.value / total) * 360
    cursor += sweep
    return { ...s, start, end: start + sweep }
  })

  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 6

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={title ?? "Pie chart"}>
        {arcs.length === 1 ? (
          <circle cx={cx} cy={cy} r={r} fill={arcs[0].color} />
        ) : (
          arcs.map((a, i) => (
            <path
              key={i}
              d={arcPath(cx, cy, r, a.start, a.end)}
              fill={a.color}
              stroke="white"
              strokeWidth={1.5}
            />
          ))
        )}
        <circle cx={cx} cy={cy} r={r * 0.5} fill="white" />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize={28}
          fontWeight={800}
          fill="var(--atlas-gray-900)"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fontSize={10}
          fontWeight={600}
          fill="var(--atlas-gray-900)"
          opacity={0.55}
          style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
        >
          Total
        </text>
      </svg>

      <ul className="flex-1 grid gap-1.5 min-w-0 w-full">
        {arcs.map((a, i) => {
          const pct = Math.round((a.value / total) * 100)
          return (
            <li key={i} className="flex items-center gap-2.5 text-[13px]">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ background: a.color }}
                aria-hidden
              />
              <span className="flex-1 truncate" style={{ color: "var(--atlas-gray-900)" }}>
                {a.label}
              </span>
              <span
                className="font-semibold tabular-nums"
                style={{ color: "var(--atlas-gray-900)" }}
              >
                {a.value}
              </span>
              <span
                className="tabular-nums text-[12px] w-10 text-right"
                style={{ color: "var(--atlas-gray-900)", opacity: 0.55 }}
              >
                {pct}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
