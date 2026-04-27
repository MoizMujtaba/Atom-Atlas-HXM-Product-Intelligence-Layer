const LINEAR_API_KEY = process.env.LINEAR_API_KEY!
const LINEAR_API = "https://api.linear.app/graphql"

async function linearQuery(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(LINEAR_API, {
    method: "POST",
    headers: {
      Authorization: LINEAR_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`Linear query failed: ${res.status}`)
  return res.json()
}

export async function getTeams() {
  const data = await linearQuery(`
    query {
      teams {
        nodes {
          id name key icon
        }
      }
    }
  `)
  return data.data?.teams?.nodes || []
}

export async function getRecentIssues() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const data = await linearQuery(`
    query($cutoff: DateTimeOrDuration!) {
      issues(
        filter: { updatedAt: { gte: $cutoff } }
        orderBy: updatedAt
        first: 50
      ) {
        nodes {
          id identifier title state { name type } team { name key } priority
          assignee { name }
          updatedAt
        }
      }
    }
  `, { cutoff })
  return data.data?.issues?.nodes || []
}
