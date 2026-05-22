import { loadSubmissions } from "@/lib/rice-submissions"

export const dynamic = "force-dynamic"

const SCORE_TEXT: Record<string, string> = {
  "Ship it": "var(--atlas-blue-500)",
  "Strong": "var(--atlas-blue-500)",
  "Validate": "var(--atlas-purple-500)",
  "Monitor": "var(--atlas-orangellow-500)",
  "Hypothesis": "var(--atlas-gray-900)",
}

const SCORE_ACCENT: Record<string, string> = {
  "Ship it": "var(--atlas-blue-500)",
  "Strong": "var(--atlas-blue-250)",
  "Validate": "var(--atlas-purple-500)",
  "Monitor": "var(--atlas-orangellow-500)",
  "Hypothesis": "var(--atlas-gray-300)",
}

function riceLabel(score: number): string {
  if (score >= 600) return "Ship it"
  if (score >= 300) return "Strong"
  if (score >= 100) return "Validate"
  if (score >= 40)  return "Monitor"
  return "Hypothesis"
}

export default async function RiceLeaderboardPage() {
  const submissions = loadSubmissions()
  const sorted = [...submissions].sort((a, b) => b.score - a.score)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          padding: "20px 24px",
          borderRadius: 12,
          background: "var(--atlas-gray-50)",
          border: "1px solid var(--atlas-gray-300)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--atlas-gray-900)", opacity: 0.5, margin: 0 }}>
            ATLAS HXM · RICE LEADERBOARD
          </p>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--atlas-gray-900)", margin: "4px 0 0" }}>
            Community submissions
          </h1>
          <p style={{ fontSize: 13, color: "var(--atlas-gray-900)", opacity: 0.6, margin: "4px 0 0" }}>
            {sorted.length} hypothesis{sorted.length !== 1 ? "es" : ""} submitted. PMs review and promote to the main backlog.
          </p>
        </div>
        <div style={{ fontSize: 12, color: "var(--atlas-gray-900)", opacity: 0.5 }}>
          Share:{" "}
          <span style={{ fontWeight: 600, opacity: 1 }}>https://atom-atlas-hxm-product-intelligence.vercel.app/rice/leaderboard</span>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--atlas-gray-900)", opacity: 0.45, fontSize: 14 }}>
          No submissions yet. Be the first!
        </div>
      ) : (
        <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--atlas-gray-300)" }}>
          <div
            style={{
              padding: "12px 20px",
              background: "var(--atlas-gray-50)",
              borderBottom: "1px solid var(--atlas-gray-300)",
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "Ship it", range: "600+", accent: "var(--atlas-blue-500)" },
              { label: "Strong", range: "300-599", accent: "var(--atlas-blue-250)" },
              { label: "Validate", range: "100-299", accent: "var(--atlas-purple-500)" },
              { label: "Monitor", range: "40-99", accent: "var(--atlas-orangellow-500)" },
              { label: "Hypothesis", range: "<40", accent: "var(--atlas-gray-300)" },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <span style={{ display: "inline-block", width: 6, height: 12, borderRadius: 9999, background: s.accent }} />
                <span style={{ fontWeight: 600, color: "var(--atlas-gray-900)" }}>{s.label}</span>
                <span style={{ color: "var(--atlas-gray-900)", opacity: 0.45 }}>{s.range}</span>
              </div>
            ))}
          </div>
          <table style={{ width: "100%", fontSize: 14, background: "white", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--atlas-gray-300)", background: "var(--atlas-gray-50)" }}>
                <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 500, color: "var(--atlas-gray-900)", opacity: 0.55, width: 40 }}>#</th>
                <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 500, color: "var(--atlas-gray-900)", opacity: 0.55 }}>Hypothesis</th>
                <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 500, color: "var(--atlas-gray-900)", opacity: 0.55 }}>Pod</th>
                <th style={{ textAlign: "right", padding: "10px 16px", fontWeight: 500, color: "var(--atlas-gray-900)", opacity: 0.55 }}>Score</th>
                <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 500, color: "var(--atlas-gray-900)", opacity: 0.55 }}>Band</th>
                <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 500, color: "var(--atlas-gray-900)", opacity: 0.55 }}>Submitter</th>
                <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 500, color: "var(--atlas-gray-900)", opacity: 0.55 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => {
                const band = riceLabel(s.score)
                const tc = SCORE_TEXT[band] ?? "var(--atlas-gray-900)"
                const ac = SCORE_ACCENT[band] ?? "var(--atlas-gray-300)"
                return (
                  <tr key={s.id} style={i > 0 ? { borderTop: "1px solid var(--atlas-gray-300)" } : {}}>
                    <td style={{ padding: "14px 16px", color: "var(--atlas-gray-900)", opacity: 0.35, fontWeight: 600, fontSize: 12 }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: "14px 16px", maxWidth: 320 }}>
                      <p style={{ fontWeight: 500, color: "var(--atlas-gray-900)", margin: 0, lineHeight: 1.4 }}>{s.title}</p>
                      {s.evidence && (
                        <p style={{ fontSize: 11, color: "var(--atlas-gray-900)", opacity: 0.5, margin: "2px 0 0" }}>{s.evidence}</p>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: "var(--atlas-gray-50)", color: "var(--atlas-gray-900)", border: "1px solid var(--atlas-gray-300)", fontWeight: 500 }}>
                        {s.pod}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                        <span style={{ fontSize: 6, display: "inline-block", width: 6, height: 6, borderRadius: 9999, background: ac, marginBottom: 2 }} />
                        <span style={{ fontSize: 20, fontWeight: 900, color: tc, lineHeight: 1 }}>{s.score}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: tc }}>
                      {band}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--atlas-gray-900)", opacity: 0.6 }}>
                      {s.submitter || "-"}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--atlas-gray-900)", opacity: 0.5 }}>
                      {s.createdAt}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
