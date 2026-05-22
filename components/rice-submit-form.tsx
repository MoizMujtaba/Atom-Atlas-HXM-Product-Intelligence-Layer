"use client"
import { useState } from "react"

const PODS = ["WFM 1", "WFM 2", "WFM 3", "FNM 1", "FNM 2", "PAY", "Data Platform"]

const SIGNAL_TYPES = [
  { label: "Something broken", value: "Something broken", hint: "Friction" },
  { label: "Missing feature", value: "Missing feature", hint: "Gap" },
  { label: "Competitor has it", value: "Competitor has it", hint: "Competitor" },
  { label: "Migration need", value: "Migration need", hint: "Migration" },
  { label: "New idea", value: "New idea", hint: "New Capability" },
]

const REACH_OPTIONS = [
  { label: "< 50 WSEs", value: "<50", num: 25 },
  { label: "50 - 200 WSEs", value: "50-200", num: 125 },
  { label: "200 - 500 WSEs", value: "200-500", num: 350 },
  { label: "500 - 1,000 WSEs", value: "500-1000", num: 750 },
  { label: "1,000+ WSEs", value: "1000+", num: 1500 },
]

const IMPACT_OPTIONS = [
  { label: "Minor annoyance", value: "Minor annoyance", num: 10 },
  { label: "Slows people down", value: "Slows people down", num: 25 },
  { label: "Blocks some work", value: "Blocks some work", num: 40 },
  { label: "Revenue at risk", value: "Revenue at risk", num: 65 },
  { label: "Compliance risk", value: "Compliance risk", num: 85 },
]

const CONFIDENCE_OPTIONS = [
  { label: "Gut feeling", value: "Gut feeling", num: 20 },
  { label: "One person told me", value: "One person told me", num: 35 },
  { label: "Multiple reports", value: "Multiple reports", num: 55 },
  { label: "I have data", value: "I have data", num: 75 },
  { label: "We measured it", value: "We measured it", num: 90 },
]

const SCORE_TEXT: Record<string, string> = {
  "Ship it": "var(--atlas-blue-500)",
  "Strong": "var(--atlas-blue-500)",
  "Validate": "var(--atlas-purple-500)",
  "Monitor": "var(--atlas-orangellow-500)",
  "Hypothesis": "var(--atlas-gray-900)",
}

function riceLabel(score: number): { label: string } {
  if (score >= 600) return { label: "Ship it" }
  if (score >= 300) return { label: "Strong" }
  if (score >= 100) return { label: "Validate" }
  if (score >= 40)  return { label: "Monitor" }
  return { label: "Hypothesis" }
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid var(--atlas-gray-300)",
  borderRadius: 8,
  background: "white",
  fontSize: 14,
  color: "var(--atlas-gray-900)",
  outline: "none",
  boxSizing: "border-box",
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "var(--atlas-gray-900)",
  opacity: 0.6,
  marginBottom: 4,
  fontWeight: 500,
}

export default function RiceSubmitForm() {
  const [form, setForm] = useState({
    title: "",
    pod: "WFM 1",
    signalType: "Something broken",
    reachLabel: "50-200",
    impactLabel: "Slows people down",
    confidenceLabel: "One person told me",
    evidence: "",
    submitter: "",
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [resultScore, setResultScore] = useState<number | null>(null)

  const reach = REACH_OPTIONS.find(o => o.value === form.reachLabel)?.num ?? 125
  const impact = IMPACT_OPTIONS.find(o => o.value === form.impactLabel)?.num ?? 25
  const confidence = CONFIDENCE_OPTIONS.find(o => o.value === form.confidenceLabel)?.num ?? 35
  const score = Math.round((reach * (impact / 100) * (confidence / 100)) / 1)
  const { label } = riceLabel(score)
  const textColor = SCORE_TEXT[label] ?? "var(--atlas-gray-900)"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/rice/submit", {
      method: "POST",
      body: JSON.stringify(form),
      headers: { "Content-Type": "application/json" },
    })
    const data = await res.json()
    setSaving(false)
    setSaved(true)
    setResultScore(data.score)
  }

  if (saved) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, fontWeight: 900, color: textColor, lineHeight: 1 }}>
          {resultScore ?? score}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: textColor }}>{label}</div>
        <p style={{ fontSize: 14, color: "var(--atlas-gray-900)", opacity: 0.7, maxWidth: 400 }}>
          Submitted! PMs will review and may promote this to the main backlog.
        </p>
        <div style={{ marginTop: 8, padding: "10px 16px", borderRadius: 8, background: "var(--atlas-gray-50)", border: "1px solid var(--atlas-gray-300)", fontSize: 12, color: "var(--atlas-gray-900)" }}>
          Share the leaderboard:{" "}
          <span style={{ fontWeight: 600 }}>https://atom-atlas-hxm-product-intelligence.vercel.app/rice/leaderboard</span>
        </div>
        <button
          onClick={() => { setSaved(false); setResultScore(null) }}
          style={{ marginTop: 8, padding: "8px 20px", borderRadius: 8, background: "var(--atlas-blue-500)", color: "white", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}
        >
          Submit another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Problem or opportunity *</label>
          <input style={fieldStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Expense approval bottleneck is blocking 40% of submissions" />
        </div>
        <div>
          <label style={labelStyle}>Pod</label>
          <select style={fieldStyle} value={form.pod} onChange={e => setForm(f => ({ ...f, pod: e.target.value }))}>
            {PODS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Signal type</label>
          <select style={fieldStyle} value={form.signalType} onChange={e => setForm(f => ({ ...f, signalType: e.target.value }))}>
            {SIGNAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label} ({t.hint})</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>How many WSEs affected?</label>
          <select style={fieldStyle} value={form.reachLabel} onChange={e => setForm(f => ({ ...f, reachLabel: e.target.value }))}>
            {REACH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>What happens if we do not fix this?</label>
          <select style={fieldStyle} value={form.impactLabel} onChange={e => setForm(f => ({ ...f, impactLabel: e.target.value }))}>
            {IMPACT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>How sure are you?</label>
          <select style={fieldStyle} value={form.confidenceLabel} onChange={e => setForm(f => ({ ...f, confidenceLabel: e.target.value }))}>
            {CONFIDENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Evidence or links? (optional)</label>
          <input style={fieldStyle} value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))} placeholder="PostHog event, Slack thread, G2 review, etc." />
        </div>
        <div>
          <label style={labelStyle}>Your name (optional)</label>
          <input style={fieldStyle} value={form.submitter} onChange={e => setForm(f => ({ ...f, submitter: e.target.value }))} placeholder="e.g. Alex M." />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderRadius: 12, background: "var(--atlas-gray-50)", border: "1px solid var(--atlas-gray-300)", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--atlas-gray-900)", opacity: 0.55, fontFamily: "monospace" }}>
            ({reach.toLocaleString()} WSE x {impact}% impact x {confidence}% confidence) / 1 =
          </span>
          <span style={{ fontSize: 28, fontWeight: 900, color: textColor, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: textColor }}>{label}</span>
        </div>
        <button type="submit" disabled={saving} style={{ padding: "8px 20px", borderRadius: 8, background: "var(--atlas-blue-900)", color: "white", fontWeight: 600, fontSize: 13, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Submitting..." : "Submit Hypothesis"}
        </button>
      </div>
    </form>
  )
}
