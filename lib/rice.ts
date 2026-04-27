import fs from "fs"
import path from "path"

export interface RiceHypothesis {
  id: string
  title: string
  pod: string
  source: string
  signalType: "friction" | "new-capability" | "gap" | "competitor" | "migration"
  reach: number
  impact: number
  confidence: number
  effort: number
  score: number
  status: "active" | "in-observation" | "shipped" | "dismissed"
  createdAt: string
  updatedAt: string
  evidence?: string
  linearUrl?: string
}

const DATA_PATH = path.join(process.cwd(), "data", "rice-scores.json")

export function loadHypotheses(): RiceHypothesis[] {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8")
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveHypotheses(hypotheses: RiceHypothesis[]) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true })
  fs.writeFileSync(DATA_PATH, JSON.stringify(hypotheses, null, 2))
}

export function calcScore(r: number, i: number, c: number, e: number): number {
  if (e === 0) return 0
  return Math.round((r * i * (c / 100)) / e)
}
