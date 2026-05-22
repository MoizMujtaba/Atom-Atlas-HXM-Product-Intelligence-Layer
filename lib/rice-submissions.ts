import fs from "fs"
import path from "path"

export interface RiceSubmission {
  id: string
  title: string
  pod: string
  signalType: string
  reachLabel: string
  impactLabel: string
  confidenceLabel: string
  reach: number
  impact: number
  confidence: number
  effort: number
  score: number
  evidence?: string
  submitter?: string
  createdAt: string
}

const DATA_PATH = path.join(process.cwd(), "data", "rice-submissions.json")

export function loadSubmissions(): RiceSubmission[] {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8")
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveSubmissions(submissions: RiceSubmission[]) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true })
  fs.writeFileSync(DATA_PATH, JSON.stringify(submissions, null, 2))
}
