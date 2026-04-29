import { getMergedPRs } from "@/lib/atom-data"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const prs = getMergedPRs()
  const p1Count = prs.filter(pr => pr.translation?.urgencyTier === "P1").length
  const regressions = 0 // regressions are always surfaced separately
  return NextResponse.json({ p1Count, regressions })
}
