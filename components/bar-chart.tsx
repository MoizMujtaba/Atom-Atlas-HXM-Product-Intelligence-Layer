/**
 * CSS-based horizontal bar chart — no SVG, SSR-safe, uses Atlas CSS vars.
 * `max` defaults to the highest value in the dataset (for relative bars)
 * or pass an explicit `max` (e.g. 100 for percentages).
 */
export default function BarChart({
  data,
  max,
}: {
  data: { label: string; value: number; color?: string; suffix?: string }[]
  max?: number
}) {
  const effectiveMax = max ?? Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="space-y-2.5">
      {data.map((d) => {
        const pct = Math.round((d.value / effectiveMax) * 100)
        return (
          <div key={d.label} className="flex items-center gap-3">
            <span
              className="text-[12px] min-w-[80px] max-w-[120px] truncate"
              style={{ color: "var(--atlas-gray-900)", opacity: 0.7 }}
            >
              {d.label}
            </span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--atlas-gray-300)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: d.color ?? "var(--atlas-blue-500)",
                }}
              />
            </div>
            <span
              className="text-[12px] font-semibold tabular-nums shrink-0 text-right"
              style={{ color: "var(--atlas-gray-900)", minWidth: 28 }}
            >
              {d.value}{d.suffix ?? ""}
            </span>
          </div>
        )
      })}
    </div>
  )
}
