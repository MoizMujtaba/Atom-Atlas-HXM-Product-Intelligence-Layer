import { NextRequest, NextResponse } from "next/server"
import { loadHypotheses, saveHypotheses, calcScore } from "@/lib/rice"
import type { RiceHypothesis } from "@/lib/rice"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const hypotheses = loadHypotheses()

  const score = calcScore(body.reach, body.impact, body.confidence, body.effort)
  const newHyp: RiceHypothesis = {
    id: `hyp-${Date.now()}`,
    title: body.title,
    pod: body.pod,
    source: body.source || "",
    signalType: body.signalType,
    reach: body.reach,
    impact: body.impact,
    confidence: body.confidence,
    effort: body.effort,
    score,
    status: "active",
    evidence: body.evidence || "",
    createdAt: new Date().toISOString().split("T")[0],
    updatedAt: new Date().toISOString().split("T")[0],
  }

  hypotheses.push(newHyp)
  saveHypotheses(hypotheses)
  return NextResponse.json({ ok: true, score })
}
