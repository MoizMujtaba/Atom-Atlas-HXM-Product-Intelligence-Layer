const GITHUB_TOKEN = process.env.GITHUB_TOKEN!
const ORG = "atlashxm"
const REPOS = ["Atlas-Webapp", "Atlas-Frontend", "Payments-Backend", "Atlas-HCM-BE"]

const TEAM_MAP: Record<string, string> = {
  "WFM1-": "WFM 1", "WFM2-": "WFM 2", "WFM3-": "WFM 3",
  "FNM1-": "FNM 1", "FNM2-": "FNM 2", "PAY-": "PAY",
  "DATA-": "Data Platform",
}

export function detectTeam(title: string): string {
  for (const [prefix, team] of Object.entries(TEAM_MAP)) {
    if (title.toUpperCase().startsWith(prefix)) return team
  }
  return "Platform"
}

async function ghFetch(path: string) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
    next: { revalidate: 3600 },
  })
  if (!res.ok) return null
  return res.json()
}

export async function getMergedPRs() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const all: MergedPR[] = []

  await Promise.all(
    REPOS.map(async (repo) => {
      const prs = await ghFetch(
        `/repos/${ORG}/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=30`
      )
      if (!prs) return
      for (const pr of prs) {
        if (pr.merged_at && pr.merged_at > since) {
          all.push({
            number: pr.number,
            title: pr.title,
            repo,
            team: detectTeam(pr.title),
            mergedAt: pr.merged_at,
            url: pr.html_url,
          })
        }
      }
    })
  )

  return all.sort((a, b) => new Date(b.mergedAt).getTime() - new Date(a.mergedAt).getTime())
}

export interface MergedPR {
  number: number
  title: string
  repo: string
  team: string
  mergedAt: string
  url: string
}
