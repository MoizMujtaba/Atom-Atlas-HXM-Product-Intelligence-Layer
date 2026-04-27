import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface AtomTranslation {
  signalType: "friction" | "new-capability" | "error-handling" | "feature-flag" | "navigation" | "migration" | "infrastructure"
  userImpact: string
  podConfirmed: string
  migrationSignal: boolean
  frictionFixed: string | null
  newCapability: string | null
  watchItems: string[]
}

export async function translatePRDiff(
  title: string,
  body: string,
  files: { filename: string; patch?: string }[],
  comments: { body: string; user: string }[]
): Promise<AtomTranslation> {
  const fileList = files.map(f => f.filename).join("\n")
  const patches = files
    .filter(f => f.patch)
    .slice(0, 5)
    .map(f => `--- ${f.filename} ---\n${f.patch?.slice(0, 800)}`)
    .join("\n\n")

  const commentText = comments
    .slice(0, 10)
    .map(c => `${c.user}: ${c.body}`)
    .join("\n")

  const prompt = `You are Atom, a product intelligence layer for Atlas HXM — an HCM/payroll/workforce management SaaS platform.

Analyze this GitHub PR and extract product signals. Do NOT review code quality. Only extract what changed for users.

PR TITLE: ${title}
PR BODY: ${body || "(no description)"}

FILES CHANGED:
${fileList}

DIFF PATCHES (sample):
${patches || "(no patches available)"}

REVIEW COMMENTS:
${commentText || "(no comments)"}

Respond with a JSON object matching this exact shape:
{
  "signalType": one of: "friction" | "new-capability" | "error-handling" | "feature-flag" | "navigation" | "migration" | "infrastructure",
  "userImpact": "One clear sentence: what can a user now do, or what pain is fixed?",
  "podConfirmed": "Pod name based on PR prefix and file paths",
  "migrationSignal": true/false (is this legacy-to-webapp migration work?),
  "frictionFixed": "What user pain point was patched, or null",
  "newCapability": "What new user action is now possible, or null",
  "watchItems": ["Any concerns or things to monitor in PostHog", ...]
}

Return only valid JSON, no markdown.`

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : "{}"
  try {
    return JSON.parse(text)
  } catch {
    return {
      signalType: "infrastructure",
      userImpact: "Could not parse translation.",
      podConfirmed: "Unknown",
      migrationSignal: false,
      frictionFixed: null,
      newCapability: null,
      watchItems: [],
    }
  }
}
