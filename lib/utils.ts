import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Effort scale: 1w=1, 2w=3, 3w=5, 4w=7 (non-linear penalty)
export const EFFORT_OPTIONS = [
  { value: 0.5, label: "3 days" },
  { value: 1,   label: "1 week" },
  { value: 3,   label: "2 weeks" },
  { value: 5,   label: "3 weeks" },
  { value: 7,   label: "4 weeks" },
]

// Impact and confidence are percentages (0–100), divided internally
export function calcRICE(reach: number, impact: number, confidence: number, effort: number): number {
  if (effort === 0) return 0
  return Math.round((reach * (impact / 100) * (confidence / 100)) / effort)
}

export function riceLabel(score: number): { label: string; color: string } {
  if (score >= 600) return { label: "Ship it", color: "text-green-400" }
  if (score >= 300) return { label: "Strong", color: "text-emerald-400" }
  if (score >= 100) return { label: "Validate", color: "text-yellow-400" }
  if (score >= 40)  return { label: "Monitor", color: "text-orange-400" }
  return { label: "Hypothesis", color: "text-zinc-500" }
}

export function wowTrend(current: number, previous: number): string {
  if (previous === 0) return "+∞%"
  const pct = Math.round(((current - previous) / previous) * 100)
  return pct >= 0 ? `+${pct}%` : `${pct}%`
}

export function wowColor(current: number, previous: number, higherIsBetter = true): string {
  const up = current >= previous
  const good = higherIsBetter ? up : !up
  return good ? "text-green-400" : "text-red-400"
}
