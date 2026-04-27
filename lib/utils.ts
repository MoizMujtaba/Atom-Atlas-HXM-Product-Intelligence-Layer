import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calcRICE(reach: number, impact: number, confidence: number, effort: number): number {
  if (effort === 0) return 0
  return Math.round((reach * impact * (confidence / 100)) / effort)
}

export function riceLabel(score: number): { label: string; color: string } {
  if (score >= 300) return { label: "Ship it", color: "text-green-400" }
  if (score >= 200) return { label: "Strong", color: "text-emerald-400" }
  if (score >= 100) return { label: "Validate", color: "text-yellow-400" }
  if (score >= 50) return { label: "Monitor", color: "text-orange-400" }
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
