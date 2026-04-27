const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY!
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID || "52189"
const POSTHOG_HOST = process.env.POSTHOG_HOST || "https://eu.posthog.com"

async function queryPostHog(query: string) {
  const res = await fetch(`${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${POSTHOG_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`PostHog query failed: ${res.status}`)
  const data = await res.json()
  return data.results
}

export async function getWeeklyEvents() {
  const rows = await queryPostHog(`
    SELECT
      event,
      countIf(timestamp >= now() - INTERVAL 7 DAY) as this_week,
      countIf(timestamp >= now() - INTERVAL 14 DAY AND timestamp < now() - INTERVAL 7 DAY) as last_week
    FROM events
    WHERE timestamp >= now() - INTERVAL 14 DAY
      AND event NOT IN ('$autocapture','$feature_flag_called','$create_alias','$groupidentify','$identify','$set','$pageleave')
    GROUP BY event
    ORDER BY this_week DESC
    LIMIT 30
  `)
  return (rows?.results || rows || []).map((r: unknown[]) => ({
    event: r[0] as string,
    thisWeek: r[1] as number,
    lastWeek: r[2] as number,
  }))
}

export async function getExecMetrics() {
  const rows = await queryPostHog(`
    SELECT
      countIf(event = 'sso_login_attempt' AND timestamp >= now() - INTERVAL 7 DAY) as sso_attempts,
      countIf(event = 'sso_login_success' AND timestamp >= now() - INTERVAL 7 DAY) as sso_success,
      countIf(event = 'sso_login_failed' AND timestamp >= now() - INTERVAL 7 DAY) as sso_failed,
      countIf(event = '$exception' AND timestamp >= now() - INTERVAL 7 DAY) as exceptions,
      countIf(event = '$rageclick' AND timestamp >= now() - INTERVAL 7 DAY) as rageclicks,
      countIf(event = 'sso_login_attempt' AND timestamp >= now() - INTERVAL 14 DAY AND timestamp < now() - INTERVAL 7 DAY) as sso_attempts_prev,
      countIf(event = 'sso_login_success' AND timestamp >= now() - INTERVAL 14 DAY AND timestamp < now() - INTERVAL 7 DAY) as sso_success_prev,
      countIf(event = '$exception' AND timestamp >= now() - INTERVAL 14 DAY AND timestamp < now() - INTERVAL 7 DAY) as exceptions_prev,
      countIf(event = '$rageclick' AND timestamp >= now() - INTERVAL 14 DAY AND timestamp < now() - INTERVAL 7 DAY) as rageclicks_prev
    FROM events
    WHERE timestamp >= now() - INTERVAL 14 DAY
  `)
  const r = (rows?.results || rows || [[]])[0] || []
  return {
    ssoAttempts: r[0] as number,
    ssoSuccess: r[1] as number,
    ssoFailed: r[2] as number,
    exceptions: r[3] as number,
    rageclicks: r[4] as number,
    ssoAttemptsPrev: r[5] as number,
    ssoSuccessPrev: r[6] as number,
    exceptionsPrev: r[7] as number,
    rageclicksPrev: r[8] as number,
    ssoSuccessRate: r[0] > 0 ? Math.round((r[1] / r[0]) * 100) : 0,
    ssoSuccessRatePrev: r[5] > 0 ? Math.round((r[6] / r[5]) * 100) : 0,
  }
}
