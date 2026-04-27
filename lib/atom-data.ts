import fs from "fs"
import path from "path"

const OUT = path.join(process.cwd(), "data", "atom-output")

function read<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(OUT, file), "utf-8"))
  } catch {
    return fallback
  }
}

export interface ExecMetrics {
  generatedAt: string
  period: string
  ssoAttempts: number
  ssoSuccess: number
  ssoFailed: number
  ssoSuccessRate: number
  ssoAttemptsPrev: number
  ssoSuccessPrev: number
  ssoSuccessRatePrev: number
  exceptions: number
  exceptionsPrev: number
  rageclicks: number
  rageclicksPrev: number
  pageviews: number
  pageviewsPrev: number
}

export function getExecMetrics(): ExecMetrics | null {
  return read<ExecMetrics | null>("exec-metrics.json", null)
}

export function getWeeklyEvents() {
  return read<{ event: string; thisWeek: number; lastWeek: number }[]>("weekly-events.json", [])
}

export function getMergedPRs() {
  return read<AtomPR[]>("merged-prs.json", [])
}

export interface AtomPR {
  number: number
  repo: string
  team: string
  title: string
  url: string
  mergedAt: string
  author: string | null
  fileCount: number | null
  translation: {
    signalType: string
    userImpact: string
    migrationSignal: boolean
    frictionFixed: string | null
    newCapability: string | null
    watchItems: string[]
  }
}
