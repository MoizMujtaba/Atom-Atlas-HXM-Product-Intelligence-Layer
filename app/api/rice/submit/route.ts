import { NextRequest, NextResponse } from "next/server"
import { loadSubmissions, saveSubmissions } from "@/lib/rice-submissions"
import type { RiceSubmission } from "@/lib/rice-submissions"

const REACH_MAP: Record<string, number> = {
  "<50": 25,
  "50-200": 125,
  "200-500": 350,
  "500-1000": 750,
  "1000+": 1500,
}

const IMPACT_MAP: Record<string, number> = {
  "Minor annoyance": 10,
  "Slows people down": 25,
  "Blocks some work": 40,
  "Revenue at risk": 65,
  "Compliance risk": 85,
}

const CONFIDENCE_MAP: Record<string, number> = {
  "Gut feeling": 20,
  "One person told me": 35,
  "Multiple reports": 55,
  "I have data": 75,
  "We measured it": 90,
}

const SIGNAL_TYPE_MAP: Record<string, string> = {
  "Something broken": "friction",
  "Missing feature": "gap",
  "Competitor has it": "competitor",
  "Migration need": "migration",
  "New idea": "new-capability",
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const reach = REACH_MAP[body.reachLabel] ?? 25
  const impact = IMPACT_MAP[body.impactLabel] ?? 10
  const confidence = CONFIDENCE_MAP[body.confidenceLabel] ?? 20
  const effort = 1

  const score = Math.round((reach * (impact / 100) * (confidence / 100)) / effort)

  const submission: RiceSubmission = {
    id: `sub-${Date.now()}`,
    title: body.title,
    pod: body.pod,
    signalType: SIGNAL_TYPE_MAP[body.signalType] ?? body.signalType,
    reachLabel: body.reachLabel,
    impactLabel: body.impactLabel,
    confidenceLabel: body.confidenceLabel,
    reach,
    impact,
    confidence,
    effort,
    score,
    evidence: body.evidence || "",
    submitter: body.submitter || "",
    createdAt: new Date().toISOString().split("T")[0],
  }

  const submissions = loadSubmissions()
  submissions.push(submission)
  saveSubmissions(submissions)

  return NextResponse.json({ ok: true, score })
}
