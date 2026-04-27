import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string | number
  trend?: string
  trendColor?: string
  sub?: string
  alert?: boolean
}

export default function MetricCard({ label, value, trend, trendColor, sub, alert }: MetricCardProps) {
  return (
    <div className={cn(
      "rounded-xl border p-5 flex flex-col gap-1 bg-white",
      alert ? "border-red-300 bg-red-50" : "border-gray-200"
    )}>
      <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-3xl font-semibold tabular-nums text-gray-900">{value}</span>
      {trend && (
        <span className={cn("text-sm font-medium", trendColor || "text-gray-500")}>{trend}</span>
      )}
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}
