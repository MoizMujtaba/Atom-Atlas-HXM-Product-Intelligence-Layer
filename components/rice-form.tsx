"use client"
import { useState } from "react"
import { calcRICE, riceLabel } from "@/lib/utils"

const PODS = ["WFM 1", "WFM 2", "WFM 3", "FNM 1", "FNM 2", "PAY", "Data Platform"]
const TYPES = ["friction", "new-capability", "gap", "competitor", "migration"]
const IMPACT_OPTIONS = [0.25, 0.5, 1, 2, 3]

export default function RiceForm() {
  const [form, setForm] = useState({
    title: "", pod: "WFM 1", signalType: "friction", source: "",
    reach: 0, impact: 1, confidence: 80, effort: 1, evidence: "",
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const score = calcRICE(form.reach, form.impact, form.confidence, form.effort)
  const { label, color } = riceLabel(score)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch("/api/rice", { method: "POST", body: JSON.stringify(form), headers: { "Content-Type": "application/json" } })
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); window.location.reload() }, 1500)
  }

  const field = "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 w-full focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-xs text-zinc-500 block mb-1">Hypothesis title *</label>
          <input className={field} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Expense detail editing dropped 47% — regression suspected" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Pod</label>
          <select className={field} value={form.pod} onChange={e => setForm(f => ({ ...f, pod: e.target.value }))}>
            {PODS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Signal type</label>
          <select className={field} value={form.signalType} onChange={e => setForm(f => ({ ...f, signalType: e.target.value }))}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Source</label>
          <input className={field} value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="e.g. PostHog: expenseDetail_upserted WoW" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Reach (WSEs impacted)</label>
          <input className={field} type="number" value={form.reach} onChange={e => setForm(f => ({ ...f, reach: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Impact (0.25 / 0.5 / 1 / 2 / 3)</label>
          <select className={field} value={form.impact} onChange={e => setForm(f => ({ ...f, impact: Number(e.target.value) }))}>
            {IMPACT_OPTIONS.map(i => <option key={i} value={i}>{i} — {i === 3 ? "Massive (130+ WSEs)" : i === 2 ? "Strong (50+ WSEs)" : i === 1 ? "Medium (10–50 WSEs)" : i === 0.5 ? "Low" : "Minimal"}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Confidence % (your evidence quality)</label>
          <input className={field} type="number" min={0} max={100} value={form.confidence} onChange={e => setForm(f => ({ ...f, confidence: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Effort (dev-weeks)</label>
          <input className={field} type="number" min={0.5} step={0.5} value={form.effort} onChange={e => setForm(f => ({ ...f, effort: Number(e.target.value) }))} />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-zinc-500 block mb-1">Evidence</label>
          <textarea className={field} rows={3} value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))} placeholder="What data supports this? Which PR, PostHog event, or user signal?" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <span className="text-zinc-500 text-sm">RICE Score:</span>
          <span className={`text-2xl font-bold tabular-nums ${color}`}>{score}</span>
          <span className={`text-sm ${color}`}>{label}</span>
        </div>
        <button type="submit" disabled={saving || saved} className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
          {saved ? "Saved ✓" : saving ? "Saving…" : "Add to Backlog"}
        </button>
      </div>
    </form>
  )
}
