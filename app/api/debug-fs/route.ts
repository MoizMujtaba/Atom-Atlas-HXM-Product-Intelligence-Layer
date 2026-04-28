import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

export async function GET() {
  const cwd = process.cwd()
  const dataPath = path.join(cwd, "data", "atom-output")
  let files: string[] = []
  let cyclesExists = false
  let cyclesSize = 0

  try {
    files = fs.readdirSync(dataPath)
  } catch {
    files = []
  }

  try {
    const cyclePath = path.join(dataPath, "linear-cycles.json")
    const stat = fs.statSync(cyclePath)
    cyclesExists = true
    cyclesSize = stat.size
  } catch {
    cyclesExists = false
  }

  return NextResponse.json({ cwd, dataPath, files, cyclesExists, cyclesSize })
}
